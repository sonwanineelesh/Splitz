import { requireSupabase, toUserMessage } from './supabase';

// Supabase Auth wrapper (backend Sec 2). Session persists + auto-refreshes
// via client config. Never store passwords manually.
export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await sb.from('profiles').upsert({ id: data.user.id, display_name: displayName });
    }
    return data;
  } catch (e) {
    console.error('[auth.signUp]', e);
    throw new Error(toUserMessage('auth'));
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[auth.signIn]', e);
    throw new Error(toUserMessage('auth'));
  }
};

export const signInWithGoogle = async (idToken: string) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[auth.google]', e);
    throw new Error(toUserMessage('auth'));
  }
};

export const signOut = async () => {
  const sb = requireSupabase();
  const { error } = await sb.auth.signOut();
  if (error) {
    console.error('[auth.signOut]', error);
    throw new Error(toUserMessage('auth'));
  }
};

export const getSession = async () => {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.getSession();
  if (error) {
    console.error('[auth.session]', error);
    throw new Error(toUserMessage('auth'));
  }
  return data.session;
};
