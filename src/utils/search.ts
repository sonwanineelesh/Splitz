import { Expense, ExpenseCategory } from '../types';

// Substring search over description + note (case-insensitive) + category filter.
// Empty query → all. Never throws on special chars (PRD Sec 42/46).
export const filterExpenses = (
  expenses: Expense[],
  query: string,
  category: ExpenseCategory | 'all'
): Expense[] => {
  const q = (query ?? '').trim().toLowerCase();
  return expenses.filter((e) => {
    if (category !== 'all' && (e.category ?? 'other') !== category) return false;
    if (!q) return true;
    const hay = `${e.description ?? ''} ${(e as { note?: string }).note ?? ''}`.toLowerCase();
    return hay.includes(q);
  });
};
