import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { ColorTheme } from '../theme/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  theme: ColorTheme;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', loading = false, disabled = false, theme, style
}) => {
  const getBg = () => {
    if (disabled) return theme.border;
    if (variant === 'primary') return theme.primary;
    if (variant === 'destructive') return theme.error;
    return theme.surface;
  };

  const getBorder = () => {
    if (variant === 'secondary') return theme.border;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    if (variant === 'secondary') return theme.text;
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBg(), borderColor: getBorder(), borderWidth: variant === 'secondary' ? 1 : 0 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.label, { color: getTextColor() }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Geist_600SemiBold',
  },
});
