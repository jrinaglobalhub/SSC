import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Platform
} from "react-native";
import {
  MapPin,
  Search,
  X,
  Navigation,
  Check,
  ChevronRight,
  Map as MapIcon,
  Home,
  SlidersHorizontal
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { Coordinates } from "../types";
import { formatDistance } from "../utils/geo";

const PALODE_LOCATION = {
  id: "palode",
  name: "Palode",
  fullName: "Palode, Thiruvananthapuram",
  subtitle: "Nedumangad, Thiruvananthapuram (695562)",
  coords: {
    latitude: 8.723257,
    longitude: 77.028392
  },
  tag: "Local Area"
};

interface SearchResultItem {
  id: string;
  name: string;
  subtext: string;
  coords: Coordinates;
}

export const LocationPickerModal: React.FC = () => {
  const {
    showLocationModal,
    setShowLocationModal,
    setShowRadiusModal,
    geofenceRadius,
    location,
    locationName,
    isGPS,
    setManualLocation,
    resetToGPSLocation,
    deliveryAddress
  } = useApp();

  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean search input on modal open/close
  useEffect(() => {
    if (!showLocationModal) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchError(null);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    }
  }, [showLocationModal]);

  // Debounced search via OpenStreetMap Nominatim
  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    setSearchError(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim() || text.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(text.trim());
    }, 450);
  };

  const executeSearch = async (query: string) => {
    if (!query) return;
    setIsSearching(true);
    setSearchError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=8&q=${encodeURIComponent(
        query + ", Kerala"
      )}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en"
        }
      });

      if (!res.ok) {
        throw new Error("Search service unavailable");
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const parsed: SearchResultItem[] = data.map((item: any, idx: number) => {
          const parts = (item.display_name || "").split(",").map((p: string) => p.trim());
          const primaryName = parts[0] || query;
          const sub = parts.slice(1, 4).join(", ");
          return {
            id: `nom_${item.place_id || idx}_${Date.now()}`,
            name: primaryName,
            subtext: sub || "Kerala, India",
            coords: {
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon)
            }
          };
        });
        setSearchResults(parsed);
      } else {
        setSearchResults([]);
        setSearchError(`No areas found for "${query}". Try searching a city or town name.`);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("[LocationPicker] Search failed:", err);
        setSearchError("Unable to fetch location results. Please check network connection.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (coords: Coordinates, name: string) => {
    Keyboard.dismiss();
    setManualLocation(coords, name);
    setShowLocationModal(false);
  };

  const handleUseGPS = async () => {
    Keyboard.dismiss();
    setShowLocationModal(false);
    await resetToGPSLocation();
  };

  const handlePickOnMap = () => {
    Keyboard.dismiss();
    setShowLocationModal(false);
    try {
      navigation.navigate("Map");
    } catch (err) {
      console.warn("Navigation to map failed:", err);
    }
  };

  const handleOpenRadiusModal = () => {
    setShowLocationModal(false);
    setShowRadiusModal(true);
  };

  const isPalodeActive =
    !isGPS &&
    (locationName.toLowerCase().includes("palode") ||
      (Math.abs(location.latitude - PALODE_LOCATION.coords.latitude) < 0.015 &&
        Math.abs(location.longitude - PALODE_LOCATION.coords.longitude) < 0.015));

  const radiusLabel = geofenceRadius >= 999999 ? "Unlimited" : formatDistance(geofenceRadius);

  return (
    <Modal
      visible={showLocationModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLocationModal(false)}
    >
      <Pressable style={styles.overlay} onPress={() => setShowLocationModal(false)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Choose Your Location</Text>
              <Text style={styles.subtitle}>
                Discover local deals, stores & offers in your preferred area
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowLocationModal(false)}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBoxWrapper}>
            <View style={styles.searchBox}>
              <Search size={18} color="#EA580C" style={{ marginLeft: 4 }} />
              <TextInput
                value={searchQuery}
                onChangeText={handleQueryChange}
                placeholder="Search area, town, or landmark in Kerala..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={() => executeSearch(searchQuery.trim())}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchError(null);
                  }}
                  style={styles.clearSearchBtn}
                >
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              )}
              {isSearching && (
                <ActivityIndicator size="small" color="#EA580C" style={{ marginRight: 6 }} />
              )}
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Live Search Results (if querying) */}
            {searchQuery.trim().length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>SEARCH RESULTS</Text>
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectLocation(item.coords, `${item.name}, Kerala`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.resultPinBox}>
                        <MapPin size={18} color="#EA580C" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultItemTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.resultItemSub} numberOfLines={1}>
                          {item.subtext}
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  ))
                ) : !isSearching && searchError ? (
                  <View style={styles.emptySearchBox}>
                    <Text style={styles.emptySearchText}>{searchError}</Text>
                  </View>
                ) : isSearching ? (
                  <View style={styles.emptySearchBox}>
                    <Text style={styles.emptySearchText}>Searching locations across Kerala...</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Live Device GPS Card */}
            <TouchableOpacity
              style={[styles.actionCard, isGPS && styles.actionCardActive]}
              onPress={handleUseGPS}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, isGPS && styles.actionIconBoxActive]}>
                <Navigation size={18} color={isGPS ? "#16A34A" : "#EA580C"} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.actionTitleRow}>
                  <Text style={styles.actionTitle}>Use Current Location</Text>
                  {isGPS && (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>Active GPS</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.actionSubtitle} numberOfLines={1}>
                  {isGPS ? locationName : "Acquire precise live GPS coordinates"}
                </Text>
              </View>
              {isGPS ? (
                <Check size={18} color="#16A34A" />
              ) : (
                <ChevronRight size={18} color="#94A3B8" />
              )}
            </TouchableOpacity>

            {/* Saved Delivery Address (if present) */}
            {deliveryAddress && (deliveryAddress.city || deliveryAddress.streetArea) && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  const lat = typeof deliveryAddress.lat === "number" ? deliveryAddress.lat : 10.0159;
                  const lng = typeof deliveryAddress.lng === "number" ? deliveryAddress.lng : 76.3419;
                  const label = [deliveryAddress.streetArea, deliveryAddress.city || "Kerala"]
                    .filter(Boolean)
                    .join(", ");
                  handleSelectLocation({ latitude: lat, longitude: lng }, label);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: "#F1F5F9" }]}>
                  <Home size={18} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>Use Saved Address</Text>
                  <Text style={styles.actionSubtitle} numberOfLines={1}>
                    {[deliveryAddress.streetArea, deliveryAddress.city, deliveryAddress.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}

            {/* Pick on Interactive Map */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handlePickOnMap}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#EFF6FF" }]}>
                <MapIcon size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Pick on Interactive Map</Text>
                <Text style={styles.actionSubtitle}>
                  Pin your exact spot by tapping anywhere on the live Kerala map
                </Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Quick 1-Tap Location: Palode */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <MapPin size={14} color="#EA580C" />
                  <Text style={styles.sectionTitle}>QUICK LOCATION</Text>
                </View>
                <Text style={styles.sectionHint}>1-Tap Selection</Text>
              </View>

              <TouchableOpacity
                style={[styles.palodeCard, isPalodeActive && styles.palodeCardActive]}
                onPress={() =>
                  handleSelectLocation(PALODE_LOCATION.coords, PALODE_LOCATION.fullName)
                }
                activeOpacity={0.8}
              >
                <View style={[styles.palodeIconBox, isPalodeActive && styles.palodeIconBoxActive]}>
                  <MapPin size={20} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.actionTitleRow}>
                    <Text style={[styles.palodeTitle, isPalodeActive && styles.palodeTitleActive]}>
                      {PALODE_LOCATION.name}
                    </Text>
                    {isPalodeActive ? (
                      <View style={styles.activeLocationBadge}>
                        <Text style={styles.activeLocationBadgeText}>Selected</Text>
                      </View>
                    ) : (
                      <Text style={styles.palodeTag}>{PALODE_LOCATION.tag}</Text>
                    )}
                  </View>
                  <Text style={styles.palodeSubtitle} numberOfLines={1}>
                    {PALODE_LOCATION.subtitle}
                  </Text>
                </View>
                {isPalodeActive ? (
                  <Check size={18} color="#EA580C" />
                ) : (
                  <ChevronRight size={18} color="#94A3B8" />
                )}
              </TouchableOpacity>
            </View>

            {/* Proximity Radius Shortcut */}
            <View style={styles.radiusShortcutCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.radiusShortcutTitle}>Radar Discovery Radius</Text>
                <Text style={styles.radiusShortcutSub}>
                  Currently showing deals within <Text style={{ fontWeight: "800", color: "#EA580C" }}>{radiusLabel}</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.radiusShortcutBtn}
                onPress={handleOpenRadiusModal}
                activeOpacity={0.8}
              >
                <SlidersHorizontal size={14} color="#EA580C" />
                <Text style={styles.radiusShortcutBtnText}>Adjust Radius</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "88%"
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A"
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    maxWidth: 290
  },
  closeBtn: {
    padding: 6
  },
  searchBoxWrapper: {
    marginTop: 12,
    marginBottom: 6
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    height: 44
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearSearchBtn: {
    padding: 4
  },
  scrollContent: {
    paddingBottom: 24,
    paddingTop: 8
  },
  sectionBlock: {
    marginTop: 14
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8
  },
  sectionHint: {
    fontSize: 11,
    color: "#EA580C",
    fontWeight: "600"
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 6,
    gap: 10
  },
  resultPinBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center"
  },
  resultItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A"
  },
  resultItemSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1
  },
  emptySearchBox: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    alignItems: "center"
  },
  emptySearchText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center"
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
    gap: 12
  },
  actionCardActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0"
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center"
  },
  actionIconBoxActive: {
    backgroundColor: "#DCFCE7"
  },
  actionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A"
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2
  },
  liveBadge: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase"
  },
  palodeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 12
  },
  palodeCardActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#EA580C"
  },
  palodeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FED7AA"
  },
  palodeIconBoxActive: {
    backgroundColor: "#FFEDD5",
    borderColor: "#FDBA74"
  },
  palodeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A"
  },
  palodeTitleActive: {
    color: "#EA580C"
  },
  palodeSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2
  },
  palodeTag: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8"
  },
  activeLocationBadge: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999
  },
  activeLocationBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase"
  },
  radiusShortcutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 12,
    marginTop: 14
  },
  radiusShortcutTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9A3412"
  },
  radiusShortcutSub: {
    fontSize: 11,
    color: "#7C2D12",
    marginTop: 2
  },
  radiusShortcutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDBA74",
    gap: 4
  },
  radiusShortcutBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EA580C"
  }
});
