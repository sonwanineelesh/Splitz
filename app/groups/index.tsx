import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useTheme } from '../../src/hooks/useTheme';
import { calculateBalances } from '../../src/utils/calculations';
import { formatCurrency } from '../../src/utils/currency';

export default function GroupsListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { groups, members, expenses } = useStore();

  const allGroups = Object.values(groups).map(group => {
    const groupMembers = group.memberIds.map(mid => members[mid]).filter(Boolean);
    const groupExpenses = Object.values(expenses).filter(e => e.groupId === group.id);
    const balances = calculateBalances(groupMembers, groupExpenses);
    const myBalance = balances[group.memberIds[0]] ?? 0;
    return { ...group, myBalance, memberCount: groupMembers.length };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Groups</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/groups/create')}
        >
          <Plus size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {allGroups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No groups yet</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Create a group to start splitting expenses.
            </Text>
          </View>
        ) : (
          allGroups.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(`/group/${g.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.groupAvatar, { backgroundColor: theme.lightGreen }]}>
                <Text style={[styles.groupAvatarText, { color: theme.primary }]}>
                  {g.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: theme.text }]}>{g.name}</Text>
                <Text style={[styles.groupMeta, { color: theme.textSecondary }]}>
                  {g.memberCount} member{g.memberCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.groupRight}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 24 },
  addBtn: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 64, gap: 8 },
  emptyTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 18 },
  emptyDesc: { fontFamily: 'Geist_400Regular', fontSize: 14, textAlign: 'center' },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  groupAvatar: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  groupAvatarText: { fontFamily: 'Geist_600SemiBold', fontSize: 20 },
  groupInfo: { flex: 1 },
  groupName: { fontFamily: 'Geist_600SemiBold', fontSize: 16, marginBottom: 2 },
  groupMeta: { fontFamily: 'Geist_400Regular', fontSize: 13 },
  groupRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  groupBalance: { fontFamily: 'Geist_600SemiBold', fontSize: 15 },
});
