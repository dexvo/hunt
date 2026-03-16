import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

// ── ENTITLEMENT IDs (match these in RevenueCat dashboard) ──
export const ENTITLEMENTS = {
  MEMBERS_PLUS: 'members_plus',
} as const;

// ── OFFERING IDs ───────────────────────────────────────────
export const OFFERINGS = {
  DEFAULT: 'default',
} as const;

// ── CONFIGURE ─────────────────────────────────────────────
export function configureRevenueCat() {
  Purchases.setLogLevel(LOG_LEVEL.ERROR);

  if (Platform.OS === 'ios') {
    const apiKey = process.env.EXPO_PUBLIC_RC_APPLE_KEY;
    if (!apiKey) throw new Error('Missing EXPO_PUBLIC_RC_APPLE_KEY');
    Purchases.configure({ apiKey });
  } else if (Platform.OS === 'android') {
    const apiKey = process.env.EXPO_PUBLIC_RC_GOOGLE_KEY;
    if (!apiKey) throw new Error('Missing EXPO_PUBLIC_RC_GOOGLE_KEY');
    Purchases.configure({ apiKey });
  }
}

// ── IDENTIFY USER (call after login) ──────────────────────
export async function identifyUser(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.error('RevenueCat login error:', e);
  }
}

// ── RESET USER (call on logout) ───────────────────────────
export async function resetUser(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (e) {
    // Ignore — user might not have been identified
  }
}

// ── CHECK ENTITLEMENT ─────────────────────────────────────
export async function checkMembersPlus(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENTS.MEMBERS_PLUS] !== undefined;
  } catch {
    return false;
  }
}

// ── GET OFFERINGS ─────────────────────────────────────────
export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    return current.availablePackages;
  } catch {
    return [];
  }
}

// ── PURCHASE ──────────────────────────────────────────────
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

// ── RESTORE ───────────────────────────────────────────────
export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    return info.entitlements.active[ENTITLEMENTS.MEMBERS_PLUS] !== undefined;
  } catch {
    return false;
  }
}

// ── LISTEN TO CHANGES ─────────────────────────────────────
export function onCustomerInfoUpdate(callback: (info: CustomerInfo) => void) {
  Purchases.addCustomerInfoUpdateListener(callback);
  return () => Purchases.removeCustomerInfoUpdateListener(callback);
}
