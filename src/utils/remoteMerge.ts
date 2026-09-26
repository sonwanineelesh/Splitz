import { Expense, ExpenseCategory, Member, SplitType } from '../types';
import { isExpenseCategory } from '../constants/categories';
import { generateId } from './helpers';

// Pure merge of server rows into the local cache (backend Sec 15/18/19).
// Matches by `backendId`; never duplicates pulled rows. Server version wins
// for conflicting edits (Sec 19). Independently testable.

export interface RemoteMember {
  id: string;
  display_name: string;
}

export interface RemoteShare {
  member_id: string | null;
  amount_paise: number;
  percentage?: number | null;
  shares?: number | null;
}

export interface RemoteExpense {
  id: string;
  description: string;
  amount_paise: number;
  paid_by: string | null;
  category: string | null;
  notes: string | null;
  split_type: string | null;
  created_at: string;
  expense_shares: RemoteShare[];
}

const VALID_SPLITS: SplitType[] = ['equal', 'exact', 'percentage', 'shares'];

export const mergeRemoteState = (
  groupId: string,
  localMembers: Record<string, Member>,
  localExpenses: Record<string, Expense>,
  remoteMembers: RemoteMember[],
  remoteExpenses: RemoteExpense[]
): { members: Record<string, Member>; expenses: Record<string, Expense> } => {
  const members: Record<string, Member> = { ...localMembers };
  const expenses: Record<string, Expense> = { ...localExpenses };

  // Index local members by backend id.
  const byBackendId = new Map<string, string>();
  Object.values(members).forEach((m) => {
    if (m.groupId === groupId && m.backendId) byBackendId.set(m.backendId, m.id);
  });

  // backend member id -> local member id.
  const memberMap = new Map<string, string>();
  remoteMembers.forEach((rm) => {
    const existingId = byBackendId.get(rm.id);
    if (existingId && members[existingId]) {
      members[existingId] = { ...members[existingId], name: rm.display_name };
      memberMap.set(rm.id, existingId);
    } else {
      const id = generateId();
      members[id] = { id, name: rm.display_name, groupId, backendId: rm.id };
      memberMap.set(rm.id, id);
    }
  });

  const expenseBackendIds = new Set(
    Object.values(expenses)
      .filter((e) => e.groupId === groupId && e.backendId)
      .map((e) => e.backendId as string)
  );

  remoteExpenses.forEach((re) => {
    if (expenseBackendIds.has(re.id)) {
      // Server wins: refresh the known record.
      const localId = Object.values(expenses).find(
        (e) => e.groupId === groupId && e.backendId === re.id
      )?.id;
      if (!localId) return;
      const paidBy = re.paid_by ? memberMap.get(re.paid_by) : undefined;
      if (!paidBy) return;
      const shares = (re.expense_shares ?? [])
        .filter((s) => s.member_id && memberMap.has(s.member_id))
        .map((s) => ({
          memberId: memberMap.get(s.member_id as string) as string,
          amountPaise: s.amount_paise,
        }));
      const splitType: SplitType = VALID_SPLITS.includes(re.split_type as SplitType)
        ? (re.split_type as SplitType)
        : 'equal';
      const category: ExpenseCategory = isExpenseCategory(re.category) ? re.category : 'other';
      expenses[localId] = {
        ...expenses[localId],
        description: re.description,
        amountPaise: re.amount_paise,
        paidBy,
        splitType,
        shares,
        category,
        note: re.notes ?? undefined,
      };
      return;
    }
    const paidBy = re.paid_by ? memberMap.get(re.paid_by) : undefined;
    if (!paidBy) return;
    const shares = (re.expense_shares ?? [])
      .filter((s) => s.member_id && memberMap.has(s.member_id))
      .map((s) => ({
        memberId: memberMap.get(s.member_id as string) as string,
        amountPaise: s.amount_paise,
      }));
    const id = generateId();
    const splitType: SplitType = VALID_SPLITS.includes(re.split_type as SplitType)
      ? (re.split_type as SplitType)
      : 'equal';
    const category: ExpenseCategory = isExpenseCategory(re.category) ? re.category : 'other';
    expenses[id] = {
      id,
      groupId,
      description: re.description,
      amountPaise: re.amount_paise,
      paidBy,
      splitType,
      shares,
      category,
      note: re.notes ?? undefined,
      recurring: 'none',
      createdAt: re.created_at,
      backendId: re.id,
    };
  });

  return { members, expenses };
};
