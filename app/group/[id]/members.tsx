import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { hasMemberExpenses, useStore } from '../../../src/store/useStore';
import { useTheme } from '../../../src/hooks/useTheme';
import { Avatar } from '../../../src/components/Avatar';
import { lightTap } from '../../../src/utils/feedback';

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { groups, members, expenses, addMember, removeMember, setDefaultSplit, clearDefaultSplit, showToast } = useStore();

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const group = groups[id];
  if (!group) return null;

  const groupMembers = group.memberIds.map(mid => members[mid]).filter(Boolean);

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (group.memberIds.length >= 20) {
      Alert.alert('Member limit', 'Groups support up to 20 members in V1.');
      return;
    }
    addMember(id, newName.trim(), {
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
    });
    lightTap();
    showToast('Member added.');
    setNewName('');
    setNewPhone('');
    setNewEmail('');
  };

  const handleRemove = (memberId: string, name: string) => {
    // V1: disable removal if the member has expenses (PRD Sec 20).
    if (hasMemberExpenses(memberId, expenses)) {
      Alert.alert(
        'Cannot remove',
        `${name} has existing expenses. Removal is disabled in V1 unless expenses are reassigned.`
      );
      return;
    }
    Alert.alert('Remove Member', `Remove ${name} from this group?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMember(memberId) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Members</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.defaultBlock}>
          <Text style={[styles.defaultLabel, { color: theme.textSecondary }]}>
            Default split: {group.defaultSplitType ? group.defaultSplitType.charAt(0).toUpperCase() + group.defaultSplitType.slice(1) : 'None'}
          </Text>
          <View style={styles.defaultRow}>
            <TouchableOpacity
              style={[styles.defaultBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setDefaultSplit(id, 'equal')}
            >
              <Text style={[styles.defaultBtnText, { color: theme.text }]}>Set Equal default</Text>
            </TouchableOpacity>
            {group.defaultSplitType && (
              <TouchableOpacity
                style={[styles.defaultBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => clearDefaultSplit(id)}
              >
                <Text style={[styles.defaultBtnText, { color: theme.error }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.addBlock}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="Member name (no account needed)"
            placeholderTextColor={theme.textSecondary}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            value={newPhone}
            onChangeText={setNewPhone}
            placeholder="Phone (optional)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Email (optional)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={handleAdd}
          >
            <Plus size={20} color="#fff" strokeWidth={2} />
            <Text style={styles.addBtnText}>Add member</Text>
          </TouchableOpacity>
        </View>

        {groupMembers.map(m => {
          const locked = hasMemberExpenses(m.id, expenses);
          return (
            <View key={m.id} style={[styles.memberRow, { borderColor: theme.border }]}>
              <View style={styles.memberLeft}>
                <Avatar name={m.name} size={36} />
                <View>
                  <Text style={[styles.memberName, { color: theme.text }]}>{m.name}</Text>
                  {(m.phone || m.email) && (
                    <Text style={[styles.memberMeta, { color: theme.textSecondary }]}>
                      {[m.phone, m.email].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(m.id, m.name)}
                style={[styles.removeBtn, locked && styles.removeBtnDisabled]}
              >
                <Trash2 size={18} color={locked ? theme.textSecondary : theme.error} strokeWidth={1.8} />
              </TouchableOpacity>
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
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 18 },
  scroll: { padding: 16, paddingBottom: 100 },
  defaultBlock: { marginBottom: 16 },
  defaultLabel: { fontFamily: 'Geist_500Medium', fontSize: 13, marginBottom: 8 },
  defaultRow: { flexDirection: 'row', gap: 8 },
  defaultBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  defaultBtnText: { fontFamily: 'Geist_500Medium', fontSize: 14 },
  addBlock: { gap: 8, marginBottom: 24 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontFamily: 'Geist_400Regular', fontSize: 16 },
  addBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  addBtnText: { color: '#fff', fontFamily: 'Geist_600SemiBold', fontSize: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberName: { fontFamily: 'Geist_500Medium', fontSize: 15 },
  memberMeta: { fontFamily: 'Geist_400Regular', fontSize: 13, marginTop: 2 },
  removeBtn: { padding: 6 },
  removeBtnDisabled: { opacity: 0.5 },
});
