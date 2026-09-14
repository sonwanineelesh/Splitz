import { Store } from '@tanstack/store';
import { Group, Member, ISplitzRepository } from '../domain/types';
import { IndexedDBRepository } from '../infrastructure/idb-repository';

export interface StoreState {
  groups: Group[];
  currentGroup: Group | null;
  members: Member[];
}

const initialState: StoreState = {
  groups: [],
  currentGroup: null,
  members: [],
};

// Singleton repository
export const repo = new IndexedDBRepository();

export const store = new Store<StoreState>(initialState);

export const storeActions = {
  async loadGroups() {
    const groups = await repo.getGroups();
    store.setState((state) => ({
      ...state,
      groups,
    }));
  },

  async calculateOverallBalance() {
    const groups = await repo.getGroups();
    let totalPaid = 0;
    let totalOwed = 0;

    for (const group of groups) {
      const members = await repo.getMembers(group.id);
      const user = members.find((m) => m.isUser);
      if (!user) continue;

      const expenses = await repo.getExpenses(group.id);
      for (const expense of expenses) {
        if (expense.paidByMemberId === user.id) {
          totalPaid += expense.amount;
        }
        const splits = await repo.getSplits(expense.id);
        const userSplit = splits.find((s) => s.memberId === user.id);
        if (userSplit) {
          totalOwed += userSplit.amount;
        }
      }
    }

    return {
      paid: totalPaid,
      owed: totalOwed,
      net: totalPaid - totalOwed,
    };
  },

  async setCurrentGroup(groupId: string) {
    const groups = store.getState().groups;
    const group = groups.find((g) => g.id === groupId) || null;

    let members = [];
    if (group) {
      members = await repo.getMembers(groupId);
    }

    store.setState((state) => ({
      ...state,
      currentGroup: group,
      members,
    }));
  },

  async addGroup(name: string, homeCurrency: string) {
    const group: Group = {
      id: crypto.randomUUID(),
      name,
      homeCurrency,
      createdAt: Date.now(),
    };

    await repo.saveGroup(group);

    // Update local state
    store.setState((state) => ({
      ...state,
      groups: [...state.groups, group],
    }));

    return group;
  },

  clearCurrentGroup() {
    store.setState((state) => ({
      ...state,
      currentGroup: null,
      members: [],
    }));
  },
};
