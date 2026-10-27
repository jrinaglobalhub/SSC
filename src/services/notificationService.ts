import { Platform, Alert, Linking, PermissionsAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const NOTIFICATION_STORAGE_KEY = "smartshopper_notifications_enabled";

// In-memory set for client-side deduplication between Supabase Realtime and Push notifications
const handledOfferIds = new Set<string>();

export function markOfferHandled(offerId: string): void {
  if (!offerId) return;
  handledOfferIds.add(String(offerId));
  if (handledOfferIds.size > 200) {
    const firstKey = handledOfferIds.keys().next().value;
    if (firstKey) handledOfferIds.delete(firstKey);
  }
}

export function isOfferAlreadyHandled(offerId: string): boolean {
  if (!offerId) return false;
  return handledOfferIds.has(String(offerId));
}

// Safely resolve expo-notifications
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async (notification: any) => {
        const data = notification?.request?.content?.data;
        // Suppress duplicate alert if deal was already processed in foreground via Realtime
        if (data?.type === "deal_drop" && data?.offerId) {
          if (isOfferAlreadyHandled(data.offerId)) {
            return {
              shouldShowAlert: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false
            };
          }
          markOfferHandled(data.offerId);
        }

        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true
        };
      }
    });
  }
} catch {
  Notifications = null;
}

export interface OSNotificationStatus {
  isGranted: boolean;
  canAskAgain: boolean;
  status: "granted" | "denied" | "undetermined" | "blocked";
}

/**
 * Initializes notification channels for Android (required for Android 8.0+ / API 26+)
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (Platform.OS === "android" && Notifications?.setNotificationChannelAsync) {
    try {
      // Channel 1: Deals & Instant Merchant Messages
      await Notifications.setNotificationChannelAsync("deals_and_messages", {
        name: "Deals & Merchant Messages",
        description: "Notifications for flash discounts, deal drops, and merchant customer chats",
        importance: Notifications.AndroidImportance?.MAX ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#EA580C",
        sound: "default",
        enableVibrate: true,
        showBadge: true
      });

      // Channel 2: Orders & Bill Updates
      await Notifications.setNotificationChannelAsync("order_updates", {
        name: "Order & Bill Receipts",
        description: "Verified counter billing receipts and voucher redemptions",
        importance: Notifications.AndroidImportance?.HIGH ?? 3,
        vibrationPattern: [0, 200, 200],
        lightColor: "#10B981",
        sound: "default",
        enableVibrate: true,
        showBadge: true
      });
    } catch (err) {
      console.warn("[Notification Channels] Error setting channels:", err);
    }
  }
}

/**
 * Checks the real-time Android / iOS OS notification permission status.
 * Requirement 3: Checks actual OS status before displaying in-app toggle.
 * Requirement 10: Handles Android < 13 without unnecessary runtime prompts.
 */
export async function getOSNotificationPermissionStatus(): Promise<OSNotificationStatus> {
  if (Platform.OS === "web") {
    return { isGranted: true, canAskAgain: true, status: "granted" };
  }

  try {
    if (Notifications?.getPermissionsAsync) {
      const perms = await Notifications.getPermissionsAsync();
      const isGranted = perms.status === "granted";
      const canAskAgain = perms.canAskAgain !== false;

      let computedStatus: OSNotificationStatus["status"] = "undetermined";
      if (isGranted) {
        computedStatus = "granted";
      } else if (!canAskAgain) {
        computedStatus = "blocked";
      } else if (perms.status === "denied") {
        computedStatus = "denied";
      }

      return {
        isGranted,
        canAskAgain,
        status: computedStatus
      };
    }

    // Fallback: On Android 13+ check via PermissionsAndroid
    if (Platform.OS === "android") {
      const androidVersion = typeof Platform.Version === "number" ? Platform.Version : parseInt(String(Platform.Version), 10);
      if (androidVersion >= 33) {
        const hasPerm = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        return {
          isGranted: hasPerm,
          canAskAgain: true,
          status: hasPerm ? "granted" : "denied"
        };
      }
    }
  } catch (err) {
    console.warn("[Notifications] Error checking OS permissions:", err);
  }

  // Pre-Android 13 default
  return { isGranted: true, canAskAgain: true, status: "granted" };
}

/**
 * Backward-compatible helper returning boolean permission status.
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  const osStatus = await getOSNotificationPermissionStatus();
  return osStatus.isGranted;
}

/**
 * Reads user's in-app notification preference from storage.
 * Requirement 7: Keep in-app preferences separate from OS permission.
 */
export async function getInAppNotificationPreference(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    // Default to true if user hasn't explicitly disabled
    return val !== "false";
  } catch {
    return true;
  }
}

/**
 * Sets user's in-app notification preference.
 */
export async function setInAppNotificationPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, enabled ? "true" : "false");
  } catch {}
}

export const setNotificationPermissionStatus = setInAppNotificationPreference;

/**
 * Returns the effective notification state.
 * Requirement 6: Never display notifications as enabled when OS permission is denied.
 */
export async function getEffectiveNotificationState(): Promise<boolean> {
  const osStatus = await getOSNotificationPermissionStatus();
  if (!osStatus.isGranted) {
    return false;
  }
  const inAppPref = await getInAppNotificationPreference();
  return inAppPref;
}

/**
 * Opens phone's native App Settings page.
 */
export function openAppSettings(): void {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    Linking.openSettings().catch(() => {
      Alert.alert("Unable to open Settings", "Please open your phone's Settings > Apps > SmartShopper > Notifications.");
    });
  }
}

/**
 * Shows an alert explaining how to enable notifications in phone settings.
 * Requirement 5: Explain how to enable notifications and provide Open Settings action.
 */
export function showSettingsPromptDialog(title?: string, message?: string): void {
  Alert.alert(
    title || "Notifications Blocked",
    message || "Notification permission has been disabled in your device settings. To receive live discounts and merchant message alerts, please enable notifications in App Settings.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: openAppSettings }
    ]
  );
}

/**
 * Prompts user for system notification permission.
 * Requirement 2: Android 13+ POST_NOTIFICATIONS handling.
 * Requirement 4: Requests system permission if not granted.
 * Requirement 5: Guides to Settings if blocked.
 * Requirement 10: Skips runtime dialog on Android < 13.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await initializeNotificationChannels();

    const currentOS = await getOSNotificationPermissionStatus();

    // 1. If already granted by OS
    if (currentOS.isGranted) {
      await setInAppNotificationPreference(true);
      return true;
    }

    // 2. If blocked by Android OS (never_ask_again)
    if (currentOS.status === "blocked" || (!currentOS.canAskAgain && currentOS.status === "denied")) {
      showSettingsPromptDialog(
        "Enable Notifications in Settings",
        "Notifications are currently disabled for SmartShopper in your phone settings. Tap 'Open Settings' to allow alerts."
      );
      return false;
    }

    // 3. Android 13+ Runtime Prompt
    if (Platform.OS === "android") {
      const androidVersion = typeof Platform.Version === "number" ? Platform.Version : parseInt(String(Platform.Version), 10);
      if (androidVersion >= 33) {
        if (Notifications?.requestPermissionsAsync) {
          const res = await Notifications.requestPermissionsAsync();
          if (res.status === "granted") {
            await setInAppNotificationPreference(true);
            return true;
          }
          if (!res.canAskAgain) {
            showSettingsPromptDialog();
          }
          return false;
        }

        // Native PermissionsAndroid fallback
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: "Notification Permission",
            message: "SmartShopper requires notification permission to alert you on local store deals and merchant messages.",
            buttonPositive: "Allow",
            buttonNegative: "Don't allow"
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await setInAppNotificationPreference(true);
          return true;
        }
        if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          showSettingsPromptDialog();
        }
        return false;
      }

      // Android < 13: If denied in system settings
      showSettingsPromptDialog(
        "Notifications Disabled",
        "App notifications are disabled in your system settings. Tap 'Open Settings' to enable them."
      );
      return false;
    }

    // 4. iOS Prompt
    if (Platform.OS === "ios" && Notifications?.requestPermissionsAsync) {
      const res = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true
        }
      });
      if (res.status === "granted") {
        await setInAppNotificationPreference(true);
        return true;
      }
      if (!res.canAskAgain) {
        showSettingsPromptDialog();
      }
      return false;
    }
  } catch (err) {
    console.warn("[Notifications] Request permission error:", err);
  }

  return false;
}

/**
 * Shows notification on phone (native tray if supported, plus in-app alert fallback).
 */
export async function sendNewOfferNotification(
  storeName: string,
  discountTag: string,
  offerTitle?: string,
  distanceInKm?: number,
  offerId?: string
): Promise<void> {
  try {
    if (offerId) {
      markOfferHandled(offerId);
    }

    const isEnabled = await getEffectiveNotificationState();
    if (!isEnabled) return;

    await initializeNotificationChannels();

    const distanceSubtitle = distanceInKm !== undefined
      ? ` (${distanceInKm.toFixed(1)} km away from your address)`
      : "";

    const title = `🔥 New Deal Drop at ${storeName}!`;
    const body = `${discountTag}: ${offerTitle || "Special limited-time discount live now. Tap to claim!"}${distanceSubtitle}`;

    let scheduledNatively = false;
    if (Platform.OS !== "web" && Notifications?.scheduleNotificationAsync) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: "default",
            data: { type: "deal_drop", storeName, offerId: offerId || "" },
            ...(Platform.OS === "android" ? { channelId: "deals_and_messages" } : {})
          },
          trigger: Platform.OS === "android" ? { channelId: "deals_and_messages" } : null
        });
        scheduledNatively = true;
      } catch {
        scheduledNatively = false;
      }
    }

    if (!scheduledNatively && Platform.OS !== "web") {
      Alert.alert(title, body, [{ text: "OK" }]);
    }
  } catch (err) {
    console.warn("[Notifications] Send notification error:", err);
  }
}

/**
 * Shows notification when merchant sends a chat message.
 */
export async function sendStoreMessageNotification(
  storeName: string,
  messageText: string,
  userName?: string,
  storeId?: string
): Promise<void> {
  try {
    const isEnabled = await getEffectiveNotificationState();
    if (!isEnabled) return;

    await initializeNotificationChannels();

    const recipient = userName && userName.trim() ? userName.trim() : "user";
    const title = `Hi ${recipient},`;
    const body = `${storeName} messaged you! Tap to open.`;

    let scheduledNatively = false;
    if (Platform.OS !== "web" && Notifications?.scheduleNotificationAsync) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            subtitle: messageText ? `"${messageText}"` : undefined,
            sound: "default",
            data: {
              type: "merchant_message",
              storeId: storeId || "",
              storeName: storeName || "",
              messageText: messageText || ""
            },
            ...(Platform.OS === "android" ? { channelId: "deals_and_messages" } : {})
          },
          trigger: Platform.OS === "android" ? { channelId: "deals_and_messages" } : null
        });
        scheduledNatively = true;
      } catch {
        scheduledNatively = false;
      }
    }

    if (!scheduledNatively && Platform.OS !== "web") {
      Alert.alert(title, body, [{ text: "OK" }]);
    }
  } catch (err) {
    console.warn("[Notifications] Send store message notification error:", err);
  }
}

/**
 * Sets up a listener for notification response events (when user taps a notification).
 */
export function setupNotificationResponseListener(
  onResponse: (data: any) => void
): () => void {
  try {
    if (Notifications?.addNotificationResponseReceivedListener) {
      const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response?.notification?.request?.content?.data;
        if (data) {
          onResponse(data);
        }
      });
      return () => {
        try {
          if (typeof subscription?.remove === "function") {
            subscription.remove();
          } else if (Notifications?.removeNotificationSubscription) {
            Notifications.removeNotificationSubscription(subscription);
          }
        } catch {}
      };
    }
  } catch (err) {
    console.warn("[Notifications] Error setting up response listener:", err);
  }
  return () => {};
}

/**
 * Retrieves the notification response that launched the app, if any.
 */
export async function getLastNotificationResponse(): Promise<any | null> {
  try {
    if (Notifications?.getLastNotificationResponseAsync) {
      const response = await Notifications.getLastNotificationResponseAsync();
      return response?.notification?.request?.content?.data || null;
    }
  } catch (err) {
    console.warn("[Notifications] Error getting last notification response:", err);
  }
  return null;
}

/**
 * Sets up a listener for notifications received while the app is in the foreground.
 * Ensures bidirectional deduplication: when a push arrives in the foreground,
 * marks the offerId as handled so Supabase Realtime will not trigger a duplicate alert.
 */
export function setupNotificationForegroundReceivedListener(
  onReceived?: (data: any) => void
): () => void {
  try {
    if (Notifications?.addNotificationReceivedListener) {
      const subscription = Notifications.addNotificationReceivedListener((notification: any) => {
        const data = notification?.request?.content?.data;
        if (data?.type === "deal_drop" && data?.offerId) {
          markOfferHandled(data.offerId);
        }
        if (onReceived && data) {
          onReceived(data);
        }
      });
      return () => {
        try {
          if (typeof subscription?.remove === "function") {
            subscription.remove();
          } else if (Notifications?.removeNotificationSubscription) {
            Notifications.removeNotificationSubscription(subscription);
          }
        } catch {}
      };
    }
  } catch (err) {
    console.warn("[Notifications] Error setting up received listener:", err);
  }
  return () => {};
}
