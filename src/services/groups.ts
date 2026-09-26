import { requireSupabase, toUserMessage } from './supabase';

// Group + membership service (backend Sec 3, 17, 20, 21).
// Roles: owner / member. Guest members have user_id NULL (Sec 21).

const randomCode = (len = 8): string => {
  // V1 client-side code; prefer server-generated codes when backend RPC exists.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

export const createGroup = async (name: string, type: string) => {
  try {
    const sb = requireSupabase();
    const { data: user } = await sb.auth.getUser();
    const { data, error } = await sb
      .from('groups')
      .insert({ name, type, created_by: user.user?.id ?? null, invite_code: randomCode() })
      .select()
      .single();
    if (error) throw error;
    if (user.user) {
      await sb.from('group_members').insert({
        group_id: data.id,
        user_id: user.user.id,
        display_name: 'You',
        role: 'owner',
      });
    }
    return data;
  } catch (e) {
    console.error('[groups.create]', e);
    throw new Error(toUserMessage('group:create'));
  }
};

export const addGuestMember = async (groupId: string, displayName: string) => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('group_members')
    .insert({ group_id: groupId, user_id: null, display_name: displayName, role: 'member' })
    .select()
    .single();
  if (error) {
    console.error('[groups.addGuest]', error);
    throw new Error(toUserMessage('group:create'));
  }
  return data;
};

export const listMyGroups = async () => {  try {
    const sb = requireSupabase();
    const { data: user } = await sb.auth.getUser();
    if (!user.user) return [];
    const { data, error } = await sb
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', user.user.id);
    if (error) throw error;
    return (data ?? []).map((r: { groups: unknown }) => r.groups);
  } catch (e) {
    console.error('[groups.list]', e);
    throw new Error(toUserMessage('group:create'));
  }
};

export const listGroupMembers = async (groupId: string) => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('group_members')
    .select('id, display_name')
    .eq('group_id', groupId);
  if (error) {
    console.error('[groups.members]', error);
    throw new Error(toUserMessage('group:create'));
  }
  return (data ?? []) as Array<{ id: string; display_name: string }>;
};
