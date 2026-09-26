import { ExpenseCategory, Group, Member, Expense, Settlement } from '../types';

export const loadDemoData = (): {
  groups: Record<string, Group>;
  members: Record<string, Member>;
  expenses: Record<string, Expense>;
  settlements: Record<string, Settlement>;
} => {
  const groupId = 'demo-goa-trip';

  const arpan: Member = { id: 'demo-arpan', name: 'Arpan', groupId, isAccount: true };
  const neelesh: Member = { id: 'demo-neelesh', name: 'Neelesh', groupId };
  const rahul: Member = { id: 'demo-rahul', name: 'Rahul', groupId };
  const priya: Member = { id: 'demo-priya', name: 'Priya', groupId };

  const allMembers = [arpan, neelesh, rahul, priya];
  const memberIds = allMembers.map((m) => m.id);

  const group: Group = {
    id: groupId,
    name: 'Goa Trip',
    type: 'Trip',
    memberIds,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    defaultSplitType: 'equal',
  };

  const makeEqualExpense = (
    id: string,
    description: string,
    amountPaise: number,
    paidBy: string,
    daysAgo: number,
    category: ExpenseCategory,
    note?: string
  ): Expense => {
    const share = Math.floor(amountPaise / 4);
    const remainder = amountPaise % 4;
    return {
      id,
      groupId,
      description,
      amountPaise,
      paidBy,
      splitType: 'equal',
      shares: memberIds.map((mid, i) => ({
        memberId: mid,
        amountPaise: share + (i === 0 ? remainder : 0),
      })),
      category,
      note,
      recurring: 'none',
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    };
  };

  const hotel = makeEqualExpense('demo-hotel', 'Hotel', 480000, arpan.id, 2, 'stay');
  const dinner = makeEqualExpense('demo-dinner', 'Dinner', 200000, neelesh.id, 1, 'food', "Rahul's birthday dinner");
  const taxi = makeEqualExpense('demo-taxi', 'Taxi', 80000, rahul.id, 0.5, 'transport');
  const breakfast = makeEqualExpense('demo-breakfast', 'Breakfast', 60000, priya.id, 0.1, 'food');

  return {
    groups: { [group.id]: group },
    members: Object.fromEntries(allMembers.map((m) => [m.id, m])),
    expenses: {
      [hotel.id]: hotel,
      [dinner.id]: dinner,
      [taxi.id]: taxi,
      [breakfast.id]: breakfast,
    },
    settlements: {},
  };
};
