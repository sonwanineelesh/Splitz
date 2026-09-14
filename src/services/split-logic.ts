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
  switch (strategy.type) {
    case 'equal': {
      const count = memberIds.length;
      if (count === 0) return [];

      const baseAmount = Math.floor(total / count);
      let remainder = total % count;

      return memberIds.map((memberId) => {
        const amount = baseAmount + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        return { memberId, amount };
      });
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
      const results: SplitResult[] = [];
      let totalPercentage = 0;

      for (const memberId of memberIds) {
        const percentage = strategy.percentages[memberId] || 0;
        totalPercentage += percentage;
      }

      // Use a small epsilon for float comparison
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

      let remainder = total - currentTotal;
      const finalResults = resultsWithAmounts.map((res) => {
        const amount = res.amount + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        return { ...res, amount };
      });

      return finalResults;
    }

    case 'shares': {
      const totalShares = Object.values(strategy.shares).reduce((acc, val) => acc + val, 0);
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

      let remainder = total - currentTotal;
      const finalResults = resultsWithAmounts.map((res) => {
        const amount = res.amount + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        return { ...res, amount };
      });

      return finalResults;
    }
  }
}
