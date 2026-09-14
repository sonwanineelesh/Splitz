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

    const groupBalances = await Promise.all(groups.map(async (group) => {
      const [members, expenses] = await Promise.all([
        repo.getMembers(group.id),
        repo.getExpenses(group.id)
      ]);

      const user = members.find((m) => m.isUser);
      if (!user) return { paid: 0, owed: 0 };

      const expenseBalances = await Promise.all(expenses.map(async (expense) => {
        let paid = 0;
        if (expense.paidByMemberId === user.id) {
          paid = expense.amount;
        }

        const splits = await repo.getSplits(expense.id);
        const userSplit = splits.find((s) => s.memberId === user.id);
        const owed = userSplit ? userSplit.amount : 0;

        return { paid, owed };
      }));

      return expenseBalances.reduce((acc, curr) => ({
        paid: acc.paid + curr.paid,
        owed: acc.owed + curr.owed
      }), { paid: 0, owed: 0 });
    }));

    const totals = groupBalances.reduce((acc, curr) => ({
      paid: acc.paid + curr.paid,
      owed: acc.owed + curr.owed
    }), { paid: 0, owed: 0 });

    return {
      paid: totals.paid,
      owed: totals.owed,
      net: totals.paid - totals.owed,
    };
  },

  async setCurrentGroup(groupId: string) {
    const groups = store.getState().groups;
    const group = groups.find((g) => g.id === groupId) || null;

    let members: Member[] = [];
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
