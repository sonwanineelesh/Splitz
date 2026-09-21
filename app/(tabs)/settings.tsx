import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useStore } from '../../src/store/useStore';
import { Settings as SettingsType } from '../../src/types';
import { Moon, Sun, Smartphone, Trash2 } from 'lucide-react-native';

type ThemeOption = SettingsType['theme'];

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, setTheme, clearAllData, clearDemoData } = useStore();

  const themeOptions: { key: ThemeOption; label: string; icon: React.ReactNode }[] = [
    { key: 'light', label: 'Light', icon: <Sun size={16} color={settings.theme === 'light' ? theme.primary : theme.textSecondary} strokeWidth={1.8} /> },
    { key: 'dark', label: 'Dark', icon: <Moon size={16} color={settings.theme === 'dark' ? theme.primary : theme.textSecondary} strokeWidth={1.8} /> },
    { key: 'system', label: 'System', icon: <Smartphone size={16} color={settings.theme === 'system' ? theme.primary : theme.textSecondary} strokeWidth={1.8} /> },
  ];

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all groups, members, expenses, and settlements.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAllData },
      ]
    );
  };

  const handleClearDemo = () => {
    Alert.alert(
      'Clear Demo Data',
      'This will remove the demo "Goa Trip" group and all its data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear Demo', style: 'destructive', onPress: clearDemoData },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {themeOptions.map((opt, i) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.settingRow,
                { borderBottomColor: theme.border, borderBottomWidth: i < themeOptions.length - 1 ? 1 : 0 },
              ]}
              onPress={() => setTheme(opt.key)}
            >
              <View style={styles.settingLeft}>
                {opt.icon}
                <Text style={[styles.settingLabel, { color: theme.text }]}>{opt.label}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  { borderColor: settings.theme === opt.key ? theme.primary : theme.border },
                ]}
              >
                {settings.theme === opt.key && (
                  <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Currency */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Currency</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Indian Rupee (₹)</Text>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>INR</Text>
          </View>
        </View>

        {/* Data */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Data</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
            onPress={handleClearDemo}
          >
            <Text style={[styles.settingLabel, { color: theme.error }]}>Clear Demo Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} onPress={handleClearAll}>
            <Text style={[styles.settingLabel, { color: theme.error }]}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>About</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Version</Text>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 26 },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontFamily: 'Geist_500Medium', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 24 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingLabel: { fontFamily: 'Geist_500Medium', fontSize: 16 },
  settingValue: { fontFamily: 'Geist_400Regular', fontSize: 15 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
});
