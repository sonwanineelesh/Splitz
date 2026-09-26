import * as Haptics from 'expo-haptics';

// Light haptic feedback for key confirmations only (design Sec 25):
// expense saved, settlement completed, button confirmation.
export const lightTap = (): void => {
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics unavailable — never break the flow.
  }
};

export const successTap = (): void => {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics unavailable — never break the flow.
  }
};
