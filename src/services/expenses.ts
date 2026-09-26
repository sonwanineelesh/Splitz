import { requireSupabase, toUserMessage } from './supabase';

// Expense service (backend Sec 4, 5, 10, 11).
// Writes go through the atomic RPC `create_expense_with_shares` (schema.sql);
// falls back to ordered two-step insert with cleanup on failure.

export interface ShareInput {
  member_id: string;
  amount_paise: number;
  percentage?: number | null;
  shares?: number | null;
}

export interface ExpenseInput {
  group_id: string;
  description: string;
  amount_paise: number;
  paid_by: string;
  category?: string;
  notes?: string;
  split_type: 'equal' | 'exact' | 'percentage' | 'shares';
  shares: ShareInput[];
}

const validateLocal = (input: ExpenseInput) => {
  if (!input.description.trim()) throw new Error('VALIDATION:description');
  if (!(input.amount_paise > 0)) throw new Error('VALIDATION:amount');
  const sum = input.shares.reduce((a, s) => a + s.amount_paise, 0);
  if (sum !== input.amount_paise) throw new Error('VALIDATION:shares');
};

export const createExpense = async (input: ExpenseInput): Promise<string> => {
  validateLocal(input);
  try {
    const sb = requireSupabase();
    const { data: user } = await sb.auth.getUser();
    // Preferred: atomic RPC.
    const { data, error } = await sb.rpc('create_expense_with_shares', {
      p_group_id: input.group_id,
      p_description: input.description.trim(),
      p_amount_paise: input.amount_paise,
      p_paid_by: input.paid_by,
      p_category: input.category ?? 'other',
      p_notes: input.notes ?? null,
      p_split_type: input.split_type,
      p_created_by: user.user?.id ?? null,
      p_shares: input.shares,
    });
    if (!error && data) return data as string;
    if (error) console.warn('[expenses.rpcFallback]', error);

    // Fallback: ordered insert + cleanup (still no partial expenses left behind).
    const { data: exp, error: e1 } = await sb
      .from('expenses')
      .insert({
        group_id: input.group_id,
        description: input.description.trim(),
        amount_paise: input.amount_paise,
        paid_by: input.paid_by,
        category: input.category ?? 'other',
        notes: input.notes ?? null,
        split_type: input.split_type,
        created_by: user.user?.id ?? null,
      })
      .select()
      .single();
    if (e1) throw e1;
    const { error: e2 } = await sb.from('expense_shares').insert(
      input.shares.map((s) => ({ ...s, expense_id: exp.id }))
    );
    if (e2) {
      await sb.from('expenses').delete().eq('id', exp.id);
      throw e2;
    }
    return exp.id as string;
  } catch (e) {
    console.error('[expenses.create]', e);
    throw new Error(toUserMessage('expense:save'));
  }
};

export const listGroupExpenses = async (groupId: string) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('expenses')
      .select('*, expense_shares(*)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error('[expenses.list]', e);
    throw new Error(toUserMessage('expense:load'));
  }
};

export const deleteExpense = async (expenseId: string) => {
  const sb = requireSupabase();
  const { error } = await sb.from('expenses').delete().eq('id', expenseId);
  if (error) {
    console.error('[expenses.delete]', error);
    throw new Error(toUserMessage('expense:save'));
  }
};
