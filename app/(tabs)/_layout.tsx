import { Tabs } from 'expo-router';
import { Home, Settings, Activity } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { View, StyleSheet } from 'react-native';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarStyle: {
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            height: 64,
            backgroundColor: theme.surface,
            borderRadius: 32,
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            paddingBottom: 0,
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Home size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Activity size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Settings size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
