export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';
export type GroupType = 'Trip' | 'Friends' | 'Roommates' | 'Couple' | 'Family' | 'Other' | 'Direct';
export type ThemePreference = 'system' | 'light' | 'dark';
export type ExpenseCategory = 'food' | 'stay' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'other';
export type RecurringFrequency = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  memberIds: string[];
  createdAt: string;
  defaultSplitType?: SplitType;
  defaultSplitData?: Record<string, number>;
}

export interface Member {
  id: string;
  name: string;
  groupId: string;
  phone?: string;
  email?: string;
  isAccount?: boolean;
  /** Server row id when pulled from Supabase (backend sync). Undefined for local-only. */
  backendId?: string;
}

export interface ExpenseShare {
  memberId: string;
  amountPaise: number; // stored in paise
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amountPaise: number; // stored in paise
  paidBy: string; // memberId
  splitType: SplitType;
  shares: ExpenseShare[];
  sharesMap?: Record<string, number>; // memberId -> shares, only when splitType === 'shares'
  category: ExpenseCategory;
  note?: string;
  recurring?: RecurringFrequency;
  createdAt: string;
  /** Server row id when pulled from Supabase (backend sync). Undefined for local-only. */
  backendId?: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMember: string; // memberId
  toMember: string;   // memberId
  amountPaise: number;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface Settings {
  theme: ThemePreference;
}
