// Analytics allowlist (backend Sec 26). Never send expense descriptions,
// notes, amounts, or other private financial data to providers.

export type AnalyticsEvent =
  | 'signup' | 'login'
  | 'group_created' | 'invite_created' | 'invite_accepted' | 'member_added'
  | 'expense_created' | 'expense_updated' | 'expense_deleted'
  | 'split_completed' | 'balance_viewed'
  | 'settlement_created' | 'settlement_paid'
  | 'upi_clicked'
  | 'pro_viewed' | 'paywall_viewed' | 'purchase_started' | 'purchase_completed';

export const track = (event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void => {
  // Provider wiring is pending; log in dev only. Props must stay coarse.
  if (__DEV__) {
    console.log('[analytics]', event, props ?? {});
  }
};
