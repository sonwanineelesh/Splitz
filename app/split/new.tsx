import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useTheme } from '../../src/hooks/useTheme';
import { Button } from '../../src/components/Button';
import { calculateEqualShares } from '../../src/utils/calculations';
import { toPaise } from '../../src/utils/currency';
import { successTap } from '../../src/utils/feedback';

// Direct Friend Split without creating a group first (PRD Sec 39).
// Stores as an implicit `Direct` 2-member group so balances/settlements reuse group logic.
export default function QuickSplitScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { createDirectSplit, addExpense, showToast } = useStore();

  const [friendName, setFriendName] = useState('');
  const [myName, setMyName] = useState('You');
  const [description, setDescription] = useState('Lunch');
  const [amountStr, setAmountStr] = useState('');
  const [paidByMe, setPaidByMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!friendName.trim()) errs.friend = 'Enter a friend name to quick split.';
    if (!amountStr || parseFloat(amountStr) <= 0) errs.amount = 'Enter an amount greater than ₹0.';
    if (!description.trim()) errs.description = 'Please enter an expense name.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const amountPaise = toPaise(parseFloat(amountStr));
    const groupId = createDirectSplit(friendName.trim(), myName.trim() || 'You');
    const { members } = useStore.getState();
    const ids = (useStore.getState().groups[groupId]?.memberIds ?? []).map(
      (mid) => members[mid]
    );
    const me = ids.find((m) => m?.name === (myName.trim() || 'You'));
    const friend = ids.find((m) => m?.id !== me?.id);
    if (!me || !friend) {
      router.replace(`/group/${groupId}`);
      return;
    }
    const equal = calculateEqualShares(amountPaise, [me.id, friend.id]);
    addExpense({
      groupId,
      description: description.trim(),
      amountPaise,
      paidBy: paidByMe ? me.id : friend.id,
      splitType: 'equal',
      shares: [me.id, friend.id].map((mid) => ({ memberId: mid, amountPaise: equal[mid] ?? 0 })),
      category: 'other',
      recurring: 'none',
    });
    successTap();
    showToast('Split saved.');
    router.replace(`/group/${groupId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={[styles.title, { color: theme.text }]}>Quick Split</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Friend name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: errors.friend ? theme.error : theme.border, color: theme.text }]}
            value={friendName}
            onChangeText={(t) => { setFriendName(t); setErrors((e) => ({ ...e, friend: '' })); }}
            placeholder="e.g. Rahul"
            placeholderTextColor={theme.textSecondary}
            autoFocus
          />
          {errors.friend && <Text style={[styles.errorText, { color: theme.error }]}>{errors.friend}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Your name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            value={myName}
            onChangeText={setMyName}
            placeholder="You"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>What was it?</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: errors.description ? theme.error : theme.border, color: theme.text }]}
            value={description}
            onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, description: '' })); }}
            placeholder="e.g. Lunch"
            placeholderTextColor={theme.textSecondary}
          />
          {errors.description && <Text style={[styles.errorText, { color: theme.error }]}>{errors.description}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Amount (₹)</Text>
          <TextInput
            style={[styles.amountInput, { backgroundColor: theme.surface, borderColor: errors.amount ? theme.error : theme.border, color: theme.text }]}
            value={amountStr}
            onChangeText={(t) => { setAmountStr(t); setErrors((e) => ({ ...e, amount: '' })); }}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
          />
          {errors.amount && <Text style={[styles.errorText, { color: theme.error }]}>{errors.amount}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Paid by</Text>
          <View style={styles.paidRow}>
            <TouchableOpacity
              style={[styles.paidBtn, { backgroundColor: paidByMe ? theme.lightGreen : theme.surface, borderColor: paidByMe ? theme.primary : theme.border }]}
              onPress={() => setPaidByMe(true)}
            >
              <Text style={[styles.paidText, { color: paidByMe ? theme.primary : theme.textSecondary }]}>{myName.trim() || 'You'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paidBtn, { backgroundColor: !paidByMe ? theme.lightGreen : theme.surface, borderColor: !paidByMe ? theme.primary : theme.border }]}
              onPress={() => setPaidByMe(false)}
            >
              <Text style={[styles.paidText, { color: !paidByMe ? theme.primary : theme.textSecondary }]}>{friendName.trim() || 'Friend'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Save Split" onPress={handleSave} theme={theme} />
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
  paidRow: { flexDirection: 'row', gap: 8 },
  paidBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  paidText: { fontFamily: 'Geist_500Medium', fontSize: 15 },
  footer: { padding: 16 },
});
