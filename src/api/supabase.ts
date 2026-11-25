import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OfferItem, StoreProfile, VoucherDetails, Coordinates, Bill, UserSession, ChatMessage, CatalogItem, DeliveryAddress, CustomerOrder, CustomerOrderStatus, SscBanner } from "../types";
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
export async function fetchLiveOffers(
  userCoords: Coordinates = DEFAULT_LOCATION,
  preloadedStores?: StoreProfile[]
): Promise<OfferItem[]> {
  try {
    const { data: offersData, error: offersError } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (offersError) {
      console.warn("[Supabase] offers fetch error:", offersError);
      return [];
    }

    const storesMap = new Map<string, any>();
    if (preloadedStores && Array.isArray(preloadedStores) && preloadedStores.length > 0) {
      preloadedStores.forEach((s) => {
        if (s.id) storesMap.set(s.id, s);
        if (s.name) storesMap.set(s.name.toLowerCase().trim(), s);
      });
    } else {
      const { data: storesData } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });
      if (storesData && Array.isArray(storesData)) {
        storesData.forEach((s) => {
          if (s.id) storesMap.set(s.id, s);
          if (s.name) storesMap.set(s.name.toLowerCase().trim(), s);
        });
      }
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

      // Resolve store cover image from StoreProfile (camelCase) or raw DB row (snake_case)
      const storeCoverImg = store?.coverImageUrl || store?.imageUrl || store?.image_url;
      const storeLogoImg = store?.logoUrl || store?.logo_url;
      const pctNum = o.offer_percentage != null ? parseFloat(o.offer_percentage) : undefined;
      const isStoreDeal = o.deal_target_type === "STORE" || !o.deal_target_type;
      const displayDiscount = o.discount_tag || (pctNum ? `${pctNum}% OFF` : "EXCLUSIVE DEAL");

      // Authoritative category resolution:
      // The merchant's verified store category is the primary authority for merchant deals.
      const authoritativeCategory = store?.category || o.category || "Retail Store";

      items.push({
        id: o.id,
        storeId: o.store_id || store?.id,
        storeName: o.store_name || store?.name || "SmartShopper Partner Store",
        title: o.title || o.discount_tag || "Special Offer",
        category: authoritativeCategory,
        discountTag: displayDiscount,
        originalPrice: isStoreDeal ? "" : (o.original_price || "₹0"),
        offerPrice: isStoreDeal ? "" : (o.offer_price || "₹0"),
        distanceInMeters: distance,
        expiresAt: o.expires_at_label || `${o.expires_in_minutes || 60} mins left`,
        expiresInMinutes: o.expires_in_minutes || 60,
        verifiedBillReviewsCount: store?.verified_bills_count || 0,
        priceFairnessScore: parseFloat(store?.price_fairness_score || "5.0"),
        imageUrl: o.image_url || storeCoverImg || DEFAULT_IMG,
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
        storeCoverImageUrl: storeCoverImg || undefined,
        storeImageUrl: storeCoverImg || storeLogoImg || undefined,
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

export interface FetchStoresResult {
  stores: StoreProfile[];
  totalCount: number;
  hasMore: boolean;
  error: string | null;
}

export interface FetchStoresOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Fetches registered stores with exact counts, explicit ordering, and pagination support.
 */
export async function fetchStoresWithMeta(
  userCoords: Coordinates = DEFAULT_LOCATION,
  options?: FetchStoresOptions
): Promise<FetchStoresResult> {
  try {
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.max(1, options?.pageSize ?? 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("stores")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.warn("[Supabase] fetchStoresWithMeta error:", error.message);
      return {
        stores: [],
        totalCount: 0,
        hasMore: false,
        error: error.message
      };
    }

    if (!data) {
      return { stores: [], totalCount: 0, hasMore: false, error: null };
    }

    const stores: StoreProfile[] = data.map((s: any) => {
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
        coverImageUrl: s.image_url || undefined,
        logoUrl: s.logo_url || undefined,
        distanceInMeters: dist
      };
    });

    const totalCount = typeof count === "number" ? count : stores.length;
    const hasMore = to < (totalCount - 1);

    return {
      stores,
      totalCount,
      hasMore,
      error: null
    };
  } catch (err: any) {
    console.warn("[Supabase] fetchStoresWithMeta exception:", err);
    return {
      stores: [],
      totalCount: 0,
      hasMore: false,
      error: err?.message || "Failed to fetch stores"
    };
  }
}

/**
 * Fetches all registered stores with distances (backwards compatible wrapper)
 */
export async function fetchStores(userCoords: Coordinates = DEFAULT_LOCATION): Promise<StoreProfile[]> {
  const res = await fetchStoresWithMeta(userCoords, { page: 1, pageSize: 200 });
  return res.stores;
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
    if (!customerCode || !customerCode.trim()) {
      return [];
    }
    const cleanCode = customerCode.trim();
    const query = supabase
      .from("bills")
      .select("*, items:bill_items(*)")
      .or(`customer_id.eq.${cleanCode},customer_phone.eq.${cleanCode}`)
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) {
      if (error.code !== "42501") {
        console.warn("[SSC Supabase] fetchUserBills query error:", error.message);
      }
      return [];
    }
    if (!data || !Array.isArray(data)) return [];

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
  } catch (err: any) {
    console.warn("[SSC Supabase] fetchUserBills exception:", err?.message || err);
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
  referralCode?: string;
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
  notRegisteredForApp?: boolean;
  user?: UserSession;
}

export interface ReferralValidationResult {
  valid: boolean;
  normalizedCode?: string;
  referrerType?: "customer" | "store" | "campaign";
  referrerId?: string;
  referrerName?: string;
  reason?: string;
}

/**
 * Official promotional / marketing campaign referral codes
 */
export const KNOWN_CAMPAIGN_REFERRAL_CODES: Record<string, { name: string; bonus: string }> = {
  SMARTSHOPPER: { name: "SmartShopper Official Welcome Pass", bonus: "Free 1-Month Premium Deals" },
  SSC2026: { name: "SSC 2026 Early Adopter Pass", bonus: "Exclusive VIP Store Offers" },
  WELCOME: { name: "New Shopper Welcome Pass", bonus: "Welcome Cashback Voucher" },
  KERALA50: { name: "Kerala Hyperlocal Shopper Pass", bonus: "Flat ₹50 Partner Discount" },
  OFFER50: { name: "Festive Deals Pass", bonus: "50% Off First Coupon" },
  DEALS100: { name: "Smart Saver Pass", bonus: "₹100 Store Voucher" },
  JRINA2026: { name: "JRINA Partner Enterprise Pass", bonus: "Direct Partner Deals" }
};

/**
 * Validates consumer referral codes against authoritative backend database logic,
 * SSA referral campaigns, volunteer codes, registered customer passes, and partner stores.
 */
export async function validateReferralCode(
  rawCode?: string
): Promise<ReferralValidationResult> {
  const clean = (rawCode || "").trim().toUpperCase();
  if (!clean) {
    // Optional field: empty is valid
    return { valid: true };
  }

  // 1. Authoritative Backend RPC Validation
  try {
    const { data, error } = await supabase.rpc("validate_referral_code", {
      p_code: clean,
      p_role: "consumer"
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      const record = data[0];
      if (record.is_valid) {
        return {
          valid: true,
          normalizedCode: record.normalized_code || clean,
          referrerType: (record.referrer_type as any) || "campaign",
          referrerId: record.referrer_id || clean,
          referrerName: record.referrer_name || clean,
          reason: record.message
        };
      } else {
        return {
          valid: false,
          normalizedCode: clean,
          reason: record.message || "Invalid referral code. Please enter a valid partner code, shopper pass, or leave it empty."
        };
      }
    }
  } catch (err) {
    console.warn("[Referral] Backend validation RPC error:", err);
  }

  // 2. Client-side fallback for official promotional campaign codes if offline
  if (KNOWN_CAMPAIGN_REFERRAL_CODES[clean]) {
    const campaign = KNOWN_CAMPAIGN_REFERRAL_CODES[clean];
    return {
      valid: true,
      normalizedCode: clean,
      referrerType: "campaign",
      referrerId: clean,
      referrerName: campaign.name
    };
  }

  // 2b. Client-side fallback for JRINA Campaign Referral Codes (Format: CMP-XXXXXXXXX)
  if (/^CMP-[A-Z0-9]{9}$/.test(clean)) {
    return {
      valid: true,
      normalizedCode: clean,
      referrerType: "campaign",
      referrerId: clean,
      referrerName: "JRINA Campaign Pass"
    };
  }

  // 3. Fallback: Invalid referral code - prevent silent acceptance
  return {
    valid: false,
    reason: "Invalid referral code. Please enter a valid partner code, shopper pass (e.g. SSC-XXXXX), or leave it empty."
  };
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
    // 1. Authoritative Backend RPC Check (Security Definer, bypasses RLS for anon)
    const { data: rpcData, error: rpcErr } = await supabase.rpc("rpc_check_username_available", {
      p_username: cleanUsername,
      p_current_user_id: currentUserId || null
    });

    if (!rpcErr && rpcData && typeof rpcData === "object" && typeof rpcData.available === "boolean") {
      return {
        available: rpcData.available,
        reason: rpcData.reason
      };
    }

    // 2. Direct table check fallback
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
 * Registers a new user with Supabase Auth + metadata, securely storing referral attribution
 */
export async function registerUserInDatabase(payload: RegisterPayload): Promise<AuthResult> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanUsername = payload.username.trim();
  const role = payload.role || "consumer";

  // Validate referral code if provided
  let validatedReferral: ReferralValidationResult = { valid: true };
  if (payload.referralCode && payload.referralCode.trim()) {
    validatedReferral = await validateReferralCode(payload.referralCode);
    if (!validatedReferral.valid) {
      return {
        success: false,
        message: validatedReferral.reason || "Invalid referral code."
      };
    }
  }

  try {
    const authMetadata: Record<string, any> = {
      app_code: "SSC",
      username: cleanUsername,
      full_name: payload.fullName.trim(),
      phone: payload.phone.trim(),
      role: "consumer"
    };

    // Store referral attribution in auth metadata linked to user account
    if (validatedReferral.normalizedCode) {
      authMetadata.referral_code = validatedReferral.normalizedCode;
      authMetadata.referred_by = validatedReferral.referrerId || validatedReferral.normalizedCode;
      authMetadata.referrer_type = validatedReferral.referrerType;
      authMetadata.referrer_name = validatedReferral.referrerName;
      authMetadata.referral_registered_at = new Date().toISOString();
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: payload.password,
      options: {
        emailRedirectTo: "https://ssc.jrina.online/auth/callback",
        data: authMetadata
      }
    });

    let authUser = data?.user;

    if (error) {
      const errLower = error.message.toLowerCase();
      // If user already exists in auth.users (e.g. independently registered in SSM Merchant or SSD Delivery)
      if (errLower.includes("already registered") || errLower.includes("user already")) {
        // Authenticate with the provided password to verify identity ownership
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: payload.password
        });
        if (signInErr || !signInData?.user) {
          return {
            success: false,
            message: "An account with this email already exists in SmartShopper. Incorrect password."
          };
        }
        authUser = signInData.user;
      } else {
        return { success: false, message: error.message };
      }
    }

    if (!authUser) {
      return { success: false, message: "Registration failed to return user." };
    }

    // Persist referral attribution in app_users table if accessible
    if (validatedReferral.normalizedCode) {
      try {
        await supabase
          .from("app_users")
          .update({
            referral_code: validatedReferral.normalizedCode,
            referred_by: validatedReferral.referrerId || validatedReferral.normalizedCode
          })
          .eq("id", authUser.id);
      } catch {}
    }

    const isConfirmed = Boolean(authUser.email_confirmed_at || data?.session);
    if (!isConfirmed && !data?.session) {
      return {
        success: true,
        emailConfirmationRequired: true,
        message: `Verification email sent to ${cleanEmail}. Please check your inbox to confirm your account.`
      };
    }

    // 1. Authoritative Application Account Registration (SSC Isolation)
    const { data: regRpc, error: regRpcErr } = await supabase.rpc("rpc_register_app_account", {
      p_app_code: "SSC",
      p_payload: {
        fullName: payload.fullName.trim(),
        username: cleanUsername,
        phone: payload.phone.trim(),
        email: cleanEmail,
        referralCode: validatedReferral.normalizedCode || null
      }
    });

    if (regRpcErr || (regRpc && !regRpc.success)) {
      console.warn("[SSC Registration RPC Warning]:", regRpcErr || regRpc);
      return {
        success: false,
        message: regRpc?.message || regRpcErr?.message || "Failed to register SSC Consumer account."
      };
    }

    // Retrieve authoritative profile from app_users or RPC metadata
    let customerId: string = regRpc?.metadata?.customer_id || "";
    try {
      const { data: userRow } = await supabase
        .from("app_users")
        .select("customer_id")
        .eq("id", authUser.id)
        .maybeSingle();
      if (userRow?.customer_id) {
        customerId = userRow.customer_id;
      }
    } catch {}

    if (!customerId) {
      customerId = `SS-CUS-${authUser.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    }

    // 2. Persist in app_user_accounts table (safely idempotent)
    try {
      await supabase.from("app_user_accounts").upsert({
        auth_user_id: authUser.id,
        app_code: "SSC",
        account_type: "CONSUMER",
        email: cleanEmail,
        mobile: payload.phone.trim(),
        status: "ACTIVE",
        metadata: {
          customer_id: customerId,
          full_name: payload.fullName.trim(),
          username: cleanUsername
        }
      }, { onConflict: "auth_user_id,app_code" });
    } catch {}

    // 3. Persist in app_users table with consumer role (safely idempotent)
    try {
      await supabase.from("app_users").upsert({
        id: authUser.id,
        username: cleanUsername,
        display_username: cleanUsername,
        customer_id: customerId,
        full_name: payload.fullName.trim(),
        phone: payload.phone.trim(),
        role: "consumer"
      }, { onConflict: "id" });
    } catch {}

    const initials = (payload.fullName || "SS")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const session: UserSession = {
      id: authUser.id,
      customerId,
      username: cleanUsername,
      email: cleanEmail,
      name: payload.fullName.trim(),
      phone: payload.phone.trim(),
      isVerified: true,
      avatarInitials: initials,
      role: "consumer",
      referralCode: validatedReferral.normalizedCode,
      referredBy: validatedReferral.referrerId || validatedReferral.normalizedCode
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
    // If input doesn't contain '@', resolve registered email address via secure RPC
    if (!cleanInput.includes("@")) {
      const { data: resolvedEmail, error: rpcErr } = await supabase.rpc("rpc_get_email_by_username", {
        p_username: cleanInput
      });

      if (!rpcErr && resolvedEmail) {
        email = resolvedEmail;
      } else {
        return {
          success: false,
          message: "No account found matching this username. Please check your username or sign in with your email address."
        };
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

    // =========================================================================
    // AUTHORITATIVE APPLICATION ACCESS VALIDATION (SSC CONSUMER)
    // Registration in SSM (Merchant) or SSD (Delivery) NEVER grants SSC access!
    // Validated strictly against public.app_user_accounts
    // =========================================================================
    let isAuthorized = false;
    let customerId: string | undefined;
    let dbFullName = authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Smart Consumer";
    let dbPhone = authUser.user_metadata?.phone || "";
    let dbUsername = authUser.user_metadata?.username || authUser.email?.split("@")[0] || "consumer";
    let dbRole = "consumer";
    let dbAddress: DeliveryAddress | undefined = authUser.user_metadata?.delivery_address;
    let rejectionReason = "No consumer account found for this user. Please register for a SmartShopper Consumer account.";

    // 1. Authoritative Application Verification: rpc_verify_app_access (SSC Gate)
    try {
      const { data: accessRes, error: accessErr } = await supabase.rpc("rpc_verify_app_access", { p_app_code: "SSC" });
      if (!accessErr && accessRes?.success && accessRes.consumer) {
        isAuthorized = true;
        customerId = accessRes.consumer.customer_id;
        dbFullName = accessRes.consumer.full_name || dbFullName;
        dbPhone = accessRes.consumer.phone || dbPhone;
        dbUsername = accessRes.consumer.username || dbUsername;
        if (accessRes.consumer.address) dbAddress = accessRes.consumer.address;
      } else if (accessRes?.message) {
        rejectionReason = accessRes.message;
      }
    } catch {}

    // 2. Authoritative backend RPC fallback: rpc_authenticate_ssc_consumer
    if (!isAuthorized) {
      try {
        const { data: authRpc, error: authRpcErr } = await supabase.rpc("rpc_authenticate_ssc_consumer");
        if (!authRpcErr && authRpc) {
          if (authRpc.success && authRpc.consumer) {
            isAuthorized = true;
            customerId = authRpc.consumer.customer_id;
            dbFullName = authRpc.consumer.full_name || dbFullName;
            dbPhone = authRpc.consumer.phone || dbPhone;
            dbUsername = authRpc.consumer.username || dbUsername;
            if (authRpc.consumer.address) dbAddress = authRpc.consumer.address;
          } else if (authRpc.error) {
            rejectionReason = authRpc.error;
          }
        }
      } catch {}
    }

    // 3. Fallback table inspection: ssc_users / app_user_accounts
    if (!isAuthorized) {
      try {
        const { data: sscRow } = await supabase
          .from("ssc_users")
          .select("*")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();
        if (sscRow && sscRow.status === "ACTIVE") {
          isAuthorized = true;
        }
      } catch {}
    }

    // STRICT ACCESS GATE: If user is NOT a registered Consumer in app_user_accounts, DENY and SIGN OUT
    if (!isAuthorized) {
      await supabase.auth.signOut().catch(() => {});
      await AsyncStorage.removeItem("smartshopper_active_user");
      return {
        success: false,
        notRegisteredForApp: true,
        message: rejectionReason
      };
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
  address: DeliveryAddress | null,
  userCoords?: Coordinates
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
    } catch {
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
      .or(`store_id.eq.${storeId},store_id.eq.${canonical},store_id.eq.${clean},store_id.ilike.%${clean}%`)
      .or("is_deleted.is.null,is_deleted.eq.false");

    let items: CatalogItem[] = [];

    if (!error && data && data.length > 0) {
      items = data
        .filter((row: any) => row.is_deleted !== true && !row.deleted_at)
        .map((row: any) => ({
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
          storeId: storeId,
          isDeleted: Boolean(row.is_deleted),
          deletedAt: row.deleted_at || undefined
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

    // 2. Query Supabase catalog table, excluding deleted items
    const { data: dbCatalog } = await supabase
      .from("catalog")
      .select("*")
      .or("is_deleted.is.null,is_deleted.eq.false");

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
        // Exclude deleted merchant products
        if (row.is_deleted === true || row.deleted_at) {
          return;
        }

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
            distanceInMeters: matchedStore.distanceInMeters,
            isDeleted: Boolean(row.is_deleted),
            deletedAt: row.deleted_at || undefined,
            productType: row.product_type || undefined,
            isDigital: typeof row.is_digital === "boolean" ? row.is_digital : undefined,
            allIndiaDelivery:
              typeof row.all_india_delivery === "boolean"
                ? row.all_india_delivery
                : typeof row.is_all_india_delivery === "boolean"
                ? row.is_all_india_delivery
                : undefined,
            deliveryScope: row.delivery_scope || undefined
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

// ==========================================
// 10. CUSTOMER ORDERS & CHECKOUT PERSISTENCE
// ==========================================

export async function saveCustomerOrderToDb(
  order: CustomerOrder
): Promise<{
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  itemSubtotal?: number;
  deliveryCharge?: number;
  platformFee?: number;
  status?: string;
  otp?: string;
  items?: any[];
  error?: string;
}> {
  try {
    const idempotencyKey = order.idempotencyKey || `idemp_${order.id || Date.now()}`;
    const { data, error } = await supabase.rpc("place_customer_order", {
      p_order: {
        id: order.id,
        orderNumber: order.orderNumber,
        storeId: order.storeId,
        storeName: order.storeName,
        storeAddress: order.storeAddress,
        storePhone: order.storePhone,
        customerId: order.customerId,
        customerName: order.deliveryAddress?.fullName || "Customer",
        customerPhone: order.deliveryAddress?.phone || "",
        deliveryAddress: order.deliveryAddress,
        deliveryOption: order.deliveryOption || (order.deliveryCharge === 0 ? "pickup" : "delivery"),
        itemSubtotal: order.itemSubtotal,
        deliveryCharge: order.deliveryCharge,
        platformFee: order.platformFee,
        totalCodAmount: order.totalCodAmount,
        paymentMethod: order.paymentMethod || "cod",
        otp: order.otp,
        roadDistanceKm: order.roadDistanceKm || 0,
        idempotencyKey
      },
      p_items: (order.items || []).map((it, idx) => ({
        id: it.id && it.id.startsWith("item_") ? it.id : `item_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 9)}`,
        productId: it.productId || it.id,
        product_id: it.productId || it.id,
        name: it.name,
        category: it.category,
        sku: it.sku,
        imageUrl: it.imageUrl,
        offerPrice: it.offerPrice,
        unitPrice: parseFloat(String(it.offerPrice || "0").replace(/[^\d.]/g, "")) || 0,
        quantity: it.quantity || 1
      })),
      p_idempotency_key: idempotencyKey
    });

    if (!error && data && data.success) {
      return {
        success: true,
        orderId: data.order_id,
        orderNumber: data.order_number,
        totalAmount: data.total_amount,
        itemSubtotal: data.item_subtotal,
        deliveryCharge: data.delivery_charge,
        platformFee: data.platform_fee,
        status: data.status,
        otp: data.otp,
        items: data.items
      };
    }

    if (error) {
      console.warn("[SSC Supabase] place_customer_order rpc error:", error);
      return { success: false, error: error.message };
    }

    if (data && !data.success) {
      return { success: false, error: data.error || "Order creation rejected." };
    }

    return { success: false, error: "Order creation failed." };
  } catch (err: any) {
    console.warn("[SSC Supabase] saveCustomerOrderToDb exception:", err);
    return { success: false, error: err?.message || "Order persistence exception" };
  }
}

export async function fetchCustomerOrdersFromDb(
  customerPhone?: string,
  customerId?: string,
  orderIds?: string[]
): Promise<CustomerOrder[]> {
  try {
    // Only invoke RPC if caller has provided identity information or active auth session exists
    const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    if (!sessionData?.session?.user && !customerId && !customerPhone) {
      return [];
    }

    const { data: rpcData, error } = await supabase.rpc("fetch_customer_orders", {
      p_customer_phone: customerPhone || null,
      p_customer_id: customerId || null,
      p_order_ids: orderIds && orderIds.length > 0 ? orderIds : null
    });

    if (!error && rpcData?.success && Array.isArray(rpcData.orders)) {
      return rpcData.orders.map((o: any) => ({
        id: String(o.id),
        orderNumber: String(o.order_number),
        storeId: String(o.store_id),
        storeName: o.store_name || "Partner Store",
        storeAddress: o.store_address || "",
        storePhone: o.store_phone || "",
        items: (o.items || []).map((it: any) => ({
          id: String(it.id),
          productId: it.product_id,
          name: it.name || it.product_name || "Item",
          category: it.category,
          sku: it.sku,
          imageUrl: it.imageUrl || it.image_url || "",
          offerPrice: it.offerPrice || `₹${it.unit_price || 0}`,
          unitPrice: Number(it.unit_price || 0),
          quantity: it.quantity || 1,
          preparedQuantity: Number(it.prepared_quantity || 0),
          isReady: Boolean(it.is_ready),
          isCancelled: Boolean(it.is_cancelled),
          replacementStatus: it.replacement_status,
          replacementTitle: it.replacement_title,
          replacementPrice: it.replacement_price ? Number(it.replacement_price) : undefined,
          replacementReason: it.replacement_reason,
          isDeleted: false
        })),
        itemSubtotal: Number(o.item_subtotal || 0),
        roadDistanceKm: Number(o.road_distance_km || 0),
        deliveryCharge: Number(o.delivery_charge || 0),
        platformFee: Number(o.platform_fee || 0),
        totalCodAmount: Number(o.total_amount || 0),
        status: o.status as CustomerOrderStatus,
        paymentMethod: o.payment_method || "cod",
        paymentStatus: o.payment_status || "pending",
        deliveryAddress: o.delivery_address || {},
        otp: o.otp || "",
        otpVerified: Boolean(o.otp_verified),
        otpStatus: o.otp_status || "pending",
        createdAt: o.created_at || new Date().toISOString(),
        deliveredAt: o.delivered_at || undefined,
        cancelledAt: o.cancelled_at || undefined,
        cancellationReason: o.cancellation_reason || o.rejection_reason,
        rejectionReason: o.rejection_reason,
        deliveryPartner: o.delivery_partner || undefined,
        history: o.history || []
      }));
    }
  } catch (err) {
    console.warn("[SSC Supabase] fetchCustomerOrdersFromDb error:", err);
  }
  return [];
}

export async function respondToOrderReplacementInDb(
  orderId: string,
  itemId: string,
  action: "accept" | "reject",
  customerId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("respond_order_item_replacement", {
      p_order_id: orderId,
      p_item_id: itemId,
      p_action: action,
      p_customer_id: customerId || "customer"
    });

    if (!error && data?.success) {
      return { success: true };
    }
    return { success: false, error: error?.message || data?.error || "Failed to update replacement." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Replacement response exception" };
  }
}

export async function updateCustomerOrderStatusInDb(
  orderId: string,
  status: CustomerOrderStatus,
  reason?: string,
  storeId?: string,
  customerId?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("update_order_lifecycle_status", {
      p_order_id: orderId,
      p_new_status: status,
      p_actor_id: customerId || "customer",
      p_actor_type: "customer",
      p_reason: reason || null,
      p_store_id: storeId || null
    });

    if (!error && data?.success) {
      return true;
    }

    // Direct fallback — ensure canonical UPPERCASE status
    const canonicalStatus = status.toUpperCase() as CustomerOrderStatus;
    const { error: directErr } = await supabase
      .from("orders")
      .update({
        status: canonicalStatus,
        ...(canonicalStatus === "CANCELLED" ? { cancellation_reason: reason, cancelled_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    return !directErr;
  } catch (err) {
    console.warn("[SSC Supabase] updateCustomerOrderStatusInDb error:", err);
    return false;
  }
}

export function subscribeToCustomerOrderUpdates(
  customerIdOrOrderIds: string | string[],
  orderIdsOrOnUpdate: string[] | ((payload: any) => void),
  maybeOnUpdate?: (payload: any) => void
): () => void {
  let customerId: string | undefined;
  let orderIds: string[] = [];
  let onUpdate: (payload: any) => void;

  if (typeof customerIdOrOrderIds === "string") {
    customerId = customerIdOrOrderIds;
    if (Array.isArray(orderIdsOrOnUpdate)) {
      orderIds = orderIdsOrOnUpdate;
    }
    onUpdate = maybeOnUpdate || (() => {});
  } else {
    orderIds = Array.isArray(customerIdOrOrderIds) ? customerIdOrOrderIds : [];
    onUpdate = (orderIdsOrOnUpdate as (payload: any) => void) || (() => {});
  }

  // Reject broad wildcard subscriptions across the entire platform
  if (!customerId && (!orderIds || orderIds.length === 0)) {
    return () => {};
  }

  const channel = supabase
    .channel(`customer_orders_${customerId || "client"}_${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders"
      },
      (payload: any) => {
        const record = payload?.new || payload?.old;
        if (!record) return;

        // Customer isolation check on incoming realtime payload
        if (customerId && record.customer_id && record.customer_id !== customerId) {
          return;
        }

        const id = record.id;
        if (orderIds && orderIds.length > 0 && !orderIds.includes(id)) {
          return;
        }

        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

const SSC_CACHED_PROMOTIONAL_BANNERS_KEY = "@smartshopper_promotional_banners_cache";

export interface BannerLocationContext {
  latitude?: number | null;
  longitude?: number | null;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  pincode?: string | null;
}

/**
 * Retrieves cached promotional banners from local storage for instant 0ms offline rendering
 */
export async function getCachedActiveSscBanners(): Promise<SscBanner[]> {
  try {
    const raw = await AsyncStorage.getItem(SSC_CACHED_PROMOTIONAL_BANNERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = new Date();
    return parsed.filter((b: SscBanner) => {
      if (b.startDate && new Date(b.startDate) > now) return false;
      if (b.endDate && new Date(b.endDate) < now) return false;
      return b.isActive !== false;
    });
  } catch {
    return [];
  }
}

/**
 * Fetches active published promotional banners for SSC Consumer App with location targeting
 */
export async function fetchActiveSscBanners(locationContext?: BannerLocationContext): Promise<SscBanner[]> {
  try {
    const rpcParams: Record<string, any> = {
      p_lat: locationContext?.latitude ?? null,
      p_lng: locationContext?.longitude ?? null,
      p_state: locationContext?.state?.trim() || null,
      p_district: locationContext?.district?.trim() || null,
      p_city: locationContext?.city?.trim() || null,
      p_pincode: locationContext?.pincode?.trim() || null,
    };

    const { data, error } = await supabase.rpc("get_active_ssc_banners", rpcParams);
    if (!error && Array.isArray(data)) {
      const mapped: SscBanner[] = data.map((b: any) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || "",
        imageUrl: b.image_url,
        linkType: (b.link_type || b.redirect_type || "none") as SscBanner["linkType"],
        targetId: b.target_id || b.redirect_target || "",
        targetName: b.target_name || b.merchant_name || "",
        customUrl: b.custom_url || "",
        sourceType: b.source_type || "custom",
        sourceRequestId: b.source_request_id || undefined,
        merchantId: b.merchant_id || undefined,
        merchantName: b.merchant_name || undefined,
        redirectType: b.redirect_type || b.link_type || "none",
        redirectTarget: b.redirect_target || b.target_id || "",
        displayOrder: Number(b.display_order || 0),
        isActive: Boolean(b.is_active),
        startDate: b.start_date || b.start_at || null,
        endDate: b.end_date || b.end_at || null,
        clicksCount: Number(b.clicks_count || 0),
        impressionsCount: Number(b.impressions_count || 0)
      }));

      // Cache for offline resilience
      await AsyncStorage.setItem(SSC_CACHED_PROMOTIONAL_BANNERS_KEY, JSON.stringify(mapped)).catch(() => {});
      return mapped;
    }

    // Fallback: direct table query if RPC is temporarily unavailable
    const { data: tableData, error: tableError } = await supabase
      .from("ssc_banners")
      .select("*")
      .eq("status", "active")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (tableError) {
      console.warn("[Supabase] fetchActiveSscBanners fallback query error:", tableError);
      return getCachedActiveSscBanners();
    }

    const now = new Date();
    const mapped: SscBanner[] = (tableData || [])
      .filter((b: any) => {
        if (b.start_at && new Date(b.start_at) > now) return false;
        if (b.start_date && new Date(b.start_date) > now) return false;
        if (b.end_at && new Date(b.end_at) < now) return false;
        if (b.end_date && new Date(b.end_date) < now) return false;
        return true;
      })
      .map((b: any) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || "",
        imageUrl: b.image_url,
        linkType: (b.link_type || b.redirect_type || "none") as SscBanner["linkType"],
        targetId: b.target_id || b.redirect_target || "",
        targetName: b.target_name || b.merchant_name || "",
        customUrl: b.custom_url || "",
        sourceType: b.source_type || "custom",
        sourceRequestId: b.source_request_id || undefined,
        merchantId: b.merchant_id || undefined,
        merchantName: b.merchant_name || undefined,
        redirectType: b.redirect_type || b.link_type || "none",
        redirectTarget: b.redirect_target || b.target_id || "",
        displayOrder: Number(b.display_order || 0),
        isActive: Boolean(b.is_active),
        startDate: b.start_date || b.start_at || null,
        endDate: b.end_date || b.end_at || null,
        clicksCount: Number(b.clicks_count || 0),
        impressionsCount: Number(b.impressions_count || 0)
      }));

    await AsyncStorage.setItem(SSC_CACHED_PROMOTIONAL_BANNERS_KEY, JSON.stringify(mapped)).catch(() => {});
    return mapped;
  } catch (err) {
    console.warn("[Supabase] fetchActiveSscBanners exception:", err);
    return getCachedActiveSscBanners();
  }
}

/**
 * Records a click on a promotional banner
 */
export async function recordSscBannerClick(bannerId: string): Promise<void> {
  try {
    await supabase.rpc("record_ssc_banner_click", { p_banner_id: bannerId });
  } catch (err) {
    console.warn("[Supabase] recordSscBannerClick error:", err);
  }
}

/**
 * Records an impression on a promotional banner
 */
export async function recordSscBannerImpression(bannerId: string): Promise<void> {
  try {
    await supabase.rpc("record_ssc_banner_impression", { p_banner_id: bannerId });
  } catch (err) {
    console.warn("[Supabase] recordSscBannerImpression error:", err);
  }
}

/**
 * Real-time subscription to promotional banner updates (create, edit, delete, publish, reorder)
 */
export function subscribeToRealtimeBanners(onUpdate: () => void): () => void {
  const channel = supabase
    .channel("ssc_banners_consumer_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ssc_banners" },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}





