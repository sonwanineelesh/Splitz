export type SplitType = 'equal' | 'exact' | 'percentage';
export type GroupType = 'Trip' | 'Friends' | 'Roommates' | 'Couple' | 'Family' | 'Other';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  memberIds: string[];
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  groupId: string;
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
  createdAt: string;
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
