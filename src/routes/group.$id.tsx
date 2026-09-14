import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@tanstack/react-store';
import { store, storeActions, repo } from '../store';
import { simplifyDebts } from '../services/debt-simplifier';
import { exportGroupToCSV } from '../services/export-service';
import { Expense, Split, Group, Member } from '../domain/types';

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
};

const getMemberName = (memberId: string, members: Member[]) => {
  return members.find((m) => m.id === memberId)?.name || 'Unknown Member';
};

const ExpenseItem = ({ expense, members, group }: { expense: Expense; members: Member[]; group: Group }) => {
  const amountInHomeCurrency = expense.amount * expense.fxRateToHome;

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
          {getMemberName(expense.paidByMemberId, members).charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{expense.description}</h3>
          <p className="text-xs text-gray-500">
            Paid by {getMemberName(expense.paidByMemberId, members)} &bull; {new Date(expense.date).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-gray-900">
          {formatCurrency(amountInHomeCurrency, group.homeCurrency)}
        </div>
        {expense.currency !== group.homeCurrency && (
          <div className="text-xs text-gray-400">
            {formatCurrency(expense.amount, expense.currency)}
          </div>
        )}
      </div>
    </div>
  );
};

const ExpenseFeed = ({ expenses, members, group }: { expenses: Expense[]; members: Member[]; group: Group }) => {
  return (
    <div className="lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Expense Feed</h2>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500">No expenses added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} members={members} group={group} />
          ))}
        </div>
      )}
    </div>
  );
};

interface SimplifiedPayment {
  from: string;
  to: string;
  amount: number;
}

const BalanceSummary = ({ simplifiedPayments, members, group }: { simplifiedPayments: SimplifiedPayment[]; members: Member[]; group: Group }) => {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden sticky top-8">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Balances</h2>
        </div>
        <div className="p-4">
          {simplifiedPayments.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm">All settled up!</p>
          ) : (
            <ul className="space-y-3">
              {simplifiedPayments.map((payment, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700">{getMemberName(payment.from, members)}</span>
                    <span className="text-xs text-gray-400">owes</span>
                    <span className="font-medium text-gray-700">{getMemberName(payment.to, members)}</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(payment.amount, group.homeCurrency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const state = useStore(store);
  const group = state.currentGroup;
  const members = state.members;

  useEffect(() => {
    if (groupId) {
      loadGroupData(groupId);
    }
  }, [groupId]);

  const loadGroupData = async (id: string) => {
    setIsLoading(true);
    try {
      await storeActions.setCurrentGroup(id);
      const groupExpenses = await repo.getExpenses(id);
      setExpenses(groupExpenses);

      const allSplits = await Promise.all(
        groupExpenses.map(async (expense) => {
          const expenseSplits = await repo.getSplits(expense.id);
          return expenseSplits;
        })
      );
      setSplits(allSplits.flat());
    } catch (error) {
      console.error('Failed to load group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Group not found</h2>
        <p className="text-gray-600 mb-6">The group you are looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Go back to Home
        </button>
      </div>
    );
  }

  const simplifiedPayments = useMemo(() => simplifyDebts(expenses, splits), [expenses, splits]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1">
          <button
            onClick={() => navigate('/')}
            className="text-blue-500 hover:text-blue-700 mb-2 flex items-center gap-1 text-sm font-medium"
          >
            &larr; Back to Home
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight">{group.name}</h1>
            <button
              onClick={() => exportGroupToCSV(group.id, expenses)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded border border-gray-300 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          {group.homeCurrency}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <BalanceSummary simplifiedPayments={simplifiedPayments} members={members} group={group} />
        <ExpenseFeed expenses={expenses} members={members} group={group} />
      </div>
    </div>
  );
};

export default GroupDetail;
