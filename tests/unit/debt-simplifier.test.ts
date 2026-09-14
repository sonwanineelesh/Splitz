import { describe, it, expect } from 'vitest';
import { simplifyDebts, SimplifiedPayment } from '../../src/services/debt-simplifier';

describe('debt-simplifier', () => {
  it('should simplify a simple chain: A owes B 10, B owes C 10 -> A owes C 10', () => {
    // Net Balances:
    // A: -10 (owed 10 to B)
    // B: 10 - 10 = 0 (paid 10 to A, owed 10 to C) - wait, if A owes B 10, B is +10. If B owes C 10, B is -10.
    // C: +10 (paid 10 by B)

    // To represent this in Expenses/Splits:
    // Expense 1: B paid 10, Split: A owes 10
    // Expense 2: C paid 10, Split: B owes 10

    const expenses = [
      { id: 'e1', paidByMemberId: 'B', amount: 10, groupId: 'g1', currency: 'USD', fxRateToHome: 1, description: 'd1', category: 'c1', date: 0, isRecurring: false },
      { id: 'e2', paidByMemberId: 'C', amount: 10, groupId: 'g1', currency: 'USD', fxRateToHome: 1, description: 'd2', category: 'c1', date: 0, isRecurring: false },
    ];
    const splits = [
      { id: 's1', expenseId: 'e1', memberId: 'A', amount: 10 },
      { id: 's2', expenseId: 'e2', memberId: 'B', amount: 10 },
    ];

    const result = simplifyDebts(expenses, splits);

    expect(result).toEqual([
      { from: 'A', to: 'C', amount: 10 },
    ]);
  });

  it('should handle equal split case: A paid 100, B paid 50, C paid 0', () => {
    // Total = 150. Equal split = 50 each.
    // A: 100 - 50 = +50
    // B: 50 - 50 = 0
    // C: 0 - 50 = -50
    const expenses = [
      { id: 'e1', paidByMemberId: 'A', amount: 100, groupId: 'g1', currency: 'USD', fxRateToHome: 1, description: 'd1', category: 'c1', date: 0, isRecurring: false },
      { id: 'e2', paidByMemberId: 'B', amount: 50, groupId: 'g1', currency: 'USD', fxRateToHome: 1, description: 'd2', category: 'c1', date: 0, isRecurring: false },
    ];
    const splits = [
      { id: 's1', expenseId: 'e1', memberId: 'A', amount: 50 },
      { id: 's2', expenseId: 'e1', memberId: 'B', amount: 25 },
      { id: 's3', expenseId: 'e1', memberId: 'C', amount: 25 },
      { id: 's4', expenseId: 'e2', memberId: 'A', amount: 0 },
      { id: 's5', expenseId: 'e2', memberId: 'B', amount: 25 },
      { id: 's6', expenseId: 'e2', memberId: 'C', amount: 25 },
    ];
    // Let's check net balances manually:
    // A: paid 100, owed 50 + 0 = 50. Net = +50.
    // B: paid 50, owed 25 + 25 = 50. Net = 0.
    // C: paid 0, owed 25 + 25 = 50. Net = -50.

    const result = simplifyDebts(expenses, splits);

    expect(result).toEqual([
      { from: 'C', to: 'A', amount: 50 },
    ]);
  });

  it('should handle balanced group (no debts)', () => {
    const expenses = [
      { id: 'e1', paidByMemberId: 'A', amount: 10, groupId: 'g1', currency: 'USD', fxRateToHome: 1, description: 'd1', category: 'c1', date: 0, isRecurring: false },
    ];
    const splits = [
      { id: 's1', expenseId: 'e1', memberId: 'A', amount: 10 },
    ];

    const result = simplifyDebts(expenses, splits);

    expect(result).toEqual([]);
  });

  it('should handle multiple debtors and creditors', () => {
    // Target Net Balances:
    // A: +100
    // B: +50
    // C: -80
    // D: -70

    // To get these:
    // A pays 180, B pays 0, C pays 0, D pays 0.
    // A is owed 80 by C and 70 by D... no that's not it.

    // Let's just construct expenses/splits to get the net balances.
    // Member A paid 150. Member B paid 100.
    // Splits:
    // A owes 50
    // B owes 50
    // C owes 80
    // D owes 70
    // Total = 250.

    // A: 150 - 50 = +100
    // B: 100 - 50 = +50
    // C: 0 - 80 = -80
    // D: 0 - 70 = -70

    const expenses = [
      { id: 'e1', paidByMemberId: 'A', amount: 150, groupId: 'g1', currency: 'USD', fxRateToHome: 1, description: 'd1', category: 'c1', date: 0, isRecurring: false },
      { id: 'e2', paidByMemberId: 'B', amount: 100, groupId: 'g1', currency: 'USD', fxRateToHome: 1, description: 'd2', category: 'c1', date: 0, isRecurring: false },
    ];
    const splits = [
      { id: 's1', expenseId: 'e1', memberId: 'A', amount: 50 },
      { id: 's2', expenseId: 'e1', memberId: 'B', amount: 50 },
      { id: 's3', expenseId: 'e1', memberId: 'C', amount: 50 },
      { id: 's4', expenseId: 'e2', memberId: 'A', amount: 0 },
      { id: 's5', expenseId: 'e2', memberId: 'B', amount: 0 },
      { id: 's6', expenseId: 'e2', memberId: 'C', amount: 30 },
      { id: 's7', expenseId: 'e2', memberId: 'D', amount: 70 },
    ];
    // Net balances check:
    // A: 150 - 50 = 100
    // B: 100 - 50 = 50
    // C: 0 - (50 + 30) = -80
    // D: 0 - 70 = -70

    const result = simplifyDebts(expenses, splits);

    // Expected:
    // Largest debtor C (-80) matches largest creditor A (+100).
    // Payment: C -> A 80.
    // Balances: A: 20, B: 50, C: 0, D: -70

    // Next: Largest debtor D (-70) matches largest creditor B (+50).
    // Payment: D -> B 50.
    // Balances: A: 20, B: 0, C: 0, D: -20

    // Next: Largest debtor D (-20) matches largest creditor A (+20).
    // Payment: D -> A 20.
    // Balances: A: 0, B: 0, C: 0, D: 0

    expect(result).toEqual(expect.arrayContaining([
      { from: 'C', to: 'A', amount: 80 },
      { from: 'D', to: 'B', amount: 50 },
      { from: 'D', to: 'A', amount: 20 },
    ]));
    expect(result.length).toBe(3);
  });

  it('should handle circular debts: A owes B 10, B owes C 10, C owes A 10 -> no payments', () => {
    const expenses = [
      { id: 'e1', paidByMemberId: 'B', amount: 10, groupId: 'g1', currency: 'USD', fxRateToHome: 1, description: 'd1', category: 'c1', date: 0, isRecurring: false },
      { id: 'e2', paidByMemberId: 'C', amount: 10, groupId: 'g1', currency: 'USD', fxRateToHome: 1, description: 'd2', category: 'c1', date: 0, isRecurring: false },
      { id: 'e3', paidByMemberId: 'A', amount: 10, groupId: 'g1', currency: 'USD', fxRateToHome: 1, description: 'd3', category: 'c1', date: 0, isRecurring: false },
    ];
    const splits = [
      { id: 's1', expenseId: 'e1', memberId: 'A', amount: 10 },
      { id: 's2', expenseId: 'e2', memberId: 'B', amount: 10 },
      { id: 's3', expenseId: 'e3', memberId: 'C', amount: 10 },
    ];

    const result = simplifyDebts(expenses, splits);

    expect(result).toEqual([]);
  });
});
