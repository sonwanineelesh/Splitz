import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { useTheme } from '../src/hooks/useTheme';
import { Button } from '../src/components/Button';

export default function Welcome() {
  const router = useRouter();
  const theme = useTheme();
  const { loadDemo, completeFirstLaunch, isFirstLaunch } = useStore();

  useEffect(() => {
    if (!isFirstLaunch) {
      router.replace('/');
    }
  }, []);

  const handleTryDemo = () => {
    completeFirstLaunch();
    const groupId = loadDemo();
    router.replace(`/group/${groupId}`);
  };

  const handleCreateGroup = () => {
    completeFirstLaunch();
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
          <Text style={styles.logoText}>S</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Splitz</Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }]}>
          Split expenses.{'\n'}Not friendships.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Try Demo"
          onPress={handleTryDemo}
          theme={theme}
          style={styles.btn}
        />
        <Button
          label="Create Group"
          onPress={handleCreateGroup}
          variant="secondary"
          theme={theme}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 44,
    color: '#fff',
    fontFamily: 'Geist_600SemiBold',
  },
  title: {
    fontSize: 40,
    fontFamily: 'Geist_600SemiBold',
  },
  tagline: {
    fontSize: 20,
    fontFamily: 'Geist_400Regular',
    textAlign: 'center',
    lineHeight: 30,
  },
  actions: {
    padding: 24,
    gap: 12,
  },
  btn: {
    width: '100%',
  },
});
