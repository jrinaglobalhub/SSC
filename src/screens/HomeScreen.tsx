import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Linking
} from "react-native";
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
  ShoppingCart,
  Zap,
  Heart,
  Check,
  WifiOff,
  Navigation
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { StoreCard } from "../components/StoreCard";
import { Header } from "../components/Header";
import { TopDealsCarousel } from "../components/TopDealsCarousel";
import { formatDistance, calculateDistanceInMeters, extractAreaFromAddress } from "../utils/geo";
import { OfferItem, CatalogItem, SscBanner } from "../types";
import { fetchActiveSscBanners, recordSscBannerClick, recordSscBannerImpression } from "../api/supabase";

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
    setShowAiAssistant,
    setSelectedOfferForVoucher,
    addToCart,
    setBuyNowProduct,
    setShowCartModal,
    wishlistIds,
    toggleWishlist,
    wishlistCount,
    isLoading,
    refreshData,
    getStoreRoadDistance
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState("All Deals & Stores");
  const [searchInput, setSearchInput] = useState("");
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [promotionalBanners, setPromotionalBanners] = useState<SscBanner[]>([]);

  // Fetch active promotional banners from Supabase
  React.useEffect(() => {
    let isMounted = true;
    const loadPromoBanners = async () => {
      try {
        const list = await fetchActiveSscBanners();
        if (isMounted) {
          setPromotionalBanners(list);
          list.forEach((b) => recordSscBannerImpression(b.id));
        }
      } catch (err) {
        console.warn("[HomeScreen] loadPromoBanners error:", err);
      }
    };
    loadPromoBanners();
    return () => {
      isMounted = false;
    };
  }, []);

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
    if (!isInsideKerala) return [];

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

      return true;
    });
  }, [nearbyProducts, isInsideKerala, searchInput, selectedCategory]);

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

    if (banner.linkType === "store" && banner.targetId) {
      const foundStore = stores.find((s) => s.id === banner.targetId);
      if (foundStore) {
        setSelectedStore(foundStore);
      } else {
        (navigation as any).navigate("Deals");
      }
    } else if (banner.linkType === "deal" && banner.targetId) {
      const foundDeal = (allOffers || offers).find((o) => o.id === banner.targetId);
      if (foundDeal) {
        setSelectedOfferForVoucher(foundDeal);
      } else {
        (navigation as any).navigate("Deals");
      }
    } else if (banner.linkType === "category" && banner.targetId) {
      const matchedCat = CATEGORIES.find(
        (c) => c.toLowerCase() === banner.targetId?.toLowerCase()
      );
      setSelectedCategory(matchedCat || banner.targetId);
    } else if (banner.linkType === "custom_url" && banner.customUrl) {
      Linking.openURL(banner.customUrl).catch((err) =>
        console.warn("[HomeScreen] Could not open banner custom URL:", err)
      );
    }
  };

  const radiusLabel = geofenceRadius >= 999999 ? "Unlimited" : formatDistance(geofenceRadius);

  return (
    <View style={styles.container}>
      <Header />

      <FlatList
        data={[]}
        keyExtractor={(_, index) => `item_${index}`}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={["#EA580C"]} />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerComponent}>
            {/* Unified Search Input with Wishlist button */}
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Search size={14} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search deals, stores, or items..."
                  placeholderTextColor="#94A3B8"
                  value={searchInput}
                  onChangeText={setSearchInput}
                />
                {searchInput ? (
                  <TouchableOpacity
                    onPress={() => setSearchInput("")}
                    style={styles.clearSearchBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color="#64748B" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Wishlist Icon Button */}
              {isWishlistVisible && (
                <TouchableOpacity
                  style={styles.wishlistHeaderBtn}
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

            {/* Horizontal Category Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Top Deals Auto-Swiping Carousel with Dynamic SSA Promotional Banners */}
            <TopDealsCarousel
              deals={filteredDeals}
              stores={stores}
              banners={promotionalBanners}
              onPressBanner={handlePressBanner}
              onPressDeal={(deal) => setSelectedOfferForVoucher(deal)}
              onPressExplore={() => (navigation as any).navigate("Deals")}
            />

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

            {/* SENSITIVE SECTION: Flipkart-Style Products Near You (5 KM Radius - Kerala Only) */}
            {isInsideKerala && (
              <View style={styles.productsSection}>
                <View style={styles.productsHeaderRow}>
                  <View style={styles.productsHeaderLeft}>
                    <View style={styles.productIconBox}>
                      <Package size={17} color="#EA580C" />
                    </View>
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.productsSectionTitle}>Products Near You</Text>
                        <View style={styles.kerala5KmPill}>
                          <Text style={styles.kerala5KmText}>5 KM RADIUS</Text>
                        </View>
                      </View>
                      <Text style={styles.productsSectionSubtitle}>
                        Flipkart-style local inventory within 5 km in Kerala
                      </Text>
                    </View>
                  </View>
                  <View style={styles.productCountPill}>
                    <Text style={styles.productCountText}>{filteredProducts.length} Items</Text>
                  </View>
                </View>

                {filteredProducts.length === 0 ? (
                  <View style={styles.emptyProductsCard}>
                    <Package size={28} color="#94A3B8" />
                    <Text style={styles.emptyProductsText}>
                      No store products found within 5 km of your location
                    </Text>
                  </View>
                ) : (
                  <View style={styles.flipkartGrid}>
                    {filteredProducts.map((item) => {
                      const discountPct = calculateDiscountPercent(
                        item.originalPrice,
                        item.offerPrice
                      );
                      const isFav = wishlistIds.has(item.id);

                      return (
                        <View key={item.id} style={styles.flipkartCard}>
                          {/* Image Container with Wishlist & Category Badges */}
                          <TouchableOpacity
                            style={styles.fkImgContainer}
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
                              style={styles.fkHeartBtn}
                              onPress={() => toggleWishlist(item.id)}
                              activeOpacity={0.7}
                            >
                              <Heart
                                size={14}
                                color={isFav ? "#EF4444" : "#64748B"}
                                fill={isFav ? "#EF4444" : "transparent"}
                              />
                            </TouchableOpacity>

                            {/* Category Badge */}
                            {item.category ? (
                              <View style={styles.fkCategoryBadge}>
                                <Text style={styles.fkCategoryText}>
                                  {item.category.toUpperCase()}
                                </Text>
                              </View>
                            ) : null}

                            {/* Distance Tag - Road Distance */}
                            {(() => {
                              const roadInfo = getStoreRoadDistance(item.storeId || item.storeName || "");
                              return (
                                <View style={styles.fkDistanceBadge}>
                                  <MapPin size={9} color="#16A34A" />
                                  <Text style={styles.fkDistanceText}>
                                    {roadInfo ? `${roadInfo.formatted} by road` : "Near you"}
                                  </Text>
                                </View>
                              );
                            })()}
                          </TouchableOpacity>

                          {/* Card Body */}
                          <View style={styles.fkCardBody}>
                            {/* Store Name with icon */}
                            <TouchableOpacity
                              style={styles.fkStoreRow}
                              onPress={() => handleProductPress(item)}
                              activeOpacity={0.8}
                            >
                              <Store size={10} color="#64748B" />
                              <Text style={styles.fkStoreName} numberOfLines={1}>
                                {item.storeName || "Partner Store"}
                              </Text>
                            </TouchableOpacity>

                            {/* Product Title */}
                            <TouchableOpacity
                              onPress={() => handleProductPress(item)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.fkTitle} numberOfLines={2}>
                                {item.name}
                              </Text>
                            </TouchableOpacity>

                            {/* Flipkart Price Section */}
                            <TouchableOpacity
                              style={styles.fkPriceRow}
                              onPress={() => handleProductPress(item)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.fkOfferPrice}>
                                {item.offerPrice || "Special"}
                              </Text>
                              {item.originalPrice ? (
                                <Text style={styles.fkOrigPrice}>
                                  {item.originalPrice}
                                </Text>
                              ) : null}
                              {discountPct ? (
                                <Text style={styles.fkDiscountText}>
                                  {discountPct}
                                </Text>
                              ) : null}
                            </TouchableOpacity>

                            {/* Local Delivery / Assured Pill */}
                            <View style={styles.fkAssuredRow}>
                              <Text style={styles.fkAssuredText}>5km Local Store Pickup</Text>
                            </View>

                            {/* Flipkart Action Buttons: Add to Cart & Buy Now */}
                            <View style={styles.fkActionsRow}>
                              <TouchableOpacity
                                style={styles.fkAddToCartBtn}
                                onPress={() => handleAddToCart(item)}
                                activeOpacity={0.8}
                              >
                                <ShoppingCart size={12} color="#EA580C" />
                                <Text style={styles.fkAddToCartText}>Add to Cart</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.fkBuyNowBtn}
                                onPress={() => handleBuyNow(item)}
                                activeOpacity={0.85}
                              >
                                <Zap size={12} color="#FFFFFF" fill="#FFFFFF" />
                                <Text style={styles.fkBuyNowText}>Buy Now</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        }
        renderItem={() => null}
        ListFooterComponent={
          <View style={styles.footerComponent}>
            {/* Section 2: Stores Around You */}
            <View style={styles.storesSection}>
              <View style={styles.storesHeaderRow}>
                <View style={styles.storeIconBox}>
                  <Store size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, paddingLeft: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.storesSectionTitle}>Stores Around You</Text>
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
                      style={[styles.presetChip, isCur && styles.presetChipActive]}
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
                <View style={styles.storesStateCard}>
                  <ActivityIndicator size="small" color="#EA580C" />
                  <Text style={styles.storesStateTitle}>Searching nearby partner stores...</Text>
                  <Text style={styles.storesStateDesc}>
                    Finding verified SmartShopper stores within your selected radius.
                  </Text>
                </View>
              ) : storesError && stores.length === 0 ? (
                <View style={styles.storesStateCard}>
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
                <View style={styles.storesStateCard}>
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
        }
        contentContainerStyle={{ paddingBottom: 90 }}
      />

      {/* Floating SmartShopper AI Button (Only on Home Screen) */}
      <TouchableOpacity
        style={styles.floatingAiButton}
        onPress={() => setShowAiAssistant(true)}
        activeOpacity={0.88}
      >
        <Sparkles size={16} color="#FFFFFF" />
        <Text style={styles.floatingAiText}>SmartShopper AI</Text>
      </TouchableOpacity>

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
  headerComponent: {
    paddingTop: 10
  },
  searchSection: {
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
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
    gap: 8,
    paddingBottom: 12
  },
  categoryChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  categoryChipSelected: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A"
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569"
  },
  categoryChipTextSelected: {
    color: "#FFFFFF"
  },

  /* SENSITIVE: Products Near You Section Styles */
  productsSection: {
    marginTop: 18,
    marginBottom: 4,
    gap: 10
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
  /* Flipkart-Style 2-Column Grid */
  flipkartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    rowGap: 12
  },
  flipkartCard: {
    width: "48.5%",
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
    height: 140,
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
  fkCategoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4
  },
  fkCategoryText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.3
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
  fkDistanceText: {
    color: "#16A34A",
    fontSize: 8.5,
    fontWeight: "800"
  },
  fkCardBody: {
    padding: 10,
    gap: 4
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
  fkTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 16,
    minHeight: 32
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
  fkOrigPrice: {
    fontSize: 10,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  fkDiscountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#16A34A"
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
  fkAssuredText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#166534"
  },
  fkActionsRow: {
    flexDirection: "column",
    gap: 5,
    marginTop: 4
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
    gap: 4
  },
  fkAddToCartText: {
    color: "#EA580C",
    fontSize: 11,
    fontWeight: "800"
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
  fkBuyNowText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900"
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
  floatingAiButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    gap: 7,
    elevation: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.7)"
  },
  floatingAiText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.2
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
