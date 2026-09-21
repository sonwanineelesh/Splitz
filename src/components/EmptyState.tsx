import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { Button } from './Button';
import { ColorTheme } from '../theme/colors';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  theme: ColorTheme;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title, description, actionLabel, onAction, theme
}) => (
  <View style={styles.container}>
    <Users size={40} color={theme.border} strokeWidth={1.5} />
    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
    {description && (
      <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
    )}
    {actionLabel && onAction && (
      <Button label={actionLabel} onPress={onAction} theme={theme} style={styles.button} />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 18,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 32,
  },
});
