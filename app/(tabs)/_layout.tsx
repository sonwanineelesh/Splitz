import { Tabs } from 'expo-router';
import { Home, Users, Activity, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';

// Standard bottom navigation (design Sec 14): max 4 tabs, icon + label,
// active = green, inactive = muted gray. No floating pill (Sec 8/9).
export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Geist_500Medium',
          fontSize: 12,
          marginTop: 2,
        },
        tabBarItemStyle: {
          minHeight: 44,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Home size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => (
            <Users size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => (
            <Activity size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Settings size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
