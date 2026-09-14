import { repo } from '../store';
import { Expense, Split, RecurringRule } from '../domain/types';

export class RecurringService {
  async processRecurringExpenses() {
    const groups = await repo.getGroups();

    for (const group of groups) {
      const rules = await repo.getRecurringRules(group.id);

      for (const rule of rules) {
        await this.processRule(rule);
      }
    }
  }

  private async processRule(rule: RecurringRule) {
    const now = Date.now();
    let lastRun = rule.lastRunTimestamp;

    while (true) {
      const nextRun = this.calculateNextRun(lastRun, rule.frequency);
      if (nextRun > now) break;

      await this.generateExpense(rule, nextRun);
      lastRun = nextRun;

      // Update the rule in the repository
      await repo.saveRecurringRule({
        ...rule,
        lastRunTimestamp: lastRun,
      });
    }
  }

  private calculateNextRun(lastRun: number, frequency: RecurringRule['frequency']): number {
    const date = new Date(lastRun);

    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date.getTime();
  }

  private async generateExpense(rule: RecurringRule, date: number) {
    const template = rule.expenseTemplate;

    const expense: Expense = {
      id: crypto.randomUUID(),
      groupId: rule.groupId,
      paidByMemberId: template.paidByMemberId || '',
      amount: template.amount || 0,
      currency: template.currency || 'USD',
      fxRateToHome: template.fxRateToHome || 1,
      description: template.description || 'Recurring Expense',
      category: template.category || 'General',
      date: date,
      isRecurring: true,
      recurringRule: rule.id,
    };

    // For recurring expenses, we typically split equally among members
    const members = await repo.getMembers(rule.groupId);
    if (members.length === 0) return;

    const splitAmount = Math.floor(expense.amount / members.length);
    const remainder = expense.amount % members.length;

    const splits: Split[] = members.map((member, index) => ({
      id: crypto.randomUUID(),
      expenseId: expense.id,
      memberId: member.id,
      amount: splitAmount + (index === 0 ? remainder : 0),
    }));

    await repo.saveExpense(expense, splits);
  }
}

export const recurringService = new RecurringService();
