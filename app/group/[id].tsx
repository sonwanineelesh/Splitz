import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, ArrowLeft, MoreHorizontal, Users, Receipt, Search } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useTheme } from '../../src/hooks/useTheme';
import { Avatar } from '../../src/components/Avatar';
import { EXPENSE_CATEGORIES } from '../../src/constants/categories';
import { ExpenseCategory } from '../../src/types';
import { calculateBalances, simplifyDebts } from '../../src/utils/calculations';
import { formatCurrency } from '../../src/utils/currency';
import { formatDate } from '../../src/utils/helpers';
import { filterExpenses } from '../../src/utils/search';
import { successTap } from '../../src/utils/feedback';
import { useGroupSync } from '../../src/hooks/useGroupSync';

type Tab = 'overview' | 'expenses' | 'balances';

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { groups, members, expenses, settlements, deleteGroup, markSettlementPaid, upsertSettlement, showToast } = useStore();

  const [tab, setTab] = useState<Tab>('overview');
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');

  useGroupSync(id);

  const group = groups[id];

  const groupMembers = (group?.memberIds ?? []).map(mid => members[mid]).filter(Boolean);
  const groupExpenses = useMemo(
    () =>
      Object.values(expenses)
        .filter(e => e.groupId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, Object.values(expenses).map(e => `${e.id}:${e.description}:${e.category}`).join('|')]
  );

  const visibleExpenses = useMemo(
    () => filterExpenses(groupExpenses, searchQuery, filterCategory),
    [groupExpenses, searchQuery, filterCategory]
  );

  if (!group) return null;

  const balances = calculateBalances(groupMembers, groupExpenses);
  const myId = group.memberIds[0];
  const myBalance = myId ? (balances[myId] ?? 0) : 0;

  const settlementsCalc = simplifyDebts(balances);
  const groupSettlements = Object.values(settlements).filter(s => s.groupId === id);

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      `Delete "${group.name}"? All expenses will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteGroup(id); router.replace('/'); } },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={22} color={theme.text} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.groupTitle, { color: theme.text }]} numberOfLines={1}>{group.name}</Text>
          <Text style={[styles.groupSubtitle, { color: theme.textSecondary }]}>
            {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerBtn}>
          <MoreHorizontal size={22} color={theme.text} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Balance Summary */}
      <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
        <Text style={styles.balCardLabel}>
          {myBalance >= 0 ? 'You are owed' : 'You owe'}
        </Text>
        <Text style={styles.balCardAmount}>{formatCurrency(Math.abs(myBalance))}</Text>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {(['overview', 'expenses', 'balances'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, { color: tab === t ? theme.primary : theme.textSecondary }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Members</Text>
            {groupMembers.map(m => {
              const bal = balances[m.id] ?? 0;
              return (
                <View key={m.id} style={[styles.memberRow, { borderColor: theme.border }]}>
                  <View style={styles.memberLeft}>
                    <Avatar name={m.name} size={36} />
                    <Text style={[styles.memberName, { color: theme.text }]}>{m.name}</Text>
                  </View>
                  <Text style={[styles.memberBalance, { color: bal > 0 ? theme.success : bal < 0 ? theme.error : theme.textSecondary }]}>
                    {bal === 0 ? 'Settled' : bal > 0 ? `owes you ${formatCurrency(bal)}` : `you owe ${formatCurrency(Math.abs(bal))}`}
                  </Text>
                </View>
              );
            })}

            {groupExpenses.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Recent</Text>
                {groupExpenses.slice(0, 5).map(exp => {
                  const payer = members[exp.paidBy];
                  return (
                    <TouchableOpacity
                      key={exp.id}
                      style={[styles.expenseRow, { borderColor: theme.border }]}
                      onPress={() => router.push(`/group/${id}/expense/${exp.id}`)}
                    >
                      <View style={[styles.expenseIcon, { backgroundColor: theme.lightGreen }]}>
                        <Receipt size={16} color={theme.primary} strokeWidth={1.8} />
                      </View>
                      <View style={styles.expenseCenter}>
                        <Text style={[styles.expenseName, { color: theme.text }]}>{exp.description}</Text>
                        <Text style={[styles.expenseMeta, { color: theme.textSecondary }]}>
                          Paid by {payer?.name ?? 'Unknown'} · {formatDate(exp.createdAt)}
                        </Text>
                      </View>
                      <Text style={[styles.expenseAmount, { color: theme.text }]}>
                        {formatCurrency(exp.amountPaise)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* EXPENSES */}
        {tab === 'expenses' && (
          <View>
            <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Search size={16} color={theme.textSecondary} strokeWidth={2} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search expenses"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: filterCategory === 'all' ? theme.lightGreen : theme.surface, borderColor: filterCategory === 'all' ? theme.primary : theme.border }]}
                onPress={() => setFilterCategory('all')}
              >
                <Text style={[styles.filterText, { color: filterCategory === 'all' ? theme.primary : theme.textSecondary }]}>All</Text>
              </TouchableOpacity>
              {EXPENSE_CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.filterChip, { backgroundColor: filterCategory === c.key ? theme.lightGreen : theme.surface, borderColor: filterCategory === c.key ? theme.primary : theme.border }]}
                  onPress={() => setFilterCategory(c.key)}
                >
                  <Text style={[styles.filterText, { color: filterCategory === c.key ? theme.primary : theme.textSecondary }]}>{c.emoji} {c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {visibleExpenses.length === 0 ? (
              <View style={styles.empty}>
                <Receipt size={40} color={theme.border} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  {groupExpenses.length === 0 ? 'No expenses yet' : 'No matches found'}
                </Text>
              </View>
            ) : (
              visibleExpenses.map(exp => {
                const payer = members[exp.paidBy];
                return (
                  <TouchableOpacity
                    key={exp.id}
                    style={[styles.expenseRow, { borderColor: theme.border }]}
                    onPress={() => router.push(`/group/${id}/expense/${exp.id}`)}
                  >
                    <View style={[styles.expenseIcon, { backgroundColor: theme.lightGreen }]}>
                      <Receipt size={16} color={theme.primary} strokeWidth={1.8} />
                    </View>
                    <View style={styles.expenseCenter}>
                      <Text style={[styles.expenseName, { color: theme.text }]}>{exp.description}</Text>
                      <Text style={[styles.expenseMeta, { color: theme.textSecondary }]}>
                        Paid by {payer?.name ?? 'Unknown'} · {formatDate(exp.createdAt)}
                      </Text>
                    </View>
                    <Text style={[styles.expenseAmount, { color: theme.text }]}>
                      {formatCurrency(exp.amountPaise)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* BALANCES */}
        {tab === 'balances' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Simplified settlement</Text>
            {settlementsCalc.length === 0 ? (
              <View style={styles.settledBox}>
                <Text style={[styles.settledText, { color: theme.success }]}>✓ All settled up!</Text>
              </View>
            ) : (
              settlementsCalc.map((s, i) => {
                const from = members[s.from];
                const to = members[s.to];
                const existing = groupSettlements.find(gs => gs.fromMember === s.from && gs.toMember === s.to);
                const isPaid = existing?.status === 'paid';
                return (
                  <View key={i} style={[styles.settlementCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.settlementTop}>
                      <Text style={[styles.settlementNames, { color: theme.text }]}>
                        {from?.name ?? 'Unknown'} pays {to?.name ?? 'Unknown'}
                      </Text>
                      <Text style={[styles.settlementAmount, { color: theme.text }]}>
                        {formatCurrency(s.amountPaise)}
                      </Text>
                    </View>
                    {isPaid ? (
                      <Text style={[styles.paidText, { color: theme.success }]}>✓ Paid</Text>
                    ) : (
                      <TouchableOpacity
                        style={[styles.markPaidBtn, { backgroundColor: theme.lightGreen }]}
                        onPress={() => {
                          if (existing) { markSettlementPaid(existing.id); }
                          else { upsertSettlement({ groupId: id, fromMember: s.from, toMember: s.to, amountPaise: s.amountPaise, status: 'paid' }); }
                          successTap();
                          showToast('Settlement recorded.');
                        }}
                      >
                        <Text style={[styles.markPaidText, { color: theme.primary }]}>Mark as Paid</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Expense FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => router.push(`/group/${id}/add-expense`)}
        activeOpacity={0.85}
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.fabText}>Add Expense</Text>
      </TouchableOpacity>

      {/* Options Modal */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setMenuVisible(false)} activeOpacity={1}>
          <View style={[styles.menu, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => { setMenuVisible(false); router.push(`/group/${id}/members`); }}
            >
              <Users size={18} color={theme.text} strokeWidth={1.8} />
              <Text style={[styles.menuText, { color: theme.text }]}>Manage Members</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setMenuVisible(false); handleDeleteGroup(); }}
            >
              <Text style={[styles.menuText, { color: theme.error }]}>Delete Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  headerBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  groupTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 18 },
  groupSubtitle: { fontFamily: 'Geist_400Regular', fontSize: 13, marginTop: 1 },
  balanceCard: { marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 8 },
  balCardLabel: { color: 'rgba(255,255,255,0.75)', fontFamily: 'Geist_400Regular', fontSize: 13, marginBottom: 4 },
  balCardAmount: { color: '#FFF', fontFamily: 'Geist_600SemiBold', fontSize: 32 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontFamily: 'Geist_500Medium', fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 16, marginBottom: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberName: { fontFamily: 'Geist_500Medium', fontSize: 15 },
  memberBalance: { fontFamily: 'Geist_500Medium', fontSize: 14 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  expenseIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expenseCenter: { flex: 1 },
  expenseName: { fontFamily: 'Geist_500Medium', fontSize: 15 },
  expenseMeta: { fontFamily: 'Geist_400Regular', fontSize: 13, marginTop: 2 },
  expenseAmount: { fontFamily: 'Geist_600SemiBold', fontSize: 15 },
  empty: { alignItems: 'center', paddingTop: 64, gap: 12 },
  emptyTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 18 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: 'Geist_400Regular', fontSize: 15 },
  filterRow: { marginHorizontal: -4, marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginHorizontal: 4 },
  filterText: { fontFamily: 'Geist_500Medium', fontSize: 13 },
  settledBox: { padding: 24, alignItems: 'center' },
  settledText: { fontFamily: 'Geist_600SemiBold', fontSize: 16 },
  settlementCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  settlementTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  settlementNames: { fontFamily: 'Geist_500Medium', fontSize: 15 },
  settlementAmount: { fontFamily: 'Geist_600SemiBold', fontSize: 16 },
  markPaidBtn: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  markPaidText: { fontFamily: 'Geist_600SemiBold', fontSize: 14 },
  paidText: { fontFamily: 'Geist_500Medium', fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, left: 16, right: 16, height: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  fabText: { color: '#fff', fontFamily: 'Geist_600SemiBold', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menu: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 8, paddingBottom: 40 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 },
  menuText: { fontFamily: 'Geist_500Medium', fontSize: 16 },
});
