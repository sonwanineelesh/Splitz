import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useStore } from '../../../src/store/useStore';
import { useTheme } from '../../../src/hooks/useTheme';
import { Avatar } from '../../../src/components/Avatar';
import { Button } from '../../../src/components/Button';
import { EXPENSE_CATEGORIES } from '../../../src/constants/categories';
import { ExpenseCategory, RecurringFrequency, SplitType } from '../../../src/types';
import {
  calculateEqualShares,
  calculatePercentageShares,
  calculateSharesSplit,
  getTotalShares,
} from '../../../src/utils/calculations';
import { toPaise, formatCurrency } from '../../../src/utils/currency';
import { successTap } from '../../../src/utils/feedback';
import { X } from 'lucide-react-native';

type SplitTab = SplitType | 'default';

const RECURRING: { key: RecurringFrequency; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export default function AddExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { groups, members, addExpense, showToast } = useStore();

  const group = groups[id];
  const groupMembers = group?.memberIds.map(mid => members[mid]).filter(Boolean) ?? [];
  const hasDefault = !!group?.defaultSplitType;

  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidBy, setPaidBy] = useState<string>(group?.memberIds[0] ?? '');
  const [splitTab, setSplitTab] = useState<SplitTab>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(group?.memberIds ?? []);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shareCounts, setShareCounts] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [note, setNote] = useState('');
  const [recurring, setRecurring] = useState<RecurringFrequency>('none');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amountPaise = toPaise(parseFloat(amountStr) || 0);
  // Resolving 'default' to the group's saved split type for calculations.
  const splitType: SplitType = splitTab === 'default' ? (group?.defaultSplitType ?? 'equal') : splitTab;

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(mid => mid !== memberId) : [...prev, memberId]
    );
  };

  const applyDefault = () => {
    if (!group?.defaultSplitType) return;
    setSplitTab('default');
    setSelectedMembers(group.memberIds);
    const data = group.defaultSplitData ?? {};
    if (group.defaultSplitType === 'exact') {
      const next: Record<string, string> = {};
      group.memberIds.forEach(mid => { if (data[mid] !== undefined) next[mid] = String(data[mid] / 100); });
      setExactAmounts(next);
    } else if (group.defaultSplitType === 'percentage') {
      const next: Record<string, string> = {};
      group.memberIds.forEach(mid => { if (data[mid] !== undefined) next[mid] = String(data[mid]); });
      setPercentages(next);
    } else if (group.defaultSplitType === 'shares') {
      const next: Record<string, string> = {};
      group.memberIds.forEach(mid => { if (data[mid] !== undefined) next[mid] = String(data[mid]); });
      setShareCounts(next);
    }
    setErrors(e => ({ ...e, split: '' }));
  };

  // Live preview per member for shares / percentage tabs.
  const preview = useMemo(() => {
    if (amountPaise <= 0 || selectedMembers.length === 0) return {};
    try {
      if (splitType === 'shares') {
        const map: Record<string, number> = {};
        selectedMembers.forEach(mid => { map[mid] = parseFloat(shareCounts[mid] || '0') || 0; });
        if (getTotalShares(selectedMembers, map) <= 0) return {};
        return calculateSharesSplit(amountPaise, selectedMembers, map);
      }
      if (splitType === 'percentage') {
        const map: Record<string, number> = {};
        selectedMembers.forEach(mid => { map[mid] = parseFloat(percentages[mid] || '0') || 0; });
        return calculatePercentageShares(amountPaise, selectedMembers, map);
      }
    } catch {
      return {};
    }
    return {};
  }, [amountPaise, selectedMembers, shareCounts, percentages, splitType]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!description.trim()) errs.description = 'Please enter an expense name.';
    if (!amountStr || parseFloat(amountStr) <= 0) errs.amount = 'Enter an amount greater than ₹0.';
    if (!paidBy) errs.payer = 'Select who paid.';
    if (selectedMembers.length < 2 && (group?.type !== 'Direct')) {
      if (selectedMembers.length < 1) errs.members = 'Select at least one member.';
    }
    if (note.trim().length > 280) errs.note = 'Note must be 280 characters or less.';
    if (splitType === 'exact' && amountPaise > 0) {
      const sum = selectedMembers.reduce((acc, mid) => acc + toPaise(parseFloat(exactAmounts[mid] || '0')), 0);
      if (sum !== amountPaise) errs.split = `Split amounts must equal ${formatCurrency(amountPaise)}.`;
    }
    if (splitType === 'percentage') {
      const sum = selectedMembers.reduce((acc, mid) => acc + (parseFloat(percentages[mid] || '0') || 0), 0);
      if (Math.abs(sum - 100) > 0.01) errs.split = 'Percentages must add up to 100%.';
    }
    if (splitType === 'shares') {
      const map: Record<string, number> = {};
      selectedMembers.forEach(mid => { map[mid] = parseFloat(shareCounts[mid] || '0') || 0; });
      if (getTotalShares(selectedMembers, map) <= 0) errs.split = 'Add at least 1 share.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    let shares: { memberId: string; amountPaise: number }[] = [];
    let sharesMap: Record<string, number> | undefined;
    if (splitType === 'equal') {
      const equalShares = calculateEqualShares(amountPaise, selectedMembers);
      shares = selectedMembers.map(mid => ({ memberId: mid, amountPaise: equalShares[mid] ?? 0 }));
    } else if (splitType === 'exact') {
      shares = selectedMembers.map(mid => ({ memberId: mid, amountPaise: toPaise(parseFloat(exactAmounts[mid] || '0')) }));
    } else if (splitType === 'percentage') {
      const map: Record<string, number> = {};
      selectedMembers.forEach(mid => { map[mid] = parseFloat(percentages[mid] || '0') || 0; });
      const calc = calculatePercentageShares(amountPaise, selectedMembers, map);
      shares = selectedMembers.map(mid => ({ memberId: mid, amountPaise: calc[mid] ?? 0 }));
    } else {
      const map: Record<string, number> = {};
      selectedMembers.forEach(mid => { map[mid] = parseFloat(shareCounts[mid] || '0') || 0; });
      sharesMap = map;
      const calc = calculateSharesSplit(amountPaise, selectedMembers, map);
      shares = selectedMembers.map(mid => ({ memberId: mid, amountPaise: calc[mid] ?? 0 }));
    }
    addExpense({
      groupId: id,
      description: description.trim(),
      amountPaise,
      paidBy,
      splitType,
      shares,
      sharesMap,
      category,
      note: note.trim() ? note.trim().slice(0, 280) : undefined,
      recurring,
    });
    successTap();
    showToast(recurring !== 'none' ? 'Expense saved. Next one scheduled.' : 'Expense saved.');
    router.back();
  };

  const splitTypes: { key: SplitTab; label: string }[] = [
    ...(hasDefault ? [{ key: 'default' as SplitTab, label: 'Default' }] : []),
    { key: 'equal', label: 'Equal' },
    { key: 'exact', label: 'Exact' },
    { key: 'percentage', label: '%' },
    { key: 'shares', label: 'Shares' },
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
          {errors.payer && <Text style={[styles.errorText, { color: theme.error }]}>{errors.payer}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Split type</Text>
          <View style={styles.splitTypeRow}>
            {splitTypes.map(st => (
              <TouchableOpacity
                key={st.key}
                style={[styles.splitTypeBtn, { backgroundColor: splitTab === st.key ? theme.lightGreen : theme.surface, borderColor: splitTab === st.key ? theme.primary : theme.border }]}
                onPress={() => (st.key === 'default' ? applyDefault() : setSplitTab(st.key))}
              >
                <Text style={[styles.splitTypeText, { color: splitTab === st.key ? theme.primary : theme.textSecondary }]}>{st.label}</Text>
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
                {splitType === 'shares' && selectedMembers.includes(m.id) && (
                  <TextInput style={[styles.splitInput, { borderColor: theme.border, color: theme.text }]} value={shareCounts[m.id] || ''} onChangeText={v => setShareCounts(prev => ({ ...prev, [m.id]: v }))} keyboardType="decimal-pad" placeholder="shares" placeholderTextColor={theme.textSecondary} />
                )}
                {splitType === 'equal' && selectedMembers.includes(m.id) && amountPaise > 0 && (
                  <Text style={[styles.equalShareText, { color: theme.textSecondary }]}>
                    {formatCurrency(Math.floor(amountPaise / Math.max(selectedMembers.length, 1)))}
                  </Text>
                )}
                {(splitType === 'percentage' || splitType === 'shares') && selectedMembers.includes(m.id) && preview[m.id] !== undefined && amountPaise > 0 && (
                  <Text style={[styles.equalShareText, { color: theme.textSecondary }]}>
                    {formatCurrency(preview[m.id])}
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

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
          <View style={styles.chipRow}>
            {EXPENSE_CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[styles.memberChip, { backgroundColor: category === c.key ? theme.lightGreen : theme.surface, borderColor: category === c.key ? theme.primary : theme.border }]}
                onPress={() => setCategory(c.key)}
              >
                <Text style={[styles.memberChipText, { color: category === c.key ? theme.primary : theme.text }]}>{c.emoji} {c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Note (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: errors.note ? theme.error : theme.border, color: theme.text }]}
            value={note}
            onChangeText={t => { setNote(t); setErrors(e => ({ ...e, note: '' })); }}
            placeholder="e.g. Paid with cash"
            placeholderTextColor={theme.textSecondary}
            maxLength={280}
          />
          {errors.note && <Text style={[styles.errorText, { color: theme.error }]}>{errors.note}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Recurring</Text>
          <View style={styles.splitTypeRow}>
            {RECURRING.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.splitTypeBtn, { backgroundColor: recurring === r.key ? theme.lightGreen : theme.surface, borderColor: recurring === r.key ? theme.primary : theme.border }]}
                onPress={() => setRecurring(r.key)}
              >
                <Text style={[styles.splitTypeText, { color: recurring === r.key ? theme.primary : theme.textSecondary }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginHorizontal: 4, marginVertical: 4 },
  memberChipText: { fontFamily: 'Geist_500Medium', fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
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
