import { openDB, IDBPDatabase } from 'idb';
import { ISplitzRepository, Group, Member, Expense, Split } from '../domain/types';

const DB_NAME = 'splitz-db';
const DB_VERSION = 1;

export class IndexedDBRepository implements ISplitzRepository {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('members')) {
          db.createObjectStore('members', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('expenses')) {
          db.createObjectStore('expenses', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('splits')) {
          db.createObjectStore('splits', { keyPath: 'id' });
        }
      },
    });
  }

  async getGroups(): Promise<Group[]> {
    const db = await this.dbPromise;
    return db.getAll('groups');
  }

  async saveGroup(group: Group): Promise<void> {
    const db = await this.dbPromise;
    await db.put('groups', group);
  }

  async getMembers(groupId: string): Promise<Member[]> {
    const db = await this.dbPromise;
    const members = await db.getAll('members');
    return members.filter(m => m.groupId === groupId);
  }

  async saveMember(member: Member): Promise<void> {
    const db = await this.dbPromise;
    await db.put('members', member);
  }

  async getExpenses(groupId: string): Promise<Expense[]> {
    const db = await this.dbPromise;
    const expenses = await db.getAll('expenses');
    return expenses.filter(e => e.groupId === groupId);
  }

  async saveExpense(expense: Expense, splits: Split[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['expenses', 'splits'], 'readwrite');
    try {
      await tx.objectStore('expenses').put(expense);
      const splitsStore = tx.objectStore('splits');
      for (const split of splits) {
        await splitsStore.put(split);
      }
      await tx.done;
    } catch (error) {
      tx.abort();
      throw error;
    }
  }

  async getSplits(expenseId: string): Promise<Split[]> {
    const db = await this.dbPromise;
    const splits = await db.getAll('splits');
    return splits.filter(s => s.expenseId === expenseId);
  }
}
