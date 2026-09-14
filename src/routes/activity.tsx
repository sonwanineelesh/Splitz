import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { repo } from '../store';
import { Group, Member, Expense } from '../domain/types';

const Activity = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{
    groups: Group[];
    members: Member[];
    expenses: { expense: Expense; group: Group }[];
  }>({
    groups: [],
    members: [],
    expenses: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setResults({ groups: [], members: [], expenses: [] });
        return;
      }

      setIsLoading(true);
      try {
        const groups = await repo.getGroups();
        const lowerSearch = searchTerm.toLowerCase();

        const matchedGroups = groups.filter(g => g.name.toLowerCase().includes(lowerSearch));

        const matchedMembers: Member[] = [];
        const matchedExpenses: { expense: Expense; group: Group }[] = [];

        for (const group of groups) {
          const members = await repo.getMembers(group.id);
          const expenses = await repo.getExpenses(group.id);

          matchedMembers.push(...members.filter(m => m.name.toLowerCase().includes(lowerSearch)));

          expenses.forEach(expense => {
            if (expense.description.toLowerCase().includes(lowerSearch)) {
              matchedExpenses.push({ expense, group });
            }
          });
        }

        setResults({
          groups: matchedGroups,
          members: matchedMembers,
          expenses: matchedExpenses,
        });
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-gray-900">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-4">Search Activity</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search groups, members, or expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pl-12 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {results.groups.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Groups</h2>
              <div className="grid gap-3">
                {results.groups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => navigate(`/group/${group.id}`)}
                    className="p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all"
                  >
                    <div className="font-semibold">{group.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.members.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Members</h2>
              <div className="grid gap-3">
                {results.members.map(member => (
                  <div
                    key={member.id}
                    onClick={() => navigate(`/group/${member.groupId}`)}
                    className="p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all"
                  >
                    <div className="font-semibold">{member.name}</div>
                    <div className="text-xs text-gray-500">Member of group</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.expenses.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Expenses</h2>
              <div className="grid gap-3">
                {results.expenses.map(({ expense, group }) => (
                  <div
                    key={expense.id}
                    onClick={() => navigate(`/group/${group.id}`)}
                    className="p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-semibold">{expense.description}</div>
                      <div className="text-sm font-medium text-gray-600">
                        {expense.currency} {(expense.amount / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      In {group.name} &bull; {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && searchTerm.trim() &&
            results.groups.length === 0 && results.members.length === 0 && results.expenses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Activity;
