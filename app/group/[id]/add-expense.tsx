import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useStore } from '../../../src/store/useStore';
import { useTheme } from '../../../src/hooks/useTheme';
import { Avatar } from '../../../src/components/Avatar';
import { Button } from '../../../src/components/Button';
import { SplitType } from '../../../src/types';
import { calculateEqualShares } from '../../../src/utils/calculations';
import { toPaise, formatCurrency } from '../../../src/utils/currency';
import { X } from 'lucide-react-native';

export default function AddExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { groups, members, addExpense } = useStore();

  const group = groups[id];
  const groupMembers = group?.memberIds.map(mid => members[mid]).filter(Boolean) ?? [];

  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidBy, setPaidBy] = useState<string>(group?.memberIds[0] ?? '');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(group?.memberIds ?? []);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amountPaise = toPaise(parseFloat(amountStr) || 0);

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(mid => mid !== memberId) : [...prev, memberId]
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!description.trim()) errs.description = 'Enter an expense name.';
    if (!amountStr || parseFloat(amountStr) <= 0) errs.amount = 'Enter an amount greater than ₹0.';
    if (selectedMembers.length < 1) errs.members = 'Select at least one member.';
    if (splitType === 'exact' && amountPaise > 0) {
      const sum = selectedMembers.reduce((acc, mid) => acc + toPaise(parseFloat(exactAmounts[mid] || '0')), 0);
      if (sum !== amountPaise) errs.split = `Split amounts must equal ${formatCurrency(amountPaise)}.`;
    }
    if (splitType === 'percentage') {
      const sum = selectedMembers.reduce((acc, mid) => acc + (parseFloat(percentages[mid] || '0')), 0);
      if (Math.abs(sum - 100) > 0.01) errs.split = 'Percentages must add up to 100%.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    let shares: { memberId: string; amountPaise: number }[] = [];
    if (splitType === 'equal') {
      const equalShares = calculateEqualShares(amountPaise, selectedMembers);
      shares = selectedMembers.map(mid => ({ memberId: mid, amountPaise: equalShares[mid] }));
    } else if (splitType === 'exact') {
      shares = selectedMembers.map(mid => ({ memberId: mid, amountPaise: toPaise(parseFloat(exactAmounts[mid] || '0')) }));
    } else {
      shares = selectedMembers.map(mid => ({ memberId: mid, amountPaise: Math.round((parseFloat(percentages[mid] || '0') / 100) * amountPaise) }));
    }
    addExpense({ groupId: id, description: description.trim(), amountPaise, paidBy, splitType, shares });
    router.back();
  };

  const splitTypes: { key: SplitType; label: string }[] = [
    { key: 'equal', label: 'Equal' },
    { key: 'exact', label: 'Exact' },
    { key: 'percentage', label: 'Percent' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={[styles.title, { color: theme.text }]}>Add Expense</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>What was it?</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: errors.description ? theme.error : theme.border, color: theme.text }]}
            value={description}
            onChangeText={t => { setDescription(t); setErrors(e => ({ ...e, description: '' })); }}
            placeholder="e.g. Dinner"
            placeholderTextColor={theme.textSecondary}
            autoFocus
          />
          {errors.description && <Text style={[styles.errorText, { color: theme.error }]}>{errors.description}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Amount (₹)</Text>
          <TextInput
            style={[styles.amountInput, { backgroundColor: theme.surface, borderColor: errors.amount ? theme.error : theme.border, color: theme.text }]}
            value={amountStr}
            onChangeText={t => { setAmountStr(t); setErrors(e => ({ ...e, amount: '' })); }}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
          />
          {errors.amount && <Text style={[styles.errorText, { color: theme.error }]}>{errors.amount}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Paid by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll}>
            {groupMembers.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.memberChip, { backgroundColor: paidBy === m.id ? theme.lightGreen : theme.surface, borderColor: paidBy === m.id ? theme.primary : theme.border }]}
                onPress={() => setPaidBy(m.id)}
              >
                <Avatar name={m.name} size={22} />
                <Text style={[styles.memberChipText, { color: paidBy === m.id ? theme.primary : theme.text }]}>{m.name}</Text>
                {paidBy === m.id && <Check size={12} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Split type</Text>
          <View style={styles.splitTypeRow}>
            {splitTypes.map(st => (
              <TouchableOpacity
                key={st.key}
                style={[styles.splitTypeBtn, { backgroundColor: splitType === st.key ? theme.lightGreen : theme.surface, borderColor: splitType === st.key ? theme.primary : theme.border }]}
                onPress={() => setSplitType(st.key)}
              >
                <Text style={[styles.splitTypeText, { color: splitType === st.key ? theme.primary : theme.textSecondary }]}>{st.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Split between</Text>
          {errors.members && <Text style={[styles.errorText, { color: theme.error }]}>{errors.members}</Text>}
          {groupMembers.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.memberRow, { borderColor: theme.border }]}
              onPress={() => toggleMember(m.id)}
            >
              <View style={styles.memberLeft}>
                <Avatar name={m.name} size={32} />
                <Text style={[styles.memberName, { color: theme.text }]}>{m.name}</Text>
              </View>
              <View style={styles.memberRight}>
                {splitType === 'exact' && selectedMembers.includes(m.id) && (
                  <TextInput style={[styles.splitInput, { borderColor: theme.border, color: theme.text }]} value={exactAmounts[m.id] || ''} onChangeText={v => setExactAmounts(prev => ({ ...prev, [m.id]: v }))} keyboardType="decimal-pad" placeholder="₹0" placeholderTextColor={theme.textSecondary} />
                )}
                {splitType === 'percentage' && selectedMembers.includes(m.id) && (
                  <TextInput style={[styles.splitInput, { borderColor: theme.border, color: theme.text }]} value={percentages[m.id] || ''} onChangeText={v => setPercentages(prev => ({ ...prev, [m.id]: v }))} keyboardType="decimal-pad" placeholder="%" placeholderTextColor={theme.textSecondary} />
                )}
                {splitType === 'equal' && selectedMembers.includes(m.id) && amountPaise > 0 && (
                  <Text style={[styles.equalShareText, { color: theme.textSecondary }]}>
                    {formatCurrency(Math.floor(amountPaise / selectedMembers.length))}
                  </Text>
                )}
                <View style={[styles.checkbox, { borderColor: selectedMembers.includes(m.id) ? theme.primary : theme.border, backgroundColor: selectedMembers.includes(m.id) ? theme.primary : 'transparent' }]}>
                  {selectedMembers.includes(m.id) && <Check size={14} color="#fff" strokeWidth={2.5} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {errors.split && <Text style={[styles.errorText, { color: theme.error }]}>{errors.split}</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Save Expense" onPress={handleSave} theme={theme} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 4 },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 18 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  field: { marginBottom: 24 },
  label: { fontFamily: 'Geist_500Medium', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontFamily: 'Geist_400Regular', fontSize: 16 },
  amountInput: { height: 72, borderRadius: 12, borderWidth: 1, paddingHorizontal: 20, fontFamily: 'Geist_600SemiBold', fontSize: 36 },
  errorText: { fontFamily: 'Geist_400Regular', fontSize: 13, marginTop: 4 },
  memberScroll: { marginHorizontal: -4 },
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginHorizontal: 4 },
  memberChipText: { fontFamily: 'Geist_500Medium', fontSize: 14 },
  splitTypeRow: { flexDirection: 'row', gap: 8 },
  splitTypeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  splitTypeText: { fontFamily: 'Geist_500Medium', fontSize: 13 },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberName: { fontFamily: 'Geist_500Medium', fontSize: 15 },
  memberRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  splitInput: { width: 70, height: 36, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, fontFamily: 'Geist_400Regular', fontSize: 14, textAlign: 'right' },
  equalShareText: { fontFamily: 'Geist_400Regular', fontSize: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 16 },
});
