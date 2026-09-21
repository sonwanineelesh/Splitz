import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { useStore } from '../../../src/store/useStore';
import { useTheme } from '../../../src/hooks/useTheme';
import { Avatar } from '../../../src/components/Avatar';

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { groups, members, addMember, removeMember } = useStore();

  const [newName, setNewName] = useState('');
  const group = groups[id];
  if (!group) return null;

  const groupMembers = group.memberIds.map(mid => members[mid]).filter(Boolean);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMember(id, newName.trim());
    setNewName('');
  };

  const handleRemove = (memberId: string, name: string) => {
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
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, flex: 1 }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="Add a member..."
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={handleAdd}
          >
            <Plus size={20} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {groupMembers.map(m => (
          <View key={m.id} style={[styles.memberRow, { borderColor: theme.border }]}>
            <View style={styles.memberLeft}>
              <Avatar name={m.name} size={36} />
              <Text style={[styles.memberName, { color: theme.text }]}>{m.name}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemove(m.id, m.name)} style={styles.removeBtn}>
              <Trash2 size={18} color={theme.error} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 18 },
  scroll: { padding: 16, paddingBottom: 100 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontFamily: 'Geist_400Regular', fontSize: 16 },
  addBtn: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberName: { fontFamily: 'Geist_500Medium', fontSize: 15 },
  removeBtn: { padding: 6 },
});
