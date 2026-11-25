import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Image, ActivityIndicator, Alert, Linking, useWindowDimensions } from "react-native";
import { AppText as Text } from "../components/common/AppText";
import { AppTextInput as TextInput } from "../components/common/AppTextInput";
import {
  Search,
  X,
  ChevronDown,
  Store,
  MapPinOff,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Package,
  MapPin,
  Heart,
  Check,
  WifiOff,
  Navigation,
  LayoutGrid,
  Utensils,
  ShoppingBasket,
  Smartphone,
  HeartPulse,
  Laptop,
  Shirt,
  Snowflake,
  ShoppingCart
} from "lucide-react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { useTabBarScroll } from "../hooks/useTabBarScroll";
import { StoreCard } from "../components/StoreCard";
import { Header } from "../components/Header";
import { SeasonalBackground } from "../components/SeasonalBackground";
import { FrostDivider, FacetedFloretteCrystal, DendriticTriForkSnowflake } from "../components/FrozenNatureElements";
import { ProductFilterTabs } from "../components/ProductFilterTabs";
import { ProductFilterTab, matchesProductFilterTab } from "../utils/productFilter";
import { TopDealsCarousel } from "../components/TopDealsCarousel";
import { formatDistance, calculateDistanceInMeters, extractAreaFromAddress } from "../utils/geo";
import { OfferItem, CatalogItem, SscBanner } from "../types";
import {
  fetchActiveSscBanners,
  getCachedActiveSscBanners,
  recordSscBannerClick,
  recordSscBannerImpression,
  subscribeToRealtimeBanners,
  BannerLocationContext
} from "../api/supabase";

const CATEGORIES = [
  "All Deals & Stores",
  "Dining",
  "Grocery",
  "Electronics",
  "Beauty",
  "Wellness",
  "IT & Services",
  "Fashion"
];

const CATEGORY_ITEMS: {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}[] = [
  { label: "All Deals & Stores", icon: LayoutGrid },
  { label: "Dining", icon: Utensils },
  { label: "Grocery", icon: ShoppingBasket },
  { label: "Electronics", icon: Smartphone },
  { label: "Beauty", icon: Sparkles },
  { label: "Wellness", icon: HeartPulse },
  { label: "IT & Services", icon: Laptop },
  { label: "Fashion", icon: Shirt }
];

const RADIUS_PRESETS = [
  { label: "1 km", value: 1000 },
  { label: "2 km", value: 2000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
  { label: "15 km", value: 15000 },
  { label: "25 km", value: 25000 },
  { label: "All", value: 999999 }
];

function calculateDiscountPercent(orig?: string, offer?: string): string | null {
  if (!orig || !offer) return null;
  const oNum = parseFloat(orig.replace(/[^\d.]/g, ""));
  const fNum = parseFloat(offer.replace(/[^\d.]/g, ""));
  if (oNum > 0 && fNum > 0 && oNum > fNum) {
    const pct = Math.round(((oNum - fNum) / oNum) * 100);
    return `${pct}% OFF`;
  }
  return null;
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { onScroll: onScrollTabBar } = useTabBarScroll();
  const { width: windowWidth } = useWindowDimensions();

  // Responsive 3-column product grid calculation (falls back to 2 columns on narrow/small devices < 360dp)
  const isThreeColumns = windowWidth >= 360;
  const productColumns = isThreeColumns ? 3 : 2;
  const productGridGap = isThreeColumns ? 8 : 12;
  const productGridPadding = isThreeColumns ? 12 : 14;
  const productCardWidth = Math.floor(
    (windowWidth - productGridPadding * 2 - productGridGap * (productColumns - 1)) / productColumns
  );
  const productImgHeight = isThreeColumns ? Math.round(productCardWidth * 0.95) : 140;

  const {
    offers,
    allOffers,
    stores,
    storesTotalCount,
    storesError,
    isLocationPermissionDenied,
    location,
    locationName,
    isGPS,
    resetToGPSLocation,
    setShowLocationModal,
    nearbyProducts,
    isInsideKerala,
    geofenceRadius,
    setGeofenceRadius,
    setShowRadiusModal,
    setSelectedStore,
    setSelectedOfferForVoucher,
    addToCart,
    setBuyNowProduct,
    setShowCartModal,
    wishlistIds,
    toggleWishlist,
    wishlistCount,
    isLoading,
    refreshData,
    getStoreRoadDistance,
    deliveryAddress,
    seasonalTheme
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState("All Deals & Stores");
  const [selectedProductTab, setSelectedProductTab] = useState<ProductFilterTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [promotionalBanners, setPromotionalBanners] = useState<SscBanner[]>([]);
  const isFocused = useIsFocused();
  const trackedImpressionIdsRef = React.useRef<Set<string>>(new Set());
  const lastBannerFetchTimeRef = React.useRef<number>(0);

  // 1. Initial instant load from offline cache for 0ms startup latency
  React.useEffect(() => {
    let isMounted = true;
    getCachedActiveSscBanners().then((cached) => {
      if (isMounted && cached.length > 0) {
        setPromotionalBanners(cached);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch active eligible banners based on live location targeting and focus
  const loadPromoBanners = React.useCallback(async () => {
    try {
      const locationContext: BannerLocationContext = {};
      if (!isLocationPermissionDenied && location) {
        locationContext.latitude = location.latitude;
        locationContext.longitude = location.longitude;
        if (deliveryAddress?.district) {
          locationContext.district = deliveryAddress.district;
        }
        if (deliveryAddress?.city) {
          locationContext.city = deliveryAddress.city;
        }
        if (deliveryAddress?.pincode) {
          locationContext.pincode = deliveryAddress.pincode;
        }
      }

      const list = await fetchActiveSscBanners(locationContext);
      lastBannerFetchTimeRef.current = Date.now();
      setPromotionalBanners(list);

      // Track impressions once per session per banner
      list.forEach((b) => {
        if (!trackedImpressionIdsRef.current.has(b.id)) {
          trackedImpressionIdsRef.current.add(b.id);
          recordSscBannerImpression(b.id);
        }
      });
    } catch (err) {
      console.warn("[HomeScreen] loadPromoBanners error:", err);
    }
  }, [location, isLocationPermissionDenied, deliveryAddress]);

  React.useEffect(() => {
    if (!isFocused) return;

    // Throttle refetches on quick re-focus (within 10s) unless location changed
    const now = Date.now();
    if (now - lastBannerFetchTimeRef.current < 10000 && promotionalBanners.length > 0) {
      return;
    }

    loadPromoBanners();
  }, [isFocused, loadPromoBanners, promotionalBanners.length]);

  // 3. Real-time synchronization: Instantly reflect SSA Banner create/edit/delete/reorder
  React.useEffect(() => {
    const unsubscribe = subscribeToRealtimeBanners(() => {
      lastBannerFetchTimeRef.current = 0;
      loadPromoBanners();
    });

    return () => {
      unsubscribe();
    };
  }, [loadPromoBanners]);

  const STORES_PAGE_SIZE = 10;
  const [visibleStoreLimit, setVisibleStoreLimit] = useState(STORES_PAGE_SIZE);

  // Wishlist visibility: Visible only when user's confirmed location is inside Kerala,
  // or when location permission is denied / location unavailable (never assumed outside Kerala).
  // Outside Kerala, completely hidden with no disabled icon or placeholder.
  const isWishlistVisible = isInsideKerala || isLocationPermissionDenied || !location;

  // Track exploration options for when no stores are within 5 km
  const [dealDiscoveryMode, setDealDiscoveryMode] = useState<"all" | "nearby">("all");
  const [selectedNearbyArea, setSelectedNearbyArea] = useState<string>("All");

  // Determine stores strictly within 5 km air-distance radius
  const storesWithin5km = React.useMemo(() => {
    return stores.filter((s) => {
      const hasCoords =
        typeof s.lat === "number" &&
        typeof s.lng === "number" &&
        !isNaN(s.lat) &&
        !isNaN(s.lng) &&
        (s.lat !== 0 || s.lng !== 0);
      const liveDist =
        hasCoords && location
          ? calculateDistanceInMeters(location, { latitude: s.lat, longitude: s.lng })
          : s.distanceInMeters;
      return liveDist !== undefined && liveDist <= 5000;
    });
  }, [stores, location]);

  // Welcoming experience condition:
  // Shows ONLY when store query confirms 0 eligible stores within 5 km,
  // NOT while loading, NOT on API/network errors, and NOT when GPS permission is denied.
  const hasNoNearbyStores =
    !isLoading &&
    !storesError &&
    !isLocationPermissionDenied &&
    storesWithin5km.length === 0;

  // Active deals across all locations (Option A - not restricted to 5 km)
  const activeAllOffers = React.useMemo(() => {
    const now = Date.now();
    return allOffers.filter((o) => {
      if ((o as any).isDeleted) return false;
      if (o.endAt && new Date(o.endAt).getTime() <= now) return false;
      if (o.startAt && new Date(o.startAt).getTime() > now) return false;
      if (o.expiresAt && new Date(o.expiresAt).getTime() <= now) return false;
      return true;
    });
  }, [allOffers]);

  // Geographically nearby areas with active deals/stores (Option B)
  // Computes real air distance to each area without hardcoded numbers, sorted closest first
  const nearbyAreas = React.useMemo(() => {
    const areaMap = new Map<string, { minDistance: number | null; count: number }>();

    activeAllOffers.forEach((o) => {
      const area = extractAreaFromAddress(o.address);
      let distKm: number | null = null;
      if (location && o.lat && o.lng) {
        const distM = calculateDistanceInMeters(location, { latitude: o.lat, longitude: o.lng });
        distKm = Math.round(distM / 1000);
      }

      const existing = areaMap.get(area);
      if (!existing) {
        areaMap.set(area, { minDistance: distKm, count: 1 });
      } else {
        existing.count += 1;
        if (distKm !== null && (existing.minDistance === null || distKm < existing.minDistance)) {
          existing.minDistance = distKm;
        }
      }
    });

    const list = Array.from(areaMap.entries()).map(([area, val]) => ({
      area,
      distanceKm: val.minDistance,
      count: val.count
    }));

    list.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    return list;
  }, [activeAllOffers, location]);

  // Filtered discovery deals based on active discovery mode & selected area
  const displayedDiscoveryDeals = React.useMemo(() => {
    if (dealDiscoveryMode === "all") {
      return activeAllOffers;
    }
    if (selectedNearbyArea === "All") {
      return activeAllOffers;
    }
    return activeAllOffers.filter((o) => extractAreaFromAddress(o.address) === selectedNearbyArea);
  }, [activeAllOffers, dealDiscoveryMode, selectedNearbyArea]);

  const filteredDeals = offers.filter((o) => {
    const now = Date.now();
    if (o.endAt && new Date(o.endAt).getTime() <= now) return false;
    if (o.startAt && new Date(o.startAt).getTime() > now) return false;

    if (searchInput.trim()) {
      const q = searchInput.toLowerCase().trim();
      const match =
        o.storeName.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.discountTag.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (selectedCategory !== "All Deals & Stores" && o.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    return true;
  });

  const filteredStores = React.useMemo(() => {
    return stores
      .map((s) => {
        const hasCoords =
          typeof s.lat === "number" &&
          typeof s.lng === "number" &&
          !isNaN(s.lat) &&
          !isNaN(s.lng) &&
          (s.lat !== 0 || s.lng !== 0);
        const liveDist =
          hasCoords && location
            ? calculateDistanceInMeters(location, { latitude: s.lat, longitude: s.lng })
            : s.distanceInMeters;

        return {
          ...s,
          distanceInMeters: liveDist
        };
      })
      .filter((s) => {
        // 1. Geofence radius filter
        if (geofenceRadius < 999999) {
          const dist = s.distanceInMeters;
          if (dist === undefined || dist > geofenceRadius) return false;
        }

        // 2. Search query filter
        if (searchInput.trim()) {
          const q = searchInput.toLowerCase().trim();
          const match =
            s.name.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q) ||
            s.address.toLowerCase().includes(q);
          if (!match) return false;
        }

        // 3. Category filter
        if (
          selectedCategory !== "All Deals & Stores" &&
          s.category.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.distanceInMeters ?? 999999) - (b.distanceInMeters ?? 999999));
  }, [stores, geofenceRadius, searchInput, selectedCategory, location]);

  // Reset pagination limit when filter parameters change
  React.useEffect(() => {
    setVisibleStoreLimit(STORES_PAGE_SIZE);
  }, [geofenceRadius, searchInput, selectedCategory, location]);

  const displayedStores = React.useMemo(() => {
    // Map filteredStores into paginated display slice
    return filteredStores.map((s) => (s)).slice(0, visibleStoreLimit);
  }, [filteredStores, visibleStoreLimit]);

  const hasMoreStores = filteredStores.length > visibleStoreLimit;

  const filteredProducts = React.useMemo(() => {
    return nearbyProducts.filter((p) => {
      // Must be within 5 km radius
      if ((p.distanceInMeters ?? 999999) > 5000) return false;

      // Search query filter
      if (searchInput.trim()) {
        const q = searchInput.toLowerCase().trim();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.storeName && p.storeName.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Category filter
      if (
        selectedCategory !== "All Deals & Stores" &&
        p.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      // 4-Option Product Type / Delivery Filter Tab
      if (!matchesProductFilterTab(p, selectedProductTab)) {
        return false;
      }

      return true;
    });
  }, [nearbyProducts, isInsideKerala, searchInput, selectedCategory, selectedProductTab]);

  const handleProductPress = (product: CatalogItem) => {
    (navigation as any).navigate("ProductDetails", {
      productId: product.id,
      product
    });
  };


  const handleAddToCart = (item: CatalogItem) => {
    if (item.isDeleted) {
      Alert.alert("Product Unavailable", "This product has been removed by the merchant and cannot be added to cart.");
      return;
    }
    addToCart(item);
    const shortTitle = item.name.length > 22 ? item.name.slice(0, 22) + "..." : item.name;
    setCartFeedback(`Added "${shortTitle}" to cart!`);
    setTimeout(() => {
      setCartFeedback(null);
    }, 2800);
  };

  const handleBuyNow = (item: CatalogItem) => {
    if (item.isDeleted) {
      Alert.alert("Product Unavailable", "This product has been removed by the merchant and cannot be ordered.");
      return;
    }
    if (!item.inStock) {
      Alert.alert("Out of Stock", "This product is currently out of stock.");
      return;
    }
    // 1. Add selected product to cart (preserves product ID, price, store relationship, quantity, avoids duplicates)
    addToCart(item);
    // 2. Redirect user directly to the Cart screen
    (navigation as any).navigate("MainTabs", { screen: "Cart" });
  };

  const handlePressBanner = (banner: SscBanner) => {
    recordSscBannerClick(banner.id);

    const targetType = (banner.redirectType || banner.linkType || "none").toLowerCase();
    const targetVal = banner.redirectTarget || banner.targetId || banner.customUrl;

    if (targetType === "store" && targetVal) {
      const foundStore = stores.find((s) => s.id === targetVal);
      if (foundStore) {
        setSelectedStore(foundStore);
      } else {
        (navigation as any).navigate("Deals");
      }
    } else if ((targetType === "deal" || targetType === "offer") && targetVal) {
      const foundDeal = (allOffers || offers).find((o) => o.id === targetVal);
      if (foundDeal) {
        setSelectedOfferForVoucher(foundDeal);
      } else {
        (navigation as any).navigate("Deals");
      }
    } else if (targetType === "product" && targetVal) {
      const foundProduct = nearbyProducts.find((p) => p.id === targetVal);
      if (foundProduct) {
        (navigation as any).navigate("ProductDetails", {
          productId: foundProduct.id,
          product: foundProduct
        });
      } else {
        // Fallback: Navigate to Deals tab if specific product is not in immediate radius
        (navigation as any).navigate("Deals");
      }
    } else if (targetType === "category" && targetVal) {
      const matchedCat = CATEGORIES.find(
        (c) => c.toLowerCase() === targetVal.toLowerCase()
      );
      setSelectedCategory(matchedCat || targetVal);
    } else if ((targetType === "custom_url" || targetType === "external") && targetVal) {
      let finalUrl = targetVal.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      Linking.canOpenURL(finalUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(finalUrl).catch((err) =>
              console.warn("[HomeScreen] Could not open banner external URL:", err)
            );
          }
        })
        .catch((err) => console.warn("[HomeScreen] Error validating banner URL:", err));
    }
  };

  const radiusLabel = geofenceRadius >= 999999 ? "Unlimited" : formatDistance(geofenceRadius);

  return (
    <View style={[styles.container, { backgroundColor: seasonalTheme.backgroundColor }]}>
      <SeasonalBackground theme={seasonalTheme} />
      <ScrollView
        stickyHeaderIndices={[1]}
        onScroll={onScrollTabBar}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={["#EA580C"]} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 84 }}
      >
        {/* Child 0: Main Header (scrolls away naturally with page) */}
        <Header />

        {/* Child 1: Sticky Search Bar & Category Row */}
        <View
          style={[
            styles.stickyTopControls,
            {
              backgroundColor: seasonalTheme.surfaceColor,
              borderBottomColor: seasonalTheme.surfaceBorderColor
            }
          ]}
        >
          {/* Subtle Winter Ice Crystal Accent in Search Area */}
          {seasonalTheme.isWinter && (
            <View pointerEvents="none" style={styles.searchWinterCrystal}>
              <FacetedFloretteCrystal size={16} opacity={0.45} />
            </View>
          )}

          {/* Search Bar & Wishlist at the Top */}
          <View style={styles.searchSection}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: seasonalTheme.inputSurfaceColor,
                  borderColor: seasonalTheme.surfaceBorderColor
                }
              ]}
            >
              <Search size={14} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search deals, stores, or items..."
                placeholderTextColor="#94A3B8"
                value={searchInput}
                onChangeText={setSearchInput}
                returnKeyType="search"
              />
              {searchInput ? (
                <TouchableOpacity
                  onPress={() => setSearchInput("")}
                  style={styles.clearSearchBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Clear search input"
                >
                  <X size={14} color="#64748B" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Wishlist Icon Button */}
            {isWishlistVisible && (
              <TouchableOpacity
                style={[
                  styles.wishlistHeaderBtn,
                  { borderColor: seasonalTheme.surfaceBorderColor }
                ]}
                onPress={() => (navigation as any).navigate("Wishlist")}
                activeOpacity={0.75}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="My Wishlist"
              >
                <Heart
                  size={19}
                  color={wishlistCount > 0 ? "#EA580C" : "#0F172A"}
                  fill={wishlistCount > 0 ? "#EA580C" : "transparent"}
                />
                {wishlistCount > 0 && (
                  <View style={styles.wishlistBadge}>
                    <Text style={styles.wishlistBadgeText}>
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Horizontal Minimal Category Row */}
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORY_ITEMS.map(({ label, icon: IconComponent }) => {
              const isSelected = selectedCategory === label;
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
                  onPress={() => setSelectedCategory(label)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <IconComponent
                    size={15}
                    color="#0F172A"
                    strokeWidth={isSelected ? 2.25 : 1.75}
                  />
                  <Text
                    style={[styles.categoryItemText, isSelected && styles.categoryItemTextSelected]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Child 2: Main Scrollable Content */}
        <View>
          <View style={styles.headerComponent}>
          {/* Top Deals Auto-Swiping Carousel with Dynamic SSA Promotional Banners */}
            <TopDealsCarousel
              deals={filteredDeals}
              stores={stores}
              banners={promotionalBanners}
              onPressBanner={handlePressBanner}
              onPressDeal={(deal) => setSelectedOfferForVoucher(deal)}
              onPressExplore={() => (navigation as any).navigate("Deals")}
            />

            {/* Subtle Winter Divider Framing Below Banner Carousel */}
            {seasonalTheme.isWinter && (
              <FrostDivider style={{ marginVertical: 6 }} />
            )}

            {/* Location-Aware Welcome Experience (Shown ONLY when 0 stores within 5 km, not loading, not error, not GPS denied) */}
            {hasNoNearbyStores && (
              <View style={styles.welcomeSection}>
                <View style={styles.welcomeCard}>
                  <View style={styles.welcomeHeaderRow}>
                    <View style={styles.welcomeIconCircle}>
                      <Sparkles size={18} color="#EA580C" />
                    </View>
                    <View style={styles.welcomeTitleCol}>
                      <Text style={styles.welcomeMainTitle}>
                        SmartShopper is coming to your area!
                      </Text>
                      <View style={styles.welcomeComingSoonBadge}>
                        <Text style={styles.welcomeComingSoonText}>EXPANDING SOON</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.welcomeParagraph}>
                    {"SmartShopper hasn't reached your neighbourhood yet. We're working to bring more local stores to your area soon."}
                  </Text>

                  <Text style={styles.welcomeParagraphSub}>
                    Meanwhile, you can still use SmartShopper to explore deals and discover shopping opportunities when you visit other places.
                  </Text>

                  {/* Discovery Mode Selector (Option A vs Option B) */}
                  <View style={styles.discoveryModeRow}>
                    <TouchableOpacity
                      style={[
                        styles.discoveryModeBtn,
                        dealDiscoveryMode === "all" && styles.discoveryModeBtnActive
                      ]}
                      onPress={() => setDealDiscoveryMode("all")}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.discoveryModeBtnText,
                          dealDiscoveryMode === "all" && styles.discoveryModeBtnTextActive
                        ]}
                      >
                        All Locations ({activeAllOffers.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.discoveryModeBtn,
                        dealDiscoveryMode === "nearby" && styles.discoveryModeBtnActive
                      ]}
                      onPress={() => setDealDiscoveryMode("nearby")}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.discoveryModeBtnText,
                          dealDiscoveryMode === "nearby" && styles.discoveryModeBtnTextActive
                        ]}
                      >
                        Nearby Areas ({nearbyAreas.length})
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Option B: Geographically Nearby Areas Filter Chips */}
                  {dealDiscoveryMode === "nearby" && (
                    <View style={styles.nearbyChipsSection}>
                      <Text style={styles.nearbyChipsHeading}>AREAS WITH ACTIVE OFFERS:</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.nearbyChipsRow}
                      >
                        <TouchableOpacity
                          style={[
                            styles.nearbyAreaChip,
                            selectedNearbyArea === "All" && styles.nearbyAreaChipActive
                          ]}
                          onPress={() => setSelectedNearbyArea("All")}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.nearbyAreaChipText,
                              selectedNearbyArea === "All" && styles.nearbyAreaChipTextActive
                            ]}
                          >
                            All Nearby Areas
                          </Text>
                        </TouchableOpacity>

                        {nearbyAreas.map((item) => {
                          const isSel = selectedNearbyArea === item.area;
                          const distText = item.distanceKm !== null ? ` (~${item.distanceKm} km)` : "";
                          return (
                            <TouchableOpacity
                              key={item.area}
                              style={[styles.nearbyAreaChip, isSel && styles.nearbyAreaChipActive]}
                              onPress={() => setSelectedNearbyArea(item.area)}
                              activeOpacity={0.8}
                            >
                              <MapPin size={10} color={isSel ? "#FFFFFF" : "#EA580C"} />
                              <Text
                                style={[
                                  styles.nearbyAreaChipText,
                                  isSel && styles.nearbyAreaChipTextActive
                                ]}
                              >
                                {item.area}{distText}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Real Discovery Deals Listing */}
                  <View style={styles.discoveryDealsList}>
                    {displayedDiscoveryDeals.length === 0 ? (
                      <View style={styles.discoveryEmptyCard}>
                        <Text style={styles.discoveryEmptyText}>
                          No active deals found for this selection.
                        </Text>
                      </View>
                    ) : (
                      displayedDiscoveryDeals.map((deal) => {
                        const area = extractAreaFromAddress(deal.address);
                        const distKm =
                          location && deal.lat && deal.lng
                            ? Math.round(
                                calculateDistanceInMeters(location, {
                                  latitude: deal.lat,
                                  longitude: deal.lng
                                }) / 1000
                              )
                            : null;
                        const distBadge = distKm !== null ? `${area} (~${distKm} km)` : area;

                        return (
                          <View key={deal.id} style={styles.discoveryDealCard}>
                            <View style={styles.discoveryDealTopRow}>
                              <View style={styles.discoveryStoreInfo}>
                                <Store size={12} color="#64748B" />
                                <Text style={styles.discoveryStoreName} numberOfLines={1}>
                                  {deal.storeName}
                                </Text>
                              </View>
                              <View style={styles.discoveryLocationPill}>
                                <MapPin size={9} color="#EA580C" />
                                <Text style={styles.discoveryLocationPillText} numberOfLines={1}>
                                  {distBadge}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.discoveryDealTitle} numberOfLines={2}>
                              {deal.title || deal.description}
                            </Text>

                            <View style={styles.discoveryDealBottomRow}>
                              <View style={styles.discoveryPriceWrap}>
                                <Text style={styles.discoveryOfferPrice}>{deal.offerPrice}</Text>
                                {deal.originalPrice ? (
                                  <Text style={styles.discoveryOrigPrice}>{deal.originalPrice}</Text>
                                ) : null}
                                <View style={styles.discoveryDiscountPill}>
                                  <Text style={styles.discoveryDiscountPillText}>
                                    {deal.discountTag}
                                  </Text>
                                </View>
                              </View>

                              <TouchableOpacity
                                style={styles.discoveryViewDealBtn}
                                onPress={() => setSelectedOfferForVoucher(deal)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.discoveryViewDealBtnText}>View Deal</Text>
                                <ChevronRight size={13} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>

                  {/* Explore in Deals Tab Navigation Action */}
                  <TouchableOpacity
                    style={styles.exploreDealsLinkBtn}
                    onPress={() => (navigation as any).navigate("Deals")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.exploreDealsLinkText}>Explore All in Deals Tab</Text>
                    <ChevronRight size={14} color="#EA580C" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* SENSITIVE SECTION: Flipkart-Style Products (5 KM Radius - Kerala Only) */}
            {isInsideKerala && (
              <View style={styles.productsSection}>
                {/* 5-Option Folder-Style Product Filter Tabs + Connected Container */}
                <View style={styles.productFilterSection}>
                  <ProductFilterTabs
                    selectedTab={selectedProductTab}
                    onSelectTab={setSelectedProductTab}
                  />

                  <View style={styles.productTabsContainer}>
                    {filteredProducts.length === 0 ? (
                      <View style={styles.emptyProductsCard}>
                        <Package size={28} color="#94A3B8" />
                        <Text style={styles.emptyProductsText}>
                          {selectedProductTab === "all_india"
                            ? "No products eligible for All India Delivery found"
                            : selectedProductTab === "nearby"
                            ? "No nearby store products found within 5 km of your location"
                            : selectedProductTab === "digital"
                            ? "No digital products found within 5 km"
                            : selectedProductTab === "physical"
                            ? "No physical products found within 5 km"
                            : "No store products found within 5 km of your location"}
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.flipkartGrid,
                          {
                            gap: productGridGap,
                            paddingHorizontal: productGridPadding
                          }
                        ]}
                      >
                        {filteredProducts.map((item) => {
                      const discountPct = calculateDiscountPercent(
                        item.originalPrice,
                        item.offerPrice
                      );
                      const isFav = wishlistIds.has(item.id);

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.flipkartCard,
                            {
                              width: productCardWidth,
                              backgroundColor: seasonalTheme.cardSurfaceColor,
                              borderColor: seasonalTheme.surfaceBorderColor
                            }
                          ]}
                        >
                          {/* Image Container with Wishlist & Category Badges */}
                          <TouchableOpacity
                            style={[
                              styles.fkImgContainer,
                              { height: productImgHeight }
                            ]}
                            onPress={() => handleProductPress(item)}
                            activeOpacity={0.9}
                          >
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={styles.fkProductImg}
                              resizeMode="cover"
                            />

                            {/* Wishlist Heart Icon */}
                            <TouchableOpacity
                              style={[
                                styles.fkHeartBtn,
                                isThreeColumns && styles.fkHeartBtnCompact
                              ]}
                              onPress={() => toggleWishlist(item.id)}
                              activeOpacity={0.7}
                            >
                              <Heart
                                size={isThreeColumns ? 12 : 14}
                                color={isFav ? "#EF4444" : "#64748B"}
                                fill={isFav ? "#EF4444" : "transparent"}
                              />
                            </TouchableOpacity>

                            {/* Category Badge */}
                            {item.category ? (
                              <View
                                style={[
                                  styles.fkCategoryBadge,
                                  isThreeColumns && styles.fkCategoryBadgeCompact
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.fkCategoryText,
                                    isThreeColumns && styles.fkCategoryTextCompact
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.category.toUpperCase()}
                                </Text>
                              </View>
                            ) : null}

                            {/* Distance Tag - Road Distance */}
                            {(() => {
                              const roadInfo = getStoreRoadDistance(item.storeId || item.storeName || "");
                              return (
                                <View
                                  style={[
                                    styles.fkDistanceBadge,
                                    isThreeColumns && styles.fkDistanceBadgeCompact
                                  ]}
                                >
                                  <MapPin size={isThreeColumns ? 8 : 9} color="#16A34A" />
                                  <Text
                                    style={[
                                      styles.fkDistanceText,
                                      isThreeColumns && styles.fkDistanceTextCompact
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {roadInfo ? roadInfo.formatted : "Nearby"}
                                  </Text>
                                </View>
                              );
                            })()}
                          </TouchableOpacity>

                          {/* Card Body */}
                          <View
                            style={[
                              styles.fkCardBody,
                              isThreeColumns && styles.fkCardBodyCompact
                            ]}
                          >
                            {/* Store Name with icon */}
                            <TouchableOpacity
                              style={styles.fkStoreRow}
                              onPress={() => handleProductPress(item)}
                              activeOpacity={0.8}
                            >
                              <Store size={isThreeColumns ? 9 : 10} color="#64748B" />
                              <Text
                                style={[
                                  styles.fkStoreName,
                                  isThreeColumns && styles.fkStoreNameCompact
                                ]}
                                numberOfLines={1}
                              >
                                {item.storeName || "Partner Store"}
                              </Text>
                            </TouchableOpacity>

                            {/* Product Title */}
                            <TouchableOpacity
                              onPress={() => handleProductPress(item)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.fkTitle,
                                  isThreeColumns && styles.fkTitleCompact
                                ]}
                                numberOfLines={2}
                              >
                                {item.name}
                              </Text>
                            </TouchableOpacity>

                            {/* Flipkart Price Section */}
                            <TouchableOpacity
                              style={styles.fkPriceRow}
                              onPress={() => handleProductPress(item)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.fkOfferPrice,
                                  isThreeColumns && styles.fkOfferPriceCompact
                                ]}
                              >
                                {item.offerPrice || "Special"}
                              </Text>
                              {item.originalPrice ? (
                                <Text
                                  style={[
                                    styles.fkOrigPrice,
                                    isThreeColumns && styles.fkOrigPriceCompact
                                  ]}
                                >
                                  {item.originalPrice}
                                </Text>
                              ) : null}
                              {discountPct ? (
                                <Text
                                  style={[
                                    styles.fkDiscountText,
                                    isThreeColumns && styles.fkDiscountTextCompact
                                  ]}
                                >
                                  {discountPct}
                                </Text>
                              ) : null}
                            </TouchableOpacity>

                            {/* Add to Cart Button */}
                            <TouchableOpacity
                              style={[
                                styles.fkAddToCartBtn,
                                isThreeColumns && styles.fkAddToCartBtnCompact
                              ]}
                              onPress={() => handleAddToCart(item)}
                              activeOpacity={0.8}
                            >
                              <ShoppingCart size={isThreeColumns ? 11 : 13} color="#EA580C" />
                              <Text
                                style={[
                                  styles.fkAddToCartText,
                                  isThreeColumns && styles.fkAddToCartTextCompact
                                ]}
                                numberOfLines={1}
                              >
                                Add to Cart
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
          <View style={styles.footerComponent}>
            {/* Subtle Frost Divider before Stores Section */}
            {seasonalTheme.isWinter && (
              <FrostDivider style={{ marginBottom: 10, marginTop: 4 }} />
            )}

            {/* Section 2: Stores Around You */}
            <View
              style={[
                styles.storesSection,
                {
                  backgroundColor: seasonalTheme.sectionSurfaceColor,
                  borderColor: seasonalTheme.surfaceBorderColor
                }
              ]}
            >
              {/* Subtle Winter Ice Crystal Accent in Section Corner */}
              {seasonalTheme.isWinter && (
                <View pointerEvents="none" style={styles.storesWinterFrostDecor}>
                  <FacetedFloretteCrystal size={22} opacity={0.35} />
                </View>
              )}

              <View style={styles.storesHeaderRow}>
                <View style={styles.storeIconBox}>
                  <Store size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, paddingLeft: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.storesSectionTitle}>Stores Around You</Text>
                    {seasonalTheme.isWinter && (
                      <Snowflake size={14} color="#3B82F6" />
                    )}
                    <View style={styles.storeCountPill}>
                      <Text style={styles.storeCountText}>
                        {hasMoreStores
                          ? `Showing ${displayedStores.length} of ${filteredStores.length} Stores`
                          : `${filteredStores.length} ${filteredStores.length === 1 ? "Store" : "Stores"}`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.storesSectionSubtitle}>
                    Listing partner stores within {radiusLabel}
                  </Text>
                </View>
              </View>

              {/* Quick Radius Selector Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.radiusChipsRow}
              >
                <Text style={styles.radiusChipsPrefix}>RADIUS:</Text>
                {RADIUS_PRESETS.map((p) => {
                  const isCur = geofenceRadius === p.value;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[
                        styles.presetChip,
                        !isCur && {
                          backgroundColor: seasonalTheme.cardSurfaceColor,
                          borderColor: seasonalTheme.surfaceBorderColor
                        },
                        isCur && styles.presetChipActive
                      ]}
                      onPress={() => setGeofenceRadius(p.value)}
                    >
                      <Text style={[styles.presetChipText, isCur && styles.presetChipTextActive]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Stores Discovery Body: Loading, Error, Location-Denied, Empty, or Results */}
              {isLoading && stores.length === 0 ? (
                <View
                  style={[
                    styles.storesStateCard,
                    {
                      backgroundColor: seasonalTheme.cardSurfaceColor,
                      borderColor: seasonalTheme.surfaceBorderColor
                    }
                  ]}
                >
                  <ActivityIndicator size="small" color="#EA580C" />
                  <Text style={styles.storesStateTitle}>Searching nearby partner stores...</Text>
                  <Text style={styles.storesStateDesc}>
                    Finding verified SmartShopper stores within your selected radius.
                  </Text>
                </View>
              ) : storesError && stores.length === 0 ? (
                <View
                  style={[
                    styles.storesStateCard,
                    {
                      backgroundColor: seasonalTheme.cardSurfaceColor,
                      borderColor: seasonalTheme.surfaceBorderColor
                    }
                  ]}
                >
                  <View style={styles.storesStateIconCircle}>
                    <WifiOff size={24} color="#EA580C" />
                  </View>
                  <Text style={styles.storesStateTitle}>Unable to Load Stores</Text>
                  <Text style={styles.storesStateDesc}>
                    Could not connect to SmartShopper servers. Please check your internet connection.
                  </Text>
                  <TouchableOpacity
                    style={styles.stateActionBtn}
                    onPress={() => refreshData()}
                    activeOpacity={0.8}
                  >
                    <RefreshCw size={13} color="#FFFFFF" />
                    <Text style={styles.stateActionBtnText}>Retry Connection</Text>
                  </TouchableOpacity>
                </View>
              ) : isLocationPermissionDenied && !isGPS ? (
                <View
                  style={[
                    styles.storesStateCard,
                    {
                      backgroundColor: seasonalTheme.cardSurfaceColor,
                      borderColor: seasonalTheme.surfaceBorderColor
                    }
                  ]}
                >
                  <View style={styles.storesStateIconCircle}>
                    <Navigation size={24} color="#EA580C" />
                  </View>
                  <Text style={styles.storesStateTitle}>Location Access Needed</Text>
                  <Text style={styles.storesStateDesc}>
                    Enable location access or choose your area manually to discover stores near you.
                  </Text>
                  <View style={styles.dualActionRow}>
                    <TouchableOpacity
                      style={styles.stateActionBtn}
                      onPress={() => setShowLocationModal(true)}
                      activeOpacity={0.8}
                    >
                      <MapPin size={13} color="#FFFFFF" />
                      <Text style={styles.stateActionBtnText}>Choose Location</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stateOutlineBtn}
                      onPress={() => resetToGPSLocation()}
                      activeOpacity={0.8}
                    >
                      <RefreshCw size={13} color="#EA580C" />
                      <Text style={styles.stateOutlineBtnText}>Enable GPS</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : filteredStores.length === 0 ? (
                <View style={styles.noStoresBox}>
                  <View style={styles.noStoresIconCircle}>
                    <MapPinOff size={28} color="#EA580C" />
                  </View>
                  <Text style={styles.noStoresTitle}>
                    {hasNoNearbyStores && geofenceRadius <= 5000
                      ? "SmartShopper is coming to your area soon!"
                      : geofenceRadius < 999999
                      ? `No stores found within ${radiusLabel}`
                      : "No stores match your search"}
                  </Text>
                  <Text style={styles.noStoresDesc}>
                    {hasNoNearbyStores && geofenceRadius <= 5000
                      ? "SmartShopper hasn't reached your neighbourhood yet. Try expanding your radius to explore partner stores in nearby areas, or change your location."
                      : geofenceRadius < 999999
                      ? `There are currently no registered SmartShopper partner stores within ${radiusLabel} of your location. Try expanding your radius or browse all stores.`
                      : "Try adjusting your search terms or selecting a different category."}
                  </Text>
                  <View style={styles.emptyActionRow}>
                    {geofenceRadius < 15000 && (
                      <TouchableOpacity
                        style={styles.expandRadiusBtn}
                        onPress={() => setGeofenceRadius(15000)}
                        activeOpacity={0.8}
                      >
                        <RefreshCw size={13} color="#EA580C" />
                        <Text style={styles.expandRadiusBtnText}>Try 15 km Radius</Text>
                      </TouchableOpacity>
                    )}
                    {geofenceRadius < 999999 && (
                      <TouchableOpacity
                        style={[styles.expandRadiusBtn, { backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }]}
                        onPress={() => setGeofenceRadius(999999)}
                        activeOpacity={0.8}
                      >
                        <Store size={13} color="#EA580C" />
                        <Text style={styles.expandRadiusBtnText}>Browse All Stores</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.expandRadiusBtn, { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" }]}
                      onPress={() => setShowLocationModal(true)}
                      activeOpacity={0.8}
                    >
                      <MapPin size={13} color="#475569" />
                      <Text style={[styles.expandRadiusBtnText, { color: "#475569" }]}>Change Location</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.storeCardsGrid}>
                    {displayedStores.map((s) => (
                      <StoreCard
                        key={s.id}
                        store={s}
                        style={{ width: "48.2%" }}
                      />
                    ))}
                  </View>

                  {hasMoreStores && (
                    <TouchableOpacity
                      style={styles.loadMoreStoresBtn}
                      onPress={() => setVisibleStoreLimit((prev) => prev + STORES_PAGE_SIZE)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.loadMoreStoresText}>
                        Load More Stores ({filteredStores.length - displayedStores.length} remaining)
                      </Text>
                      <ChevronDown size={14} color="#EA580C" />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Official Footer */}
            <View style={styles.footerBranding}>
              <View style={styles.footerLogoRow}>
                <Image
                  source={require("../../assets/icon-192.png")}
                  style={{ width: 22, height: 22 }}
                  resizeMode="contain"
                />
                <Text style={styles.footerBrandName}>SmartShopper</Text>
              </View>
              <Text style={styles.footerRights}>
                © 2026 JRINA Private Limited. Operating SmartShopper.
              </Text>
              <Text style={styles.footerSub}>
                Hyper-local merchant deals & verified digital loyalty wallet.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Cart Feedback Toast */}
      {cartFeedback && (
        <View style={styles.cartToast}>
          <Check size={14} color="#16A34A" />
          <Text style={styles.cartToastText} numberOfLines={1}>
            {cartFeedback}
          </Text>
          <TouchableOpacity
            style={styles.cartToastBtn}
            onPress={() => setShowCartModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.cartToastBtnText}>View Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  stickyTopControls: {
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  headerComponent: {
    paddingTop: 10
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 10
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingLeft: 12,
    paddingRight: 10,
    height: 42,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "#0F172A",
    marginLeft: 6
  },
  clearSearchBtn: {
    padding: 4
  },
  wishlistHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative"
  },
  wishlistBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EA580C",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF"
  },
  wishlistBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800"
  },
  categoryScroll: {
    paddingHorizontal: 14,
    gap: 16,
    alignItems: "center"
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  categoryItemSelected: {
    borderBottomColor: "#0F172A"
  },
  categoryItemText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A"
  },
  categoryItemTextSelected: {
    fontWeight: "800",
    color: "#0F172A"
  },

  /* SENSITIVE: Products Near You Section Styles */
  productsSection: {
    marginTop: 18,
    marginBottom: 4,
    gap: 10
  },
  productFilterSection: {
    marginTop: 2
  },
  productTabsContainer: {
    backgroundColor: "#DCF0FD",
    borderTopWidth: 1,
    borderTopColor: "#94C2EA",
    paddingTop: 10,
    paddingBottom: 12
  },
  productsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  productsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  productIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center"
  },
  productsSectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3
  },
  kerala5KmPill: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4
  },
  kerala5KmText: {
    color: "#166534",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.3
  },
  productsSectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  productCountPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  productCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569"
  },
  emptyProductsCard: {
    marginHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  emptyProductsText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center"
  },
  /* Flipkart-Style Grid (3-Column on standard/intended screens, 2-Column responsive fallback on smaller screens) */
  flipkartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12
  },
  flipkartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  fkImgContainer: {
    position: "relative",
    width: "100%",
    backgroundColor: "#F8FAFC"
  },
  fkProductImg: {
    width: "100%",
    height: "100%"
  },
  fkHeartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2
  },
  fkHeartBtnCompact: {
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12
  },
  fkCategoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4
  },
  fkCategoryBadgeCompact: {
    top: 6,
    left: 6,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    maxWidth: "58%"
  },
  fkCategoryText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  fkCategoryTextCompact: {
    fontSize: 7,
    letterSpacing: 0.1
  },
  fkDistanceBadge: {
    position: "absolute",
    bottom: 6,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1
  },
  fkDistanceBadgeCompact: {
    bottom: 5,
    left: 6,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    gap: 2,
    maxWidth: "85%"
  },
  fkDistanceText: {
    color: "#16A34A",
    fontSize: 8.5,
    fontWeight: "800"
  },
  fkDistanceTextCompact: {
    fontSize: 7.5
  },
  fkCardBody: {
    padding: 10,
    gap: 4
  },
  fkCardBodyCompact: {
    padding: 6.5,
    gap: 3
  },
  fkStoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  fkStoreName: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    flex: 1
  },
  fkStoreNameCompact: {
    fontSize: 9
  },
  fkTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 16,
    minHeight: 32
  },
  fkTitleCompact: {
    fontSize: 10.5,
    lineHeight: 14,
    minHeight: 28
  },
  fkPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2
  },
  fkOfferPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A"
  },
  fkOfferPriceCompact: {
    fontSize: 12.5
  },
  fkOrigPrice: {
    fontSize: 10,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  fkOrigPriceCompact: {
    fontSize: 9
  },
  fkDiscountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#16A34A"
  },
  fkDiscountTextCompact: {
    fontSize: 8.5
  },
  fkAssuredRow: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
    marginBottom: 4
  },
  fkAssuredRowCompact: {
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    marginTop: 1,
    marginBottom: 2,
    maxWidth: "100%"
  },
  fkAssuredText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#166534"
  },
  fkAssuredTextCompact: {
    fontSize: 7.5
  },
  fkActionsRow: {
    flexDirection: "column",
    gap: 5,
    marginTop: 4
  },
  fkActionsRowCompact: {
    gap: 3.5,
    marginTop: 2
  },
  fkAddToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingVertical: 6,
    borderRadius: 7,
    gap: 4,
    marginTop: 4
  },
  fkAddToCartBtnCompact: {
    paddingVertical: 5,
    gap: 2.5,
    marginTop: 2
  },
  fkAddToCartText: {
    color: "#EA580C",
    fontSize: 11,
    fontWeight: "800"
  },
  fkAddToCartTextCompact: {
    fontSize: 9.5
  },
  fkBuyNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 6.5,
    borderRadius: 7,
    gap: 4
  },
  fkBuyNowBtnCompact: {
    paddingVertical: 5.5,
    gap: 2.5
  },
  fkBuyNowText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900"
  },
  fkBuyNowTextCompact: {
    fontSize: 9.5
  },
  cartToast: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999
  },
  cartToastText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    flex: 1
  },
  cartToastBtn: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  cartToastBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800"
  },

  footerComponent: {
    marginTop: 14
  },
  searchWinterCrystal: {
    position: "absolute",
    right: 14,
    top: 6,
    zIndex: 1
  },
  storesWinterFrostDecor: {
    position: "absolute",
    right: 14,
    top: 12,
    zIndex: 1
  },
  storesSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 14,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  storesHeaderRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  storeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center"
  },
  storesSectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A"
  },
  storeCountPill: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  storeCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EA580C"
  },
  storesSectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  radiusChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: 14
  },
  radiusChipsPrefix: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    marginRight: 4
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  presetChipActive: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C"
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569"
  },
  presetChipTextActive: {
    color: "#FFFFFF"
  },
  noStoresBox: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12
  },
  noStoresIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  noStoresTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center"
  },
  noStoresDesc: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18
  },
  expandRadiusBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    gap: 6
  },
  expandRadiusBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EA580C"
  },
  emptyActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 10
  },
  storesStateCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8
  },
  storesStateIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  storesStateTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center"
  },
  storesStateDesc: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280
  },
  dualActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
    justifyContent: "center"
  },
  stateActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6
  },
  stateActionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  stateOutlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6
  },
  stateOutlineBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EA580C"
  },
  loadMoreStoresBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  loadMoreStoresText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#EA580C"
  },
  storeCardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginTop: 8
  },
  storeGridCard: {
    width: "48.2%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  storeImgWrap: {
    width: "100%",
    height: 96,
    backgroundColor: "#E2E8F0",
    position: "relative"
  },
  storeGridThumb: {
    width: "100%",
    height: "100%"
  },
  storeGridDistBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  storeGridDistText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#EA580C"
  },
  storeGridBody: {
    padding: 8
  },
  storeGridCategory: {
    fontSize: 9,
    fontWeight: "800",
    color: "#EA580C",
    letterSpacing: 0.4,
    marginBottom: 2
  },
  storeGridName: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2
  },
  storeGridAddress: {
    fontSize: 10,
    color: "#64748B"
  },
  footerBranding: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 4
  },
  footerLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  footerBrandName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A"
  },
  footerRights: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B"
  },
  footerSub: {
    fontSize: 10,
    color: "#94A3B8"
  },
  welcomeSection: {
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 6
  },
  welcomeCard: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  },
  welcomeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  welcomeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center"
  },
  welcomeTitleCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6
  },
  welcomeMainTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    flex: 1
  },
  welcomeComingSoonBadge: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  welcomeComingSoonText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  welcomeParagraph: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 6
  },
  welcomeParagraphSub: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
    marginBottom: 14
  },
  discoveryModeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  discoveryModeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center"
  },
  discoveryModeBtnActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A"
  },
  discoveryModeBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B"
  },
  discoveryModeBtnTextActive: {
    color: "#FFFFFF"
  },
  nearbyChipsSection: {
    marginBottom: 12
  },
  nearbyChipsHeading: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 6
  },
  nearbyChipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2
  },
  nearbyAreaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FED7AA"
  },
  nearbyAreaChipActive: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C"
  },
  nearbyAreaChipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F172A"
  },
  nearbyAreaChipTextActive: {
    color: "#FFFFFF"
  },
  discoveryDealsList: {
    gap: 10,
    marginBottom: 12
  },
  discoveryEmptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  discoveryEmptyText: {
    fontSize: 12.5,
    color: "#64748B",
    fontWeight: "600"
  },
  discoveryDealCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  discoveryDealTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8
  },
  discoveryStoreInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1
  },
  discoveryStoreName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569"
  },
  discoveryLocationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFEDD5"
  },
  discoveryLocationPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#EA580C"
  },
  discoveryDealTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 17,
    marginBottom: 8
  },
  discoveryDealBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  discoveryPriceWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    flex: 1
  },
  discoveryOfferPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#EA580C"
  },
  discoveryOrigPrice: {
    fontSize: 12,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  discoveryDiscountPill: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  discoveryDiscountPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626"
  },
  discoveryViewDealBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EA580C",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  discoveryViewDealBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  exploreDealsLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FED7AA"
  },
  exploreDealsLinkText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#EA580C"
  }
});
