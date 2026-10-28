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
  Image
} from "react-native";
import {
  Flame,
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
  Tag,
  ShoppingCart,
  Zap,
  Heart,
  Check
} from "lucide-react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { DealCard } from "../components/DealCard";
import { Header } from "../components/Header";
import { formatDistance } from "../utils/geo";
import { OfferItem, CatalogItem } from "../types";

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
  { label: "20 km", value: 20000 },
  { label: "All", value: 999999 }
];

/**
 * Single Row Marquee Scroller for Live Deals on Home Screen
 */
const DealMarqueeRow: React.FC<{ deals: OfferItem[] }> = ({ deals }) => {
  const isFocused = useIsFocused();
  const scrollRef = React.useRef<React.ElementRef<typeof ScrollView>>(null);
  const scrollPosRef = React.useRef(0);
  const isInteractingRef = React.useRef(false);

  // Auto-scroll marquee effect (pauses when screen is unfocused to conserve battery and CPU)
  React.useEffect(() => {
    if (!isFocused || deals.length <= 1) return;

    const interval = setInterval(() => {
      if (isInteractingRef.current || !scrollRef.current) return;

      scrollPosRef.current += 1.2;
      // Card width (160) + margin (8) * deals count
      const totalWidth = deals.length * 168;

      if (scrollPosRef.current >= totalWidth) {
        scrollPosRef.current = 0;
        scrollRef.current.scrollTo({ x: 0, animated: false });
      } else {
        scrollRef.current.scrollTo({ x: scrollPosRef.current, animated: false });
      }
    }, 35); // 35ms for smooth 30-60fps glide

    return () => clearInterval(interval);
  }, [deals.length, isFocused]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.marqueeContent}
      onTouchStart={() => {
        isInteractingRef.current = true;
      }}
      onTouchEnd={() => {
        setTimeout(() => {
          isInteractingRef.current = false;
        }, 3000); // Resume auto-scroll 3 seconds after touch
      }}
      onScrollBeginDrag={() => {
        isInteractingRef.current = true;
      }}
      onScrollEndDrag={(e) => {
        scrollPosRef.current = e.nativeEvent.contentOffset.x;
        setTimeout(() => {
          isInteractingRef.current = false;
        }, 3000);
      }}
      onMomentumScrollEnd={(e) => {
        scrollPosRef.current = e.nativeEvent.contentOffset.x;
      }}
      scrollEventThrottle={16}
    >
      {deals.map((deal) => (
        <DealCard key={deal.id} offer={deal} cardWidth={160} />
      ))}
    </ScrollView>
  );
};

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
    stores,
    nearbyProducts,
    isInsideKerala,
    geofenceRadius,
    setGeofenceRadius,
    setShowRadiusModal,
    setSelectedStore,
    setShowAiAssistant,
    addToCart,
    setBuyNowProduct,
    setShowCartModal,
    isLoading,
    refreshData
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState("All Deals & Stores");
  const [searchInput, setSearchInput] = useState("");
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const filteredDeals = offers.filter((o) => {
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
      .filter((s) => {
        // 1. Geofence radius filter
        if (geofenceRadius < 999999) {
          const dist = s.distanceInMeters ?? 0;
          if (dist > geofenceRadius) return false;
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
      .sort((a, b) => (a.distanceInMeters ?? 0) - (b.distanceInMeters ?? 0));
  }, [stores, geofenceRadius, searchInput, selectedCategory]);

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
    const store = stores.find(
      (s) => s.id === product.storeId || s.name.toLowerCase() === product.storeName?.toLowerCase()
    );
    if (store) {
      setSelectedStore(store);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddToCart = (item: CatalogItem) => {
    addToCart(item);
    const shortTitle = item.name.length > 22 ? item.name.slice(0, 22) + "..." : item.name;
    setCartFeedback(`Added "${shortTitle}" to cart!`);
    setTimeout(() => {
      setCartFeedback(null);
    }, 2800);
  };

  const handleBuyNow = (item: CatalogItem) => {
    setBuyNowProduct(item);
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
            {/* Unified Search Input matching PWA */}
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search deals, stores, or items..."
                  placeholderTextColor="#94A3B8"
                  value={searchInput}
                  onChangeText={setSearchInput}
                />
                {searchInput ? (
                  <TouchableOpacity onPress={() => setSearchInput("")} style={{ padding: 4 }}>
                    <X size={14} color="#64748B" />
                  </TouchableOpacity>
                ) : null}

                {/* Inline Radius Chip inside search bar */}
                <TouchableOpacity
                  style={styles.inlineRadiusChip}
                  onPress={() => setShowRadiusModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.inlineRadiusText}>{radiusLabel}</Text>
                  <ChevronDown size={12} color="#64748B" />
                </TouchableOpacity>
              </View>
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

            {/* Section 1: Live Deals Header with See All Button */}
            <View style={styles.sectionHeading}>
              <View style={styles.liveDealsTitleRow}>
                <View style={styles.pingDot} />
                <Flame size={16} color="#EF4444" fill="#EF4444" />
                <Text style={styles.sectionHeadingText}>Live Deals</Text>
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>{filteredDeals.length}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => (navigation as any).navigate("Deals")}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <ChevronRight size={14} color="#EA580C" />
              </TouchableOpacity>
            </View>

            {/* Single Row Horizontal Marquee Scroller */}
            {filteredDeals.length === 0 ? (
              <View style={styles.emptyDealsCard}>
                <Text style={styles.emptyDealsText}>No deals available in this radius</Text>
              </View>
            ) : (
              <DealMarqueeRow deals={filteredDeals} />
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
                      const isFav = favoriteIds.has(item.id);

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
                              onPress={() => toggleFavorite(item.id)}
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

                            {/* Distance Tag */}
                            {item.distanceInMeters != null ? (
                              <View style={styles.fkDistanceBadge}>
                                <MapPin size={9} color="#16A34A" />
                                <Text style={styles.fkDistanceText}>
                                  {formatDistance(item.distanceInMeters)}
                                </Text>
                              </View>
                            ) : null}
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
                            <View style={styles.fkPriceRow}>
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
                            </View>

                            {/* Local Delivery / Assured Pill */}
                            <View style={styles.fkAssuredRow}>
                              <Text style={styles.fkAssuredText}>⚡ 5km Local Store Pickup</Text>
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
                      <Text style={styles.storeCountText}>{filteredStores.length} Stores</Text>
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

              {/* Stores List or Empty State */}
              {filteredStores.length === 0 ? (
                <View style={styles.noStoresBox}>
                  <View style={styles.noStoresIconCircle}>
                    <MapPinOff size={28} color="#EA580C" />
                  </View>
                  <Text style={styles.noStoresTitle}>
                    Sorry! SmartShopper is not available here yet.
                  </Text>
                  <Text style={styles.noStoresDesc}>
                    There are currently no registered SmartShopper partner stores within your {radiusLabel} radius.
                  </Text>
                  <TouchableOpacity
                    style={styles.expandRadiusBtn}
                    onPress={() => setGeofenceRadius(10000)}
                  >
                    <RefreshCw size={14} color="#EA580C" />
                    <Text style={styles.expandRadiusBtnText}>Try 10 km Radius</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.storeCardsGrid}>
                  {filteredStores.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.storeGridCard}
                      onPress={() => setSelectedStore(s)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.storeImgWrap}>
                        <Image
                          source={{
                            uri:
                              s.imageUrl ||
                              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                          }}
                          style={styles.storeGridThumb}
                          resizeMode="cover"
                        />
                        <View style={styles.storeGridDistBadge}>
                          <Text style={styles.storeGridDistText}>
                            {formatDistance(s.distanceInMeters)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.storeGridBody}>
                        <Text style={styles.storeGridCategory} numberOfLines={1}>
                          {s.category.toUpperCase()}
                        </Text>
                        <Text style={styles.storeGridName} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={styles.storeGridAddress} numberOfLines={1}>
                          {s.address}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
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
    marginBottom: 10
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingLeft: 12,
    paddingRight: 6,
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
  inlineRadiusChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4
  },
  inlineRadiusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B"
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
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  liveDealsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  pingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444"
  },
  sectionHeadingText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A"
  },
  livePill: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8
  },
  livePillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#EF4444"
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 2,
    borderWidth: 1,
    borderColor: "#FFEDD5"
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EA580C"
  },
  marqueeContent: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4
  },
  dealsColumnWrapper: {
    paddingHorizontal: 9
  },
  emptyDealsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 14,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  emptyDealsText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B"
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
    marginTop: 14,
    gap: 6
  },
  expandRadiusBtnText: {
    fontSize: 12,
    fontWeight: "700",
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
  }
});
