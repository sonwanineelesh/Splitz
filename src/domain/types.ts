/**
 * Domain types for Splitz.
 *
 * CRITICAL: All money values (amount) MUST use integer minor units (e.g., cents)
 * to avoid floating-point errors.
 */

export interface Group {
  id: string;
  name: string;
  homeCurrency: string;
  createdAt: number;
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
  isUser: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  paidByMemberId: string;
  amount: number; // Minor units (e.g., cents)
  currency: string;
  fxRateToHome: number;
  description: string;
  category: string;
  date: number;
  isRecurring: boolean;
  recurringRule?: string;
}

export interface Split {
  id: string;
  expenseId: string;
  memberId: string;
  amount: number; // Minor units (e.g., cents)
}

export interface RecurringRule {
  id: string;
  groupId: string;
  expenseTemplate: Partial<Expense>;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastRunTimestamp: number;
  startDate: number;
  endDate?: number;
}

export interface ISplitzRepository {
  getGroups(): Promise<Group[]>;
  saveGroup(group: Group): Promise<void>;
  getMembers(groupId: string): Promise<Member[]>;
  saveMember(member: Member): Promise<void>;
  getExpenses(groupId: string): Promise<Expense[]>;
  saveExpense(expense: Expense, splits: Split[]): Promise<void>;
  getSplits(expenseId: string): Promise<Split[]>;
  getRecurringRules(groupId: string): Promise<RecurringRule[]>;
  saveRecurringRule(rule: RecurringRule): Promise<void>;
}
