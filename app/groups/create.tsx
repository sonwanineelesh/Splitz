import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useTheme } from '../../src/hooks/useTheme';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';

export default function CreateGroupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { members: existingMembers, addGroup, addMember } = useStore();

  const [name, setName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState('');

  // Show all globally known members as quick-add options
  const allMembers = Object.values(existingMembers);

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setNameError('Please enter a group name.');
      return;
    }
    if (selectedMemberIds.length < 2) {
      Alert.alert('Select Members', 'Please select at least 2 members for the group.');
      return;
    }

    // Create the group, then add each selected member to it
    const groupId = addGroup(name.trim(), 'Trip');
    selectedMemberIds.forEach(mid => {
      const member = existingMembers[mid];
      if (member) addMember(groupId, member.name);
    });

    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={[styles.title, { color: theme.text }]}>New Group</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Group Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: nameError ? theme.error : theme.border, color: theme.text }]}
            value={name}
            onChangeText={t => { setName(t); setNameError(''); }}
            placeholder="e.g. Goa Trip"
            placeholderTextColor={theme.textSecondary}
            autoFocus
          />
          {nameError ? <Text style={[styles.errorText, { color: theme.error }]}>{nameError}</Text> : null}
        </View>

        {allMembers.length > 0 && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Add Members</Text>
            {allMembers.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.memberRow, { borderColor: theme.border }]}
                onPress={() => toggleMember(m.id)}
              >
                <View style={styles.memberLeft}>
                  <Avatar name={m.name} size={36} />
                  <Text style={[styles.memberName, { color: theme.text }]}>{m.name}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  {
                    borderColor: selectedMemberIds.includes(m.id) ? theme.primary : theme.border,
                    backgroundColor: selectedMemberIds.includes(m.id) ? theme.primary : 'transparent',
                  }
                ]}>
                  {selectedMemberIds.includes(m.id) && <Check size={14} color="#fff" strokeWidth={2.5} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Create Group" onPress={handleCreate} theme={theme} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 18 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  field: { marginBottom: 24 },
  label: { fontFamily: 'Geist_500Medium', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontFamily: 'Geist_400Regular', fontSize: 16 },
  errorText: { fontFamily: 'Geist_400Regular', fontSize: 13, marginTop: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberName: { fontFamily: 'Geist_500Medium', fontSize: 15 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 16 },
});
