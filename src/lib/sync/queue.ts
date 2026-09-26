import AsyncStorage from '@react-native-async-storage/async-storage';

// Offline op queue (backend Sec 18). Writes go to local cache first when
// offline, then replay in order on reconnect. New expenses use client
// unique ids so they sync independently (Sec 19).

const KEY = 'splitz-sync-queue-v1';

export interface PendingOp {
  id: string;
  kind: 'expense:create' | 'expense:delete' | 'settlement:paid' | 'member:add';
  payload: Record<string, unknown>;
  createdAt: string;
}

export const enqueueOp = async (op: PendingOp): Promise<void> => {
  const raw = await AsyncStorage.getItem(KEY);
  const list: PendingOp[] = raw ? (JSON.parse(raw) as PendingOp[]) : [];
  list.push(op);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
};

export const listPendingOps = async (): Promise<PendingOp[]> => {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as PendingOp[]) : [];
};

export const removePendingOp = async (id: string): Promise<void> => {
  const list = await listPendingOps();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter((o) => o.id !== id)));
};

export const clearPendingOps = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEY);
};
