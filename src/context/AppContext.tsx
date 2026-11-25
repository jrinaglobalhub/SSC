import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SeasonalThemeConfig,
  SeasonalThemeId,
  SEASONAL_THEMES,
  resolveSeasonalTheme,
  getMsUntilNextKolkataMidnight
} from "../theme/seasonalTheme";
import {
  Coordinates,
  OfferItem,
  StoreProfile,
  VoucherDetails,
  UserSession,
  DealNotification,
  CatalogItem,
  CartItem,
  DeliveryAddress,
  CustomerOrder,
  CustomerOrderStatus,
  CustomerOrderProductSnapshot
} from "../types";
import {
  generateOrderOtp,
  verifyOtp,
  isCompletedOrderStatus,
  isCancelledOrderStatus,
  isUpcomingOrderStatus,
  isOrderCancellableByCustomer,
  isHomeDeliveryAvailable
} from "../utils/delivery";
import {
  DEFAULT_LOCATION,
  calculateDistanceInMeters,
  CONSUMER_NOTIFICATION_RADAR_METERS,
  isValidCoordinate,
  resolveEligibleConsumerLocation,
  ResolvedConsumerLocation,
  formatGeocodedLocationName,
  formatAddressDisplayLabel
} from "../utils/geo";
import { getRoadDistance, RoadDistanceResult } from "../services/valhallaRoutingService";
import {
  supabase,
  fetchLiveOffers,
  fetchStores,
  fetchStoresWithMeta,
  subscribeToRealtimeDeals,
  claimOfferVoucher,
  getClaimedVouchers,
  updateUserProfile as apiUpdateUserProfile,
  saveUserDeliveryAddress as apiSaveUserDeliveryAddress,
  fetchNearbyProducts,
  subscribeToAllStoreChatMessages,
  saveCustomerOrderToDb,
  fetchCustomerOrdersFromDb,
  updateCustomerOrderStatusInDb,
  subscribeToCustomerOrderUpdates,
  respondToOrderReplacementInDb
} from "../api/supabase";
import {
  sendNewOfferNotification,
  sendStoreMessageNotification,
  setupNotificationResponseListener,
  setupNotificationForegroundReceivedListener,
  getLastNotificationResponse,
  markOfferHandled,
  isOfferAlreadyHandled
} from "../services/notificationService";
import {
  registerDevicePushToken,
  deactivateDevicePushToken,
  syncLocationWithPushToken
} from "../services/pushTokenService";
import { networkService } from "../services/networkService";
import { navigate } from "../navigation/navigationRef";

interface AppContextType {
  location: Coordinates;
  locationName: string;
  isGPS: boolean;
  isInsideKerala: boolean;
  geofenceRadius: number; // in meters
  setGeofenceRadius: (radius: number) => void;
  setManualLocation: (coords: Coordinates, name: string) => void;
  resetToGPSLocation: () => Promise<void>;
  offers: OfferItem[];
  allOffers: OfferItem[];
  stores: StoreProfile[];
  storesTotalCount: number;
  storesError: string | null;
  isLocationPermissionDenied: boolean;
  nearbyProducts: CatalogItem[];
  vouchers: VoucherDetails[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  claimVoucher: (offer: OfferItem) => Promise<VoucherDetails>;
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  updateUserProfile: (updates: { fullName: string; username?: string }) => Promise<{ success: boolean; message?: string }>;
  deliveryAddress: DeliveryAddress | null;
  saveDeliveryAddress: (address: DeliveryAddress | null) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authPromptReason: string | undefined;
  openAuthModal: (reason?: string) => void;
  selectedStore: StoreProfile | null;
  setSelectedStore: (store: StoreProfile | null) => void;
  storeModalTab: "overview" | "hours" | "chat" | "catalog" | "reviews";
  setStoreModalTab: (tab: "overview" | "hours" | "chat" | "catalog" | "reviews") => void;
  openStoreChat: (storeIdentifier?: string) => void;
  selectedOfferForVoucher: OfferItem | null;
  setSelectedOfferForVoucher: (offer: OfferItem | null) => void;
  showCustomerCode: boolean;
  setShowCustomerCode: (show: boolean) => void;
  showAiAssistant: boolean;
  setShowAiAssistant: (show: boolean) => void;
  isTabBarVisible: boolean;
  setIsTabBarVisible: (visible: boolean) => void;
  seasonalTheme: SeasonalThemeConfig;
  showRadiusModal: boolean;
  setShowRadiusModal: (show: boolean) => void;
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;
  notifications: DealNotification[];
  unreadNotificationsCount: number;
  showNotificationsModal: boolean;
  setShowNotificationsModal: (show: boolean) => void;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  // Cart & Buy Now state
  cart: CartItem[];
  addToCart: (product: CatalogItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  showCartModal: boolean;
  setShowCartModal: (show: boolean) => void;
  buyNowProduct: CatalogItem | null;
  setBuyNowProduct: (product: CatalogItem | null) => void;
  // Wishlist state
  wishlistIds: Set<string>;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  wishlistCount: number;
  // Road Distance & In-App Navigation
  roadDistances: Record<string, { distanceKm: number; distanceMeters: number; durationMinutes: number; formatted: string }>;
  getStoreRoadDistance: (identifier?: string) => { distanceKm: number; distanceMeters: number; durationMinutes: number; formatted: string } | undefined;
  activeNavStore: StoreProfile | null;
  startInAppNavigation: (store: StoreProfile) => void;
  stopInAppNavigation: () => void;
  navigationTriggerTimestamp: number;
  // Customer Orders & COD Management
  customerOrders: CustomerOrder[];
  placeCustomerOrder: (orderInput: {
    storeId: string;
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    items: CustomerOrderProductSnapshot[];
    itemSubtotal: number;
    roadDistanceKm: number;
    deliveryCharge: number;
    platformFee: number;
    totalCodAmount: number;
    deliveryAddress: DeliveryAddress;
    deliveryOption?: "pickup" | "delivery";
  }) => Promise<CustomerOrder>;
  respondToMerchantReplacement: (
    orderId: string,
    itemId: string,
    action: "accept" | "reject"
  ) => Promise<{ success: boolean; message?: string }>;
  verifyOrderOtp: (orderId: string, enteredOtp: string) => { success: boolean; message: string; order?: CustomerOrder };
  cancelCustomerOrder: (orderId: string, reason?: string) => { success: boolean; message: string; order?: CustomerOrder };
  requestOrderReplacement: (orderId: string, productId: string, reason: string) => { success: boolean; message: string; order?: CustomerOrder };
  refreshOrders: () => Promise<CustomerOrder[]>;
  updateOrderStatus: (orderId: string, status: CustomerOrderStatus) => boolean;
}

export { ResolvedConsumerLocation, resolveEligibleConsumerLocation } from "../utils/geo";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [locationName, setLocationName] = useState<string>("Current location");
  const [isGPS, setIsGPS] = useState<boolean>(false);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(5000); // 5 km default
  const [allOffers, setAllOffers] = useState<OfferItem[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [storesTotalCount, setStoresTotalCount] = useState<number>(0);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [isLocationPermissionDenied, setIsLocationPermissionDenied] = useState<boolean>(false);
  const [nearbyProducts, setNearbyProducts] = useState<CatalogItem[]>([]);
  const [vouchers, setVouchers] = useState<VoucherDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedStore, setSelectedStore] = useState<StoreProfile | null>(null);
  const [storeModalTab, setStoreModalTab] = useState<"overview" | "hours" | "chat" | "catalog" | "reviews">("overview");
  const [selectedOfferForVoucher, setSelectedOfferForVoucher] = useState<OfferItem | null>(null);
  const [showCustomerCode, setShowCustomerCode] = useState<boolean>(false);
  const [showAiAssistant, setShowAiAssistant] = useState<boolean>(false);
  const [isTabBarVisible, setIsTabBarVisible] = useState<boolean>(true);
  const [seasonalTheme, setSeasonalTheme] = useState<SeasonalThemeConfig>(() => resolveSeasonalTheme());

  useEffect(() => {
    let overrideConfig: { mode: "automatic" | "manual"; manualThemeId: SeasonalThemeId | null } = {
      mode: "automatic",
      manualThemeId: null
    };

    const applyEffectiveTheme = () => {
      if (
        overrideConfig.mode === "manual" &&
        overrideConfig.manualThemeId &&
        SEASONAL_THEMES[overrideConfig.manualThemeId]
      ) {
        const manualCfg = SEASONAL_THEMES[overrideConfig.manualThemeId];
        setSeasonalTheme((prev) => (prev.id === manualCfg.id ? prev : manualCfg));
      } else {
        const autoTheme = resolveSeasonalTheme();
        setSeasonalTheme((prev) => (prev.id === autoTheme.id ? prev : autoTheme));
      }
    };

    // 1. Initial remote theme fetch from Supabase
    const fetchRemoteThemeConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("app_seasonal_theme_config")
          .select("mode, manual_theme_id")
          .eq("id", "current")
          .maybeSingle();

        if (!error && data) {
          overrideConfig = {
            mode: data.mode === "manual" ? "manual" : "automatic",
            manualThemeId: data.manual_theme_id as SeasonalThemeId | null
          };
          applyEffectiveTheme();
        }
      } catch {
        applyEffectiveTheme();
      }
    };
    fetchRemoteThemeConfig();

    // 2. Real-time subscription to Super Admin theme overrides
    const channel = supabase
      .channel("ssc_seasonal_theme_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_seasonal_theme_config" },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            overrideConfig = {
              mode: row.mode === "manual" ? "manual" : "automatic",
              manualThemeId: row.manual_theme_id as SeasonalThemeId | null
            };
            applyEffectiveTheme();
          }
        }
      )
      .subscribe();

    // 3. AppState change & midnight refresh
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchRemoteThemeConfig();
      }
    });

    let midnightTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleMidnightRefresh = () => {
      const msUntilMidnight = getMsUntilNextKolkataMidnight();
      midnightTimer = setTimeout(() => {
        applyEffectiveTheme();
        scheduleMidnightRefresh();
      }, msUntilMidnight);
    };
    scheduleMidnightRefresh();

    return () => {
      subscription.remove();
      supabase.removeChannel(channel);
      if (midnightTimer) {
        clearTimeout(midnightTimer);
      }
    };
  }, []);
  const [showRadiusModal, setShowRadiusModal] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

  // Auth State
  const [user, setUser] = useState<UserSession | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authPromptReason, setAuthPromptReason] = useState<string | undefined>(undefined);

  // Notification Drawer State
  const [notifications, setNotifications] = useState<DealNotification[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);

  // Cart & Buy Now State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState<boolean>(false);
  const [buyNowProduct, setBuyNowProduct] = useState<CatalogItem | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);

  // Wishlist State
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  // Road Distance & In-App Navigation State
  const [roadDistances, setRoadDistances] = useState<
    Record<string, { distanceKm: number; distanceMeters: number; durationMinutes: number; formatted: string }>
  >({});
  const [activeNavStore, setActiveNavStore] = useState<StoreProfile | null>(null);
  const [navigationTriggerTimestamp, setNavigationTriggerTimestamp] = useState<number>(0);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);

  const storesRef = useRef<StoreProfile[]>([]);
  const isGPSRef = useRef<boolean>(false);
  const locationRef = useRef<Coordinates>(DEFAULT_LOCATION);
  const locationRequestIdRef = useRef<number>(0);
  const deliveryAddressRef = useRef<DeliveryAddress | null>(null);
  const userRef = useRef<UserSession | null>(null);
  const processedOfferIdsRef = useRef<Set<string>>(new Set());
  const processedCustomerChatIdsRef = useRef<Set<string>>(new Set());
  const selectedStoreRef = useRef<StoreProfile | null>(selectedStore);
  const storeModalTabRef = useRef<"overview" | "hours" | "chat" | "catalog" | "reviews">(storeModalTab);
  const refreshDataRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    selectedStoreRef.current = selectedStore;
  }, [selectedStore]);

  useEffect(() => {
    storeModalTabRef.current = storeModalTab;
  }, [storeModalTab]);

  useEffect(() => {
    isGPSRef.current = isGPS;
  }, [isGPS]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    deliveryAddressRef.current = deliveryAddress;
  }, [deliveryAddress]);

  useEffect(() => {
    userRef.current = user;
    if (user?.address && !deliveryAddressRef.current) {
      setDeliveryAddress(user.address);
      deliveryAddressRef.current = user.address;
    }
  }, [user]);

  // Restore authenticated session, saved notifications, cart, and delivery address from AsyncStorage & Supabase
  useEffect(() => {
    async function restoreSessionAndNotifications() {
      try {
        let activeUser: UserSession | null = null;

        // 0. Pre-hydrate instantly from local storage cache if available
        const cachedUserRaw = await AsyncStorage.getItem("smartshopper_active_user");
        if (cachedUserRaw) {
          try {
            const parsedCachedUser: UserSession = JSON.parse(cachedUserRaw);
            if (parsedCachedUser && parsedCachedUser.id) {
              activeUser = parsedCachedUser;
              setUser(parsedCachedUser);
              userRef.current = parsedCachedUser;
            }
          } catch {}
        }

        // Authoritative Supabase Auth Session verification
        const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        if (sessionData?.session?.user) {
          const authUserId = sessionData.session.user.id;
          let isAuthorized = false;
          let consumerData: any = null;

          // 1. Authoritative Application Verification: rpc_verify_app_access (SSC Gate)
          try {
            const { data: accessRes } = await supabase.rpc("rpc_verify_app_access", { p_app_code: "SSC" });
            if (accessRes?.success && accessRes.consumer) {
              isAuthorized = true;
              consumerData = accessRes.consumer;
            }
          } catch {}

          // 2. Authoritative RPC verification: rpc_authenticate_ssc_consumer
          if (!isAuthorized) {
            try {
              const { data: authRpc } = await supabase.rpc("rpc_authenticate_ssc_consumer");
              if (authRpc?.success && authRpc.consumer) {
                isAuthorized = true;
                consumerData = authRpc.consumer;
              }
            } catch {}
          }

          // 3. Direct table inspection of app_user_accounts / ssc_users
          if (!isAuthorized) {
            try {
              const { data: accRow } = await supabase
                .from("app_user_accounts")
                .select("*")
                .eq("auth_user_id", authUserId)
                .eq("app_code", "SSC")
                .maybeSingle();
              if (accRow && accRow.status === "ACTIVE") {
                isAuthorized = true;
                consumerData = accRow.metadata;
              } else {
                const { data: sscRow } = await supabase
                  .from("ssc_users")
                  .select("*")
                  .eq("auth_user_id", authUserId)
                  .maybeSingle();
                if (sscRow && sscRow.status === "ACTIVE") {
                  isAuthorized = true;
                  consumerData = sscRow;
                }
              }
            } catch {}
          }

          if (isAuthorized && consumerData) {
            const initials = (consumerData.full_name || "Customer")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const userEmail = sessionData.session.user.email || consumerData.email;
            activeUser = {
              id: authUserId,
              customerId: consumerData.customer_id || `SSC-${authUserId.slice(0, 5).toUpperCase()}`,
              username: consumerData.username || (userEmail ? userEmail.split("@")[0] : "consumer"),
              email: userEmail,
              name: consumerData.full_name || "Customer",
              phone: consumerData.phone || "",
              isVerified: true,
              avatarInitials: initials,
              role: consumerData.role || "consumer",
              address: consumerData.address || null
            };
            setUser(activeUser);
            userRef.current = activeUser;
            await AsyncStorage.setItem("smartshopper_active_user", JSON.stringify(activeUser));
          } else {
            // Unregistered in SSC (e.g. SSM merchant-only session): enforce logout
            await supabase.auth.signOut().catch(() => {});
            await AsyncStorage.removeItem("smartshopper_active_user");
            setUser(null);
            userRef.current = null;
          }
        } else {
          // If no active Supabase auth session, clear stale cached user session
          await AsyncStorage.removeItem("smartshopper_active_user");
          setUser(null);
          userRef.current = null;
        }

        // Restore delivery address (prioritizing user profile in DB/session, then AsyncStorage)
        const rawAddress = await AsyncStorage.getItem("@smartshopper_delivery_address");
        let restoredAddress: DeliveryAddress | null = null;
        if (activeUser?.address) {
          restoredAddress = activeUser.address;
          setDeliveryAddress(activeUser.address);
          deliveryAddressRef.current = activeUser.address;
          await AsyncStorage.setItem("@smartshopper_delivery_address", JSON.stringify(activeUser.address));
        } else if (rawAddress) {
          try {
            const parsed = JSON.parse(rawAddress);
            if (parsed && typeof parsed === "object") {
              restoredAddress = parsed;
              setDeliveryAddress(parsed);
              deliveryAddressRef.current = parsed;
            }
          } catch {}
        }

        // If GPS is not acquired yet, center initial location on saved address coordinates
        if (!isGPSRef.current && restoredAddress && typeof restoredAddress.lat === "number" && typeof restoredAddress.lng === "number" && isValidCoordinate(restoredAddress.lat, restoredAddress.lng)) {
          const coords = { latitude: restoredAddress.lat, longitude: restoredAddress.lng };
          setLocation(coords);
          locationRef.current = coords;
          setLocationName(formatAddressDisplayLabel(restoredAddress));
        }

        const rawNotifs = await AsyncStorage.getItem("smartshopper_saved_notifications");
        if (rawNotifs) {
          setNotifications(JSON.parse(rawNotifs));
        }
        const rawCart = await AsyncStorage.getItem("smartshopper_user_cart");
        if (rawCart) {
          setCart(JSON.parse(rawCart));
        }
        const rawOrders = await AsyncStorage.getItem("@smartshopper_customer_orders");
        if (rawOrders) {
          try {
            const parsed = JSON.parse(rawOrders);
            if (Array.isArray(parsed)) {
              if (activeUser) {
                // Strictly isolate cached orders to the active authenticated user
                const userOrders = parsed.filter(
                  (lo: any) =>
                    (Boolean(lo.customerId && activeUser.customerId) && lo.customerId === activeUser.customerId) ||
                    (Boolean(lo.deliveryAddress?.phone && activeUser.phone) &&
                      lo.deliveryAddress.phone.replace(/\D/g, "").slice(-10) === activeUser.phone.replace(/\D/g, "").slice(-10))
                );
                setCustomerOrders(userOrders);
                await AsyncStorage.setItem("@smartshopper_customer_orders", JSON.stringify(userOrders));
              } else {
                // Unauthenticated: purge any lingering customer orders from memory and cache
                setCustomerOrders([]);
                await AsyncStorage.removeItem("@smartshopper_customer_orders");
              }
            }
          } catch {}
        } else {
          setCustomerOrders([]);
        }
        const rawWishlist = await AsyncStorage.getItem("smartshopper_user_wishlist");
        if (rawWishlist) {
          try {
            const arr = JSON.parse(rawWishlist);
            if (Array.isArray(arr)) {
              setWishlistIds(new Set(arr));
            }
          } catch {}
        }

        // Register / sync device push token with consented location
        registerDevicePushToken({
          userId: activeUser?.id,
          location: locationRef.current,
          isGPS: isGPSRef.current,
          deliveryAddress: restoredAddress
        }).catch(() => {});
      } catch (err) {
        console.warn("[AppContext] restoreSession error:", err);
      }
    }
    restoreSessionAndNotifications();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        userRef.current = null;
        setCustomerOrders([]);
        setDeliveryAddress(null);
        setCart([]);
        await AsyncStorage.multiRemove([
          "smartshopper_active_user",
          "@smartshopper_customer_orders",
          "@smartshopper_delivery_address",
          "smartshopper_user_cart"
        ]).catch(() => {});
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        try {
          const authUserId = session.user.id;
          let isAuthorized = false;
          let consumerData: any = null;

          // 1. Authoritative Application Verification: rpc_verify_app_access (SSC Gate)
          try {
            const { data: accessRes } = await supabase.rpc("rpc_verify_app_access", { p_app_code: "SSC" });
            if (accessRes?.success && accessRes.consumer) {
              isAuthorized = true;
              consumerData = accessRes.consumer;
            }
          } catch {}

          // 2. Authoritative RPC verification: rpc_authenticate_ssc_consumer
          if (!isAuthorized) {
            try {
              const { data: authRpc } = await supabase.rpc("rpc_authenticate_ssc_consumer");
              if (authRpc?.success && authRpc.consumer) {
                isAuthorized = true;
                consumerData = authRpc.consumer;
              }
            } catch {}
          }

          // 3. Direct table inspection of app_user_accounts / ssc_users
          if (!isAuthorized) {
            try {
              const { data: accRow } = await supabase
                .from("app_user_accounts")
                .select("*")
                .eq("auth_user_id", authUserId)
                .eq("app_code", "SSC")
                .maybeSingle();
              if (accRow && accRow.status === "ACTIVE") {
                isAuthorized = true;
                consumerData = accRow.metadata;
              } else {
                const { data: sscRow } = await supabase
                  .from("ssc_users")
                  .select("*")
                  .eq("auth_user_id", authUserId)
                  .maybeSingle();
                if (sscRow && sscRow.status === "ACTIVE") {
                  isAuthorized = true;
                  consumerData = sscRow;
                }
              }
            } catch {}
          }

          if (isAuthorized && consumerData) {
            const initials = (consumerData.full_name || "Customer")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const userEmail = session.user.email || consumerData.email;
            const resolved: UserSession = {
              id: authUserId,
              customerId: consumerData.customer_id || `SSC-${authUserId.slice(0, 5).toUpperCase()}`,
              username: consumerData.username || (userEmail ? userEmail.split("@")[0] : "consumer"),
              email: userEmail,
              name: consumerData.full_name || "Customer",
              phone: consumerData.phone || "",
              isVerified: true,
              avatarInitials: initials,
              role: consumerData.role || "consumer",
              address: consumerData.address || null
            };
            setUser(resolved);
            userRef.current = resolved;
            await AsyncStorage.setItem("smartshopper_active_user", JSON.stringify(resolved));
          } else {
            // Unauthorized session (e.g. merchant-only): sign out immediately
            await supabase.auth.signOut().catch(() => {});
            setUser(null);
            userRef.current = null;
            await AsyncStorage.removeItem("smartshopper_active_user");
          }
        } catch {}
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const saveOrders = useCallback((orders: CustomerOrder[]) => {
    setCustomerOrders(orders);
    AsyncStorage.setItem("@smartshopper_customer_orders", JSON.stringify(orders)).catch(() => {});
  }, []);

  const saveCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
    AsyncStorage.setItem("smartshopper_user_cart", JSON.stringify(newCart)).catch(() => {});
  }, []);

  const addToCart = useCallback((product: CatalogItem) => {
    if (product.isDeleted) {
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      let updated: CartItem[];
      if (idx > -1) {
        updated = prev.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updated = [...prev, { product, quantity: 1 }];
      }
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      saveCart(updated);
      return updated;
    });
  }, [removeFromCart, saveCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    AsyncStorage.removeItem("smartshopper_user_cart").catch(() => {});
  }, []);

  // Validate cart against deleted merchant products whenever nearbyProducts updates
  useEffect(() => {
    if (cart.length === 0) return;
    let hasChanges = false;
    const validatedCart = cart.map((item) => {
      const liveProduct = nearbyProducts.find((p) => p.id === item.product.id);
      if (liveProduct && liveProduct.isDeleted) {
        if (!item.isUnavailable) {
          hasChanges = true;
          return {
            ...item,
            isUnavailable: true,
            unavailableReason: "This product was removed by the merchant."
          };
        }
      } else if (item.product.isDeleted && !item.isUnavailable) {
        hasChanges = true;
        return {
          ...item,
          isUnavailable: true,
          unavailableReason: "This product was removed by the merchant."
        };
      }
      return item;
    });

    if (hasChanges) {
      saveCart(validatedCart);
    }
  }, [nearbyProducts, cart, saveCart]);

  const placeCustomerOrder = useCallback(
    async (orderInput: {
      storeId: string;
      storeName: string;
      storeAddress?: string;
      storePhone?: string;
      items: CustomerOrderProductSnapshot[];
      itemSubtotal: number;
      roadDistanceKm: number;
      deliveryCharge: number;
      platformFee: number;
      totalCodAmount: number;
      deliveryAddress: DeliveryAddress;
      deliveryOption?: "pickup" | "delivery";
    }): Promise<CustomerOrder> => {
      if (!user) {
        throw new Error("Authentication required. Please sign in or register to place your order.");
      }

      if (orderInput.deliveryOption === "delivery" && !isHomeDeliveryAvailable(user.email)) {
        throw new Error("Home delivery is temporarily unavailable until January 1, 2027. Please select Store Pickup.");
      }

      const enrichedItems: CustomerOrderProductSnapshot[] = orderInput.items.map((item, idx) => {
        const cat = (item.category || "").toLowerCase();
        const isPerishable =
          cat.includes("grocery") ||
          cat.includes("vegetable") ||
          cat.includes("fruit") ||
          cat.includes("meat") ||
          cat.includes("fish") ||
          cat.includes("dairy") ||
          cat.includes("food");
        const eligible = item.replacementEligible !== undefined ? item.replacementEligible : !isPerishable;
        return {
          ...item,
          id: item.id && item.id.startsWith("item_") ? item.id : `item_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 9)}`,
          productId: item.productId || item.id,
          replacementEligible: eligible,
          replacementPolicy: item.replacementPolicy || (eligible ? "7 Days Replacement" : "Non-Returnable / Non-Replaceable")
        };
      });

      const clientOrderId = "ord_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const clientOrderNumber = "SS-ORD-" + Math.floor(100000 + Math.random() * 900000);
      const clientOtp = generateOrderOtp();
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const provisionalOrder: CustomerOrder = {
        id: clientOrderId,
        orderNumber: clientOrderNumber,
        storeId: orderInput.storeId,
        storeName: orderInput.storeName,
        storeAddress: orderInput.storeAddress,
        storePhone: orderInput.storePhone,
        customerId: user.customerId || user.id,
        items: enrichedItems,
        itemSubtotal: orderInput.itemSubtotal,
        roadDistanceKm: orderInput.roadDistanceKm,
        deliveryCharge: orderInput.deliveryCharge,
        platformFee: orderInput.platformFee,
        totalCodAmount: orderInput.totalCodAmount,
        deliveryOption: orderInput.deliveryOption || (orderInput.deliveryCharge === 0 ? "pickup" : "delivery"),
        status: "PENDING_MERCHANT_ACCEPTANCE",
        paymentMethod: "cod",
        paymentStatus: "pending",
        deliveryAddress: orderInput.deliveryAddress,
        otp: clientOtp,
        otpVerified: false,
        otpStatus: "pending",
        createdAt: new Date().toISOString(),
        idempotencyKey
      };

      // Atomic remote checkout in Supabase - MUST succeed before cart clearing or state commit
      const remoteRes = await saveCustomerOrderToDb(provisionalOrder);
      if (!remoteRes.success) {
        throw new Error(remoteRes.error || "Order placement failed on server. Please try again.");
      }

      const confirmedOrder: CustomerOrder = {
        ...provisionalOrder,
        id: remoteRes.orderId || provisionalOrder.id,
        orderNumber: remoteRes.orderNumber || provisionalOrder.orderNumber,
        items: remoteRes.items && remoteRes.items.length > 0
          ? remoteRes.items.map((it: any) => ({
              ...it,
              id: it.id,
              productId: it.productId || it.product_id,
              name: it.name,
              category: it.category,
              sku: it.sku,
              imageUrl: it.imageUrl,
              offerPrice: it.offerPrice || `₹${it.unitPrice || 0}`,
              quantity: it.quantity || 1,
              replacementEligible: true
            }))
          : provisionalOrder.items,
        itemSubtotal: remoteRes.itemSubtotal !== undefined ? remoteRes.itemSubtotal : provisionalOrder.itemSubtotal,
        deliveryCharge: remoteRes.deliveryCharge !== undefined ? remoteRes.deliveryCharge : provisionalOrder.deliveryCharge,
        platformFee: remoteRes.platformFee !== undefined ? remoteRes.platformFee : provisionalOrder.platformFee,
        totalCodAmount: remoteRes.totalAmount !== undefined ? remoteRes.totalAmount : provisionalOrder.totalCodAmount,
        status: (remoteRes.status as any) || provisionalOrder.status,
        otp: remoteRes.otp || provisionalOrder.otp
      };

      setCustomerOrders((prev) => {
        const updated = [confirmedOrder, ...prev.filter((o) => o.id !== confirmedOrder.id)];
        saveOrders(updated);
        return updated;
      });

      // Clear the active cart ONLY after successful remote confirmation
      clearCart();

      return confirmedOrder;
    },
    [user, clearCart, saveOrders]
  );

  const verifyOrderOtp = useCallback(
    (orderId: string, enteredOtp: string): { success: boolean; message: string; order?: CustomerOrder } => {
      let matchedOrder: CustomerOrder | undefined;
      let isMatch = false;
      let alreadyCompleted = false;

      setCustomerOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
        if (idx === -1) return prev;

        const target = prev[idx];
        if (isCompletedOrderStatus(target.status)) {
          alreadyCompleted = true;
          matchedOrder = target;
          return prev;
        }

        if (verifyOtp(target.otp, enteredOtp)) {
          isMatch = true;
          const updated: CustomerOrder = {
            ...target,
            status: "DELIVERED",
            paymentStatus: "collected",
            otpVerified: true,
            otpStatus: "verified",
            deliveredAt: new Date().toISOString()
          };
          matchedOrder = updated;
          const newOrders = [...prev];
          newOrders[idx] = updated;
          saveOrders(newOrders);

          // Persist delivered status to Supabase
          updateCustomerOrderStatusInDb(target.id, "DELIVERED", undefined, target.storeId).catch(() => {});

          return newOrders;
        }
        return prev;
      });

      if (alreadyCompleted && matchedOrder) {
        return {
          success: true,
          message: "Order has already been verified and delivered.",
          order: matchedOrder
        };
      }

      if (isMatch && matchedOrder) {
        return {
          success: true,
          message: "Delivery verified! Order marked as Delivered and COD payment collected.",
          order: matchedOrder
        };
      }

      return {
        success: false,
        message: "Invalid OTP. Please enter the correct 4-digit OTP shown to the customer."
      };
    },
    [saveOrders]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, newStatus: CustomerOrderStatus): boolean => {
      let updatedSuccess = false;
      setCustomerOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
        if (idx === -1) return prev;
        const target = prev[idx];
        if (target.status === newStatus) return prev;

        updatedSuccess = true;
        const isReceived = (newStatus as string) === "received" || newStatus === "confirmed";
        const isReady = (newStatus as string) === "ready" || (newStatus as string) === "ready_for_pickup" || newStatus === "preparing";
        const isPickedUp = (newStatus as string) === "picked_up" || newStatus === "out_for_delivery";
        const isDelivered = newStatus === "delivered" || newStatus === "completed";
        const isCancelled = newStatus === "cancelled";

        const updated: CustomerOrder = {
          ...target,
          status: newStatus,
          ...(isReceived ? { receivedAt: target.receivedAt || new Date().toISOString() } : {}),
          ...(isReady ? { readyAt: target.readyAt || new Date().toISOString() } : {}),
          ...(isPickedUp ? { pickedUpAt: target.pickedUpAt || new Date().toISOString() } : {}),
          ...(isDelivered
            ? {
                paymentStatus: "collected",
                otpVerified: true,
                otpStatus: "verified",
                deliveredAt: target.deliveredAt || new Date().toISOString()
              }
            : {}),
          ...(isCancelled
            ? {
                cancelledAt: target.cancelledAt || new Date().toISOString()
              }
            : {})
        };
        const newOrders = [...prev];
        newOrders[idx] = updated;
        saveOrders(newOrders);

        // Sync with backend
        updateCustomerOrderStatusInDb(target.id, newStatus, undefined, target.storeId).catch(() => {});

        return newOrders;
      });
      return updatedSuccess;
    },
    [saveOrders]
  );

  const refreshOrders = useCallback(async (): Promise<CustomerOrder[]> => {
    try {
      if (!user) {
        setCustomerOrders([]);
        await AsyncStorage.removeItem("@smartshopper_customer_orders");
        return [];
      }

      let localOrders: CustomerOrder[] = [];
      const rawOrders = await AsyncStorage.getItem("@smartshopper_customer_orders");
      if (rawOrders) {
        try {
          const parsed = JSON.parse(rawOrders);
          if (Array.isArray(parsed)) {
            // Strictly isolate localOrders to current authenticated user
            const userScoped = parsed.filter((lo) => {
              const isOwnedByCurrentUser =
                (Boolean(lo.customerId && user.customerId) && lo.customerId === user.customerId) ||
                (Boolean(lo.customerId && user.id) && lo.customerId === user.id) ||
                (Boolean(lo.deliveryAddress?.phone && user.phone) &&
                  lo.deliveryAddress!.phone.replace(/\D/g, "").slice(-10) === user.phone.replace(/\D/g, "").slice(-10));
              return isOwnedByCurrentUser;
            });
            localOrders = userScoped;
          }
        } catch {}
      }

      // Query live orders from Supabase using authenticated user identity ONLY (never arbitrary IDs)
      const remoteOrders = await fetchCustomerOrdersFromDb(
        user.phone,
        user.customerId || user.id
      );

      if (remoteOrders && remoteOrders.length > 0) {
        // Double-check customer isolation on remote orders returned
        const authorizedRemoteOrders = remoteOrders.filter(
          (ro) =>
            (Boolean(ro.customerId && user.customerId) && ro.customerId === user.customerId) ||
            ro.customerId === user.id ||
            (Boolean(ro.deliveryAddress?.phone && user.phone) &&
              ro.deliveryAddress!.phone.replace(/\D/g, "").slice(-10) === user.phone.replace(/\D/g, "").slice(-10))
        );

        const remoteMap = new Map(authorizedRemoteOrders.map((ro) => [ro.id, ro]));
        const merged: CustomerOrder[] = [...authorizedRemoteOrders];

        localOrders.forEach((lo) => {
          if (!remoteMap.has(lo.id)) {
            merged.push(lo);
          }
        });

        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCustomerOrders(merged);
        saveOrders(merged);
        return merged;
      } else if (localOrders.length > 0) {
        setCustomerOrders(localOrders);
        saveOrders(localOrders);
        return localOrders;
      } else {
        setCustomerOrders([]);
        await AsyncStorage.removeItem("@smartshopper_customer_orders");
        return [];
      }
    } catch (err) {
      console.warn("[AppContext] refreshOrders error:", err);
    }
    return customerOrders;
  }, [user, customerOrders, saveOrders]);

  // Sync orders from Supabase whenever user signs in or changes
  useEffect(() => {
    if (user?.id || user?.phone || user?.customerId) {
      refreshOrders().catch(() => {});
    }
  }, [user?.id, user?.phone, user?.customerId, refreshOrders]);

  const cancelCustomerOrder = useCallback(
    (orderId: string, reason?: string): { success: boolean; message: string; order?: CustomerOrder } => {
      let result: { success: boolean; message: string; order?: CustomerOrder } = {
        success: false,
        message: "Order not found."
      };

      setCustomerOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
        if (idx === -1) return prev;
        const target = prev[idx];

        if (isCancelledOrderStatus(target.status)) {
          result = {
            success: false,
            message: "Order has already been cancelled.",
            order: target
          };
          return prev;
        }

        if (isCompletedOrderStatus(target.status)) {
          result = {
            success: false,
            message: "Delivered orders cannot be cancelled.",
            order: target
          };
          return prev;
        }

        if (!isOrderCancellableByCustomer(target.status)) {
          result = {
            success: false,
            message: "Order cannot be cancelled because the merchant has already accepted and started processing it.",
            order: target
          };
          return prev;
        }

        const updated: CustomerOrder = {
          ...target,
          status: "CANCELLED",
          cancelledAt: new Date().toISOString(),
          cancellationReason: reason || "Cancelled by customer"
        };

        const newOrders = [...prev];
        newOrders[idx] = updated;
        saveOrders(newOrders);

        // Persist cancellation in Supabase
        updateCustomerOrderStatusInDb(target.id, "CANCELLED", reason || "Cancelled by customer", target.storeId).catch(() => {});

        result = {
          success: true,
          message: "Order cancelled successfully.",
          order: updated
        };
        return newOrders;
      });

      return result;
    },
    [saveOrders]
  );

  const respondToMerchantReplacement = useCallback(
    async (
      orderId: string,
      itemId: string,
      action: "accept" | "reject"
    ): Promise<{ success: boolean; message?: string }> => {
      try {
        const customerId = user?.id || user?.phone || "customer";
        const res = await respondToOrderReplacementInDb(orderId, itemId, action, customerId);
        if (res.success) {
          await refreshOrders().catch(() => {});
          return { success: true };
        } else {
          return { success: false, message: res.error || "Failed to update replacement." };
        }
      } catch (err: any) {
        return { success: false, message: err?.message || "Replacement response exception" };
      }
    },
    [user?.id, user?.phone, refreshOrders]
  );

  const requestOrderReplacement = useCallback(
    (orderId: string, productId: string, reason: string): { success: boolean; message: string; order?: CustomerOrder } => {
      let result: { success: boolean; message: string; order?: CustomerOrder } = {
        success: false,
        message: "Order not found."
      };

      setCustomerOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
        if (idx === -1) return prev;
        const target = prev[idx];

        // Find item in order (matches line item id or catalog productId)
        const item = target.items.find((i) => i.id === productId || (i as any).productId === productId);
        if (!item) {
          result = {
            success: false,
            message: "Product not found in this order.",
            order: target
          };
          return prev;
        }

        if (item.replacementEligible === false) {
          result = {
            success: false,
            message: "This product is not eligible for replacement.",
            order: target
          };
          return prev;
        }

        if (target.replacementStatus === "requested" || target.replacementStatus === "under_review") {
          result = {
            success: false,
            message: "A replacement request is already in progress for this order.",
            order: target
          };
          return prev;
        }

        const updated: CustomerOrder = {
          ...target,
          replacementRequested: true,
          replacementStatus: "requested",
          replacementReason: reason,
          replacementRequestedAt: new Date().toISOString()
        };

        const newOrders = [...prev];
        newOrders[idx] = updated;
        saveOrders(newOrders);

        result = {
          success: true,
          message: "Replacement request submitted successfully. The merchant will review your request.",
          order: updated
        };
        return newOrders;
      });

      return result;
    },
    [saveOrders]
  );

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      AsyncStorage.setItem("smartshopper_user_wishlist", JSON.stringify(Array.from(next))).catch(() => {});
      return next;
    });
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  const wishlistCount = useMemo(() => wishlistIds.size, [wishlistIds]);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      AsyncStorage.setItem("smartshopper_saved_notifications", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    try {
      await AsyncStorage.removeItem("smartshopper_saved_notifications");
    } catch {}
  }, []);

  const unreadNotificationsCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const openAuthModal = useCallback((reason?: string) => {
    setAuthPromptReason(reason);
    setShowAuthModal(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await deactivateDevicePushToken().catch(() => {});
      await supabase.auth.signOut().catch(() => {});
      await AsyncStorage.multiRemove([
        "smartshopper_active_user",
        "@smartshopper_customer_orders",
        "@smartshopper_delivery_address",
        "smartshopper_user_cart"
      ]);
      setCustomerOrders([]);
      setDeliveryAddress(null);
      setCart([]);
      setUser(null);
      userRef.current = null;
    } catch {}
  }, []);

  const updateUserProfile = useCallback(async (updates: { fullName: string; username?: string }) => {
    if (!user) return { success: false, message: "No active user session." };
    const res = await apiUpdateUserProfile(user.id, updates);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return { success: res.success, message: res.message };
  }, [user]);

  const saveDeliveryAddress = useCallback(async (addr: DeliveryAddress | null) => {
    setDeliveryAddress(addr);
    deliveryAddressRef.current = addr;

    // Center fallback catalog on saved address if GPS is not currently active
    if (!isGPSRef.current && addr && typeof addr.lat === "number" && typeof addr.lng === "number" && isValidCoordinate(addr.lat, addr.lng)) {
      locationRequestIdRef.current++;
      const coords = { latitude: addr.lat, longitude: addr.lng };
      setLocation(coords);
      locationRef.current = coords;
      setLocationName(formatAddressDisplayLabel(addr));
    }

    // Sync saved address coordinates with registered push token for 5,000m geo-filter
    if (addr && typeof addr.lat === "number" && typeof addr.lng === "number") {
      syncLocationWithPushToken({ latitude: addr.lat, longitude: addr.lng }, "saved_address").catch(() => {});
    }

    // 1. Sync to local storage immediately
    try {
      if (addr) {
        await AsyncStorage.setItem("@smartshopper_delivery_address", JSON.stringify(addr));
      } else {
        await AsyncStorage.removeItem("@smartshopper_delivery_address");
      }
    } catch {}

    // 2. If logged in, sync directly to database
    if (user?.id) {
      const res = await apiSaveUserDeliveryAddress(user.id, addr, locationRef.current);
      if (res.success && res.user) {
        setUser(res.user);
        userRef.current = res.user;
      }
      return { success: res.success, message: res.message };
    }

    return { success: true };
  }, [user]);


  // Reverse geocode helper bound to request sequence ID to eliminate race conditions
  const reverseGeocodeCoords = useCallback(async (coords: Coordinates, requestId: number) => {
    try {
      const geoResults = await Location.reverseGeocodeAsync(coords);
      // If a newer location request or manual selection occurred, discard stale result
      if (requestId !== locationRequestIdRef.current) return;

      if (geoResults && geoResults.length > 0) {
        const formatted = formatGeocodedLocationName(geoResults[0]);
        setLocationName(formatted);
      } else {
        setLocationName("Current location");
      }
    } catch (err) {
      if (requestId !== locationRequestIdRef.current) return;
      console.warn("[AppContext] Reverse geocoding failed:", err);
      setLocationName("Current location");
    }
  }, []);

  // Request GPS Location fast (prefer last known or quick fix with timeout)
  const requestGPS = useCallback(async () => {
    const requestId = ++locationRequestIdRef.current;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (requestId === locationRequestIdRef.current) {
          setIsGPS(false);
          isGPSRef.current = false;
          setIsLocationPermissionDenied(true);
          setLocationName("Location permission denied");
        }
        return;
      }

      if (requestId === locationRequestIdRef.current) {
        setIsLocationPermissionDenied(false);
      }

      // 1. Immediately grab last known location for zero-latency start
      const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
      if (lastKnown && lastKnown.coords && requestId === locationRequestIdRef.current) {
        const coords: Coordinates = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude
        };
        if (isValidCoordinate(coords.latitude, coords.longitude)) {
          setLocation(coords);
          locationRef.current = coords;
          setIsGPS(true);
          isGPSRef.current = true;
          syncLocationWithPushToken(coords, "gps").catch(() => {});
          reverseGeocodeCoords(coords, requestId);
        }
      }

      // 2. Fetch fresh position with low accuracy/balanced and timeout
      const freshPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
      const curr = await Promise.race([freshPromise, timeoutPromise]);

      if (curr && curr.coords && requestId === locationRequestIdRef.current) {
        const coords: Coordinates = {
          latitude: curr.coords.latitude,
          longitude: curr.coords.longitude
        };
        if (isValidCoordinate(coords.latitude, coords.longitude)) {
          setLocation(coords);
          locationRef.current = coords;
          setIsGPS(true);
          isGPSRef.current = true;
          syncLocationWithPushToken(coords, "gps").catch(() => {});
          reverseGeocodeCoords(coords, requestId);
        }
      }
    } catch (e) {
      console.warn("GPS Request Error:", e);
      if (requestId === locationRequestIdRef.current) {
        setIsGPS(false);
        isGPSRef.current = false;
        setLocationName("Location unavailable");
      }
    }
  }, [reverseGeocodeCoords]);

  // Fetch Data from Supabase
  const refreshData = useCallback(async () => {
    if (!networkService.getIsOnline()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setStoresError(null);
    try {
      const [storesRes, savedVouchers] = await Promise.all([
        fetchStoresWithMeta(location, { page: 1, pageSize: 200 }),
        getClaimedVouchers()
      ]);

      if (storesRes.error) {
        setStoresError(storesRes.error);
      } else {
        setStoresError(null);
      }

      const liveStores = storesRes.stores;
      setStores(liveStores);
      setStoresTotalCount(storesRes.totalCount);
      storesRef.current = liveStores;
      setVouchers(savedVouchers);

      const liveOffers = await fetchLiveOffers(location, liveStores);
      setAllOffers(liveOffers);

      // Fetch nearby store catalog products within 5 km
      const products = await fetchNearbyProducts(location, liveStores, 5000);
      setNearbyProducts(products);
    } catch (err: any) {
      console.error("Refresh data error:", err);
      setStoresError(err?.message || "Failed to load stores");
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  // Automatically refresh data when internet connection is restored
  useEffect(() => {
    let wasOffline = false;
    const unsub = networkService.subscribe((online) => {
      if (online && wasOffline && refreshDataRef.current) {
        refreshDataRef.current();
      }
      wasOffline = !online;
    });
    return () => unsub();
  }, []);

  // Initial setup: check for saved manual location before requesting GPS
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const savedManual = await AsyncStorage.getItem("@smartshopper_manual_location");
        if (savedManual) {
          const parsed = JSON.parse(savedManual);
          if (
            parsed?.coords &&
            typeof parsed.coords.latitude === "number" &&
            typeof parsed.coords.longitude === "number"
          ) {
            if (isMounted) {
              setLocation(parsed.coords);
              locationRef.current = parsed.coords;
              if (parsed.name) setLocationName(parsed.name);
              setIsGPS(false);
              isGPSRef.current = false;
            }
            return;
          }
        }
      } catch (err) {
        console.warn("[AppContext] Error reading saved manual location:", err);
      }
      if (isMounted) {
        await requestGPS();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [requestGPS]);

  // Refresh data when location changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await refreshData();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshData]);

  // Persistent realtime deal subscription (independent of location drifts)
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeDeals(
      () => {
        refreshDataRef.current();
      },
      (newOffer: any) => {
        if (!newOffer || !newOffer.id) return;

        const offerId = String(newOffer.id);

        // 1. Deduplication: Prevent duplicate notification on replay, data refresh, or if push arrived first
        if (processedOfferIdsRef.current.has(offerId) || isOfferAlreadyHandled(offerId)) {
          console.log(`[DealFilter] Skipped offer ${offerId}: Duplicate event already processed.`);
          return;
        }
        processedOfferIdsRef.current.add(offerId);
        markOfferHandled(offerId);
        if (processedOfferIdsRef.current.size > 200) {
          const firstKey = processedOfferIdsRef.current.keys().next().value;
          if (firstKey) processedOfferIdsRef.current.delete(firstKey);
        }

        // 2. Ignore deleted or expired offers
        if (newOffer.is_deleted) {
          console.log(`[DealFilter] Skipped offer ${offerId}: Offer marked as deleted.`);
          return;
        }
        if (newOffer.end_at && new Date(newOffer.end_at).getTime() < Date.now()) {
          console.log(`[DealFilter] Skipped offer ${offerId}: Offer already expired.`);
          return;
        }

        // 3. Resolve Consumer Location via Priority:
        // Priority 1: Verified current GPS coordinates
        // Priority 2: Primary saved address coordinates
        // Priority 3: Safely skip if neither source is available
        const resolved = resolveEligibleConsumerLocation(
          isGPSRef.current,
          locationRef.current,
          deliveryAddressRef.current,
          userRef.current?.address
        );

        if (!resolved) {
          console.log(
            `[DealFilter] Skipped offer ${offerId}: Neither verified GPS nor valid saved delivery address available.`
          );
          return;
        }

        const consumerCoords = resolved.coords;
        const locationSource = resolved.source;

        // 4. Resolve & Confirm Merchant Coordinates
        // Merchant's actual coordinates must be confirmed valid before calculating distance.
        // Never use fabricated Kakkanad fallback coordinates (10.0159, 76.3419).
        let storeLat = parseFloat(newOffer.lat ?? newOffer.latitude ?? 0);
        let storeLng = parseFloat(newOffer.lng ?? newOffer.longitude ?? 0);
        const matchedStore = storesRef.current.find(
          (s) =>
            s.id === newOffer.store_id ||
            s.id === newOffer.storeId ||
            s.name.toLowerCase().trim() === (newOffer.store_name || newOffer.storeName || "").toLowerCase().trim()
        );

        // If offer coordinates are missing or match fabricated Kakkanad, resolve from matchedStore
        const isOfferCoordsFabricated = Math.abs(storeLat - 10.0159) < 0.0001 && Math.abs(storeLng - 76.3419) < 0.0001;
        if ((!storeLat || !storeLng || isOfferCoordsFabricated) && matchedStore) {
          const mLat = typeof matchedStore.lat === "number" ? matchedStore.lat : parseFloat(String(matchedStore.lat));
          const mLng = typeof matchedStore.lng === "number" ? matchedStore.lng : parseFloat(String(matchedStore.lng));
          if (!isNaN(mLat) && !isNaN(mLng) && (mLat !== 0 || mLng !== 0)) {
            storeLat = mLat;
            storeLng = mLng;
          }
        }

        // Validate merchant coordinates
        const isStoreValid = isValidCoordinate(storeLat, storeLng);
        if (!isStoreValid) {
          console.log(
            `[DealFilter] Skipped offer ${offerId}: Merchant coordinates are missing, unverified, or fabricated Kakkanad fallback.`
          );
          return;
        }

        // 5. Fixed 5,000-metre (5 km) Consumer Deal Radar
        // Requirement 1: Update SSC deal-notification eligibility to use a fixed 5,000-metre consumer notification radius.
        // Remove previous 2,000m default and ensure merchant settings do not restrict the requested 5 km consumer radius.
        const distanceInMeters = calculateDistanceInMeters(consumerCoords, {
          latitude: storeLat,
          longitude: storeLng
        });

        if (distanceInMeters === null || isNaN(distanceInMeters)) {
          console.log(`[DealFilter] Skipped offer ${offerId}: Distance calculation returned invalid result.`);
          return;
        }

        const isWithin5Km = distanceInMeters <= CONSUMER_NOTIFICATION_RADAR_METERS;

        if (!isWithin5Km) {
          console.log(
            `[DealFilter] Suppressed offer ${offerId}: Deal beyond 5,000m consumer radius. Distance: ~${Math.round(
              distanceInMeters
            )}m, Limit: ${CONSUMER_NOTIFICATION_RADAR_METERS}m, Source: ${locationSource}`
          );
          return;
        }

        console.log(
          `[DealFilter] Eligible offer ${offerId}: Deal within 5,000m consumer radius. Distance: ~${Math.round(
            distanceInMeters
          )}m, Limit: ${CONSUMER_NOTIFICATION_RADAR_METERS}m, Source: ${locationSource}`
        );

        const distanceInKm = distanceInMeters > 0 ? distanceInMeters / 1000 : undefined;
        sendNewOfferNotification(
          newOffer.store_name || newOffer.storeName || matchedStore?.name || "Partner Store",
          newOffer.discount_tag || newOffer.discountTag || "New Deal",
          newOffer.description,
          distanceInKm,
          offerId
        );

        // Add to in-app notifications drawer list
        const distanceText = distanceInKm !== undefined
          ? ` (${distanceInKm.toFixed(1)} km from ${locationSource === "verified_device_gps" ? "your location" : "your saved address"})`
          : "";

        const notifItem: DealNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          storeName: newOffer.store_name || matchedStore?.name || "SmartShopper Partner Store",
          discountTag: newOffer.discount_tag || "Exclusive Deal",
          description: `${newOffer.description || "Limited-time flash discount dropped!"}${distanceText}`,
          receivedAt: new Date().toISOString(),
          isRead: false,
          offerId: newOffer.id
        };

        setNotifications((prev) => {
          if (prev.some((n) => n.offerId === newOffer.id)) return prev;
          const updated = [notifItem, ...prev.slice(0, 49)];
          AsyncStorage.setItem("smartshopper_saved_notifications", JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Open store modal directly to chat tab
  const openStoreChat = useCallback(
    (storeIdentifier?: string) => {
      setShowNotificationsModal(false);
      if (!storeIdentifier) {
        if (storesRef.current.length > 0) {
          setSelectedStore(storesRef.current[0]);
          setStoreModalTab("chat");
        }
        return;
      }

      const cleanId = storeIdentifier.toLowerCase().trim();
      let matched = storesRef.current.find(
        (s) =>
          s.id.toLowerCase() === cleanId ||
          s.name.toLowerCase().trim() === cleanId ||
          cleanId.includes(s.id.toLowerCase()) ||
          s.id.toLowerCase().includes(cleanId)
      );

      if (!matched) {
        const offerWithStore = allOffers.find(
          (o) =>
            (o.storeId && o.storeId.toLowerCase() === cleanId) ||
            (o.storeName && o.storeName.toLowerCase().trim() === cleanId)
        );
        if (offerWithStore) {
          matched = {
            id: offerWithStore.storeId || storeIdentifier,
            name: offerWithStore.storeName,
            category: offerWithStore.category || "General Store",
            address: offerWithStore.address || "Kerala, India",
            phone: offerWithStore.phone || "",
            operatingHours: offerWithStore.operatingHours || "9:00 AM - 9:00 PM",
            lat: offerWithStore.lat || location.latitude,
            lng: offerWithStore.lng || location.longitude,
            imageUrl: offerWithStore.storeImageUrl || offerWithStore.imageUrl
          };
        }
      }

      if (!matched) {
        matched = {
          id: storeIdentifier,
          name: storeIdentifier.startsWith("store_") ? "Partner Store" : storeIdentifier,
          category: "Partner Store",
          address: "Kerala, India",
          phone: "",
          operatingHours: "9:00 AM - 9:00 PM",
          lat: location.latitude,
          lng: location.longitude
        };
      }

      setSelectedStore(matched);
      setStoreModalTab("chat");
    },
    [allOffers, location]
  );

  // Handle native notification taps (system tray clicks)
  useEffect(() => {
    getLastNotificationResponse().then((data) => {
      if (data && (data.order_id || data.orderId)) {
        navigate("OrderDetails", { orderId: String(data.order_id || data.orderId) });
      } else if (data && (data.type === "merchant_message" || data.type === "chat_message")) {
        openStoreChat(data.storeId || data.storeName);
      } else if (data && data.type === "deal_drop") {
        if (data.offerId) {
          const matched = allOffers.find((o) => o.id === data.offerId);
          if (matched) {
            setSelectedOfferForVoucher(matched);
            return;
          }
        }
        setShowNotificationsModal(true);
      }
    });

    const unsub = setupNotificationResponseListener((data) => {
      if (data && (data.order_id || data.orderId)) {
        navigate("OrderDetails", { orderId: String(data.order_id || data.orderId) });
      } else if (data && (data.type === "merchant_message" || data.type === "chat_message")) {
        openStoreChat(data.storeId || data.storeName);
      } else if (data && data.type === "deal_drop") {
        if (data.offerId) {
          const matched = allOffers.find((o) => o.id === data.offerId);
          if (matched) {
            setSelectedOfferForVoucher(matched);
            return;
          }
        }
        setShowNotificationsModal(true);
      }
    });

    const unsubReceived = setupNotificationForegroundReceivedListener((data) => {
      if (data && data.type === "deal_drop" && data.offerId) {
        processedOfferIdsRef.current.add(String(data.offerId));
        refreshData();
      }
    });

    return () => {
      unsub();
      unsubReceived();
    };
  }, [openStoreChat]);

  // Global listener for incoming merchant / store messages directed to this user
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeChat = subscribeToAllStoreChatMessages(
      user.id,
      (incomingMsg) => {
        const msgIdStr = String(incomingMsg.id);

        // 1. Prevent duplicate notifications for replayed events
        if (processedCustomerChatIdsRef.current.has(msgIdStr)) return;
        processedCustomerChatIdsRef.current.add(msgIdStr);
        if (processedCustomerChatIdsRef.current.size > 200) {
          const firstKey = processedCustomerChatIdsRef.current.keys().next().value;
          if (firstKey) processedCustomerChatIdsRef.current.delete(firstKey);
        }

        // 2. Suppress native notification if consumer is actively viewing this exact conversation
        const isActivelyViewingThisChat =
          selectedStoreRef.current?.id === incomingMsg.storeId && storeModalTabRef.current === "chat";

        if (!isActivelyViewingThisChat) {
          sendStoreMessageNotification(
            incomingMsg.storeName,
            incomingMsg.text,
            userRef.current?.name || userRef.current?.username || "Shopper",
            incomingMsg.storeId
          ).catch((err) => {
            console.warn("[AppContext] Customer chat notification scheduling error:", err);
          });
        }

        // 3. Add to in-app notification drawer list
        const notifItem: DealNotification = {
          id: `msg_notif_${incomingMsg.id}_${Date.now()}`,
          storeName: incomingMsg.storeName,
          discountTag: "Merchant Message",
          description: `${incomingMsg.storeName} messaged you! Tap to open.`,
          receivedAt: new Date().toISOString(),
          isRead: false,
          storeId: incomingMsg.storeId,
          type: "chat"
        };

        setNotifications((prev) => {
          const updated = [notifItem, ...prev.slice(0, 49)];
          AsyncStorage.setItem("smartshopper_saved_notifications", JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      },
      { phone: user.phone, customerId: user.customerId || user.id }
    );

    return () => {
      unsubscribeChat();
    };
  }, [user?.id, user?.phone]);

  // Realtime subscription for customer's orders so merchant status updates reflect live
  useEffect(() => {
    if (!user || customerOrders.length === 0) return;
    const orderIds = customerOrders.map((o) => o.id);
    const unsub = subscribeToCustomerOrderUpdates(user.customerId || user.id, orderIds, () => {
      refreshOrders().catch(() => {});
    });
    return () => {
      unsub();
    };
  }, [user?.id, user?.customerId, customerOrders.length, refreshOrders]);

  // All features (Cart, Delivery, Catalog, Orders) are enabled everywhere
  const isInsideKerala = true;

  // Filter offers by geofence radius and expiry
  const filteredOffers = useMemo(() => {
    const now = Date.now();
    const activeOffers = allOffers.filter((o) => {
      if (o.endAt && new Date(o.endAt).getTime() <= now) return false;
      if (o.startAt && new Date(o.startAt).getTime() > now) return false;
      return true;
    });
    if (geofenceRadius >= 999999) return activeOffers;
    return activeOffers.filter((o) => {
      const dist = calculateDistanceInMeters(location, { latitude: o.lat, longitude: o.lng });
      return dist <= geofenceRadius;
    });
  }, [allOffers, geofenceRadius, location]);

  const claimVoucher = useCallback(async (offer: OfferItem) => {
    if (!user) {
      openAuthModal("Sign in to unlock and claim this exclusive discount voucher!");
      throw new Error("AUTH_REQUIRED");
    }
    const v = await claimOfferVoucher(offer, user.name, user.phone);
    setVouchers((prev) => [v, ...prev]);
    return v;
  }, [openAuthModal, user]);

  const setManualLocation = useCallback((coords: Coordinates, name: string) => {
    locationRequestIdRef.current++;
    setIsLocationPermissionDenied(false);
    setLocation(coords);
    locationRef.current = coords;
    setLocationName(name);
    setIsGPS(false);
    isGPSRef.current = false;
    // Recompute store distance immediately in memory against new coordinates
    setStores((prev) =>
      prev.map((s) => {
        const hasCoords = typeof s.lat === "number" && typeof s.lng === "number" && !isNaN(s.lat) && !isNaN(s.lng) && (s.lat !== 0 || s.lng !== 0);
        const dist = hasCoords ? calculateDistanceInMeters(coords, { latitude: s.lat, longitude: s.lng }) : s.distanceInMeters;
        return { ...s, distanceInMeters: dist };
      })
    );
    AsyncStorage.setItem(
      "@smartshopper_manual_location",
      JSON.stringify({ coords, name })
    ).catch(() => {});
    syncLocationWithPushToken(coords, "saved_address").catch(() => {});
  }, []);

  const resetToGPSLocation = useCallback(async () => {
    setIsLocationPermissionDenied(false);
    await AsyncStorage.removeItem("@smartshopper_manual_location").catch(() => {});
    await requestGPS();
  }, [requestGPS]);

  // Asynchronously compute actual road-network distance for eligible stores within geofence
  useEffect(() => {
    let isCancelled = false;
    const computeRoadDistances = async () => {
      if (!location || !stores || stores.length === 0) return;

      // Geofence check: Air-distance is strictly preserved for store discovery & eligibility
      const eligibleStores = stores.filter((s) => {
        const airDist = s.distanceInMeters ?? calculateDistanceInMeters(location, { latitude: s.lat, longitude: s.lng });
        return geofenceRadius >= 999999 || airDist <= geofenceRadius;
      });

      for (const store of eligibleStores) {
        if (isCancelled) break;
        if (!store.lat || !store.lng) continue;

        getRoadDistance(location, { latitude: store.lat, longitude: store.lng })
          .then((res) => {
            if (!isCancelled && res) {
              setRoadDistances((prev) => {
                const entry = {
                  distanceKm: res.distanceKm,
                  distanceMeters: res.distanceMeters,
                  durationMinutes: res.durationMinutes,
                  formatted: res.formattedDistance
                };
                const updated: Record<string, typeof entry> = {
                  ...prev,
                  [store.id]: entry
                };
                if (store.name) {
                  updated[store.name.toLowerCase().trim()] = entry;
                }
                return updated;
              });
            }
          })
          .catch(() => {});
      }
    };

    computeRoadDistances();
    return () => {
      isCancelled = true;
    };
  }, [location, stores, geofenceRadius]);

  const getStoreRoadDistance = useCallback(
    (identifier?: string) => {
      if (!identifier) return undefined;
      const clean = identifier.trim();
      return roadDistances[clean] || roadDistances[clean.toLowerCase()];
    },
    [roadDistances]
  );

  const startInAppNavigation = useCallback((store: StoreProfile) => {
    setSelectedStore(null);
    setShowCartModal(false);
    setBuyNowProduct(null);
    setActiveNavStore(store);
    setNavigationTriggerTimestamp(Date.now());
  }, []);

  const stopInAppNavigation = useCallback(() => {
    setActiveNavStore(null);
  }, []);

  const contextValue = useMemo<AppContextType>(
    () => ({
      location,
      locationName,
      isGPS,
      isInsideKerala,
      geofenceRadius,
      setGeofenceRadius,
      setManualLocation,
      resetToGPSLocation,
      offers: filteredOffers,
      allOffers,
      stores,
      storesTotalCount,
      storesError,
      isLocationPermissionDenied,
      nearbyProducts,
      vouchers,
      isLoading,
      refreshData,
      claimVoucher,
      user,
      setUser,
      updateUserProfile,
      logout,
      showAuthModal,
      setShowAuthModal,
      authPromptReason,
      openAuthModal,
      selectedStore,
      setSelectedStore,
      storeModalTab,
      setStoreModalTab,
      openStoreChat,
      selectedOfferForVoucher,
      setSelectedOfferForVoucher,
      showCustomerCode,
      setShowCustomerCode,
      showAiAssistant,
      setShowAiAssistant,
      isTabBarVisible,
      setIsTabBarVisible,
      seasonalTheme,
      showRadiusModal,
      setShowRadiusModal,
      showLocationModal,
      setShowLocationModal,
      notifications,
      unreadNotificationsCount,
      showNotificationsModal,
      setShowNotificationsModal,
      markAllNotificationsRead,
      clearNotifications,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartCount,
      showCartModal,
      setShowCartModal,
      buyNowProduct,
      setBuyNowProduct,
      wishlistIds,
      toggleWishlist,
      isWishlisted,
      wishlistCount,
      deliveryAddress,
      saveDeliveryAddress,
      roadDistances,
      getStoreRoadDistance,
      activeNavStore,
      startInAppNavigation,
      stopInAppNavigation,
      navigationTriggerTimestamp,
      customerOrders,
      placeCustomerOrder,
      respondToMerchantReplacement,
      verifyOrderOtp,
      cancelCustomerOrder,
      requestOrderReplacement,
      refreshOrders,
      updateOrderStatus
    }),
    [
      location,
      locationName,
      isGPS,
      isInsideKerala,
      geofenceRadius,
      setManualLocation,
      resetToGPSLocation,
      filteredOffers,
      allOffers,
      stores,
      storesTotalCount,
      storesError,
      isLocationPermissionDenied,
      nearbyProducts,
      vouchers,
      isLoading,
      refreshData,
      claimVoucher,
      user,
      updateUserProfile,
      logout,
      showAuthModal,
      authPromptReason,
      openAuthModal,
      selectedStore,
      storeModalTab,
      openStoreChat,
      selectedOfferForVoucher,
      showCustomerCode,
      showAiAssistant,
      showRadiusModal,
      showLocationModal,
      notifications,
      unreadNotificationsCount,
      showNotificationsModal,
      markAllNotificationsRead,
      clearNotifications,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartCount,
      showCartModal,
      buyNowProduct,
      wishlistIds,
      toggleWishlist,
      isWishlisted,
      wishlistCount,
      deliveryAddress,
      saveDeliveryAddress,
      roadDistances,
      getStoreRoadDistance,
      activeNavStore,
      startInAppNavigation,
      stopInAppNavigation,
      navigationTriggerTimestamp,
      customerOrders,
      placeCustomerOrder,
      respondToMerchantReplacement,
      verifyOrderOtp,
      cancelCustomerOrder,
      requestOrderReplacement,
      refreshOrders,
      updateOrderStatus
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
