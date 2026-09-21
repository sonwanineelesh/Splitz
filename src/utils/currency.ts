// Money stored internally as paise (integer) to avoid floating-point errors
// ₹100.50 → 10050 paise

export const toPaise = (rupees: number): number => Math.round(rupees * 100);
export const toRupees = (paise: number): number => paise / 100;

export const formatCurrency = (paise: number): string => {
  const rupees = toRupees(Math.abs(paise));
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const formatCurrencyWithSign = (paise: number): string => {
  if (paise === 0) return '₹0';
  const sign = paise > 0 ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(paise))}`;
};
