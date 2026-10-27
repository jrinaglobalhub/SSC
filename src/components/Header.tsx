import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Bell, RefreshCw, ChevronDown, ShoppingCart } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { formatDistance } from "../utils/geo";

export const Header: React.FC = () => {
  const {
    locationName,
    geofenceRadius,
    setShowRadiusModal,
    setShowCustomerCode,
    setShowNotificationsModal,
    unreadNotificationsCount,
    cartCount,
    setShowCartModal,
    refreshData,
    isLoading,
    isGPS,
    user,
    openAuthModal
  } = useApp();

  const radiusLabel = geofenceRadius >= 999999 ? "Unlimited" : formatDistance(geofenceRadius);

  return (
    <View style={styles.container}>
      {/* Top Line: Brand Logo, Location Pill, Radius Chip, Bell & Profile */}
      <View style={styles.topRow}>
        {/* Brand Identity: Official Logo + SmartShopper Text */}
        <View style={styles.brandContainer}>
          <Image
            source={require("../../assets/icon-192.png")}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={styles.brandTextRow}>
            <Text style={styles.brandSmart}>Smart</Text>
            <Text style={styles.brandShopper}>Shopper</Text>
          </View>
        </View>

        {/* Right Actions: Cart + Notification Bell + User Profile Avatar Pill */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setShowCartModal(true)}
            activeOpacity={0.7}
          >
            <ShoppingCart size={18} color="#475569" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => {
              if (!user) {
                openAuthModal("Sign in to view real-time store deal alerts, discounts, and notifications.");
              } else {
                setShowNotificationsModal(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Bell size={18} color="#475569" />
            {unreadNotificationsCount > 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profilePill}
            onPress={() => setShowCustomerCode(true)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {user?.name?.slice(0, 2).toUpperCase() || "SC"}
              </Text>
            </View>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.name?.split(" ")[0] || "Account"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Second Line: Location Radar Bar with GPS indicator + Radius Pill */}
      <View style={styles.subRow}>
        <TouchableOpacity
          style={styles.locationPill}
          onPress={() => setShowRadiusModal(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.gpsDot, isGPS ? styles.gpsActive : styles.gpsFallback]} />
          <Text style={styles.locationName} numberOfLines={1}>
            {locationName}
          </Text>
          <Text style={styles.gpsBadge}>{isGPS ? "GPS" : "Area"}</Text>

          <TouchableOpacity
            onPress={refreshData}
            disabled={isLoading}
            style={styles.refreshBtn}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#EA580C" />
            ) : (
              <RefreshCw size={12} color="#94A3B8" />
            )}
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Distance Radius Badge */}
        <TouchableOpacity
          style={styles.radiusPill}
          onPress={() => setShowRadiusModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.radiusPillText}>Within {radiusLabel}</Text>
          <ChevronDown size={13} color="#C2410C" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8
  },
  brandTextRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  brandSmart: {
    fontSize: 18,
    fontWeight: "900",
    color: "#EA580C",
    letterSpacing: -0.5
  },
  brandShopper: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  cartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative"
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EA580C",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF"
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900"
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative"
  },
  unreadDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626"
  },
  profilePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarInitials: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  profileName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    maxWidth: 75
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  locationPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  gpsActive: {
    backgroundColor: "#16A34A"
  },
  gpsFallback: {
    backgroundColor: "#F59E0B"
  },
  locationName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B"
  },
  gpsBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: "#16A34A",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  refreshBtn: {
    padding: 2
  },
  radiusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C2410C"
  }
});
