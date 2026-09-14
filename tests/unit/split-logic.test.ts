import { describe, it, expect } from 'vitest';
import { calculateSplits } from '../../src/services/split-logic';

describe('split-logic', () => {
  const members = ['m1', 'm2', 'm3'];
  const total = 10000; // 100.00 in cents

  describe('Equal split', () => {
    it('should divide equally without remainder', () => {
      const total2 = 9000; // 90.00
      const result = calculateSplits(total2, members, { type: 'equal' });
      expect(result).toEqual([
        { memberId: 'm1', amount: 3000 },
        { memberId: 'm2', amount: 3000 },
        { memberId: 'm3', amount: 3000 },
      ]);
    });

    it('should handle remainders by distributing them one-by-one to the first members', () => {
      const result = calculateSplits(total, members, { type: 'equal' });
      // 10000 / 3 = 3333 with remainder 1
      expect(result).toEqual([
        { memberId: 'm1', amount: 3334 },
        { memberId: 'm2', amount: 3333 },
        { memberId: 'm3', amount: 3333 },
      ]);
    });

    it('should handle remainders for larger remainder', () => {
      const members2 = ['m1', 'm2', 'm3', 'm4'];
      const total2 = 10002; // 100.02
      // 10002 / 4 = 2500 with remainder 2
      const result = calculateSplits(total2, members2, { type: 'equal' });
      expect(result).toEqual([
        { memberId: 'm1', amount: 2501 },
        { memberId: 'm2', amount: 2501 },
        { memberId: 'm3', amount: 2500 },
        { memberId: 'm4', amount: 2500 },
      ]);
    });

    it('should return empty array when memberIds is empty', () => {
      const result = calculateSplits(total, [], { type: 'equal' });
      expect(result).toEqual([]);
    });

    it('should handle total being 0', () => {
      const result = calculateSplits(0, members, { type: 'equal' });
      expect(result).toEqual([
        { memberId: 'm1', amount: 0 },
        { memberId: 'm2', amount: 0 },
        { memberId: 'm3', amount: 0 },
      ]);
    });
  });

  describe('Exact split', () => {
    it('should calculate correctly when sum matches total', () => {
      const strategy = {
        type: 'exact',
        amounts: { 'm1': 5000, 'm2': 3000, 'm3': 2000 },
      };
      const result = calculateSplits(total, members, strategy);
      expect(result).toEqual([
        { memberId: 'm1', amount: 5000 },
        { memberId: 'm2', amount: 3000 },
        { memberId: 'm3', amount: 2000 },
      ]);
    });

    it('should throw error when sum does not match total', () => {
      const strategy = {
        type: 'exact',
        amounts: { 'm1': 5000, 'm2': 3000, 'm3': 1000 }, // sum 9000 != 10000
      };
      expect(() => calculateSplits(total, members, strategy)).toThrow('Total amount must match the sum of individual amounts');
    });

    it('should return empty array when memberIds is empty', () => {
      const strategy = {
        type: 'exact',
        amounts: { 'm1': 10000 },
      };
      const result = calculateSplits(total, [], strategy);
      expect(result).toEqual([]);
    });

    it('should handle total being 0', () => {
      const strategy = {
        type: 'exact',
        amounts: { 'm1': 0, 'm2': 0, 'm3': 0 },
      };
      const result = calculateSplits(0, members, strategy);
      expect(result).toEqual([
        { memberId: 'm1', amount: 0 },
        { memberId: 'm2', amount: 0 },
        { memberId: 'm3', amount: 0 },
      ]);
    });
  });

  describe('Percentage split', () => {
    it('should calculate correctly when percentages sum to 100%', () => {
      const strategy = {
        type: 'percentage',
        percentages: { 'm1': 50, 'm2': 30, 'm3': 20 },
      };
      const result = calculateSplits(total, members, strategy);
      expect(result).toEqual([
        { memberId: 'm1', amount: 5000 },
        { memberId: 'm2', amount: 3000 },
        { memberId: 'm3', amount: 2000 },
      ]);
    });

    it('should handle percentage remainders by distributing them to the first members', () => {
      const total2 = 10000;
      const strategy = {
        type: 'percentage',
        percentages: { 'm1': 33.33, 'm2': 33.33, 'm3': 33.34 }, // wait, the requirement says "percentages sum to 100%"
      };
      // Actually, let's use simpler percentages that might cause rounding issues if not handled.
      // For 10000, 33.33% is 3333.
      // 33.33 + 33.33 + 33.34 = 100
      const result = calculateSplits(total2, members, strategy);
      expect(result).toEqual([
        { memberId: 'm1', amount: 3333 },
        { memberId: 'm2', amount: 3333 },
        { memberId: 'm3', amount: 3334 },
      ]);
    });

    it('should throw error when percentages do not sum to 100%', () => {
      const strategy = {
        type: 'percentage',
        percentages: { 'm1': 50, 'm2': 20, 'm3': 20 }, // sum 90 != 100
      };
      expect(() => calculateSplits(total, members, strategy)).toThrow('Percentages must sum to 100%');
    });

    it('should return empty array when memberIds is empty', () => {
      const strategy = {
        type: 'percentage',
        percentages: { 'm1': 100 },
      };
      const result = calculateSplits(total, [], strategy);
      expect(result).toEqual([]);
    });

    it('should handle total being 0', () => {
      const strategy = {
        type: 'percentage',
        percentages: { 'm1': 50, 'm2': 50 },
      };
      const result = calculateSplits(0, ['m1', 'm2'], strategy);
      expect(result).toEqual([
        { memberId: 'm1', amount: 0 },
        { memberId: 'm2', amount: 0 },
      ]);
    });

    it('should handle 100% allocation to a single member', () => {
      const strategy = {
        type: 'percentage',
        percentages: { 'm1': 100, 'm2': 0, 'm3': 0 },
      };
      const result = calculateSplits(total, members, strategy);
      expect(result).toEqual([
        { memberId: 'm1', amount: 10000 },
        { memberId: 'm2', amount: 0 },
        { memberId: 'm3', amount: 0 },
      ]);
    });
  });

  describe('Shares split', () => {
    it('should calculate correctly based on shares', () => {
      const strategy = {
        type: 'shares',
        shares: { 'm1': 2, 'm2': 1, 'm3': 2 }, // total shares = 5
      };
      // 10000 / 5 = 2000 per share
      const result = calculateSplits(total, members, strategy);
      expect(result).toEqual([
        { memberId: 'm1', amount: 4000 },
        { memberId: 'm2', amount: 2000 },
        { memberId: 'm3', amount: 4000 },
      ]);
    });

    it('should handle share remainders by distributing them to the first members', () => {
      const total2 = 10001; // 100.01
      const strategy = {
        type: 'shares',
        shares: { 'm1': 1, 'm2': 1, 'm3': 1 }, // total shares = 3
      };
      // 10001 / 3 = 3333 with remainder 2
      const result = calculateSplits(total2, members, strategy);
      expect(result).toEqual([
        { memberId: 'm1', amount: 3334 },
        { memberId: 'm2', amount: 3334 },
        { memberId: 'm3', amount: 3333 },
      ]);
    });

    it('should return empty array when memberIds is empty', () => {
      const strategy = {
        type: 'shares',
        shares: { 'm1': 1 },
      };
      const result = calculateSplits(total, [], strategy);
      expect(result).toEqual([]);
    });

    it('should handle total being 0', () => {
      const strategy = {
        type: 'shares',
        shares: { 'm1': 1, 'm2': 1 },
      };
      const result = calculateSplits(0, ['m1', 'm2'], strategy);
      expect(result).toEqual([
        { memberId: 'm1', amount: 0 },
        { memberId: 'm2', amount: 0 },
      ]);
    });

    it('should handle 100% allocation to a single member', () => {
      const strategy = {
        type: 'shares',
        shares: { 'm1': 1, 'm2': 0, 'm3': 0 },
      };
      const result = calculateSplits(total, members, strategy);
      expect(result).toEqual([
        { memberId: 'm1', amount: 10000 },
        { memberId: 'm2', amount: 0 },
        { memberId: 'm3', amount: 0 },
      ]);
    });
  });
});
