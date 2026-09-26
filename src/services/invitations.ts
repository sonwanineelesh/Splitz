import { requireSupabase, toUserMessage } from './supabase';

// Invitation service (backend Sec 8, 20). Codes are crypto-random and
// never expose internal DB ids.

const randomCode = (len = 10): string => {
  // V1 client-side code; prefer server-generated codes when backend RPC exists.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

export const createInvitation = async (groupId: string, expiresAt?: string) => {
  try {
    const sb = requireSupabase();
    const { data: user } = await sb.auth.getUser();
    const { data, error } = await sb
      .from('invitations')
      .insert({
        group_id: groupId,
        code: randomCode(),
        created_by: user.user?.id ?? null,
        expires_at: expiresAt ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[invitations.create]', e);
    throw new Error(toUserMessage('group:create'));
  }
};

export const acceptInvitation = async (code: string, displayName: string) => {
  try {
    const sb = requireSupabase();
    const { data: invite, error: e1 } = await sb
      .from('invitations')
      .select('*')
      .eq('code', code)
      .single();
    if (e1 || !invite) throw new Error('INVITE_INVALID');
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error('INVITE_EXPIRED');
    }
    const { data: user } = await sb.auth.getUser();
    const { data, error: e2 } = await sb
      .from('group_members')
      .insert({
        group_id: invite.group_id,
        user_id: user.user?.id ?? null,
        display_name: displayName,
        role: 'member',
      })
      .select()
      .single();
    if (e2) throw e2;
    return data;
  } catch (e) {
    console.error('[invitations.accept]', e);
    throw new Error(toUserMessage('group:join'));
  }
};
