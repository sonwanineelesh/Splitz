import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { useStore } from '../../../../src/store/useStore';
import { useTheme } from '../../../../src/hooks/useTheme';
import { Avatar } from '../../../../src/components/Avatar';
import { formatCurrency } from '../../../../src/utils/currency';
import { formatDate } from '../../../../src/utils/helpers';

export default function ExpenseDetailScreen() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { expenses, members, deleteExpense } = useStore();

  const expense = expenses[expenseId];
  if (!expense) return null;

  const payer = members[expense.paidBy];

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      `Delete "${expense.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteExpense(expenseId); router.back(); } },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={22} color={theme.text} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Expense</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
          <Trash2 size={20} color={theme.error} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.expenseName, { color: theme.text }]}>{expense.description}</Text>
        <Text style={[styles.amount, { color: theme.text }]}>{formatCurrency(expense.amountPaise)}</Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          Paid by {payer?.name ?? 'Unknown'} · {formatDate(expense.createdAt)}
        </Text>
        <Text style={[styles.splitType, { color: theme.textSecondary }]}>
          Split: {expense.splitType.charAt(0).toUpperCase() + expense.splitType.slice(1)}
        </Text>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Breakdown</Text>
        {(expense.shares as { memberId: string; amountPaise: number }[]).map(share => {
          const member = members[share.memberId];
          return (
            <View key={share.memberId} style={[styles.shareRow, { borderColor: theme.border }]}>
              <View style={styles.shareLeft}>
                <Avatar name={member?.name ?? '?'} size={32} />
                <Text style={[styles.memberName, { color: theme.text }]}>{member?.name ?? 'Unknown'}</Text>
              </View>
              <Text style={[styles.shareAmount, { color: theme.text }]}>{formatCurrency(share.amountPaise)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 18 },
  scroll: { padding: 16 },
  expenseName: { fontFamily: 'Geist_600SemiBold', fontSize: 26, marginBottom: 8 },
  amount: { fontFamily: 'Geist_600SemiBold', fontSize: 40, marginBottom: 8 },
  meta: { fontFamily: 'Geist_400Regular', fontSize: 14, marginBottom: 4 },
  splitType: { fontFamily: 'Geist_400Regular', fontSize: 14 },
  divider: { height: 1, marginVertical: 24 },
  sectionTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 16, marginBottom: 12 },
  shareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  shareLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberName: { fontFamily: 'Geist_500Medium', fontSize: 15 },
  shareAmount: { fontFamily: 'Geist_600SemiBold', fontSize: 15 },
});
