import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OfferItem, StoreProfile, VoucherDetails, Coordinates, Bill, UserSession, ChatMessage, ChatThread, CatalogItem, DeliveryAddress } from "../types";
import { calculateDistanceInMeters, DEFAULT_LOCATION } from "../utils/geo";

export const SUPABASE_URL = "https://tpcrwtxtqvvdghtfckea.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_duE4gQ7TYTYpO7sRjeKcXQ_1mf2F-d3";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

const DEFAULT_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";

/**
 * Fetches all live active offers and joins store metadata
 */
export async function fetchLiveOffers(userCoords: Coordinates = DEFAULT_LOCATION): Promise<OfferItem[]> {
  try {
    const { data: offersData, error: offersError } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (offersError) {
      console.warn("[Supabase] offers fetch error:", offersError);
      return [];
    }

    const { data: storesData } = await supabase.from("stores").select("*");
    const storesMap = new Map<string, any>();
    if (storesData && Array.isArray(storesData)) {
      storesData.forEach((s) => {
        if (s.id) storesMap.set(s.id, s);
        if (s.name) storesMap.set(s.name.toLowerCase().trim(), s);
      });
    }

    const now = Date.now();
    const items: OfferItem[] = [];

    (offersData || []).forEach((o: any) => {
      if (o.is_deleted) return;
      if (o.end_at && new Date(o.end_at).getTime() <= now) return;
      if (o.start_at && new Date(o.start_at).getTime() > now) return;

      const store = storesMap.get(o.store_id) || storesMap.get(o.store_name?.toLowerCase()?.trim());
      const rawLat = o.lat ?? store?.lat ?? store?.latitude;
      const rawLng = o.lng ?? store?.lng ?? store?.longitude;
      const storeLat = rawLat !== undefined && rawLat !== null ? parseFloat(rawLat) : NaN;
      const storeLng = rawLng !== undefined && rawLng !== null ? parseFloat(rawLng) : NaN;
      const hasValidCoords = !isNaN(storeLat) && !isNaN(storeLng) && (storeLat !== 0 || storeLng !== 0);

      const distance = hasValidCoords && userCoords
        ? calculateDistanceInMeters(userCoords, {
            latitude: storeLat,
            longitude: storeLng
          })
        : undefined;

      const storeImg = store?.image_url || store?.logo_url;
      const pctNum = o.offer_percentage != null ? parseFloat(o.offer_percentage) : undefined;
      const isStoreDeal = o.deal_target_type === "STORE" || !o.deal_target_type;
      const displayDiscount = o.discount_tag || (pctNum ? `${pctNum}% OFF` : "EXCLUSIVE DEAL");

      items.push({
        id: o.id,
        storeId: o.store_id || store?.id,
        storeName: o.store_name || store?.name || "SmartShopper Partner Store",
        category: o.category || store?.category || "Retail Store",
        discountTag: displayDiscount,
        originalPrice: isStoreDeal ? "" : (o.original_price || "₹0"),
        offerPrice: isStoreDeal ? "" : (o.offer_price || "₹0"),
        distanceInMeters: distance,
        expiresAt: o.expires_at_label || `${o.expires_in_minutes || 60} mins left`,
        expiresInMinutes: o.expires_in_minutes || 60,
        verifiedBillReviewsCount: store?.verified_bills_count || 0,
        priceFairnessScore: parseFloat(store?.price_fairness_score || "5.0"),
        imageUrl: o.image_url || storeImg || DEFAULT_IMG,
        mapCoords: { x: o.map_x || 50, y: o.map_y || 50 },
        isHotspot: Boolean(o.is_hotspot),
        couponCode: o.coupon_code || "",
        description: o.description || "Proximity Deal Drop",
        address: o.address || store?.address || "Kochi, Kerala",
        lat: isNaN(storeLat) ? 10.0159 : storeLat,
        lng: isNaN(storeLng) ? 76.3419 : storeLng,
        phone: store?.phone || o.phone || "",
        operatingHours: store?.operating_hours || "8:00 AM - 10:00 PM",
        storeDescription: store?.description || "",
        storeImageUrl: storeImg || DEFAULT_IMG,
        dealTargetType: o.deal_target_type || "STORE",
        targetProductId: o.target_product_id || undefined,
        startAt: o.start_at || undefined,
        endAt: o.end_at || undefined,
        expiryDurationType: o.expiry_duration_type || "PRESET",
        offerPercentage: pctNum,
        isDeleted: Boolean(o.is_deleted),
        deletedAt: o.deleted_at || undefined,
        createdAt: o.created_at || undefined
      });
    });

    // Sort closest first
    return items.sort((a, b) => (a.distanceInMeters || 0) - (b.distanceInMeters || 0));
  } catch (err) {
    console.error("[Supabase] fetchLiveOffers error:", err);
    return [];
  }
}

/**
 * Fetches all registered stores with distances
 */
export async function fetchStores(userCoords: Coordinates = DEFAULT_LOCATION): Promise<StoreProfile[]> {
  try {
    const { data, error } = await supabase.from("stores").select("*");
    if (error || !data) return [];

    return data.map((s: any) => {
      const rawLat = s.lat ?? s.latitude;
      const rawLng = s.lng ?? s.longitude;
      const lat = rawLat !== undefined && rawLat !== null ? parseFloat(rawLat) : NaN;
      const lng = rawLng !== undefined && rawLng !== null ? parseFloat(rawLng) : NaN;
      const hasValidCoords = !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);

      const dist = hasValidCoords && userCoords
        ? calculateDistanceInMeters(userCoords, {
            latitude: lat,
            longitude: lng
          })
        : undefined;

      return {
        id: s.id,
        name: s.name || "Store",
        category: s.category || "Retail",
        address: s.address || "Kerala, India",
        phone: s.phone || "",
        operatingHours: s.operating_hours || "8:00 AM - 10:00 PM",
        radarRadiusMeters: s.radar_radius_meters || 2000,
        lat: isNaN(lat) ? 10.0159 : lat,
        lng: isNaN(lng) ? 76.3419 : lng,
        priceFairnessScore: parseFloat(s.price_fairness_score || "4.8"),
        verifiedBillsCount: s.verified_bills_count || 0,
        description: s.description || "",
        imageUrl: s.image_url || DEFAULT_IMG,
        logoUrl: s.logo_url || DEFAULT_IMG,
        distanceInMeters: dist
      };
    });
  } catch (err) {
    console.warn("[Supabase] fetchStores error:", err);
    return [];
  }
}

/**
 * Realtime subscription to offers and stores
 */
export function subscribeToRealtimeDeals(
  onUpdate: () => void,
  onNewOffer?: (offer: any) => void
) {
  try {
    const channel = supabase
      .channel(`rn_deals_sync_${Date.now()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "offers" }, (payload) => {
        onUpdate();
        if (onNewOffer && payload.new) {
          onNewOffer(payload.new);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "offers" }, () => {
        onUpdate();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "offers" }, () => {
        onUpdate();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "stores" }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("[Supabase] Realtime subscribe error:", err);
    return () => {};
  }
}

/**
 * Claim voucher for user
 */
export async function claimOfferVoucher(
  offer: OfferItem,
  userName: string = "Shopper",
  userPhone: string = "9876543210"
): Promise<VoucherDetails> {
  const code = `SS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const voucher: VoucherDetails = {
    id: `v_${Date.now()}`,
    code,
    offerId: offer.id,
    storeName: offer.storeName,
    discountTag: offer.discountTag,
    originalPrice: offer.originalPrice,
    offerPrice: offer.offerPrice,
    customerName: userName,
    customerPhone: userPhone,
    claimedAt: new Date().toISOString(),
    expiresAt: offer.endAt || new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    isRedeemed: false
  };

  try {
    // Persist in AsyncStorage
    const existingRaw = await AsyncStorage.getItem("smartshopper_claimed_vouchers");
    const existing: VoucherDetails[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [voucher, ...existing];
    await AsyncStorage.setItem("smartshopper_claimed_vouchers", JSON.stringify(updated));

    // Try saving to Supabase vouchers table if exists
    await supabase.from("vouchers").insert([
      {
        code: voucher.code,
        offer_id: voucher.offerId,
        store_name: voucher.storeName,
        customer_name: voucher.customerName,
        customer_phone: voucher.customerPhone,
        is_redeemed: false
      }
    ]);
  } catch (err) {
    console.warn("[Voucher] Claim error:", err);
  }

  return voucher;
}

/**
 * Get saved claimed vouchers
 */
export async function getClaimedVouchers(): Promise<VoucherDetails[]> {
  try {
    const raw = await AsyncStorage.getItem("smartshopper_claimed_vouchers");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Fetch digital bills
 */
export async function fetchUserBills(customerCode?: string): Promise<Bill[]> {
  try {
    let query = supabase.from("bills").select("*, items:bill_items(*)").order("created_at", { ascending: false });
    if (customerCode) {
      query = query.or(`customer_id.eq.${customerCode},customer_phone.eq.${customerCode}`);
    }
    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((b: any) => ({
      id: b.id,
      billNumber: b.bill_number,
      storeId: b.store_id,
      storeName: b.store_name || "SmartShopper Store",
      customerName: b.customer_name,
      customerPhone: b.customer_phone,
      subtotal: parseFloat(b.subtotal || 0),
      discountAmount: parseFloat(b.discount_amount || 0),
      taxAmount: parseFloat(b.tax_amount || 0),
      totalAmount: parseFloat(b.total_amount || 0),
      createdAt: b.created_at,
      status: b.status,
      items: b.items?.map((it: any) => ({
        id: it.id,
        productName: it.product_name,
        quantity: it.quantity,
        unitPrice: parseFloat(it.unit_price || 0),
        lineTotal: parseFloat(it.line_total || 0)
      })) || []
    }));
  } catch {
    return [];
  }
}

// ====================================================
// AUTHENTICATION SERVICES (PWA PARITY)
// ====================================================

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  role?: string;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
  role?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  emailConfirmationRequired?: boolean;
  emailNotConfirmed?: boolean;
  user?: UserSession;
}

/**
 * Checks if a username is available in Supabase app_users table
 */
export async function checkUsernameAvailability(
  username: string,
  currentUserId?: string
): Promise<{ available: boolean; reason?: string }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { available: false, reason: "Username must be at least 3 characters long." };
  }
  try {
    let query = supabase
      .from("app_users")
      .select("id")
      .ilike("username", cleanUsername);

    if (currentUserId) {
      query = query.neq("id", currentUserId);
    }

    const { data } = await query.maybeSingle();

    if (data) {
      return { available: false, reason: "Username is already taken. Please choose another." };
    }
  } catch (err) {
    console.warn("[Supabase] checkUsernameAvailability warning:", err);
  }
  return { available: true };
}

/**
 * Registers a new user with Supabase Auth + metadata
 */
export async function registerUserInDatabase(payload: RegisterPayload): Promise<AuthResult> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanUsername = payload.username.trim();
  const role = payload.role || "consumer";

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: payload.password,
      options: {
        emailRedirectTo: "https://ssc.jrina.online/auth/callback",
        data: {
          username: cleanUsername,
          full_name: payload.fullName.trim(),
          phone: payload.phone.trim(),
          role
        }
      }
    });

    if (error) {
      return { success: false, message: error.message };
    }

    const authUser = data.user;
    if (!authUser) {
      return { success: false, message: "Registration failed to return user." };
    }

    const isConfirmed = Boolean(authUser.email_confirmed_at || data.session);
    if (!isConfirmed) {
      return {
        success: true,
        emailConfirmationRequired: true,
        message: `Verification email sent to ${cleanEmail}. Please check your inbox to confirm your account.`
      };
    }

    // Try fetching customer_id created by DB trigger
    let customerId: string | undefined;
    try {
      const { data: userRow } = await supabase
        .from("app_users")
        .select("customer_id")
        .eq("id", authUser.id)
        .maybeSingle();
      customerId = userRow?.customer_id;
    } catch {}

    const initials = (payload.fullName || "SS")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const session: UserSession = {
      id: authUser.id,
      customerId: customerId || `SSC-${authUser.id.slice(0, 5).toUpperCase()}`,
      username: cleanUsername,
      email: cleanEmail,
      name: payload.fullName.trim(),
      phone: payload.phone.trim(),
      isVerified: true,
      avatarInitials: initials,
      role
    };

    await AsyncStorage.setItem("smartshopper_active_user", JSON.stringify(session));

    return { success: true, emailConfirmationRequired: false, user: session };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to register account." };
  }
}

/**
 * Logs in user using email or username + password
 */
export async function loginUserInDatabase(payload: LoginPayload): Promise<AuthResult> {
  const cleanInput = payload.emailOrUsername.trim();
  let email = cleanInput;

  try {
    // If input doesn't contain '@', look up email from app_users table
    if (!cleanInput.includes("@")) {
      const { data: userRow } = await supabase
        .from("app_users")
        .select("id, username")
        .ilike("username", cleanInput)
        .maybeSingle();

      if (!userRow) {
        return { success: false, message: "No account found matching this username." };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: payload.password
    });

    if (error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes("email not confirmed") || errorMsg.includes("not verified")) {
        return {
          success: false,
          emailNotConfirmed: true,
          message: "Please verify your email address before signing in. Check your inbox for the confirmation link."
        };
      }
      return { success: false, message: error.message };
    }

    const authUser = data.user;
    if (!authUser) {
      return { success: false, message: "Login failed: no user session returned." };
    }

    if (authUser.email && !authUser.email_confirmed_at && authUser.confirmed_at === null) {
      return {
        success: false,
        emailNotConfirmed: true,
        message: "Please verify your email address before signing in. Check your inbox for the confirmation link."
      };
    }

    // Fetch profile and customer_id from app_users
    let customerId: string | undefined;
    let dbFullName = authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Smart Consumer";
    let dbPhone = authUser.user_metadata?.phone || "";
    let dbUsername = authUser.user_metadata?.username || authUser.email?.split("@")[0] || "consumer";
    let dbRole = authUser.user_metadata?.role || "consumer";
    let dbAddress: DeliveryAddress | undefined = authUser.user_metadata?.delivery_address;

    try {
      const { data: appUserData } = await supabase
        .from("app_users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (appUserData) {
        customerId = appUserData.customer_id;
        dbFullName = appUserData.full_name || dbFullName;
        dbPhone = appUserData.phone || dbPhone;
        dbUsername = appUserData.username || dbUsername;
        dbRole = appUserData.role || dbRole;
        if (appUserData.address && typeof appUserData.address === "object") {
          dbAddress = appUserData.address;
        }
      }
    } catch (err) {
      console.warn("[Supabase] Profile lookup error:", err);
    }

    const initials = dbFullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const session: UserSession = {
      id: authUser.id,
      customerId: customerId || `SSC-${authUser.id.slice(0, 5).toUpperCase()}`,
      username: dbUsername,
      email: authUser.email,
      name: dbFullName,
      phone: dbPhone,
      isVerified: true,
      avatarInitials: initials,
      role: dbRole,
      address: dbAddress
    };

    await AsyncStorage.setItem("smartshopper_active_user", JSON.stringify(session));

    return { success: true, user: session };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to sign in." };
  }
}

/**
 * Resends email verification link
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, message: "Please provide a valid email address." };
  }

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: cleanEmail,
      options: {
        emailRedirectTo: "https://ssc.jrina.online/auth/callback"
      }
    });

    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        return { success: false, message: "Too many requests. Please wait a minute before retrying." };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: `Verification email resent to ${cleanEmail}.` };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to resend verification email." };
  }
}

/**
 * Signs out current user and clears session storage
 */
export async function logoutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {}
  try {
    await AsyncStorage.removeItem("smartshopper_active_user");
  } catch {}
}

/**
 * Updates editable profile fields (fullName, username) for the authenticated consumer.
 * Note: Mobile number and Email are locked per business requirements.
 */
export async function updateUserProfile(
  userId: string,
  updates: { fullName: string; username?: string }
): Promise<{ success: boolean; user?: UserSession; message?: string }> {
  try {
    const cleanName = updates.fullName.trim();
    if (!cleanName) {
      return { success: false, message: "Full name cannot be empty." };
    }

    let cleanUsername = updates.username?.trim();
    if (cleanUsername) {
      const avail = await checkUsernameAvailability(cleanUsername, userId);
      if (!avail.available) {
        return { success: false, message: avail.reason || "Username is already taken." };
      }
    }

    // 1. Update app_users table
    const updatePayload: Record<string, any> = {
      full_name: cleanName
    };
    if (cleanUsername) {
      updatePayload.username = cleanUsername;
    }

    const { error: dbError } = await supabase
      .from("app_users")
      .update(updatePayload)
      .eq("id", userId);

    if (dbError) {
      console.warn("[Supabase] updateUserProfile app_users warning:", dbError);
    }

    // 2. Update Supabase Auth user metadata
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          ...(cleanUsername ? { username: cleanUsername } : {})
        }
      });
    } catch (authErr) {
      console.warn("[Supabase] updateUserProfile auth metadata warning:", authErr);
    }

    // 3. Update cached session in AsyncStorage
    const raw = await AsyncStorage.getItem("smartshopper_active_user");
    let prevSession: Partial<UserSession> = {};
    if (raw) {
      try {
        prevSession = JSON.parse(raw);
      } catch {}
    }

    const initials = cleanName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const updatedSession: UserSession = {
      id: userId,
      customerId: prevSession.customerId || `SSC-${userId.slice(0, 5).toUpperCase()}`,
      username: cleanUsername || prevSession.username || "consumer",
      email: prevSession.email || "",
      name: cleanName,
      phone: prevSession.phone || "",
      isVerified: prevSession.isVerified ?? true,
      avatarInitials: initials,
      role: prevSession.role || "consumer"
    };

    await AsyncStorage.setItem("smartshopper_active_user", JSON.stringify(updatedSession));

    return { success: true, user: updatedSession };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to update profile." };
  }
}

/**
 * Saves or deletes user's delivery address in Supabase (auth.user_metadata & app_users)
 * and syncs with AsyncStorage.
 */
export async function saveUserDeliveryAddress(
  userId: string,
  address: DeliveryAddress | null
): Promise<{ success: boolean; user?: UserSession; message?: string }> {
  try {
    // 1. Update Supabase Auth user_metadata (always accessible by authenticated user)
    try {
      await supabase.auth.updateUser({
        data: {
          delivery_address: address
        }
      });
    } catch (authErr) {
      console.warn("[Supabase] saveUserDeliveryAddress auth updateUser warning:", authErr);
    }

    // 2. Try updating app_users table if it exists and has permission
    try {
      await supabase
        .from("app_users")
        .update({
          address: address
        })
        .eq("id", userId);
    } catch (dbErr) {
      // Non-blocking fallback
    }

    // 3. Update active session in AsyncStorage
    const raw = await AsyncStorage.getItem("smartshopper_active_user");
    let session: UserSession | null = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          session = {
            ...parsed,
            address: address || undefined
          };
          await AsyncStorage.setItem("smartshopper_active_user", JSON.stringify(session));
        }
      } catch {}
    }

    // 4. Update @smartshopper_delivery_address in AsyncStorage
    if (address) {
      await AsyncStorage.setItem("@smartshopper_delivery_address", JSON.stringify(address));
    } else {
      await AsyncStorage.removeItem("@smartshopper_delivery_address");
    }

    return { success: true, user: session || undefined };
  } catch (err: any) {
    console.error("[Supabase] saveUserDeliveryAddress error:", err);
    return { success: false, message: err?.message || "Failed to save address to database." };
  }
}

// ----------------------------------------------------
// IN-APP CHAT WITH STORE OWNER (SUPABASE `chat_messages`)
// ----------------------------------------------------

export function normalizeStoreKey(storeIdentifier: string): string {
  if (!storeIdentifier) return "default_store";
  const clean = storeIdentifier.toLowerCase().trim().replace(/^store_/, "");
  if (clean.includes("jrina")) return "jrina";
  return clean.replace(/[^a-z0-9]/g, "") || "default_store";
}

/**
 * Fetch messages for a store and customer from Supabase
 */
export async function fetchStoreChatMessages(
  storeId: string,
  customerId?: string
): Promise<ChatMessage[]> {
  const clean = normalizeStoreKey(storeId);
  const canonical = storeId.startsWith("store_") ? storeId : `store_${storeId}`;

  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`store_id.eq.${storeId},store_id.eq.${canonical},store_id.eq.${clean},store_id.ilike.%${clean}%`)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[Supabase] fetchStoreChatMessages error:", error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Filter by customerId preserving full canonical UUID and safe legacy thread matching
    const filtered = customerId
      ? data.filter((row: any) => {
          if (!row.customer_id) return true;
          if (row.customer_id === customerId || row.sender_id === customerId) return true;
          // Safe backward compatibility for legacy threads already in DB:
          if (
            row.sender === "store" &&
            row.customer_id === customerId.slice(0, 8) &&
            row.thread_id === `thread_${customerId.slice(0, 8)}`
          ) {
            return true;
          }
          return false;
        })
      : data;

    return filtered.map((row: any) => ({
      id: String(row.id),
      sender: row.sender === "store" ? "store" : "customer",
      text: row.text || "",
      timestamp:
        row.timestamp ||
        new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: row.sender === "store" ? true : (row.unread === 0 || row.unread === false),
      sender_id: row.sender_id,
      customer_id: row.customer_id
    }));
  } catch (err) {
    console.warn("[Supabase] fetchStoreChatMessages exception:", err);
    return [];
  }
}

/**
 * Send a chat message from consumer to store owner
 */
export async function sendStoreChatMessage(
  storeId: string,
  storeName: string,
  user: UserSession,
  text: string
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  const cleanText = text.trim();
  if (!cleanText) {
    return { success: false, error: "Message cannot be empty." };
  }

  const canonicalStoreId = storeId.startsWith("store_")
    ? storeId
    : storeId.toLowerCase().includes("jrina")
    ? "store_jrina"
    : `store_${storeId}`;

  const targetThreadId = `thread_${user.id}`;
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const msgId = `msg_${Date.now()}`;
  const payload = {
    id: msgId,
    store_id: canonicalStoreId,
    store_name: storeName,
    thread_id: targetThreadId,
    customer_id: user.id,
    sender_id: user.id,
    customer_name: user.name || user.username || "Customer",
    customer_phone: user.phone || "+91 98471 00000",
    sender: "customer",
    text: cleanText,
    timestamp: timeStr,
    unread: 1
  };

  try {
    const { error } = await supabase.from("chat_messages").insert([payload]);
    if (error) {
      console.warn("[Supabase] sendStoreChatMessage error:", error);
      return { success: false, error: error.message };
    }

    // Trigger server-side push notification to merchant (Edge Function or backend)
    supabase.functions
      .invoke("send-chat-push", {
        body: payload
      })
      .then((res) => {
        if (res.error) {
          console.log("[Supabase] send-chat-push edge function notice:", res.error.message);
        }
      })
      .catch((err) => {
        console.log("[Supabase] send-chat-push edge function non-blocking notice:", err?.message || err);
      });

    const createdMsg: ChatMessage = {
      id: msgId,
      sender: "customer",
      text: cleanText,
      timestamp: timeStr,
      read: false,
      sender_id: user.id,
      customer_id: user.id
    };

    return { success: true, message: createdMsg };
  } catch (err: any) {
    console.error("[Supabase] sendStoreChatMessage exception:", err);
    return { success: false, error: err?.message || "Failed to send message." };
  }
}

/**
 * Subscribe to realtime chat messages for a specific store
 */
export function subscribeToStoreChat(
  storeId: string,
  onNewMessage: (msg: ChatMessage) => void
) {
  const canonicalStoreId = storeId.startsWith("store_")
    ? storeId
    : storeId.toLowerCase().includes("jrina")
    ? "store_jrina"
    : `store_${storeId}`;

  try {
    const channel = supabase
      .channel(`chat_sync_${storeId}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages"
        },
        (payload) => {
          const row = payload.new;
          if (row && (row.store_id === storeId || row.store_id === canonicalStoreId)) {
            const msg: ChatMessage = {
              id: String(row.id),
              sender: row.sender === "store" ? "store" : "customer",
              text: row.text || "",
              timestamp:
                row.timestamp ||
                new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              read: row.sender === "store" ? true : (row.unread === 0 || row.unread === false),
              sender_id: row.sender_id,
              customer_id: row.customer_id
            };
            onNewMessage(msg);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("[Supabase] subscribeToStoreChat error:", err);
    return () => {};
  }
}

/**
 * Subscribe to ALL realtime chat messages directed to a specific customer
 * so they receive notifications even when the store modal is closed.
 */
export function subscribeToAllStoreChatMessages(
  userId: string,
  onIncomingMerchantMessage: (msg: {
    id: string;
    storeId: string;
    storeName: string;
    text: string;
    timestamp: string;
  }) => void,
  userMetadata?: { customerId?: string; phone?: string }
) {
  try {
    const channel = supabase
      .channel(`customer_global_chat_${userId}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages"
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          // Message must be from merchant/store (not from customer themselves)
          const isFromStore =
            row.sender === "store" ||
            row.sender === "merchant" ||
            (row.sender_id && row.sender_id !== userId);
          if (!isFromStore) return;

          // Match criteria preserving full UUID identity:
          const isExactCustomerMatch =
            row.customer_id === userId ||
            (Boolean(userMetadata?.customerId) && row.customer_id === userMetadata?.customerId);

          // Canonical thread match:
          const isCanonicalThreadMatch =
            row.sender === "store" && row.thread_id === `thread_${userId}`;

          // Safe legacy compatibility for existing DB messages where merchant replied to truncated thread:
          const isLegacyTruncatedMatch =
            row.sender === "store" &&
            row.customer_id === userId.slice(0, 8) &&
            row.thread_id === `thread_${userId.slice(0, 8)}`;

          const cleanPhone = (userMetadata?.phone || "").replace(/\D/g, "");
          const rowPhone = (row.customer_phone || "").replace(/\D/g, "");
          const isPhoneMatch = Boolean(cleanPhone && rowPhone && cleanPhone.slice(-10) === rowPhone.slice(-10));

          const isForThisUser =
            isExactCustomerMatch ||
            isCanonicalThreadMatch ||
            isLegacyTruncatedMatch ||
            isPhoneMatch;

          if (isForThisUser) {
            onIncomingMerchantMessage({
              id: String(row.id),
              storeId: row.store_id || "partner_store",
              storeName: row.store_name || "Merchant",
              text: row.text || "",
              timestamp:
                row.timestamp ||
                new Date(row.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("[Supabase] subscribeToAllStoreChatMessages error:", err);
    return () => {};
  }
}

const STORE_CATALOG_FALLBACKS: Record<string, Omit<CatalogItem, "id" | "storeId" | "storeName" | "distanceInMeters">[]> = {};

/**
 * Fetch Product Catalog for a specific store from Supabase
 */
export async function fetchStoreCatalog(storeId: string): Promise<CatalogItem[]> {
  const clean = normalizeStoreKey(storeId);
  const canonical = storeId.startsWith("store_") ? storeId : `store_${storeId}`;

  try {
    const { data, error } = await supabase
      .from("catalog")
      .select("*")
      .or(`store_id.eq.${storeId},store_id.eq.${canonical},store_id.eq.${clean},store_id.ilike.%${clean}%`);

    let items: CatalogItem[] = [];

    if (!error && data && data.length > 0) {
      items = data.map((row: any) => ({
        id: String(row.id),
        name: row.name || "Product Item",
        category: row.category || "General",
        originalPrice: row.original_price || "",
        offerPrice: row.offer_price || "",
        imageUrl:
          row.image_url ||
          "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
        inStock: row.in_stock !== false,
        sku: row.sku,
        description: row.description,
        storeId: storeId
      }));
    }

    // If no items in Supabase DB for this store, check curated fallbacks
    if (items.length === 0) {
      const fallbackList =
        STORE_CATALOG_FALLBACKS[storeId] ||
        STORE_CATALOG_FALLBACKS[canonical] ||
        STORE_CATALOG_FALLBACKS[clean];

      if (fallbackList && fallbackList.length > 0) {
        items = fallbackList.map((f, idx) => ({
          id: `fallback-${clean}-${idx}`,
          name: f.name,
          category: f.category,
          originalPrice: f.originalPrice,
          offerPrice: f.offerPrice,
          imageUrl: f.imageUrl,
          inStock: f.inStock,
          sku: f.sku,
          description: f.description,
          storeId: storeId
        }));
      }
    }

    return items;
  } catch (err) {
    console.warn("[Supabase] fetchStoreCatalog exception:", err);
    return [];
  }
}

/**
 * Fetch all catalog products from partner stores within a 5 km radius
 */
export async function fetchNearbyProducts(
  userCoords: Coordinates,
  stores: StoreProfile[],
  radiusMeters: number = 5000
): Promise<CatalogItem[]> {
  try {
    // 1. Filter stores within 5 km
    const nearbyStores = stores.filter((s) => {
      const dist =
        s.distanceInMeters ??
        calculateDistanceInMeters(userCoords, { latitude: s.lat, longitude: s.lng });
      return dist <= radiusMeters;
    });

    if (nearbyStores.length === 0) {
      return [];
    }

    // 2. Query Supabase catalog table
    const { data: dbCatalog } = await supabase.from("catalog").select("*");

    const allProducts: CatalogItem[] = [];
    const storesMap = new Map<string, StoreProfile>();
    nearbyStores.forEach((s) => {
      storesMap.set(s.id, s);
      storesMap.set(normalizeStoreKey(s.id), s);
      if (s.name) storesMap.set(s.name.toLowerCase().trim(), s);
    });

    const storesWithDbProducts = new Set<string>();

    if (dbCatalog && Array.isArray(dbCatalog)) {
      dbCatalog.forEach((row: any) => {
        const storeKey = row.store_id || "";
        const clean = normalizeStoreKey(storeKey);
        const matchedStore =
          storesMap.get(storeKey) ||
          storesMap.get(clean) ||
          storesMap.get(`store_${clean}`);

        if (matchedStore) {
          storesWithDbProducts.add(matchedStore.id);
          storesWithDbProducts.add(clean);
          allProducts.push({
            id: String(row.id),
            name: row.name || "Product Item",
            category: row.category || matchedStore.category || "General",
            originalPrice: row.original_price || "",
            offerPrice: row.offer_price || "",
            imageUrl:
              row.image_url ||
              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
            inStock: row.in_stock !== false,
            sku: row.sku,
            description: row.description,
            storeId: matchedStore.id,
            storeName: matchedStore.name,
            distanceInMeters: matchedStore.distanceInMeters
          });
        }
      });
    }

    // 3. For any nearby store without DB products, add curated inventory
    nearbyStores.forEach((s) => {
      const clean = normalizeStoreKey(s.id);
      if (!storesWithDbProducts.has(s.id) && !storesWithDbProducts.has(clean)) {
        const fallbackList =
          STORE_CATALOG_FALLBACKS[s.id] ||
          STORE_CATALOG_FALLBACKS[`store_${clean}`] ||
          STORE_CATALOG_FALLBACKS[clean];

        if (fallbackList && fallbackList.length > 0) {
          fallbackList.forEach((f, idx) => {
            allProducts.push({
              id: `near-${clean}-${idx}`,
              name: f.name,
              category: f.category || s.category,
              originalPrice: f.originalPrice,
              offerPrice: f.offerPrice,
              imageUrl: f.imageUrl,
              inStock: f.inStock,
              sku: f.sku,
              description: f.description,
              storeId: s.id,
              storeName: s.name,
              distanceInMeters: s.distanceInMeters
            });
          });
        }
      }
    });

    // Sort products: closest store first
    return allProducts.sort((a, b) => (a.distanceInMeters || 0) - (b.distanceInMeters || 0));
  } catch (err) {
    console.warn("[Supabase] fetchNearbyProducts error:", err);
    return [];
  }
}



