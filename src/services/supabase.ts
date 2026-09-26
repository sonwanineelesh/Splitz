import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy Supabase client. The app works fully offline without env keys
// (frontend V1 local-first); backend features activate when configured
// (backend Sec 1/18). Never import service_role here — anon key only (Sec 28).
let client: SupabaseClient | null = null;

export const isBackendEnabled = (): boolean =>
  !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const getSupabase = (): SupabaseClient | null => {
  if (!isBackendEnabled()) return null;
  if (!client) {
    client = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL as string,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
  }
  return client;
};

export const requireSupabase = (): SupabaseClient => {
  const c = getSupabase();
  if (!c) throw new Error('Backend not configured. Add Supabase keys to .env to enable sync.');
  return c;
};

// Convert technical failures to friendly UI messages (backend Sec 27).
// Never surface SQL errors, IDs, or stack traces to users.
export const toUserMessage = (action: string): string => {
  switch (action) {
    case 'expense:save':
      return "Couldn't save the expense. Please try again.";
    case 'expense:load':
      return "Couldn't load expenses. Please try again.";
    case 'group:create':
      return "Couldn't create the group. Please try again.";
    case 'group:join':
      return "Couldn't join the group. Check the invite code and try again.";
    case 'settlement:save':
      return "Couldn't save the settlement. Please try again.";
    case 'auth':
      return "Couldn't sign you in. Check your details and try again.";
    default:
      return 'Something went wrong. Please try again.';
  }
};
