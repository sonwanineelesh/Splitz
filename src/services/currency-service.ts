import { createServerFn } from '@tanstack/start';

/**
 * Currency Service for handling exchange rates.
 */

interface ExchangeRateCacheEntry {
  rate: number;
  timestamp: number;
}

const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds
const rateCache = new Map<string, ExchangeRateCacheEntry>();

/**
 * Fetches the exchange rate from 'from' currency to 'to' currency.
 * Uses the Frankfurter API.
 * This is a server function to ensure API keys are not exposed and the cache is shared.
 *
 * @param data Object containing 'from' and 'to' currency codes
 * @returns The exchange rate
 */
export const getExchangeRate = createServerFn('GET', async ({ data }: { data: { from: string; to: string } }) => {
  const { from, to } = data;
  if (from === to) return 1;

  const cacheKey = `${from}_${to}`;
  const cached = rateCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rate;
  }

  try {
    const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Currency code not supported: ${from} or ${to}`);
      }
      throw new Error('Failed to fetch exchange rate from API');
    }

    const dataJson = await response.json();
    const rate = dataJson.rates[to];

    if (!rate) {
      throw new Error(`Rate for ${to} not found in response`);
    }

    rateCache.set(cacheKey, {
      rate,
      timestamp: Date.now(),
    });

    return rate;
  } catch (error) {
    console.error('CurrencyService Error:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred while fetching exchange rate');
  }
});

/**
 * List of commonly used currencies for the selector.
 */
export const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD', 'INR', 'SGD'
];
