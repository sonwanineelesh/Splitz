import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Group, Member, Expense, Settlement, Settings, SplitType, GroupType
} from '../types';
import { generateId } from '../utils/helpers';
import { loadDemoData } from '../utils/demoData';

interface SplitzState {
  groups: Record<string, Group>;
  members: Record<string, Member>;
  expenses: Record<string, Expense>;
  settlements: Record<string, Settlement>;
  settings: Settings;
  isFirstLaunch: boolean;

  // Group actions
  addGroup: (name: string, type: GroupType) => string;
  deleteGroup: (groupId: string) => void;

  // Member actions
  addMember: (groupId: string, name: string) => string;
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

      addMember: (groupId, name) => {
        const id = generateId();
        set((s) => ({
          members: { ...s.members, [id]: { id, name, groupId } },
          groups: {
            ...s.groups,
            [groupId]: {
              ...s.groups[groupId],
              memberIds: [...s.groups[groupId].memberIds, id],
            },
          },
        }));
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
        set((s) => ({
          expenses: {
            ...s.expenses,
            [id]: { ...expense, id, createdAt: new Date().toISOString() },
          },
        }));
        return id;
      },

      updateExpense: (id, expense) => {
        set((s) => ({
          expenses: {
            ...s.expenses,
            [id]: { ...expense, id, createdAt: s.expenses[id]?.createdAt ?? new Date().toISOString() },
          },
        }));
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
    }),
    {
      name: 'splitz-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
