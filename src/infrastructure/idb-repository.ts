import { openDB, IDBPDatabase } from 'idb';
import { ISplitzRepository, Group, Member, Expense, Split } from '../domain/types';

const DEFAULT_DB_NAME = 'splitz-db';
const DB_VERSION = 2;

export class IndexedDBRepository implements ISplitzRepository {
  private dbPromise: Promise<IDBPDatabase>;

  constructor(dbName: string = DEFAULT_DB_NAME) {
    this.dbPromise = openDB(dbName, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          db.createObjectStore('groups', { keyPath: 'id' });
          db.createObjectStore('members', { keyPath: 'id' });
          db.createObjectStore('expenses', { keyPath: 'id' });
          db.createObjectStore('splits', { keyPath: 'id' });
        }

        const membersStore = transaction.objectStore('members');
        if (!membersStore.indexNames.contains('groupId')) {
          membersStore.createIndex('groupId', 'groupId');
        }

        const expensesStore = transaction.objectStore('expenses');
        if (!expensesStore.indexNames.contains('groupId')) {
          expensesStore.createIndex('groupId', 'groupId');
        }

        const splitsStore = transaction.objectStore('splits');
        if (!splitsStore.indexNames.contains('expenseId')) {
          splitsStore.createIndex('expenseId', 'expenseId');
        }
      },
    });
  }

  async getGroups(): Promise<Group[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAll('groups');
    } catch (error) {
      throw new Error(`Failed to retrieve groups: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveGroup(group: Group): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.put('groups', group);
    } catch (error) {
      throw new Error(`Failed to save group: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getMembers(groupId: string): Promise<Member[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAllFromIndex('members', 'groupId', groupId);
    } catch (error) {
      throw new Error(`Failed to retrieve members for group ${groupId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveMember(member: Member): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.put('members', member);
    } catch (error) {
      throw new Error(`Failed to save member: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getExpenses(groupId: string): Promise<Expense[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAllFromIndex('expenses', 'groupId', groupId);
    } catch (error) {
      throw new Error(`Failed to retrieve expenses for group ${groupId}: ${error instanceof Error ? error.message : String(error)}`);
    }
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
      // In idb, tx.abort() can be called, but the error from the failed put
      // will already cause the transaction to abort.
      // We just need to make sure we don't leave an unhandled rejection from tx.done.
      try {
        await tx.abort();
      } catch (e) {
        // Ignore abort errors
      }
      throw new Error(`Failed to save expense and splits: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getSplits(expenseId: string): Promise<Split[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAllFromIndex('splits', 'expenseId', expenseId);
    } catch (error) {
      throw new Error(`Failed to retrieve splits for expense ${expenseId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(['groups', 'members', 'expenses', 'splits'], 'readwrite');
      tx.objectStore('groups').clear();
      tx.objectStore('members').clear();
      tx.objectStore('expenses').clear();
      tx.objectStore('splits').clear();
      await tx.done;
    } catch (error) {
      throw new Error(`Failed to clear database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
