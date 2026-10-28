import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
  Linking,
  ScrollView,
  Keyboard
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import {
  Search,
  X,
  Crosshair,
  Flame,
  Radio,
  MapPin,
  Navigation
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { formatDistance, calculateDistanceInMeters } from "../utils/geo";
import { StoreProfile } from "../types";
import { LEAFLET_JS, LEAFLET_CSS } from "../assets/leaflet/leaflet.bundle";

const { width } = Dimensions.get("window");

const RADIUS_OPTIONS = [1000, 2000, 5000, 10000, 20000, 999999];

export const MapScreen: React.FC = () => {
  const {
    location,
    geofenceRadius,
    setGeofenceRadius,
    setManualLocation,
    resetToGPSLocation,
    setShowLocationModal,
    stores,
    offers,
    setSelectedStore,
    setSelectedOfferForVoucher
  } = useApp();

  const webViewRef = useRef<WebView>(null);
  const [isHeatmapActive, setIsHeatmapActive] = useState<boolean>(false);
  const [mapSearchQuery, setMapSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selectedStoreItem, setSelectedStoreItem] = useState<StoreProfile | null>(null);

  // Match PWA Store Data formatting
  const displayStores = useMemo(() => {
    return stores.map((s) => {
      const deal = offers.find(
        (o) => o.storeId === s.id || o.storeName.toLowerCase() === s.name.toLowerCase()
      );
      const dist = s.distanceInMeters ?? calculateDistanceInMeters(location, { latitude: s.lat, longitude: s.lng });
      return {
        id: s.id,
        name: s.name,
        category: s.category || "Retail Store",
        lat: s.lat,
        lng: s.lng,
        address: s.address || "Kerala, India",
        imageUrl: s.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
        topOffer: deal ? deal.discountTag : "Partner Store",
        hasDeal: Boolean(deal),
        isFlashSale: Boolean(deal?.isHotspot),
        distanceInMeters: dist,
        fairnessScore: s.priceFairnessScore || 5.0,
        deal: deal || null
      };
    });
  }, [stores, offers, location]);

  // Filtered dropdown stores
  const searchResults = useMemo(() => {
    if (!mapSearchQuery.trim()) return [];
    const q = mapSearchQuery.toLowerCase();
    return displayStores.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [displayStores, mapSearchQuery]);

  // Build the complete Leaflet HTML containing exact PWA styles and Leaflet bundle
  const mapHtml = useMemo(() => {
    const storesJson = JSON.stringify(displayStores);
    const userLat = location.latitude || 9.9981;
    const userLng = location.longitude || 76.2999;
    const radius = geofenceRadius || 5000;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    ${LEAFLET_CSS}

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #020617; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    #map { width: 100%; height: 100%; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #020617; }

    /* Custom Leaflet Controls */
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3) !important;
      margin-bottom: 90px !important;
      margin-right: 14px !important;
    }
    .leaflet-control-zoom a {
      background: #0f172a !important;
      color: #ea580c !important;
      border: 1px solid #1e293b !important;
      border-radius: 12px !important;
      width: 38px !important;
      height: 38px !important;
      line-height: 38px !important;
      font-size: 20px !important;
      font-weight: bold !important;
      margin-bottom: 6px !important;
    }

    /* PWA Pulsing User Pin */
    .user-pulse-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
    }
    .user-pulse-ring {
      position: absolute;
      width: 44px;
      height: 44px;
      border-radius: 9999px;
      background: rgba(234, 88, 12, 0.35);
      animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
    .user-pulse-core {
      position: relative;
      width: 24px;
      height: 24px;
      border-radius: 9999px;
      background: #ea580c;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 14px rgba(234, 88, 12, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(2.0); opacity: 0; }
    }

    /* PWA Merchant Pin */
    .merchant-pin-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transform: translate3d(0,0,0);
      transition: transform 0.15s ease;
    }
    .merchant-pin-pill {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 900;
      white-space: nowrap;
      box-shadow: 0 6px 18px rgba(0,0,0,0.4);
      border: 2px solid #ea580c;
      background: #090d16;
      color: #ffffff;
    }
    .merchant-pin-pill.deal {
      background: #020617;
      border-color: #f97316;
    }
    .merchant-pin-pill.selected {
      background: #ea580c;
      color: #ffffff;
      border-color: #ffedd5;
      transform: scale(1.1);
      box-shadow: 0 8px 24px rgba(234, 88, 12, 0.7);
    }
    .pin-name {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .pin-badge {
      background: #dc2626;
      color: #ffffff;
      font-size: 9px;
      font-weight: 900;
      padding: 2px 5px;
      border-radius: 9999px;
      margin-left: 2px;
    }
    .pin-arrow {
      width: 8px;
      height: 8px;
      background: #ea580c;
      transform: rotate(45deg);
      margin-top: -4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    /* Popup Styling identical to PWA */
    .leaflet-popup-content-wrapper {
      background: #0f172a !important;
      color: #f8fafc !important;
      border-radius: 16px !important;
      padding: 4px !important;
      border: 1px solid #1e293b !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
    }
    .leaflet-popup-tip {
      background: #0f172a !important;
    }
    .leaflet-popup-content {
      margin: 10px 12px !important;
      font-size: 12px !important;
      line-height: 1.4 !important;
    }
    .popup-badge {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(234, 88, 12, 0.2);
      color: #fb923c;
      border: 1px solid rgba(234, 88, 12, 0.3);
      padding: 2px 7px;
      border-radius: 9999px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .popup-title {
      font-size: 14px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 2px;
    }
    .popup-addr {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .popup-deal-box {
      background: rgba(220, 38, 38, 0.15);
      border: 1px solid rgba(220, 38, 38, 0.3);
      padding: 6px 10px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 8px;
    }
    .popup-deal-tag {
      font-size: 13px;
      font-weight: 900;
      color: #f87171;
    }
    .popup-btn-row {
      display: flex;
      gap: 6px;
      margin-top: 6px;
    }
    .popup-btn {
      flex: 1;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
      text-align: center;
      cursor: pointer;
      border: none;
    }
    .popup-btn-info {
      background: #1e293b;
      color: #f1f5f9;
    }
    .popup-btn-claim {
      background: #ea580c;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    ${LEAFLET_JS}

    window.onerror = function(message, source, lineno, colno, error) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ERROR',
          message: message + ' at line ' + lineno
        }));
      }
    };

    var map = null;
    var userMarker = null;
    var radiusCircle = null;
    var markersGroup = null;
    var storesData = ${storesJson};
    var currentRadius = ${radius};
    var isHeatmap = false;

    try {
      map = L.map('map', {
        center: [${userLat}, ${userLng}],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      // Standard OpenStreetMap tiles (100% Free, NO API KEY required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markersGroup = L.layerGroup().addTo(map);

      // User Pulse Marker
      var userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: '<div class="user-pulse-container"><div class="user-pulse-ring"></div><div class="user-pulse-core"></div></div>',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      userMarker = L.marker([${userLat}, ${userLng}], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

      // Radius Circle
      radiusCircle = L.circle([${userLat}, ${userLng}], {
        radius: currentRadius >= 999999 ? 15000 : currentRadius,
        color: '#EA580C',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#EA580C',
        fillOpacity: 0.08
      }).addTo(map);

      // Render Stores
      renderMarkers();

      // Tap on map to set manual location
      map.on('click', function(e) {
        if (window.ReactNativeWebView && e && e.latlng) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_TAP_LOCATION',
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }));
        }
      });

      // Signal ready to React Native
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    } catch (e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
      }
    }

    function renderMarkers() {
      if (!markersGroup) return;
      markersGroup.clearLayers();

      storesData.forEach(function(store) {
        var isWithinRadius = currentRadius >= 999999 || store.distanceInMeters <= currentRadius;
        if (!isWithinRadius) return;

        var pinHtml = '<div class="merchant-pin-node">' +
          '<div class="merchant-pin-pill ' + (store.hasDeal ? 'deal' : '') + '">' +
            '<span>' + (store.hasDeal ? '🏷️' : '🏬') + '</span>' +
            '<span class="pin-name">' + store.name + '</span>' +
            (store.hasDeal ? '<span class="pin-badge">' + store.topOffer + '</span>' : '') +
          '</div>' +
          '<div class="pin-arrow"></div>' +
        '</div>';

        var pinIcon = L.divIcon({
          className: 'custom-merchant-pin',
          html: pinHtml,
          iconSize: [160, 40],
          iconAnchor: [80, 40],
          popupAnchor: [0, -40]
        });

        var marker = L.marker([store.lat, store.lng], { icon: pinIcon });

        var popupContent = '<div style="min-width: 220px;">' +
          '<span class="popup-badge">' + store.category + '</span>' +
          '<div class="popup-title">' + store.name + '</div>' +
          '<div class="popup-addr">' + store.address + ' (' + (store.distanceInMeters >= 1000 ? (store.distanceInMeters/1000).toFixed(1) + ' km' : store.distanceInMeters + 'm') + ')</div>' +
          (store.hasDeal ? '<div class="popup-deal-box"><div class="popup-deal-tag">🔥 ' + store.topOffer + '</div></div>' : '') +
          '<div class="popup-btn-row">' +
            '<button class="popup-btn popup-btn-info" onclick="onViewStoreClicked(\\'' + store.id + '\\')">Details</button>' +
            (store.hasDeal ? '<button class="popup-btn popup-btn-claim" onclick="onClaimClicked(\\'' + store.id + '\\')">Claim Offer</button>' : '<button class="popup-btn popup-btn-claim" onclick="onNavClicked(' + store.lat + ',' + store.lng + ',\\'' + encodeURIComponent(store.name) + '\\')">Navigate</button>') +
          '</div>' +
        '</div>';

        marker.bindPopup(popupContent, { maxWidth: 280 });

        marker.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SELECT_STORE',
              storeId: store.id
            }));
          }
        });

        markersGroup.addLayer(marker);
      });
    }

    function onViewStoreClicked(id) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'VIEW_STORE', storeId: id }));
      }
    }

    function onClaimClicked(id) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLAIM_OFFER', storeId: id }));
      }
    }

    function onNavClicked(lat, lng, name) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NAVIGATE', lat: lat, lng: lng, name: decodeURIComponent(name) }));
      }
    }

    window.updateUserLocation = function(lat, lng, radius) {
      if (!map) return;
      if (userMarker) userMarker.setLatLng([lat, lng]);
      if (radiusCircle) {
        radiusCircle.setLatLng([lat, lng]);
        radiusCircle.setRadius(radius >= 999999 ? 15000 : radius);
      }
      map.flyTo([lat, lng], radius <= 2000 ? 15 : radius <= 10000 ? 13 : 11, { animate: true, duration: 1.0 });
    };

    window.updateRadius = function(newRadius) {
      currentRadius = newRadius;
      if (radiusCircle) {
        radiusCircle.setRadius(newRadius >= 999999 ? 15000 : newRadius);
      }
      renderMarkers();
    };

    window.flyToLocation = function(lat, lng, zoom) {
      if (map) {
        map.flyTo([lat, lng], zoom || 16, { animate: true, duration: 1.2 });
      }
    };

    window.toggleHeatmap = function(active) {
      isHeatmap = active;
      if (radiusCircle) {
        radiusCircle.setStyle({
          color: active ? '#EF4444' : '#EA580C',
          fillColor: active ? '#EF4444' : '#EA580C',
          fillOpacity: active ? 0.25 : 0.08
        });
      }
    };
  </script>
</body>
</html>`;
  }, [location, geofenceRadius, displayStores]);

  // Handle messages from Leaflet webview
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "SELECT_STORE") {
        const found = stores.find((s) => s.id === data.storeId);
        if (found) setSelectedStoreItem(found);
      } else if (data.type === "VIEW_STORE") {
        const found = stores.find((s) => s.id === data.storeId);
        if (found) setSelectedStore(found);
      } else if (data.type === "CLAIM_OFFER") {
        const deal = offers.find((o) => o.storeId === data.storeId);
        if (deal) setSelectedOfferForVoucher(deal);
      } else if (data.type === "NAVIGATE") {
        openExternalMap(data.lat, data.lng, data.name);
      } else if (data.type === "MAP_TAP_LOCATION") {
        const tapLat = Number(data.lat.toFixed(6));
        const tapLng = Number(data.lng.toFixed(6));
        Location.reverseGeocodeAsync({ latitude: tapLat, longitude: tapLng })
          .then(([geo]) => {
            const label = geo
              ? [geo.name || geo.street, geo.district || geo.city, geo.region].filter(Boolean).join(", ")
              : `Point (${tapLat.toFixed(3)}, ${tapLng.toFixed(3)})`;
            setManualLocation({ latitude: tapLat, longitude: tapLng }, label);
          })
          .catch(() => {
            setManualLocation(
              { latitude: tapLat, longitude: tapLng },
              `Custom Pin (${tapLat.toFixed(3)}, ${tapLng.toFixed(3)})`
            );
          });
        webViewRef.current?.injectJavaScript(
          `if(window.updateUserLocation) { window.updateUserLocation(${tapLat}, ${tapLng}, ${geofenceRadius}); } true;`
        );
      }
    } catch (err) {
      console.warn("[MapScreen] WebView message parse error:", err);
    }
  };

  const handleSelectRadius = (r: number) => {
    setGeofenceRadius(r);
    webViewRef.current?.injectJavaScript(`if(window.updateRadius) { window.updateRadius(${r}); } true;`);
  };

  const handleRecenter = () => {
    resetToGPSLocation();
    webViewRef.current?.injectJavaScript(
      `if(window.updateUserLocation) { window.updateUserLocation(${location.latitude}, ${location.longitude}, ${geofenceRadius}); } true;`
    );
  };

  const handleToggleHeatmap = () => {
    const nextState = !isHeatmapActive;
    setIsHeatmapActive(nextState);
    webViewRef.current?.injectJavaScript(
      `if(window.toggleHeatmap) { window.toggleHeatmap(${nextState}); } true;`
    );
  };

  const handleSearchSubmit = async () => {
    if (!mapSearchQuery.trim()) return;
    setIsSearching(true);
    setShowDropdown(false);
    Keyboard.dismiss();

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          mapSearchQuery + ", Kerala, India"
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const top = data[0];
          const lat = parseFloat(top.lat);
          const lng = parseFloat(top.lon);
          const label = top.display_name.split(",")[0].trim();
          setManualLocation({ latitude: lat, longitude: lng }, label);
          webViewRef.current?.injectJavaScript(`if(window.flyToLocation) { window.flyToLocation(${lat}, ${lng}, 15); } true;`);
        }
      }
    } catch (e) {
      console.warn("Nominatim search error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStoreFromSearch = (store: any) => {
    setMapSearchQuery(store.name);
    setShowDropdown(false);
    setSelectedStoreItem(stores.find((s) => s.id === store.id) || null);
    Keyboard.dismiss();
    webViewRef.current?.injectJavaScript(`if(window.flyToLocation) { window.flyToLocation(${store.lat}, ${store.lng}, 16); } true;`);
  };

  const openExternalMap = (lat: number, lng: number, label: string) => {
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(label)}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${encodeURIComponent(label)})`
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latLng}`);
      });
    }
  };

  const getStoreOffer = (storeId: string, storeName: string) => {
    return offers.find(
      (o) => o.storeId === storeId || o.storeName.toLowerCase() === storeName.toLowerCase()
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      {/* Main Interactive Leaflet Map via WebView */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: mapHtml, baseUrl: "https://unpkg.com" }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          androidLayerType="hardware"
          onMessage={handleWebViewMessage}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={styles.loaderText}>Loading OpenStreetMap...</Text>
            </View>
          )}
          startInLoadingState={true}
        />

        {/* Top Floating Controls Bar (Search + Radius Pills + Actions) */}
        <View style={styles.topOverlayContainer}>
          {/* Search Bar */}
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBar}>
              <MapPin size={16} color="#EA580C" style={{ marginLeft: 10 }} />
              <TextInput
                value={mapSearchQuery}
                onChangeText={(text) => {
                  setMapSearchQuery(text);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onSubmitEditing={handleSearchSubmit}
                placeholder="Search Kakkanad, Fort Kochi, Store..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {mapSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setMapSearchQuery("")} style={styles.clearBtn}>
                  <X size={14} color="#94A3B8" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSearchSubmit}
                disabled={isSearching}
                style={styles.searchActionBtn}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Search size={14} color="#FFFFFF" />
                )}
                <Text style={styles.searchActionBtnText}>Focus</Text>
              </TouchableOpacity>
            </View>

            {/* Instant Search Dropdown matching PWA */}
            {showDropdown && searchResults.length > 0 && (
              <View style={styles.dropdownList}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownHeaderText}>Found Stores ({searchResults.length})</Text>
                  <TouchableOpacity onPress={() => setShowDropdown(false)}>
                    <X size={14} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                  {searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectStoreFromSearch(item)}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.dropdownItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.dropdownItemAddr} numberOfLines={1}>
                          {item.address} • {formatDistance(item.distanceInMeters)}
                        </Text>
                      </View>
                      {item.hasDeal && (
                        <View style={styles.dropdownDealBadge}>
                          <Text style={styles.dropdownDealBadgeText}>{item.topOffer}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Controls Strip (Radius + My Location + Heatmap) */}
          <View style={styles.controlsStrip}>
            {/* Radius Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.radiusPillsRow}
            >
              <View style={styles.radarLabelWrapper}>
                <Radio size={14} color="#EA580C" />
                <Text style={styles.radarLabelText}>Radar:</Text>
              </View>
              {RADIUS_OPTIONS.map((r) => {
                const isActive = geofenceRadius === r;
                const label = r >= 999999 ? "All" : r >= 1000 ? `${r / 1000}km` : `${r}m`;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => handleSelectRadius(r)}
                    style={[styles.radiusPill, isActive && styles.radiusPillActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.radiusPillText, isActive && styles.radiusPillTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Quick Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                onPress={() => setShowLocationModal(true)}
                style={styles.quickActionBtn}
                activeOpacity={0.8}
              >
                <MapPin size={14} color="#EA580C" />
                <Text style={styles.quickActionBtnText}>Choose Area</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRecenter}
                style={styles.quickActionBtn}
                activeOpacity={0.8}
              >
                <Crosshair size={14} color="#EA580C" />
                <Text style={styles.quickActionBtnText}>My GPS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleHeatmap}
                style={[styles.quickActionBtn, isHeatmapActive && styles.quickActionBtnActive]}
                activeOpacity={0.8}
              >
                <Flame size={14} color={isHeatmapActive ? "#EF4444" : "#EA580C"} />
                <Text style={[styles.quickActionBtnText, isHeatmapActive && { color: "#EF4444" }]}>
                  Heatmap
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Floating Tap to Pin Location Hint when no store selected */}
        {!selectedStoreItem && (
          <View style={styles.mapTapTipContainer} pointerEvents="none">
            <View style={styles.mapTapTip}>
              <MapPin size={12} color="#EA580C" />
              <Text style={styles.mapTapTipText}>Tap anywhere on map to set your location</Text>
            </View>
          </View>
        )}

        {/* Bottom Store Details Floating Card matching PWA */}
        {selectedStoreItem && (
          <View style={styles.bottomCardContainer}>
            <View style={styles.bottomCard}>
              <View style={styles.cardHeader}>
                <Image
                  source={{
                    uri:
                      selectedStoreItem.imageUrl ||
                      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                  }}
                  style={styles.storeThumb}
                />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.storeTitle} numberOfLines={1}>
                      {selectedStoreItem.name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedStoreItem(null)}>
                      <Text style={{ fontSize: 16, color: "#94A3B8", fontWeight: "bold" }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.storeCategory}>{selectedStoreItem.category}</Text>
                  <Text style={styles.storeDist}>
                    📍 {formatDistance(selectedStoreItem.distanceInMeters)} from you
                  </Text>
                </View>
              </View>

              <Text style={styles.storeAddr} numberOfLines={2}>
                {selectedStoreItem.address}
              </Text>

              {(() => {
                const deal = getStoreOffer(selectedStoreItem.id, selectedStoreItem.name);
                if (deal) {
                  return (
                    <View style={styles.dealRow}>
                      <View style={styles.dealTag}>
                        <Text style={styles.dealTagText}>🔥 {deal.discountTag}</Text>
                      </View>
                      <Text style={styles.dealDesc} numberOfLines={1}>
                        {deal.description}
                      </Text>
                      <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => setSelectedOfferForVoucher(deal)}
                      >
                        <Text style={styles.claimBtnText}>Claim</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }
                return null;
              })()}

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() =>
                    openExternalMap(
                      selectedStoreItem.lat,
                      selectedStoreItem.lng,
                      selectedStoreItem.name
                    )
                  }
                >
                  <Navigation size={14} color="#FFFFFF" />
                  <Text style={styles.navBtnText}>Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.storeDetailsBtn}
                  onPress={() => setSelectedStore(selectedStoreItem)}
                >
                  <Text style={styles.storeDetailsBtnText}>Store Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617"
  },
  mapContainer: {
    flex: 1,
    position: "relative"
  },
  webView: {
    flex: 1,
    backgroundColor: "#020617"
  },
  loaderContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center"
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "800",
    color: "#EA580C"
  },
  topOverlayContainer: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    zIndex: 10
  },
  searchBarWrapper: {
    position: "relative",
    marginBottom: 8
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearBtn: {
    padding: 6
  },
  searchActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4
  },
  searchActionBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  dropdownList: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 20
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    marginBottom: 4
  },
  dropdownHeaderText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(30, 41, 59, 0.5)"
  },
  dropdownItemName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  dropdownItemAddr: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2
  },
  dropdownDealBadge: {
    backgroundColor: "rgba(234, 88, 12, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  dropdownDealBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FB923C"
  },
  controlsStrip: {
    flexDirection: "column",
    gap: 8
  },
  radiusPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 16,
    padding: 4,
    gap: 4
  },
  radarLabelWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8
  },
  radarLabelText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#CBD5E1"
  },
  radiusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "transparent"
  },
  radiusPillActive: {
    backgroundColor: "#EA580C"
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8"
  },
  radiusPillTextActive: {
    color: "#FFFFFF"
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8
  },
  quickActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5
  },
  quickActionBtnActive: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.15)"
  },
  quickActionBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F1F5F9"
  },
  mapTapTipContainer: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10
  },
  mapTapTip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 6
  },
  mapTapTipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  bottomCardContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 20
  },
  bottomCard: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center"
  },
  storeThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1E293B"
  },
  storeTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  storeCategory: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 1
  },
  storeDist: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EA580C",
    marginTop: 2
  },
  storeAddr: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 8,
    lineHeight: 15
  },
  dealRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
    gap: 8
  },
  dealTag: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  dealTagText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  dealDesc: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#FED7AA"
  },
  claimBtn: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  claimBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  navBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  storeDetailsBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
    paddingVertical: 10,
    borderRadius: 12
  },
  storeDetailsBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F1F5F9"
  }
});

