// Pro entitlement (backend Sec 25). RevenueCat is the source of truth;
// never store subscription status as an editable boolean. Local cache is
// UI-only. Full RevenueCat SDK wiring is pending store keys
// (EXPO_PUBLIC_REVENUECAT_IOS/ANDROID_KEY); until then everything is free-tier.

export interface Entitlement {
  pro: boolean;
  source: 'revenuecat' | 'stub';
}

let cached: Entitlement = { pro: false, source: 'stub' };

export const refreshEntitlement = async (): Promise<Entitlement> => {
  // TODO: replace with react-native-purchases getCustomerInfo when keys exist.
  cached = { pro: false, source: 'stub' };
  return cached;
};

export const getEntitlement = (): Entitlement => cached;
