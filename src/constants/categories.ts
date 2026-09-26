import { ExpenseCategory } from '../types';

export interface CategoryDef {
  key: ExpenseCategory;
  label: string;
  emoji: string;
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { key: 'food', label: 'Food', emoji: '🍔' },
  { key: 'stay', label: 'Stay', emoji: '🏨' },
  { key: 'transport', label: 'Transport', emoji: '🚕' },
  { key: 'shopping', label: 'Shopping', emoji: '🛒' },
  { key: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { key: 'bills', label: 'Bills', emoji: '💡' },
  { key: 'other', label: 'Other', emoji: '📦' },
];

export const CATEGORY_MAP: Record<ExpenseCategory, CategoryDef> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.key, c])
) as Record<ExpenseCategory, CategoryDef>;

export const isExpenseCategory = (v: unknown): v is ExpenseCategory =>
  typeof v === 'string' &&
  (['food', 'stay', 'transport', 'shopping', 'entertainment', 'bills', 'other'] as string[]).includes(v);
