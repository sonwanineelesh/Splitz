import { createServerFn } from '@tanstack/start';

export interface ScanReceiptResult {
  merchant: string;
  total: number;
  currency: string;
  date: string;
}

/**
 * Scans a receipt image using Gemini Vision via the Lovable AI Gateway.
 *
 * @param data Object containing the base64 encoded image data
 * @returns A structured object with merchant, total, currency, and date
 */
export const scanReceipt = createServerFn('POST', async ({ data }: { data: { imageData: string } }) => {
  const { imageData } = data;

  const prompt = `
    Analyze this receipt image and return a strictly structured JSON object.
    The object must contain the following fields:
    - merchant: The name of the store or business. If unknown or missing, use "Unknown Merchant".
    - total: The total amount of the receipt as a float (e.g., 12.34). If missing, return null.
    - currency: The ISO 4217 currency code (e.g., USD, EUR). If missing, return null.
    - date: The date of the transaction in YYYY-MM-DD format. If missing, return null.

    If the image is not a receipt or is completely unreadable, return exactly:
    { "error": "unreadable_receipt" }

    Return ONLY the JSON object. Do not include markdown formatting, explanations, or any other text.
  `;

  try {
    // Call the Lovable AI Gateway
    const response = await fetch('/api/ai/vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-1.5-flash',
        prompt,
        image: imageData,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.statusText}`);
    }

    const result = await response.json();

    // The gateway may return the JSON as a string inside a 'text' field or directly
    const content = typeof result === 'string' ? result : result.text || result.content || JSON.stringify(result);

    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);

      if (parsed.error === 'unreadable_receipt') {
        throw new Error('The image provided does not appear to be a readable receipt.');
      }

      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('AI returned an invalid response format.');
      }

      const { merchant, total, currency, date } = parsed;

      if (typeof merchant !== 'string') {
        throw new Error('AI response missing merchant name.');
      }
      if (total !== null && typeof total !== 'number') {
        throw new Error('AI response total must be a number or null.');
      }
      if (currency !== null && typeof currency !== 'string') {
        throw new Error('AI response currency must be a string or null.');
      }
      if (date !== null && typeof date !== 'string') {
        throw new Error('AI response date must be a string or null.');
      }

      return {
        merchant,
        total: total ?? 0,
        currency: currency ?? 'USD',
        date: date ?? new Date().toISOString().split('T')[0],
      };
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('scanReceipt Error:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred while scanning the receipt');
  }
});
