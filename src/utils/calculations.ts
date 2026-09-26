import { Expense, Member, RecurringFrequency, Settlement } from '../types';

// Calculate net balance for each member in a group (positive = owed money, negative = owes money)
export const calculateBalances = (
  members: Member[],
  expenses: Expense[]
): Record<string, number> => {
  const balances: Record<string, number> = {};

  members.forEach((m) => {
    balances[m.id] = 0;
  });

  expenses.forEach((expense) => {
    // The payer is credited the full amount
    if (balances[expense.paidBy] !== undefined) {
      balances[expense.paidBy] += expense.amountPaise;
    }

    // Each share member is debited their share
    expense.shares.forEach((share) => {
      if (balances[share.memberId] !== undefined) {
        balances[share.memberId] -= share.amountPaise;
      }
    });
  });

  return balances;
};

export interface SimplifiedDebt {
  from: string;
  to: string;
  amountPaise: number;
}

// Generate minimum-transaction settlements from balances.
// Greedy largest-creditor ↔ largest-debtor matching (PRD Sec 18/37, backend Sec 13).
// Totals are preserved; dust (< 1 paise) is ignored since paise are integers.
export const calculateSettlements = (
  balances: Record<string, number>
): SimplifiedDebt[] => {
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  Object.entries(balances).forEach(([id, amount]) => {
    const rounded = Math.round(amount);
    if (rounded > 0) creditors.push({ id, amount: rounded });
    else if (rounded < 0) debtors.push({ id, amount: -rounded });
  });

  // Sort desc so largest balances settle first → minimum practical payments.
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedDebt[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.amount, debt.amount);

    if (amount > 0) {
      transactions.push({ from: debt.id, to: credit.id, amountPaise: amount });
    }

    credit.amount -= amount;
    debt.amount -= amount;

    if (credit.amount === 0) ci++;
    if (debt.amount === 0) di++;
  }

  return transactions;
};

// Alias required by PRD Sec 37 implementation note.
export const simplifyDebts = (
  balances: Record<string, number>
): SimplifiedDebt[] => calculateSettlements(balances);

// Calculate equal shares (largest-remainder, deterministic by member order)
export const calculateEqualShares = (
  amountPaise: number,
  memberIds: string[]
): Record<string, number> => {
  const n = memberIds.length;
  if (n === 0) return {};
  const base = Math.floor(amountPaise / n);
  const remainder = amountPaise % n;

  const shares: Record<string, number> = {};
  memberIds.forEach((id, i) => {
    shares[id] = base + (i < remainder ? 1 : 0);
  });

  return shares;
};

// Largest-remainder distribution used by percentage + shares splits.
// `weights` are arbitrary non-negative numbers (percents or share counts).
export const distributeByWeights = (
  amountPaise: number,
  memberIds: string[],
  weights: Record<string, number>
): Record<string, number> => {
  const totalWeight = memberIds.reduce((acc, id) => acc + (weights[id] ?? 0), 0);
  if (totalWeight <= 0 || amountPaise <= 0 || memberIds.length === 0) {
    return Object.fromEntries(memberIds.map((id) => [id, 0]));
  }

  const exact = memberIds.map((id) => ({
    id,
    exact: (amountPaise * (weights[id] ?? 0)) / totalWeight,
  }));
  const floored = exact.map((e) => ({ id: e.id, amount: Math.floor(e.exact), frac: e.exact - Math.floor(e.exact) }));
  let assigned = floored.reduce((acc, f) => acc + f.amount, 0);
  let remainder = amountPaise - assigned;

  // Give leftover paise to largest fractional parts (deterministic tie-break by id)
  floored.sort((a, b) => b.frac - a.frac || (a.id < b.id ? -1 : 1));
  const result: Record<string, number> = {};
  floored.forEach((f) => {
    result[f.id] = f.amount;
  });
  for (let i = 0; i < floored.length && remainder > 0; i++, remainder--) {
    result[floored[i].id] += 1;
  }
  void assigned;
  return result;
};

// Calculate percentage shares (percentages must sum to ~100; paise via largest-remainder)
export const calculatePercentageShares = (
  amountPaise: number,
  memberIds: string[],
  percentages: Record<string, number>
): Record<string, number> => distributeByWeights(amountPaise, memberIds, percentages);

// Calculate shares split (PRD Sec 14b/40): share_amount = amount * member_shares / total_shares
export const calculateSharesSplit = (
  amountPaise: number,
  memberIds: string[],
  sharesMap: Record<string, number>
): Record<string, number> => {
  const sanitized: Record<string, number> = {};
  memberIds.forEach((id) => {
    const v = sharesMap[id] ?? 0;
    sanitized[id] = Number.isFinite(v) && v > 0 ? v : 0;
  });
  return distributeByWeights(amountPaise, memberIds, sanitized);
};

export const getTotalShares = (
  memberIds: string[],
  sharesMap: Record<string, number>
): number => memberIds.reduce((acc, id) => acc + (sharesMap[id] ?? 0), 0);

// Next recurring instance date (V1: single next instance only, PRD Sec 43)
export const getNextRecurringDate = (
  fromIso: string,
  frequency: RecurringFrequency
): string => {
  const d = new Date(fromIso);
  if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
};

// Merge PRD-spec settlements with existing settlement records
export const mergeSettlements = (
  calculated: SimplifiedDebt[],
  existing: Settlement[]
): Settlement[] => {
  return calculated.map((calc) => {
    const found = existing.find(
      (s) => s.fromMember === calc.from && s.toMember === calc.to
    );
    if (found) return { ...found, amountPaise: calc.amountPaise };
    return {
      id: `${Date.now()}-${Math.random()}`,
      groupId: '',
      fromMember: calc.from,
      toMember: calc.to,
      amountPaise: calc.amountPaise,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
  });
};
