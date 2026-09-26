import { filterExpenses } from '../src/utils/search';
import { Expense } from '../src/types';

const e = (id: string, description: string, category: Expense['category'], note?: string): Expense => ({
  id,
  groupId: 'g',
  description,
  amountPaise: 100,
  paidBy: 'a',
  splitType: 'equal',
  shares: [],
  category,
  note,
  recurring: 'none',
  createdAt: new Date().toISOString(),
});

const all = [
  e('1', 'Hotel Goa', 'stay'),
  e('2', 'Dinner', 'food', "Rahul's birthday dinner"),
  e('3', 'Taxi', 'transport'),
];

describe('search expenses (PRD Sec 42)', () => {
  it('matches description case-insensitively', () => {
    expect(filterExpenses(all, 'hotel', 'all').map((x) => x.id)).toEqual(['1']);
  });

  it('matches note text', () => {
    expect(filterExpenses(all, 'birthday', 'all').map((x) => x.id)).toEqual(['2']);
  });

  it('category filter isolates', () => {
    expect(filterExpenses(all, '', 'food').map((x) => x.id)).toEqual(['2']);
  });

  it('empty query → all', () => {
    expect(filterExpenses(all, '   ', 'all')).toHaveLength(3);
  });

  it('special chars do not crash', () => {
    expect(() => filterExpenses(all, '.*+?^${}()|[]\\', 'all')).not.toThrow();
  });

  it('old expenses without category default safely', () => {
    const legacy = { ...all[0], category: undefined } as unknown as Expense;
    expect(() => filterExpenses([legacy], '', 'all')).not.toThrow();
  });
});
