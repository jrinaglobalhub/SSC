import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { supabase } from "../api/supabase";
import { getEffectiveNotificationState } from "./notificationService";
import { Coordinates, DeliveryAddress } from "../types";

// Safely require expo-notifications
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
} catch {
  Notifications = null;
}

const STORAGE_DEVICE_ID_KEY = "@smartshopper_device_id";
const STORAGE_CACHED_TOKEN_KEY = "@smartshopper_cached_push_token";

export interface PushTokenRegistrationResult {
  success: boolean;
  token?: string;
  tokenType?: "expo" | "fcm";
  deviceId?: string;
  error?: string;
}

/**
 * Returns a stable, privacy-safe per-installation device ID.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(STORAGE_DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      await AsyncStorage.setItem(STORAGE_DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return `dev_fallback_${Date.now()}`;
  }
}

/**
 * Acquires the device push token using expo-notifications.
 * Prioritizes Expo Push Token, with native FCM device token fallback.
 */
export async function acquirePushToken(): Promise<{ token: string; type: "expo" | "fcm" } | null> {
  if (Platform.OS === "web" || !Notifications) return null;

  try {
    // 1. Resolve optional EAS project ID from Expo config
    const rawProjectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId ??
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
      undefined;
    const projectId =
      typeof rawProjectId === "string" && rawProjectId.trim().length > 0
        ? rawProjectId.trim()
        : undefined;

    // 2. Attempt acquiring Expo Push Token
    if (typeof Notifications.getExpoPushTokenAsync === "function") {
      try {
        const expoTokenObj = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        if (expoTokenObj?.data && typeof expoTokenObj.data === "string") {
          return { token: expoTokenObj.data, type: "expo" };
        }
      } catch (expoErr: any) {
        // If projectId is not configured or offline, fallback to native device token
        console.log("[PushTokenService] getExpoPushTokenAsync info:", expoErr?.message || expoErr);
      }
    }

    // 3. Fallback: Native Android FCM / APNs device token
    if (typeof Notifications.getDevicePushTokenAsync === "function") {
      try {
        const deviceTokenObj = await Notifications.getDevicePushTokenAsync();
        if (deviceTokenObj?.data && typeof deviceTokenObj.data === "string") {
          return { token: deviceTokenObj.data, type: "fcm" };
        }
      } catch (nativeErr: any) {
        console.log("[PushTokenService] getDevicePushTokenAsync info:", nativeErr?.message || nativeErr);
      }
    }
  } catch (err: any) {
    console.warn("[PushTokenService] Token acquisition failed:", err?.message || err);
  }

  return null;
}

/**
 * Registers the device push token and associates it with the authenticated user & consented location.
 */
export async function registerDevicePushToken(options: {
  userId?: string | null;
  location?: Coordinates | null;
  isGPS?: boolean;
  deliveryAddress?: DeliveryAddress | null;
}): Promise<PushTokenRegistrationResult> {
  if (Platform.OS === "web") {
    return { success: false, error: "Push notifications not supported on web." };
  }

  // 1. Verify that system notification permission is granted and user hasn't disabled in-app
  const isEnabled = await getEffectiveNotificationState();
  if (!isEnabled) {
    return { success: false, error: "Notifications are not permitted or disabled in preferences." };
  }

  // 2. Acquire push token
  const tokenData = await acquirePushToken();
  if (!tokenData || !tokenData.token) {
    return { success: false, error: "Could not acquire push token from notification provider." };
  }

  const deviceId = await getOrCreateDeviceId();

  // 3. Resolve consented location coordinates for 5,000m geo-filter
  let lat: number | null = null;
  let lng: number | null = null;
  let locationSource: "gps" | "saved_address" | "none" = "none";

  if (
    options.isGPS &&
    options.location &&
    typeof options.location.latitude === "number" &&
    typeof options.location.longitude === "number" &&
    (options.location.latitude !== 0 || options.location.longitude !== 0) &&
    !(Math.abs(options.location.latitude - 10.0159) < 0.0001 && Math.abs(options.location.longitude - 76.3419) < 0.0001)
  ) {
    lat = options.location.latitude;
    lng = options.location.longitude;
    locationSource = "gps";
  } else if (
    options.deliveryAddress &&
    typeof options.deliveryAddress.lat === "number" &&
    typeof options.deliveryAddress.lng === "number" &&
    (options.deliveryAddress.lat !== 0 || options.deliveryAddress.lng !== 0)
  ) {
    lat = options.deliveryAddress.lat;
    lng = options.deliveryAddress.lng;
    locationSource = "saved_address";
  }

  const payload = {
    device_id: deviceId,
    user_id: options.userId || null,
    push_token: tokenData.token,
    token_type: tokenData.type,
    platform: Platform.OS,
    app_name: "ssc",
    is_active: true,
    last_lat: lat,
    last_lng: lng,
    location_source: locationSource,
    location_updated_at: lat ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };

  // 4. Upsert into Supabase `user_push_tokens` table
  try {
    const { error } = await supabase
      .from("user_push_tokens")
      .upsert([payload], { onConflict: "device_id,app_name" });

    if (error) {
      console.log("[PushTokenService] Supabase registration notice:", error.message);
    }
  } catch (dbErr: any) {
    console.log("[PushTokenService] Supabase table update notice:", dbErr?.message || dbErr);
  }

  // 5. Cache registration in local storage
  try {
    await AsyncStorage.setItem(
      STORAGE_CACHED_TOKEN_KEY,
      JSON.stringify({
        token: tokenData.token,
        type: tokenData.type,
        registeredAt: Date.now(),
        userId: options.userId || null
      })
    );
  } catch {}

  return {
    success: true,
    token: tokenData.token,
    tokenType: tokenData.type,
    deviceId
  };
}

/**
 * Deactivates device push token upon user logout or preference toggle off.
 */
export async function deactivateDevicePushToken(): Promise<void> {
  try {
    const deviceId = await getOrCreateDeviceId();
    await supabase
      .from("user_push_tokens")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("device_id", deviceId)
      .eq("app_name", "ssc");

    await AsyncStorage.removeItem(STORAGE_CACHED_TOKEN_KEY);
  } catch (err: any) {
    console.log("[PushTokenService] deactivateDevicePushToken notice:", err?.message || err);
  }
}

/**
 * Updates consented location coordinates on the registered push token record.
 */
export async function syncLocationWithPushToken(
  coords: Coordinates | null,
  source: "gps" | "saved_address"
): Promise<void> {
  if (!coords || (coords.latitude === 0 && coords.longitude === 0)) return;
  const isFabricatedDefault = Math.abs(coords.latitude - 10.0159) < 0.0001 && Math.abs(coords.longitude - 76.3419) < 0.0001;
  if (source === "gps" && isFabricatedDefault) return;

  try {
    const deviceId = await getOrCreateDeviceId();
    await supabase
      .from("user_push_tokens")
      .update({
        last_lat: coords.latitude,
        last_lng: coords.longitude,
        location_source: source,
        location_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("device_id", deviceId)
      .eq("app_name", "ssc");
  } catch {}
}
