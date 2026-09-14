import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IndexedDBRepository } from '../../src/infrastructure/idb-repository';
import { Group, Member, Expense, Split } from '../../src/domain/types';

describe('IndexedDBRepository', () => {
  let repository: IndexedDBRepository;

  beforeEach(() => {
    repository = new IndexedDBRepository(`test-db-${Math.random()}`);
  });

  it('should save and retrieve a group', async () => {
    const group: Group = {
      id: 'group-1',
      name: 'Test Group',
      homeCurrency: 'USD',
      createdAt: Date.now(),
    };

    await repository.saveGroup(group);
    const groups = await repository.getGroups();

    expect(groups).toContainEqual(group);
  });

  it('should return an empty array when no groups exist', async () => {
    // Fresh repository instance should have empty groups
    const groups = await repository.getGroups();
    expect(groups).toEqual([]);
  });

  it('should save and retrieve members for a group', async () => {
    const groupId = 'group-1';
    const member1: Member = {
      id: 'member-1',
      groupId,
      name: 'Alice',
      isUser: true,
    };
    const member2: Member = {
      id: 'member-2',
      groupId,
      name: 'Bob',
      isUser: false,
    };
    const member3: Member = {
      id: 'member-3',
      groupId: 'other-group',
      name: 'Charlie',
      isUser: true,
    };

    await repository.saveMember(member1);
    await repository.saveMember(member2);
    await repository.saveMember(member3);

    const members = await repository.getMembers(groupId);

    expect(members).toHaveLength(2);
    expect(members).toContainEqual(member1);
    expect(members).toContainEqual(member2);
    expect(members).not.toContainEqual(member3);
  });

  it('should return an empty array when retrieving members for a non-existent group', async () => {
    const members = await repository.getMembers('non-existent-group');
    expect(members).toEqual([]);
  });

  it('should save an expense and its splits atomically', async () => {
    const groupId = 'group-1';
    const expense: Expense = {
      id: 'expense-1',
      groupId,
      paidByMemberId: 'member-1',
      amount: 1000,
      currency: 'USD',
      fxRateToHome: 1,
      description: 'Lunch',
      category: 'Food',
      date: Date.now(),
      isRecurring: false,
    };
    const splits: Split[] = [
      { id: 'split-1', expenseId: 'expense-1', memberId: 'member-1', amount: 500 },
      { id: 'split-2', expenseId: 'expense-1', memberId: 'member-2', amount: 500 },
    ];

    await repository.saveExpense(expense, splits);

    const expenses = await repository.getExpenses(groupId);
    expect(expenses).toContainEqual(expense);

    const retrievedSplits = await repository.getSplits('expense-1');
    expect(retrievedSplits).toHaveLength(2);
    expect(retrievedSplits).toContainEqual(splits[0]);
    expect(retrievedSplits).toContainEqual(splits[1]);
  });

  it('should not save expense if saving splits fails (atomicity)', async () => {
    const groupId = 'group-1';
    const expense: Expense = {
      id: 'expense-fail',
      groupId,
      paidByMemberId: 'member-1',
      amount: 1000,
      currency: 'USD',
      fxRateToHome: 1,
      description: 'Failing Expense',
      category: 'Food',
      date: Date.now(),
      isRecurring: false,
    };

    // We force a failure by passing something that might fail.
    // Since it's hard to force IDB failure with fake-indexeddb without mocking,
    // we can try passing an invalid splits array if our implementation allows it.
    // But our implementation iterates over splits and calls put().

    // To truly test atomicity, we should probably mock the put call.
    // However, let's see if passing null as a split causes an error.
    const invalidSplits = [null as any];

    await expect(repository.saveExpense(expense, invalidSplits)).rejects.toThrow();

    const expenses = await repository.getExpenses(groupId);
    expect(expenses).not.toContainEqual(expense);

    const splits = await repository.getSplits('expense-fail');
    expect(splits).toEqual([]);
  });

  it('should return an empty array when retrieving splits for a non-existent expense', async () => {
    const splits = await repository.getSplits('non-existent-expense');
    expect(splits).toEqual([]);
  });

  it('should retrieve expenses for a specific group', async () => {
    const groupId1 = 'group-1';
    const groupId2 = 'group-2';
    const expense1: Expense = {
      id: 'expense-1',
      groupId: groupId1,
      paidByMemberId: 'member-1',
      amount: 1000,
      currency: 'USD',
      fxRateToHome: 1,
      description: 'Lunch 1',
      category: 'Food',
      date: Date.now(),
      isRecurring: false,
    };
    const expense2: Expense = {
      id: 'expense-2',
      groupId: groupId2,
      paidByMemberId: 'member-1',
      amount: 2000,
      currency: 'USD',
      fxRateToHome: 1,
      description: 'Dinner 2',
      category: 'Food',
      date: Date.now(),
      isRecurring: false,
    };

    await repository.saveExpense(expense1, []);
    await repository.saveExpense(expense2, []);

    const expenses1 = await repository.getExpenses(groupId1);
    expect(expenses1).toHaveLength(1);
    expect(expenses1[0].id).toBe('expense-1');

    const expenses2 = await repository.getExpenses(groupId2);
    expect(expenses2).toHaveLength(1);
    expect(expenses2[0].id).toBe('expense-2');
  });
});
