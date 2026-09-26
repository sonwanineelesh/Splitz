import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Menu, ChevronRight } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useTheme } from '../../src/hooks/useTheme';
import { calculateBalances } from '../../src/utils/calculations';
import { formatCurrency } from '../../src/utils/currency';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const { groups, members, expenses, isFirstLaunch } = useStore();
  const myId = 'demo-user-1';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
    
    return { ...group, myBalance: bal, expenseCount: groupExpenses.length };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
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
