import { Expense, Settlement, Member } from '../types';

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

// Generate minimum-transaction settlements from balances
export const calculateSettlements = (
  balances: Record<string, number>
): Array<{ from: string; to: string; amountPaise: number }> => {
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  Object.entries(balances).forEach(([id, amount]) => {
    if (amount > 0) creditors.push({ id, amount });
    else if (amount < 0) debtors.push({ id, amount: -amount });
  });

  const transactions: Array<{ from: string; to: string; amountPaise: number }> = [];

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

// Calculate equal shares
export const calculateEqualShares = (
  amountPaise: number,
  memberIds: string[]
): Record<string, number> => {
  const n = memberIds.length;
  const base = Math.floor(amountPaise / n);
  const remainder = amountPaise % n;

  const shares: Record<string, number> = {};
  memberIds.forEach((id, i) => {
    shares[id] = base + (i < remainder ? 1 : 0);
  });

  return shares;
};

// Merge PRD-spec settlements with existing settlement records
export const mergeSettlements = (
  calculated: Array<{ from: string; to: string; amountPaise: number }>,
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
