import { formatCurrency } from './currency';

// Dynamic, balance-aware greeting (never a hardcoded string).
// Template rotates daily (day-of-year seeded); suffix reflects live totals.
export type Daypart = 'morning' | 'afternoon' | 'evening' | 'night';

export const getDaypart = (hour: number): Daypart => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
};

const TEMPLATES: Record<Daypart, string[]> = {
  morning: ['Good morning', 'Morning', 'A fresh day to split'],
  afternoon: ['Good afternoon', 'Afternoon', 'Midday check-in'],
  evening: ['Good evening', 'Evening', 'Time for the day\u2019s tally'],
  night: ['Good night', 'Night owl mode', 'Late-night ledger'],
};

const dayOfYear = (d: Date): number => {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
};

export const getGreeting = (now: Date, netPaise: number, groupCount: number): string => {
  const templates = TEMPLATES[getDaypart(now.getHours())];
  const base = templates[dayOfYear(now) % templates.length];
  if (groupCount === 0) return `${base} · let\u2019s split something`;
  if (netPaise > 0) return `${base} · you\u2019re owed ${formatCurrency(netPaise)}`;
  if (netPaise < 0) return `${base} · ${formatCurrency(Math.abs(netPaise))} to settle`;
  return `${base} · all settled up`;
};
