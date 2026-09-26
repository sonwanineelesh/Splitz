import { useEffect } from 'react';
import { isBackendEnabled } from '../services/supabase';
import { subscribeGroup } from '../services/settlements';
import { pullGroup } from '../services/sync';
import { useStore } from '../store/useStore';

// Realtime refresh for one group (backend Sec 15). Inert without backend
// keys. On remote change: pull members + expenses, merge by backendId,
// toast. Never refetches the whole app.
export const useGroupSync = (groupId: string | undefined): void => {
  useEffect(() => {
    if (!groupId || !isBackendEnabled()) return;
    let alive = true;
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeGroup(groupId, () => {
        if (!alive) return;
        void pullGroup(groupId)
          .then((ok) => {
            if (ok && alive) useStore.getState().showToast('Synced latest changes.');
          })
          .catch(() => {});
      });
    } catch {
      // Realtime unavailable — local data remains the source of truth.
    }
    return () => {
      alive = false;
      try {
        unsub?.();
      } catch {
        // Ignore teardown errors.
      }
    };
  }, [groupId]);
};
