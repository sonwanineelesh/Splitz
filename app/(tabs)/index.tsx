import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Menu, ChevronRight } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useTheme } from '../../src/hooks/useTheme';
import { calculateBalances, simplifyDebts } from '../../src/utils/calculations';
import { formatCurrency } from '../../src/utils/currency';
import { getGreeting } from '../../src/utils/greeting';
import { CATEGORY_MAP } from '../../src/constants/categories';
import { formatDate } from '../../src/utils/helpers';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { groups, members, expenses, isFirstLaunch } = useStore();
  const myId = 'demo-user-1';

  useEffect(() => {
    if (isFirstLaunch) {
      router.replace('/welcome');
    }
  }, [isFirstLaunch]);

  if (isFirstLaunch) return null;

  let totalBalance = 0;
  const activeGroups = Object.values(groups).map(group => {
    const groupMembers = group.memberIds.map(mid => members[mid]).filter(Boolean);
    const groupExpenses = Object.values(expenses).filter(e => e.groupId === group.id);
    const balances = calculateBalances(groupMembers, groupExpenses);
    
    // Fallback logic for demo user balance logic
    const bal = balances[myId] || balances[group.memberIds[0]] || 0;
    totalBalance += bal;

    return { ...group, myBalance: bal, expenseCount: groupExpenses.length, debts: simplifyDebts(balances) };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const greeting = getGreeting(new Date(), totalBalance, activeGroups.length);

  // A. Breakdown: totals owed to you / owed by you + pending settlement count.
  let totalOwed = 0;
  let totalOwe = 0;
  activeGroups.forEach(g => {
    if (g.myBalance > 0) totalOwed += g.myBalance;
    else if (g.myBalance < 0) totalOwe += -g.myBalance;
  });
  const allDebts = activeGroups.flatMap(g =>
    g.debts.map(d => ({ ...d, groupId: g.id, groupName: g.name }))
  );
  const pendingCount = allDebts.length;
  const firstUnsettledId = activeGroups.find(g => g.debts.length > 0)?.id ?? null;
  interface Attention { fromName: string; toName: string; amount: number; groupId: string; groupName: string }
  const attention = allDebts.reduce<Attention | null>(
    (best, d) =>
      !best || d.amountPaise > best.amount
        ? {
            fromName: members[d.from]?.name ?? 'Someone',
            toName: members[d.to]?.name ?? 'someone',
            amount: d.amountPaise,
            groupId: d.groupId,
            groupName: d.groupName,
          }
        : best,
    null
  );

  // C. This month: spend total + top category.
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const monthExpenses = Object.values(expenses).filter(e => new Date(e.createdAt).getTime() >= monthStart);
  const monthSpent = monthExpenses.reduce((acc, e) => acc + e.amountPaise, 0);
  const spendByCat: Record<string, number> = {};
  monthExpenses.forEach(e => {
    const c = e.category ?? 'other';
    spendByCat[c] = (spendByCat[c] ?? 0) + e.amountPaise;
  });
  let topCat: string | null = null;
  Object.entries(spendByCat).forEach(([c, v]) => {
    if (!topCat || v > spendByCat[topCat]) topCat = c;
  });

  // D. Recent activity across all groups.
  const recentActivity = Object.values(expenses)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.appName, { color: theme.text }]}>Splitz</Text>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.headerIconBtn, { backgroundColor: theme.surface, borderWidth: 0 }]}
                onPress={() => router.push('/menu')}
              >
                <Menu size={24} color={theme.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
            <Text style={styles.balCardLabel}>Your total balance</Text>
            <Text style={styles.balCardAmount}>{totalBalance >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalBalance))}</Text>
            <Text style={styles.balCardSubtext}>
              {totalBalance >= 0 ? 'You are owed' : 'You owe'}
            </Text>
          </View>

        {activeGroups.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Owed to you</Text>
              <Text style={[styles.statValue, { color: theme.success }]}>{formatCurrency(totalOwed)}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>You owe</Text>
              <Text style={[styles.statValue, { color: theme.error }]}>{formatCurrency(totalOwe)}</Text>
            </View>
          </View>
        )}
        {pendingCount > 0 && firstUnsettledId && (
          <TouchableOpacity
            style={[styles.pendingRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push(`/group/${firstUnsettledId}`)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pendingText, { color: theme.text }]}>
              {pendingCount} payment{pendingCount === 1 ? '' : 's'} to settle
            </Text>
            <ChevronRight size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Split</Text>
        </View>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/split/new')}
            activeOpacity={0.85}
          >
            <Text style={styles.quickBtnText}>With a friend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtnOutline, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => router.push('/groups/create')}
            activeOpacity={0.85}
          >
            <Text style={[styles.quickBtnOutlineText, { color: theme.text }]}>Create Group</Text>
          </TouchableOpacity>
        </View>

        {attention && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Needs attention</Text>
            </View>
            <TouchableOpacity
              style={[styles.attentionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(`/group/${attention.groupId}`)}
              activeOpacity={0.7}
            >
              <View style={styles.attentionTop}>
                <Text style={[styles.attentionNames, { color: theme.text }]}>
                  {attention.fromName} pays {attention.toName}
                </Text>
                <Text style={[styles.attentionAmount, { color: theme.text }]}>
                  {formatCurrency(attention.amount)}
                </Text>
              </View>
              <Text style={[styles.attentionMeta, { color: theme.textSecondary }]}>
                {attention.groupName} · tap to settle
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Groups</Text>
        </View>

        {activeGroups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No groups yet.</Text>
          </View>
        ) : (
          activeGroups.slice(0, 5).map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(`/group/${g.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.groupCardLeft}>
                <Text style={[styles.groupName, { color: theme.text }]}>{g.name}</Text>
                <Text style={[styles.groupMeta, { color: theme.textSecondary }]}>
                  {g.memberIds.length} members · {g.expenseCount} expenses
                </Text>
              </View>
              <View style={styles.groupCardRight}>
                <Text
                  style={[
                    styles.groupBalance,
                    { color: g.myBalance > 0 ? theme.success : g.myBalance < 0 ? theme.error : theme.textSecondary },
                  ]}
                >
                  {g.myBalance > 0 ? '+' : ''}{formatCurrency(g.myBalance)}
                </Text>
                <ChevronRight size={16} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          ))
        )}

        {monthSpent > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>This month</Text>
            </View>
            <View style={[styles.monthCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View>
                <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>Total spent</Text>
                <Text style={[styles.monthValue, { color: theme.text }]}>{formatCurrency(monthSpent)}</Text>
              </View>
              {topCat && (
                <Text style={[styles.monthTop, { color: theme.textSecondary }]}>
                  {CATEGORY_MAP[topCat as keyof typeof CATEGORY_MAP].emoji} {CATEGORY_MAP[topCat as keyof typeof CATEGORY_MAP].label}
                </Text>
              )}
            </View>
          </View>
        )}

        {recentActivity.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent activity</Text>
            </View>
            {recentActivity.map(exp => {
              const g = groups[exp.groupId];
              const payer = members[exp.paidBy];
              return (
                <TouchableOpacity
                  key={exp.id}
                  style={[styles.activityRow, { borderColor: theme.border }]}
                  onPress={() => router.push(`/group/${exp.groupId}/expense/${exp.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityLeft}>
                    <Text style={[styles.activityName, { color: theme.text }]}>{exp.description}</Text>
                    <Text style={[styles.activityMeta, { color: theme.textSecondary }]}>
                      {g?.name ?? 'Group'} · Paid by {payer?.name ?? 'Unknown'} · {formatDate(exp.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.activityAmount, { color: theme.text }]}>
                    {formatCurrency(exp.amountPaise)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  balCardSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    marginTop: 4,
  },
  greeting: { fontFamily: 'Geist_400Regular', fontSize: 14, marginBottom: 4 },
  appName: { fontFamily: 'Geist_600SemiBold', fontSize: 28, marginBottom: 2 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    elevation: 8,
  },
  balCardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  balCardAmount: {
    color: '#FFF',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 38,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 18,
  },
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  quickBtn: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickBtnText: { color: '#fff', fontFamily: 'Geist_600SemiBold', fontSize: 15 },
  quickBtnOutline: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  quickBtnOutlineText: { fontFamily: 'Geist_600SemiBold', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBox: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16 },
  statLabel: { fontFamily: 'Geist_500Medium', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontFamily: 'Geist_600SemiBold', fontSize: 20 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 32 },
  pendingText: { fontFamily: 'Geist_500Medium', fontSize: 15 },
  attentionCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 32 },
  attentionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  attentionNames: { fontFamily: 'Geist_500Medium', fontSize: 15, flex: 1 },
  attentionAmount: { fontFamily: 'Geist_600SemiBold', fontSize: 18 },
  attentionMeta: { fontFamily: 'Geist_400Regular', fontSize: 13 },
  monthCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 32 },
  monthLabel: { fontFamily: 'Geist_500Medium', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  monthValue: { fontFamily: 'Geist_600SemiBold', fontSize: 22 },
  monthTop: { fontFamily: 'Geist_500Medium', fontSize: 14 },
  activityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  activityLeft: { flex: 1 },
  activityName: { fontFamily: 'Geist_500Medium', fontSize: 15, marginBottom: 2 },
  activityMeta: { fontFamily: 'Geist_400Regular', fontSize: 13 },
  activityAmount: { fontFamily: 'Geist_600SemiBold', fontSize: 15 },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
  },
  groupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  groupCardLeft: {
    flex: 1,
  },
  groupName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  groupMeta: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
  },
  groupCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupBalance: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
  },
});
