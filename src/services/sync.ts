import { isBackendEnabled } from './supabase';
import { listGroupMembers } from './groups';
import { listGroupExpenses } from './expenses';
import { useStore } from '../store/useStore';
import type { RemoteExpense, RemoteMember } from '../utils/remoteMerge';

// Pull-to-refresh from Supabase into the local cache (backend Sec 15/18).
// Merge is by backendId; server wins on conflict (Sec 19).

export const pullGroup = async (groupId: string): Promise<boolean> => {
  if (!isBackendEnabled()) return false;
  const [members, expenses] = await Promise.all([
    listGroupMembers(groupId),
    listGroupExpenses(groupId),
  ]);
  useStore
    .getState()
    .applyRemoteState(groupId, members as RemoteMember[], expenses as unknown as RemoteExpense[]);
  return true;
};

export const pullAllGroups = async (): Promise<number> => {
  if (!isBackendEnabled()) return 0;
  const { groups } = useStore.getState();
  let synced = 0;
  for (const id of Object.keys(groups)) {
    try {
      if (await pullGroup(id)) synced++;
    } catch {
      // Keep going — one group's failure must not block the rest.
    }
  }
  return synced;
};
