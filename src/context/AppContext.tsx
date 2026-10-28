import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Coordinates, OfferItem, StoreProfile, VoucherDetails, UserSession, DealNotification, CatalogItem, CartItem, DeliveryAddress } from "../types";
import {
  DEFAULT_LOCATION,
  calculateDistanceInMeters,
  isLocationInsideKerala,
  CONSUMER_NOTIFICATION_RADAR_METERS,
  isValidCoordinate,
  resolveEligibleConsumerLocation,
  ResolvedConsumerLocation
} from "../utils/geo";
import {
  fetchLiveOffers,
  fetchStores,
  subscribeToRealtimeDeals,
  claimOfferVoucher,
  getClaimedVouchers,
  updateUserProfile as apiUpdateUserProfile,
  saveUserDeliveryAddress as apiSaveUserDeliveryAddress,
  fetchNearbyProducts,
  subscribeToAllStoreChatMessages
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
}

export { ResolvedConsumerLocation, resolveEligibleConsumerLocation } from "../utils/geo";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [locationName, setLocationName] = useState<string>("Kochi, Kakkanad");
  const [isGPS, setIsGPS] = useState<boolean>(false);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(5000); // 5 km default
  const [allOffers, setAllOffers] = useState<OfferItem[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [nearbyProducts, setNearbyProducts] = useState<CatalogItem[]>([]);
  const [vouchers, setVouchers] = useState<VoucherDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedStore, setSelectedStore] = useState<StoreProfile | null>(null);
  const [storeModalTab, setStoreModalTab] = useState<"overview" | "hours" | "chat" | "catalog" | "reviews">("overview");
  const [selectedOfferForVoucher, setSelectedOfferForVoucher] = useState<OfferItem | null>(null);
  const [showCustomerCode, setShowCustomerCode] = useState<boolean>(false);
  const [showAiAssistant, setShowAiAssistant] = useState<boolean>(false);
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
  const storesRef = useRef<StoreProfile[]>([]);
  const isGPSRef = useRef<boolean>(false);
  const locationRef = useRef<Coordinates>(DEFAULT_LOCATION);
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

  // Restore authenticated session, saved notifications, cart, and delivery address from AsyncStorage
  useEffect(() => {
    async function restoreSessionAndNotifications() {
      try {
        const rawUser = await AsyncStorage.getItem("smartshopper_active_user");
        let activeUser: UserSession | null = null;
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed && parsed.id) {
            activeUser = parsed;
            setUser(parsed);
            userRef.current = parsed;
          }
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
        if (!isGPSRef.current && restoredAddress && typeof restoredAddress.lat === "number" && typeof restoredAddress.lng === "number" && !isNaN(restoredAddress.lat) && !isNaN(restoredAddress.lng)) {
          const coords = { latitude: restoredAddress.lat, longitude: restoredAddress.lng };
          setLocation(coords);
          locationRef.current = coords;
          if (restoredAddress.city || restoredAddress.district) {
            setLocationName(`${restoredAddress.city || restoredAddress.district}, Kerala`);
          }
        }

        const rawNotifs = await AsyncStorage.getItem("smartshopper_saved_notifications");
        if (rawNotifs) {
          setNotifications(JSON.parse(rawNotifs));
        }
        const rawCart = await AsyncStorage.getItem("smartshopper_user_cart");
        if (rawCart) {
          setCart(JSON.parse(rawCart));
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
  }, []);

  const saveCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
    AsyncStorage.setItem("smartshopper_user_cart", JSON.stringify(newCart)).catch(() => {});
  }, []);

  const addToCart = useCallback((product: CatalogItem) => {
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

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

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
      await AsyncStorage.removeItem("smartshopper_active_user");
      setUser(null);
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
    if (!isGPSRef.current && addr && typeof addr.lat === "number" && typeof addr.lng === "number" && !isNaN(addr.lat) && !isNaN(addr.lng)) {
      const coords = { latitude: addr.lat, longitude: addr.lng };
      setLocation(coords);
      locationRef.current = coords;
      if (addr.city || addr.district) {
        setLocationName(`${addr.city || addr.district}, Kerala`);
      }
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
      const res = await apiSaveUserDeliveryAddress(user.id, addr);
      if (res.success && res.user) {
        setUser(res.user);
        userRef.current = res.user;
      }
      return { success: res.success, message: res.message };
    }

    return { success: true };
  }, [user]);


  // Request GPS Location fast (prefer last known or quick fix with timeout)
  const requestGPS = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        // 1. Immediately grab last known location for zero-latency start
        const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
        if (lastKnown) {
          const coords = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude
          };
          setLocation(coords);
          setIsGPS(true);
          syncLocationWithPushToken(coords, "gps").catch(() => {});
        }

        // 2. Fetch fresh position with low accuracy/balanced and timeout
        const freshPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
        const curr = await Promise.race([freshPromise, timeoutPromise]);

        if (curr && curr.coords) {
          const coords = {
            latitude: curr.coords.latitude,
            longitude: curr.coords.longitude
          };
          setLocation(coords);
          setIsGPS(true);
          syncLocationWithPushToken(coords, "gps").catch(() => {});

          // Geocode in background without blocking
          Location.reverseGeocodeAsync(coords).then(([geo]) => {
            if (geo) {
              setLocationName(`${geo.name || geo.district || geo.city || "Current Location"}, ${geo.region || "Kerala"}`);
            }
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("GPS Request Error:", e);
    }
  }, []);

  // Fetch Data from Supabase
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [liveStores, savedVouchers] = await Promise.all([
        fetchStores(location),
        getClaimedVouchers()
      ]);
      const liveOffers = await fetchLiveOffers(location, liveStores);
      setAllOffers(liveOffers);
      setStores(liveStores);
      storesRef.current = liveStores;
      setVouchers(savedVouchers);

      // Fetch nearby store catalog products within 5 km
      const products = await fetchNearbyProducts(location, liveStores, 5000);
      setNearbyProducts(products);
    } catch (err) {
      console.error("Refresh data error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

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
      if (data && (data.type === "merchant_message" || data.type === "chat_message")) {
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
      if (data && (data.type === "merchant_message" || data.type === "chat_message")) {
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
          discountTag: "💬 Merchant Message",
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

  const isInsideKerala = useMemo(() => isLocationInsideKerala(location), [location]);

  // Filter offers by geofence radius
  const filteredOffers = useMemo(() => {
    if (geofenceRadius >= 999999) return allOffers;
    return allOffers.filter((o) => {
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
    setLocation(coords);
    locationRef.current = coords;
    setLocationName(name);
    setIsGPS(false);
    isGPSRef.current = false;
    AsyncStorage.setItem(
      "@smartshopper_manual_location",
      JSON.stringify({ coords, name })
    ).catch(() => {});
    syncLocationWithPushToken(coords, "saved_address").catch(() => {});
  }, []);

  const resetToGPSLocation = useCallback(async () => {
    await AsyncStorage.removeItem("@smartshopper_manual_location").catch(() => {});
    await requestGPS();
  }, [requestGPS]);

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
      deliveryAddress,
      saveDeliveryAddress
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
      deliveryAddress,
      saveDeliveryAddress
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
