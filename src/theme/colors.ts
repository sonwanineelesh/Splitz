// Theme colors exact from design-system.md
export const Colors = {
  light: {
    background: '#F8F7F2',
    surface: '#FFFFFF',
    text: '#17201A',
    textSecondary: '#667067',
    border: '#E6E7E3',
    primary: '#14532D',
    primarySecondary: '#166534',
    lightGreen: '#DCFCE7',
    accent: '#22C55E',
    success: '#15803D',
    error: '#DC2626',
  },
  dark: {
    background: '#101512',
    surface: '#171D19',
    elevatedSurface: '#202821',
    text: '#F5F5F0',
    textSecondary: '#A7B0A9',
    border: '#29322C',
    primary: '#14532D',
    primarySecondary: '#166534',
    lightGreen: '#166534',
    accent: '#22C55E',
    success: '#4ADE80',
    error: '#F87171',
  },
};

export type ColorTheme = typeof Colors.light;
