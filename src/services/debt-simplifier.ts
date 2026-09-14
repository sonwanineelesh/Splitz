import { Expense, Split } from '../domain/types';

export interface SimplifiedPayment {
  from: string;
  to: string;
  amount: number;
}

/**
 * Simplifies debts in a group using a greedy matching algorithm.
 * Minimizes the total number of transactions needed to settle the group.
 *
 * @param expenses - List of all expenses in the group
 * @param splits - List of all splits for those expenses
 * @returns A list of simplified payments to settle all debts
 */
export function simplifyDebts(expenses: Expense[], splits: Split[]): SimplifiedPayment[] {
  // 1. Calculate Net Balance for each member
  // Net Balance = Sum(Paid) - Sum(Owed)
  const balances: Map<string, number> = new Map();

  // Sum up all payments made by members
  for (const expense of expenses) {
    const paidBy = expense.paidByMemberId;
    const currentBalance = balances.get(paidBy) || 0;
    balances.set(paidBy, currentBalance + expense.amount);
  }

  // Subtract all amounts owed by members
  for (const split of splits) {
    const memberId = split.memberId;
    const currentBalance = balances.get(memberId) || 0;
    balances.set(memberId, currentBalance - split.amount);
  }

  // 2. Separate members into Creditors (Net > 0) and Debtors (Net < 0)
  const creditors: { id: string; balance: number }[] = [];
  const debtors: { id: string; balance: number }[] = [];

  for (const [id, balance] of balances.entries()) {
    if (balance > 0) {
      creditors.push({ id, balance });
    } else if (balance < 0) {
      debtors.push({ id, balance: -balance }); // Store debtor balance as positive for easier matching
    }
  }

  // Sort both lists by balance in descending order for greedy matching
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => b.balance - a.balance);

  // 3. Greedily match the largest debtor with the largest creditor
  const simplifiedPayments: SimplifiedPayment[] = [];
  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];

    const paymentAmount = Math.min(debtor.balance, creditor.balance);

    if (paymentAmount > 0) {
      simplifiedPayments.push({
        from: debtor.id,
        to: creditor.id,
        amount: paymentAmount,
      });
    }

    debtor.balance -= paymentAmount;
    creditor.balance -= paymentAmount;

    if (debtor.balance === 0) {
      debtorIdx++;
    }
    if (creditor.balance === 0) {
      creditorIdx++;
    }
  }

  return simplifiedPayments;
}
