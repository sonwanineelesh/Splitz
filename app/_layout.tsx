import { Tabs, Stack } from 'expo-router';
import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';
import { Home, Settings, Activity } from 'lucide-react-native';
import { useTheme } from '../src/hooks/useTheme';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });

  const theme = useTheme();

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#F8F7F2' }} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { fontFamily: 'Geist_600SemiBold', fontSize: 18 },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="menu"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="welcome"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="groups/index"
          options={{ headerTitle: 'All Groups' }}
        />
        <Stack.Screen
          name="groups/create"
          options={{ headerTitle: 'Create Group', presentation: 'modal' }}
        />
        <Stack.Screen
          name="group/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="group/[id]/add-expense"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="group/[id]/expense/[expenseId]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="group/[id]/members"
          options={{ headerTitle: 'Manage Members' }}
        />
      </Stack>
    </View>
  );
}
