import { useColorScheme } from 'react-native';
import { Colors, ColorTheme } from '../theme/colors';
import { useStore } from '../store/useStore';

export const useTheme = (): ColorTheme => {
  const systemScheme = useColorScheme();
  const preference = useStore((s) => s.settings.theme);

  let effective: 'light' | 'dark';
  if (preference === 'system') {
    effective = systemScheme === 'dark' ? 'dark' : 'light';
  } else {
    effective = preference;
  }

  return Colors[effective];
};
