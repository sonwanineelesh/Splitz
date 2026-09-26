// UPI intent builder (backend Sec 24). Splitz only generates a payment
// intent — opening a UPI app NEVER counts as confirmed payment.
// Settlement confirmation remains explicit `Mark as Paid`.

export interface UpiIntent {
  pa: string; // recipient VPA
  pn: string; // recipient name
  am: string; // amount in rupees, 2dp
  cu?: string;
  tn?: string;
}

export const buildUpiIntent = (intent: UpiIntent): string => {
  const params = new URLSearchParams({
    pa: intent.pa,
    pn: intent.pn,
    am: intent.am,
    cu: intent.cu ?? 'INR',
    ...(intent.tn ? { tn: intent.tn } : {}),
  });
  return `upi://pay?${params.toString()}`;
};

// Paise → UPI amount string (backend stores BIGINT paise, Sec 9).
export const paiseToUpiAmount = (paise: number): string =>
  (Math.max(0, Math.round(paise)) / 100).toFixed(2);
