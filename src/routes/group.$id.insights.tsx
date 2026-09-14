import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { repo } from '../store';
import { Expense } from '../domain/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function GroupInsights() {
  const { id } = useParams<{ id: string }>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const data = await repo.getExpenses(id);
        setExpenses(data);
      } catch (error) {
        console.error('Failed to load expenses for insights:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-500">Loading your spending insights...</p>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
        <div className="text-gray-300 text-5xl">📊</div>
        <p className="text-gray-500">No expense data available yet. Start adding expenses to see insights!</p>
      </div>
    );
  }

  // Aggregate data for Spend by Category (Pie Chart)
  const pieChartData = useMemo(() => {
    const categoryData = expenses.reduce((acc, exp) => {
      const cat = exp.category || 'Other';
      acc[cat] = (acc[cat] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryData).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Aggregate data for Spend over Time (Bar Chart) - Monthly
  const barChartData = useMemo(() => {
    const timeDataMap = expenses.reduce((acc, exp) => {
      const date = new Date(exp.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;

      if (!acc[key]) {
        acc[key] = {
          label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          value: 0,
          timestamp: new Date(year, month, 1).getTime()
        };
      }
      acc[key].value += exp.amount;
      return acc;
    }, {} as Record<string, { label: string, value: number, timestamp: number }>);

    return Object.values(timeDataMap)
      .map(item => ({
        name: item.label,
        value: item.value,
        sortKey: item.timestamp
      }))
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [expenses]);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Group Insights</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spend by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-center">Spend by Category</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart aria-label="Spending by category pie chart">
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${(value / 100).toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend over Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-center">Spend over Time</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} aria-label="Spending over time bar chart">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${(value / 100).toFixed(0)}`} />
                <Tooltip formatter={(value: number) => [`$${(value / 100).toFixed(2)}`, 'Amount']} />
                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} name="Total Spend" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
