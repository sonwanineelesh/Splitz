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
    - merchant: The name of the store or business.
    - total: The total amount of the receipt as a float (e.g., 12.34).
    - currency: The ISO 4217 currency code (e.g., USD, EUR).
    - date: The date of the transaction in YYYY-MM-DD format.

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
      return JSON.parse(cleanContent) as ScanReceiptResult;
    } catch (e) {
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('scanReceipt Error:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred while scanning the receipt');
  }
});
