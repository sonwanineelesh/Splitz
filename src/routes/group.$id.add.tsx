import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@tanstack/react-store';
import { store, repo } from '../store';
import { Expense, Split } from '../domain/types';
import { calculateSplits, SplitStrategy } from '../services/split-logic';
import { getExchangeRate, COMMON_CURRENCIES } from '../services/currency-service';
import { scanReceipt } from '../services/ai-service';

const AddExpense = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const state = useStore(store);
  const group = state.currentGroup;
  const members = state.members;

  const [isSettleUp, setIsSettleUp] = useState(false);
  const [payerId, setPayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [description, setDescription] = useState('');
  const [splitMode, setSplitMode] = useState<'equal' | 'exact' | 'percentage' | 'shares'>('equal');
  const [splitValues, setSplitValues] = useState<Record<string, number>>({});
  const [settleUpToId, setSettleUpToId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fxRate, setFxRate] = useState<number>(1);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (members.length > 0) {
      setPayerId(members[0].id);
      if (isSettleUp) {
        setSettleUpToId(members[1]?.id || '');
      }
    }
    if (group) {
      setCurrency(group.homeCurrency);
    }
  }, [members, isSettleUp, group]);

  useEffect(() => {
    const updateRate = async () => {
      if (!group || !currency) return;
      if (currency === group.homeCurrency) {
        setFxRate(1);
        return;
      }

      try {
        setIsFetchingRate(true);
        const rate = await getExchangeRate({ data: { from: currency, to: group.homeCurrency } });
        setFxRate(rate);
      } catch (err: any) {
        setError(`Could not fetch exchange rate: ${err.message}`);
      } finally {
        setIsFetchingRate(false);
      }
    };

    updateRate();
  }, [currency, group]);

  const convertedAmount = useMemo(() => {
    const numericAmount = parseFloat(amount) || 0;
    return (numericAmount * fxRate).toFixed(2);
  }, [amount, fxRate]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      setError(null);
      const imageData = await convertToBase64(file);
      const result = await scanReceipt({ data: { imageData } });

      if (result) {
        setDescription(result.merchant);
        setAmount(result.total.toString());
        setCurrency(result.currency);
      }
    } catch (err: any) {
      setError(`Receipt scanning failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    setError(null);

    if (!groupId || !group) {
      setError('Group not found');
      return;
    }

    if (!payerId) {
      setError('Please select a payer');
      return;
    }

    const numericAmount = Math.round(parseFloat(amount) * 100);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsSaving(true);
      let finalSplits: { memberId: string; amount: number }[] = [];

      if (isSettleUp) {
        if (!settleUpToId || settleUpToId === payerId) {
          throw new Error('Please select a different member to settle up with');
        }
        // Settle up: Payer pays, Recipient gets everything
        finalSplits = [{ memberId: settleUpToId, amount: numericAmount }];
      } else {
        const strategy: SplitStrategy = {
          type: splitMode,
          ...(splitMode === 'exact' && { amounts: splitValues }),
          ...(splitMode === 'percentage' && { percentages: splitValues }),
          ...(splitMode === 'shares' && { shares: splitValues }),
        };

        finalSplits = calculateSplits(numericAmount, members.map(m => m.id), strategy);
      }

      const expense: Expense = {
        id: crypto.randomUUID(),
        groupId,
        paidByMemberId: payerId,
        amount: numericAmount,
        currency: currency,
        fxRateToHome: fxRate,
        description: isSettleUp ? `Settle up with ${members.find(m => m.id === settleUpToId)?.name}` : description,
        category: isSettleUp ? 'Settle Up' : 'General',
        date: Date.now(),
        isRecurring: false,
      };

      const splits: Split[] = finalSplits.map(s => ({
        id: crypto.randomUUID(),
        expenseId: expense.id,
        memberId: s.memberId,
        amount: s.amount,
      }));

      await repo.saveExpense(expense, splits);
      navigate(`/group/${groupId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSplitValue = (memberId: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setSplitValues(prev => ({ ...prev, [memberId]: numericValue }));
  };

  const currentSplits = useMemo(() => {
    if (isSettleUp) return [];
    try {
      const strategy: SplitStrategy = {
        type: splitMode,
        ...(splitMode === 'exact' && { amounts: splitValues }),
        ...(splitMode === 'percentage' && { percentages: splitValues }),
        ...(splitMode === 'shares' && { shares: splitValues }),
      };
      return calculateSplits(Math.round(parseFloat(amount) * 100) || 0, members.map(m => m.id), strategy);
    } catch (e) {
      return null; // Validation error handled by catch in calculateSplits
    }
  }, [amount, members, splitMode, splitValues, isSettleUp]);

  if (!group || members.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-center p-4">
        <p className="text-gray-600">No members found in this group. Please add members first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
        >
          &larr; Back to Group
        </button>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setIsSettleUp(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!isSettleUp ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Add Expense
          </button>
          <button
            onClick={() => setIsSettleUp(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isSettleUp ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Settle Up
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {isSettleUp ? 'Settle Up' : 'Add New Expense'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {isSettleUp ? 'Who is paying?' : 'Who paid?'}
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Amount</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {COMMON_CURRENCIES.map(cur => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
            </div>
            {currency !== group.homeCurrency && (
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                {isFetchingRate ? (
                  <span>Fetching rate...</span>
                ) : (
                  <span>≈ {convertedAmount} {group.homeCurrency} (Rate: {fxRate.toFixed(4)})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {isSettleUp ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Who are they paying back?</label>
            <select
              value={settleUpToId}
              onChange={(e) => setSettleUpToId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select member</option>
              {members
                .filter(m => m.id !== payerId)
                .map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))
              }
            </select>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="receipt-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleScanReceipt}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('receipt-upload')?.click()}
                    disabled={isScanning}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors disabled:text-gray-400"
                  >
                    {isScanning ? (
                      <>
                        <span className="animate-spin">↻</span> Scanning receipt...
                      </>
                    ) : (
                      <>
                        <span>📷</span> Scan Receipt
                      </>
                    )}
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner, Movies"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Split Mode</label>
              <select
                value={splitMode}
                onChange={(e) => setSplitMode(e.target.value as 'equal' | 'exact' | 'percentage' | 'shares')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="equal">Equal</option>
                <option value="exact">Exact Amounts</option>
                <option value="percentage">Percentages</option>
                <option value="shares">Shares</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">Splits</label>
              <div className="space-y-3">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{m.name}</span>
                    <div className="flex items-center gap-2">
                      {splitMode === 'equal' ? (
                        <span className="text-sm font-medium text-gray-800">
                          {currentSplits ? (currentSplits.find(s => s.memberId === m.id)?.amount / 100).toFixed(2) : '0.00'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step={splitMode === 'percentage' ? '0.1' : '1'}
                            value={splitValues[m.id] || ''}
                            onChange={(e) => updateSplitValue(m.id, e.target.value)}
                            className="w-24 p-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="0"
                          />
                          <span className="text-xs text-gray-400">
                            {splitMode === 'exact' ? currency : splitMode === 'percentage' ? '%' : 'shares'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {currentSplits === null && (
                <p className="text-xs text-red-500 font-medium">Splits must sum to the total amount</p>
              )}
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isSaving || (currentSplits === null && !isSettleUp)}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
            isSaving || (currentSplits === null && !isSettleUp)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Expense'}
        </button>
      </form>
    </div>
  );
};

export default AddExpense;
