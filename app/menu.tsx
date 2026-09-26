import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Users, Plus } from 'lucide-react-native';
import { useTheme } from '../src/hooks/useTheme';

export default function MenuScreen() {
  const router = useRouter();
  const theme = useTheme();

  const menuItems = [
    {
      title: 'All Groups',
      subtitle: 'View and manage your groups',
      icon: <Users size={22} color={theme.primary} strokeWidth={1.8} />,
      route: '/(tabs)/groups',
    },
    {
      title: 'Create a Group',
      subtitle: 'Start a new split with friends',
      icon: <Plus size={22} color={theme.primary} strokeWidth={1.8} />,
      route: '/groups/create',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Menu</Text>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: theme.surface }]}
          onPress={() => router.back()}
        >
          <X size={20} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.menuList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
              onPress={() => { router.back(); setTimeout(() => router.push(item.route as any), 100); }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: theme.lightGreen }]}>
                {item.icon}
              </View>
              <View style={styles.menuTextBlock}>
                <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
  },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 28 },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 16 },
  menuList: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  menuIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  menuTextBlock: { flex: 1 },
  menuTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 16 },
  menuSubtitle: { fontFamily: 'Geist_400Regular', fontSize: 13, marginTop: 2 },
});
