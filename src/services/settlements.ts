import { requireSupabase, toUserMessage } from './supabase';

// Settlement service (backend Sec 6, 14). History is immutable:
// mark-paid flips status + paid_at, never deletes.

// Realtime subscriptions (backend Sec 15): one channel per group.
// Callers refresh local cache on events; avoid full-app refetch.
export const subscribeGroup = (
  groupId: string,
  onEvent: (table: string) => void
): (() => void) => {
  const sb = requireSupabase();
  const channel = sb
    .channel(`group:${groupId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${groupId}` }, () => onEvent('expenses'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements', filter: `group_id=eq.${groupId}` }, () => onEvent('settlements'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, () => onEvent('group_members'))
    .subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
};

export const createSettlement = async (
  groupId: string,
  fromMember: string,
  toMember: string,
  amountPaise: number
) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('settlements')
      .insert({ group_id: groupId, from_member: fromMember, to_member: toMember, amount_paise: amountPaise, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[settlements.create]', e);
    throw new Error(toUserMessage('settlement:save'));
  }
};

export const markSettlementPaid = async (settlementId: string) => {
  try {
    const sb = requireSupabase();
    const { error } = await sb
      .from('settlements')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', settlementId);
    if (error) throw error;
  } catch (e) {
    console.error('[settlements.paid]', e);
    throw new Error(toUserMessage('settlement:save'));
  }
};
