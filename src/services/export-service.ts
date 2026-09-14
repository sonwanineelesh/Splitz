import { Expense, Member } from '../domain/types';
import { repo } from '../store';

/**
 * Exports a group's expenses to a CSV file and triggers a browser download.
 * @param groupId The ID of the group to export.
 * @param expenses The list of expenses for the group.
 */
export const exportGroupToCSV = async (groupId: string, expenses: Expense[]) => {
  try {
    const members = await repo.getMembers(groupId);

    const headers = ['Date', 'Description', 'Category', 'Payer', 'Amount', 'Currency'];

    const rows = expenses.map(expense => {
      const date = new Date(expense.date).toLocaleDateString();
      const payer = members.find(m => m.id === expense.paidByMemberId)?.name || 'Unknown';
      const amount = (expense.amount / 100).toFixed(2);

      return [
        date,
        `"${expense.description.replace(/"/g, '""')}"`,
        `"${expense.category.replace(/"/g, '""')}"`,
        `"${payer.replace(/"/g, '""')}"`,
        amount,
        expense.currency
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `group_${groupId}_expenses.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export CSV:', error);
    throw error;
  }
};
