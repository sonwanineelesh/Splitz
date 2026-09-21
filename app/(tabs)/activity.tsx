import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useTheme } from '../../src/hooks/useTheme';
import { formatCurrency } from '../../src/utils/currency';
import { formatDate } from '../../src/utils/helpers';
import { useRouter } from 'expo-router';

export default function ActivityScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { expenses, groups, members } = useStore();

  const allExpenses = Object.values(expenses)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Activity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {allExpenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No recent activity</Text>
          </View>
        ) : (
          allExpenses.map((exp) => {
            const group = groups[exp.groupId];
            const payer = members[exp.paidBy];
            return (
              <TouchableOpacity
                key={exp.id}
                style={[styles.expenseRow, { borderColor: theme.border }]}
                onPress={() => router.push(`/group/${exp.groupId}/expense/${exp.id}`)}
              >
                <View style={[styles.expenseIcon, { backgroundColor: theme.lightGreen }]}>
                  <Receipt size={16} color={theme.primary} strokeWidth={1.8} />
                </View>
                <View style={styles.expenseCenter}>
                  <Text style={[styles.expenseName, { color: theme.text }]}>{exp.description}</Text>
                  <Text style={[styles.expenseMeta, { color: theme.textSecondary }]}>
                    {group?.name} · Paid by {payer?.name ?? 'Unknown'}
                  </Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={[styles.expenseAmount, { color: theme.text }]}>
                    {formatCurrency(exp.amountPaise)}
                  </Text>
                  <Text style={[styles.expenseDate, { color: theme.textSecondary }]}>
                    {formatDate(exp.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 24, paddingBottom: 12 },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 24 },
  scroll: { padding: 16, paddingBottom: 120 },
  empty: { alignItems: 'center', paddingTop: 64 },
  emptyTitle: { fontFamily: 'Geist_500Medium', fontSize: 16 },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseCenter: { flex: 1 },
  expenseName: { fontFamily: 'Geist_500Medium', fontSize: 16, marginBottom: 2 },
  expenseMeta: { fontFamily: 'Geist_400Regular', fontSize: 13 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontFamily: 'Geist_600SemiBold', fontSize: 16, marginBottom: 2 },
  expenseDate: { fontFamily: 'Geist_400Regular', fontSize: 12 },
});
