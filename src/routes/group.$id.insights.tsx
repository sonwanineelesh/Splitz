import React, { useEffect, useState } from 'react';
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
    return <div className="p-8 text-center">Loading insights...</div>;
  }

  if (!expenses || expenses.length === 0) {
    return <div className="p-8 text-center">No data available to generate insights.</div>;
  }

  // Aggregate data for Spend by Category (Pie Chart)
  const categoryData = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'Other';
    acc[cat] = (acc[cat] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  // Aggregate data for Spend over Time (Bar Chart) - Monthly
  const timeData = expenses.reduce((acc, exp) => {
    const date = new Date(exp.date);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // Sort time data by date (approximate)
  const barChartData = Object.entries(timeData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      return new Date(a.name).getTime() - new Date(b.name).getTime();
    });

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Group Insights</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spend by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-center">Spend by Category</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
              <BarChart data={barChartData}>
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
