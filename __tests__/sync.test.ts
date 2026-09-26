import { mergeRemoteState } from '../src/utils/remoteMerge';
import { Expense, Member } from '../src/types';

const localMember = (id: string, name: string, backendId?: string): Member => ({
  id, name, groupId: 'g', ...(backendId ? { backendId } : {}),
});

const localExpense = (id: string, backendId?: string): Expense => ({
  id,
  groupId: 'g',
  description: 'Local',
  amountPaise: 100,
  paidBy: 'm1',
  splitType: 'equal',
  shares: [],
  category: 'other',
  recurring: 'none',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...(backendId ? { backendId } : {}),
});

describe('remote merge (backend Sec 15/18/19)', () => {
  it('adds new remote members and expenses without duplicating', () => {
    const first = mergeRemoteState(
      'g',
      { m1: localMember('m1', 'Arpan') },
      {},
      [{ id: 'srv-a', display_name: 'Arpan' }],
      [{
        id: 'srv-e1', description: 'Hotel', amount_paise: 480000,
        paid_by: 'srv-a', category: 'stay', notes: null,
        split_type: 'equal', created_at: '2026-01-02T00:00:00.000Z',
        expense_shares: [{ member_id: 'srv-a', amount_paise: 480000 }],
      }]
    );
    // Matched local Arpan by... no backendId yet → creates new member (name match not used).
    expect(Object.keys(first.members)).toHaveLength(2);
    expect(Object.keys(first.expenses)).toHaveLength(1);

    // Pulling the same payload again must not duplicate.
    const second = mergeRemoteState('g', first.members, first.expenses,
      [{ id: 'srv-a', display_name: 'Arpan' }],
      [{
        id: 'srv-e1', description: 'Hotel', amount_paise: 480000,
        paid_by: 'srv-a', category: 'stay', notes: null,
        split_type: 'equal', created_at: '2026-01-02T00:00:00.000Z',
        expense_shares: [{ member_id: 'srv-a', amount_paise: 480000 }],
      }]);
    expect(Object.keys(second.members)).toHaveLength(2);
    expect(Object.keys(second.expenses)).toHaveLength(1);
  });

  it('server wins on conflicting edits, invalid enums fall back safely', () => {
    const merged = mergeRemoteState(
      'g',
      { m1: localMember('m1', 'Old Name', 'srv-a') },
      { e1: localExpense('e1', 'srv-e1') },
      [{ id: 'srv-a', display_name: 'New Name' }],
      [{
        id: 'srv-e1', description: 'Updated', amount_paise: 200,
        paid_by: 'srv-a', category: 'bogus', notes: 'hi',
        split_type: 'bogus', created_at: '2026-01-02T00:00:00.000Z',
        expense_shares: [],
      }]
    );
    expect(merged.members.m1.name).toBe('New Name');
    expect(merged.expenses.e1.description).toBe('Updated');
    expect(merged.expenses.e1.category).toBe('other');
    expect(merged.expenses.e1.splitType).toBe('equal');
    expect(merged.expenses.e1.note).toBe('hi');
  });

  it('skips remote expenses whose payer is unknown', () => {
    const merged = mergeRemoteState('g', {}, {},
      [],
      [{
        id: 'srv-x', description: 'Ghost', amount_paise: 100,
        paid_by: 'srv-ghost', category: 'food', notes: null,
        split_type: 'equal', created_at: '2026-01-02T00:00:00.000Z',
        expense_shares: [],
      }]);
    expect(Object.keys(merged.expenses)).toHaveLength(0);
  });
});
