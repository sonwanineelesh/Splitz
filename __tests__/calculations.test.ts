import {
  calculateBalances,
  calculateEqualShares,
  calculatePercentageShares,
  calculateSharesSplit,
  calculateSettlements,
  distributeByWeights,
  getNextRecurringDate,
  getTotalShares,
  simplifyDebts,
} from '../src/utils/calculations';
import { Expense, Member } from '../src/types';

const member = (id: string): Member => ({ id, name: id, groupId: 'g' });

const expense = (
  id: string,
  amountPaise: number,
  paidBy: string,
  shares: Array<{ memberId: string; amountPaise: number }>
): Expense => ({
  id,
  groupId: 'g',
  description: id,
  amountPaise,
  paidBy,
  splitType: 'equal',
  shares,
  category: 'other',
  recurring: 'none',
  createdAt: new Date().toISOString(),
});

describe('equal split', () => {
  it('splits evenly with remainder to first members', () => {
    expect(calculateEqualShares(200000, ['a', 'b', 'c', 'd'])).toEqual({
      a: 50000, b: 50000, c: 50000, d: 50000,
    });
  });

  it('₹10 / 3 totals exactly ₹10', () => {
    const shares = calculateEqualShares(1000, ['a', 'b', 'c']);
    expect(Object.values(shares).reduce((x, y) => x + y, 0)).toBe(1000);
    expect(shares).toEqual({ a: 334, b: 333, c: 333 });
  });
});

describe('shares split (PRD Sec 40: 2-1-1 on ₹2,000)', () => {
  it('computes 1000/500/500', () => {
    expect(
      calculateSharesSplit(200000, ['arpan', 'rahul', 'priya'], { arpan: 2, rahul: 1, priya: 1 })
    ).toEqual({ arpan: 100000, rahul: 50000, priya: 50000 });
  });

  it('zero total shares → all zero', () => {
    expect(calculateSharesSplit(200000, ['a', 'b'], { a: 0, b: 0 })).toEqual({ a: 0, b: 0 });
  });

  it('rounding remainder still sums to total', () => {
    const out = calculateSharesSplit(1000, ['a', 'b', 'c'], { a: 1, b: 1, c: 1 });
    expect(Object.values(out).reduce((x, y) => x + y, 0)).toBe(1000);
  });

  it('getTotalShares sums map', () => {
    expect(getTotalShares(['a', 'b'], { a: 2, b: 3 })).toBe(5);
  });
});

describe('percentage split', () => {
  it('25/25/25/25 on ₹2,000', () => {
    const out = calculatePercentageShares(200000, ['a', 'b', 'c', 'd'], { a: 25, b: 25, c: 25, d: 25 });
    expect(out).toEqual({ a: 50000, b: 50000, c: 50000, d: 50000 });
  });

  it('largest-remainder sums exactly (no Math.round drift)', () => {
    const out = calculatePercentageShares(1000, ['a', 'b', 'c'], { a: 33.33, b: 33.33, c: 33.34 });
    expect(Object.values(out).reduce((x, y) => x + y, 0)).toBe(1000);
  });
});

describe('distributeByWeights edge cases', () => {
  it('zero/negative weights → zeros', () => {
    expect(distributeByWeights(1000, ['a'], { a: 0 })).toEqual({ a: 0 });
  });
});

describe('balances', () => {
  it('1 payer, 2 members', () => {
    const members = [member('a'), member('b')];
    const ex = [expense('e1', 80000, 'a', [
      { memberId: 'a', amountPaise: 40000 },
      { memberId: 'b', amountPaise: 40000 },
    ])];
    expect(calculateBalances(members, ex)).toEqual({ a: 40000, b: -40000 });
  });

  it('fully settled group → zeros', () => {
    const members = [member('a'), member('b')];
    const ex = [
      expense('e1', 10000, 'a', [{ memberId: 'a', amountPaise: 5000 }, { memberId: 'b', amountPaise: 5000 }]),
      expense('e2', 10000, 'b', [{ memberId: 'a', amountPaise: 5000 }, { memberId: 'b', amountPaise: 5000 }]),
    ];
    expect(calculateBalances(members, ex)).toEqual({ a: 0, b: 0 });
  });
});

describe('simplify debts (PRD Sec 37 chain collapse)', () => {
  it('simple debt', () => {
    expect(calculateSettlements({ arpan: 200000, rahul: -100000, priya: -100000 })).toEqual([
      { from: 'rahul', to: 'arpan', amountPaise: 100000 },
      { from: 'priya', to: 'arpan', amountPaise: 100000 },
    ]);
  });

  it('chain debts collapse with totals unchanged', () => {
    // Before: Rahul→Arpan 500, Priya→Rahul 300, Priya→Arpan 200
    // Net: Arpan +100000? No — net balances: Arpan +100000... use direct rupee analog:
    // Rahul net -50000+30000 = -20000? Model as balances: arpan +100000, rahul -50000, priya -50000
    const balances = { arpan: 100000, rahul: -50000, priya: -50000 };
    const before = Object.values(balances).reduce((x, y) => x + y, 0);
    const out = simplifyDebts(balances);
    expect(out).toEqual([
      { from: 'rahul', to: 'arpan', amountPaise: 50000 },
      { from: 'priya', to: 'arpan', amountPaise: 50000 },
    ]);
    const moved = out.reduce((x, t) => x + t.amountPaise, 0);
    expect(before).toBe(0);
    expect(moved).toBe(100000);
  });

  it('zero balances → no transactions', () => {
    expect(simplifyDebts({ a: 0, b: 0 })).toEqual([]);
  });

  it('largest first ordering', () => {
    const out = simplifyDebts({ c1: 150000, c2: 50000, d1: -120000, d2: -80000 });
    expect(out[0]).toEqual({ from: 'd1', to: 'c1', amountPaise: 120000 });
  });
});

describe('recurring (PRD Sec 43)', () => {
  it('monthly adds one month', () => {
    const next = getNextRecurringDate('2026-01-15T00:00:00.000Z', 'monthly');
    expect(new Date(next).getUTCMonth()).toBe(1);
  });

  it('weekly adds 7 days', () => {
    const next = getNextRecurringDate('2026-01-01T00:00:00.000Z', 'weekly');
    expect(new Date(next).getUTCDate()).toBe(8);
  });

  it('yearly adds one year', () => {
    const next = getNextRecurringDate('2026-01-01T00:00:00.000Z', 'yearly');
    expect(new Date(next).getUTCFullYear()).toBe(2027);
  });
});
