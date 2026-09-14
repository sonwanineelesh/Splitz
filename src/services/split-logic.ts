export type SplitResult = {
  memberId: string;
  amount: number;
};

export interface EqualStrategy {
  type: 'equal';
}

export interface ExactStrategy {
  type: 'exact';
  amounts: Record<string, number>;
}

export interface PercentageStrategy {
  type: 'percentage';
  percentages: Record<string, number>;
}

export interface SharesStrategy {
  type: 'shares';
  shares: Record<string, number>;
}

export type SplitStrategy = EqualStrategy | ExactStrategy | PercentageStrategy | SharesStrategy;

export function calculateSplits(
  total: number,
  memberIds: string[],
  strategy: SplitStrategy
): SplitResult[] {
  if (memberIds.length === 0) return [];

  switch (strategy.type) {
    case 'equal': {
      const count = memberIds.length;
      const baseAmount = Math.floor(total / count);
      const currentTotal = baseAmount * count;

      const results = memberIds.map((memberId) => ({
        memberId,
        amount: baseAmount,
      }));

      return distributeRemainder(results, total, currentTotal);
    }

    case 'exact': {
      const results: SplitResult[] = [];
      let sum = 0;

      for (const memberId of memberIds) {
        const amount = strategy.amounts[memberId] || 0;
        sum += amount;
        results.push({ memberId, amount });
      }

      if (sum !== total) {
        throw new Error('Total amount must match the sum of individual amounts');
      }

      return results;
    }

    case 'percentage': {
      let totalPercentage = 0;

      for (const memberId of memberIds) {
        const percentage = strategy.percentages[memberId] || 0;
        totalPercentage += percentage;
      }

      if (Math.abs(totalPercentage - 100) > 0.0001) {
        throw new Error('Percentages must sum to 100%');
      }

      let currentTotal = 0;
      const resultsWithAmounts = memberIds.map((memberId) => {
        const percentage = strategy.percentages[memberId] || 0;
        const amount = Math.floor(total * (percentage / 100));
        currentTotal += amount;
        return { memberId, amount };
      });

      return distributeRemainder(resultsWithAmounts, total, currentTotal);
    }

    case 'shares': {
      const totalShares = memberIds.reduce(
        (acc, memberId) => acc + (strategy.shares[memberId] || 0),
        0
      );

      if (totalShares === 0) {
        throw new Error('Total shares must be greater than 0');
      }

      const baseAmountPerShare = total / totalShares;
      let currentTotal = 0;

      const resultsWithAmounts = memberIds.map((memberId) => {
        const shares = strategy.shares[memberId] || 0;
        const amount = Math.floor(shares * baseAmountPerShare);
        currentTotal += amount;
        return { memberId, amount };
      });

      return distributeRemainder(resultsWithAmounts, total, currentTotal);
    }
  }
}

function distributeRemainder(
  results: SplitResult[],
  total: number,
  currentTotal: number
): SplitResult[] {
  let remainder = total - currentTotal;
  return results.map((res) => {
    const amount = res.amount + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    return { ...res, amount };
  });
}
