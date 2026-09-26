import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Group, Member, Expense, Settlement, Settings, SplitType, GroupType
} from '../types';
import { generateId } from '../utils/helpers';
import { loadDemoData } from '../utils/demoData';
import { getNextRecurringDate } from '../utils/calculations';
import { isExpenseCategory } from '../constants/categories';
import { mergeRemoteState, RemoteExpense, RemoteMember } from '../utils/remoteMerge';

interface SplitzState {
  groups: Record<string, Group>;
  members: Record<string, Member>;
  expenses: Record<string, Expense>;
  settlements: Record<string, Settlement>;
  settings: Settings;
  isFirstLaunch: boolean;
  toast: string | null;

  // Group actions
  addGroup: (name: string, type: GroupType) => string;
  deleteGroup: (groupId: string) => void;
  setDefaultSplit: (groupId: string, type: SplitType, data?: Record<string, number>) => void;
  clearDefaultSplit: (groupId: string) => void;
  createDirectSplit: (friendName: string, myName?: string) => string;

  // Member actions
  addMember: (groupId: string, name: string, opts?: { phone?: string; email?: string }) => string;
  removeMember: (memberId: string) => void;
  renameMember: (memberId: string, name: string) => void;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => string;
  updateExpense: (id: string, expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  // Settlement actions
  markSettlementPaid: (id: string) => void;
  upsertSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void;

  // Settings
  setTheme: (theme: Settings['theme']) => void;

  // Demo
  loadDemo: () => string;
  clearAllData: () => void;
  clearDemoData: () => void;
  completeFirstLaunch: () => void;

  // Toast (not persisted)
  showToast: (message: string) => void;
  hideToast: () => void;

  // Backend sync (pull remote rows into local cache, matched by backendId)
  applyRemoteState: (
    groupId: string,
    remoteMembers: RemoteMember[],
    remoteExpenses: RemoteExpense[]
  ) => void;
}

export const useStore = create<SplitzState>()(
  persist(
    (set, get) => ({
      groups: {},
      members: {},
      expenses: {},
      settlements: {},
      settings: { theme: 'system' },
      isFirstLaunch: true,
      toast: null,

      addGroup: (name, type) => {
        const id = generateId();
        set((s) => ({
          groups: {
            ...s.groups,
            [id]: { id, name, type, memberIds: [], createdAt: new Date().toISOString() },
          },
        }));
        return id;
      },

      deleteGroup: (groupId) => {
        set((s) => {
          const groups = { ...s.groups };
          const members = { ...s.members };
          const expenses = { ...s.expenses };
          const settlements = { ...s.settlements };
          delete groups[groupId];
          Object.keys(members).forEach((k) => { if (members[k].groupId === groupId) delete members[k]; });
          Object.keys(expenses).forEach((k) => { if (expenses[k].groupId === groupId) delete expenses[k]; });
          Object.keys(settlements).forEach((k) => { if (settlements[k].groupId === groupId) delete settlements[k]; });
          return { groups, members, expenses, settlements };
        });
      },

      setDefaultSplit: (groupId, type, data) => {
        set((s) => {
          const g = s.groups[groupId];
          if (!g) return s;
          return { groups: { ...s.groups, [groupId]: { ...g, defaultSplitType: type, defaultSplitData: data } } };
        });
      },

      clearDefaultSplit: (groupId) => {
        set((s) => {
          const g = s.groups[groupId];
          if (!g) return s;
          const { defaultSplitType: _t, defaultSplitData: _d, ...rest } = g;
          void _t; void _d;
          return { groups: { ...s.groups, [groupId]: rest as Group } };
        });
      },

      // Direct Friend Split: implicit 2-member `Direct` group (PRD Sec 39)
      createDirectSplit: (friendName, myName = 'You') => {
        const groupId = generateId();
        const meId = generateId();
        const friendId = generateId();
        const now = new Date().toISOString();
        set((s) => ({
          groups: {
            ...s.groups,
            [groupId]: { id: groupId, name: `${myName} ↔ ${friendName}`, type: 'Direct', memberIds: [meId, friendId], createdAt: now },
          },
          members: {
            ...s.members,
            [meId]: { id: meId, name: myName, groupId: groupId, isAccount: true },
            [friendId]: { id: friendId, name: friendName, groupId: groupId },
          },
        }));
        return groupId;
      },

      addMember: (groupId, name, opts) => {
        const id = generateId();
        set((s) => {
          const group = s.groups[groupId];
          if (!group) return s;
          return {
            members: {
              ...s.members,
              [id]: {
                id,
                name,
                groupId,
                phone: opts?.phone?.trim() ? opts.phone.trim() : undefined,
                email: opts?.email?.trim() ? opts.email.trim() : undefined,
              },
            },
            groups: {
              ...s.groups,
              [groupId]: { ...group, memberIds: [...group.memberIds, id] },
            },
          };
        });
        return id;
      },

      removeMember: (memberId) => {
        set((s) => {
          const member = s.members[memberId];
          if (!member) return s;
          const members = { ...s.members };
          delete members[memberId];
          const group = s.groups[member.groupId];
          return {
            members,
            groups: group
              ? {
                  ...s.groups,
                  [group.id]: {
                    ...group,
                    memberIds: group.memberIds.filter((id) => id !== memberId),
                  },
                }
              : s.groups,
          };
        });
      },

      renameMember: (memberId, name) => {
        set((s) => ({
          members: { ...s.members, [memberId]: { ...s.members[memberId], name } },
        }));
      },

      addExpense: (expense) => {
        const id = generateId();
        const now = new Date().toISOString();
        const category = isExpenseCategory(expense.category) ? expense.category : 'other';
        const note = expense.note?.trim().slice(0, 280) || undefined;
        const recurring = expense.recurring ?? 'none';
        const main: Expense = { ...expense, id, createdAt: now, category, note, recurring };
        set((s) => ({
          expenses: { ...s.expenses, [id]: main },
        }));
        // V1 recurring: create the next instance automatically (non-recurring child to avoid chains)
        if (recurring !== 'none') {
          const childId = generateId();
          const child: Expense = {
            ...main,
            id: childId,
            createdAt: getNextRecurringDate(now, recurring),
            recurring: 'none',
          };
          set((s) => ({ expenses: { ...s.expenses, [childId]: child } }));
        }
        return id;
      },

      updateExpense: (id, expense) => {
        set((s) => {
          const prev = s.expenses[id];
          if (!prev) return s;
          const category = isExpenseCategory(expense.category) ? expense.category : 'other';
          const note = expense.note?.trim().slice(0, 280) || undefined;
          return {
            expenses: {
              ...s.expenses,
              [id]: { ...expense, id, createdAt: prev.createdAt, category, note },
            },
          };
        });
      },

      deleteExpense: (id) => {
        set((s) => {
          const expenses = { ...s.expenses };
          delete expenses[id];
          return { expenses };
        });
      },

      markSettlementPaid: (id) => {
        set((s) => ({
          settlements: {
            ...s.settlements,
            [id]: { ...s.settlements[id], status: 'paid' },
          },
        }));
      },

      upsertSettlement: (settlement) => {
        const id = generateId();
        set((s) => ({
          settlements: {
            ...s.settlements,
            [id]: { ...settlement, id, createdAt: new Date().toISOString() },
          },
        }));
      },

      setTheme: (theme) => {
        set((s) => ({ settings: { ...s.settings, theme } }));
      },

      loadDemo: () => {
        const demo = loadDemoData();
        set((s) => ({
          groups: { ...s.groups, ...demo.groups },
          members: { ...s.members, ...demo.members },
          expenses: { ...s.expenses, ...demo.expenses },
          settlements: { ...s.settlements, ...demo.settlements },
        }));
        return 'demo-goa-trip';
      },

      clearAllData: () => {
        set({
          groups: {},
          members: {},
          expenses: {},
          settlements: {},
        });
      },

      clearDemoData: () => {
        set((s) => {
          const groups = { ...s.groups };
          const members = { ...s.members };
          const expenses = { ...s.expenses };
          const settlements = { ...s.settlements };
          // Remove keys starting with 'demo-'
          ['demo-goa-trip'].forEach((id) => delete groups[id]);
          Object.keys(members).forEach((k) => { if (k.startsWith('demo-')) delete members[k]; });
          Object.keys(expenses).forEach((k) => { if (k.startsWith('demo-')) delete expenses[k]; });
          Object.keys(settlements).forEach((k) => { if (k.startsWith('demo-')) delete settlements[k]; });
          return { groups, members, expenses, settlements };
        });
      },

      completeFirstLaunch: () => {
        set({ isFirstLaunch: false });
      },

      showToast: (message) => {
        set({ toast: message });
        setTimeout(() => {
          if (get().toast === message) set({ toast: null });
        }, 2500);
      },

      hideToast: () => {
        set({ toast: null });
      },

      applyRemoteState: (groupId, remoteMembers, remoteExpenses) => {
        set((s) => mergeRemoteState(groupId, s.members, s.expenses, remoteMembers, remoteExpenses));
      },
    }),
    {
      name: 'splitz-v1',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // Toast is UI-only — never persist it.
      partialize: (s) => {
        const { toast: _t, ...rest } = s;
        void _t;
        return rest;
      },
      // Backfill pre-v2 records with new PRD Sec 5 fields.
      migrate: (persisted: unknown) => {
        const s = persisted as SplitzState;
        if (!s || typeof s !== 'object') return persisted as never;
        const expenses = { ...(s.expenses ?? {}) };
        Object.values(expenses).forEach((e) => {
          const ex = e as Expense;
          if (!isExpenseCategory((ex as { category?: unknown }).category)) {
            (ex as { category?: unknown }).category = 'other';
          }
          if (!ex.recurring) ex.recurring = 'none';
        });
        return { ...s, expenses } as never;
      },
    }
  )
);

export const hasMemberExpenses = (memberId: string, expenses: Record<string, Expense>): boolean =>
  Object.values(expenses).some(
    (e) => e.paidBy === memberId || e.shares.some((sh) => sh.memberId === memberId)
  );
