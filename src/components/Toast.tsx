import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';

// Web has no native animated module — fall back to the JS driver there only.
const useNativeDriver = Platform.OS !== 'web';

// Global lightweight toast (design Sec 28). Shown via `showToast()` from the
// store; auto-dismisses. Rendered once in the root layout.
export const Toast = () => {
  const theme = useTheme();
  const message = useStore((s) => s.toast);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver }).start();
    }
  }, [message, opacity]);

  if (!message) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: theme.text,
            opacity,
          },
        ]}
      >
        <CheckCircle2 size={18} color={theme.background} strokeWidth={2} />
        <Text style={[styles.text, { color: theme.background }]} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 100,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: '100%',
  },
  text: { fontFamily: 'Geist_500Medium', fontSize: 14, flexShrink: 1 },
});
