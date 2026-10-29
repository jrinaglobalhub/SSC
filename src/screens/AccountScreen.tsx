import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  AppState
} from "react-native";
import {
  User,
  Phone,
  QrCode,
  Receipt,
  Bell,
  Shield,
  FileText,
  LogOut,
  ChevronRight,
  Sparkles,
  Store,
  Edit3,
  UserCog,
  MapPin,
  Ticket,
  RotateCcw
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { fetchUserBills } from "../api/supabase";
import { Bill, RootStackParamList } from "../types";
import { EditProfileModal } from "../components/EditProfileModal";
import {
  getEffectiveNotificationState,
  getOSNotificationPermissionStatus,
  setInAppNotificationPreference,
  requestNotificationPermission
} from "../services/notificationService";
import { registerDevicePushToken, deactivateDevicePushToken } from "../services/pushTokenService";

export const AccountScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout, openAuthModal, setShowCustomerCode, stores, vouchers, deliveryAddress, location, isGPS, locationName, setShowLocationModal } = useApp();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [osPermissionDenied, setOsPermissionDenied] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Sync notification state on mount and when app resumes from Android Settings
  useEffect(() => {
    async function syncNotificationStatus() {
      const osStatus = await getOSNotificationPermissionStatus();
      setOsPermissionDenied(!osStatus.isGranted);
      const effective = await getEffectiveNotificationState();
      setNotificationsEnabled(effective);
    }

    syncNotificationStatus();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncNotificationStatus();
      }
    });

    return () => sub.remove();
  }, []);

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      const osStatus = await getOSNotificationPermissionStatus();
      if (!osStatus.isGranted) {
        const granted = await requestNotificationPermission();
        setOsPermissionDenied(!granted);
        setNotificationsEnabled(granted);
        if (granted) {
          registerDevicePushToken({ userId: user?.id, location, isGPS, deliveryAddress }).catch(() => {});
        }
      } else {
        await setInAppNotificationPreference(true);
        setNotificationsEnabled(true);
        setOsPermissionDenied(false);
        registerDevicePushToken({ userId: user?.id, location, isGPS, deliveryAddress }).catch(() => {});
      }
    } else {
      await setInAppNotificationPreference(false);
      setNotificationsEnabled(false);
      deactivateDevicePushToken().catch(() => {});
    }
  };

  useEffect(() => {
    async function loadBills() {
      if (!user?.customerId) {
        setBills([]);
        return;
      }
      setLoadingBills(true);
      try {
        const data = await fetchUserBills(user.customerId);
        setBills(data);
      } finally {
        setLoadingBills(false);
      }
    }
    loadBills();
  }, [user]);

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Loyalty Card or Sign In Banner */}
        {user ? (
          <View style={styles.loyaltyCard}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.avatarInitials || user.name?.slice(0, 2).toUpperCase() || "SC"}
                </Text>
              </View>
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={styles.userName}>{user.name}</Text>
                {Boolean(user.phone) && <Text style={styles.userPhone}>{user.phone}</Text>}
                {Boolean(user.email) && <Text style={styles.userEmail}>{user.email}</Text>}
                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText}>ID: {user.customerId}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.cardEditBtn}
                onPress={() => setShowEditProfile(true)}
                activeOpacity={0.8}
              >
                <Edit3 size={13} color="#FB923C" />
                <Text style={styles.cardEditText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.qrActionBtn}
              onPress={() => setShowCustomerCode(true)}
              activeOpacity={0.85}
            >
              <QrCode size={18} color="#FFFFFF" />
              <Text style={styles.qrActionText}>Show Merchant Counter Pass</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIconCircle}>
              <User size={28} color="#EA580C" />
            </View>
            <Text style={styles.guestTitle}>Welcome to SmartShopper</Text>
            <Text style={styles.guestSub}>
              Sign in or create an account to claim exclusive deals, track digital e-bills, and earn shopper rewards!
            </Text>
            <TouchableOpacity
              style={styles.guestLoginBtn}
              onPress={() => openAuthModal()}
              activeOpacity={0.85}
            >
              <Text style={styles.guestLoginText}>Sign In / Register</Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Store size={20} color="#EA580C" />
            <Text style={styles.statVal}>{stores.length}</Text>
            <Text style={styles.statLabel}>Partner Stores</Text>
          </View>

          <View style={styles.statBox}>
            <Receipt size={20} color="#059669" />
            <Text style={styles.statVal}>{bills.length}</Text>
            <Text style={styles.statLabel}>Digital E-Bills</Text>
          </View>

          <View style={styles.statBox}>
            <Sparkles size={20} color="#EA580C" />
            <Text style={styles.statVal}>Active</Text>
            <Text style={styles.statLabel}>AI Radar</Text>
          </View>
        </View>

        {/* Claimed Vouchers Access Banner */}
        <TouchableOpacity
          style={styles.voucherBanner}
          onPress={() => navigation.navigate("Vouchers")}
          activeOpacity={0.85}
        >
          <View style={styles.voucherBannerLeft}>
            <View style={styles.voucherIconCircle}>
              <Ticket size={20} color="#EA580C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.voucherBannerTitle}>My Claimed Vouchers</Text>
              <Text style={styles.voucherBannerSub} numberOfLines={1}>
                {vouchers.length > 0
                  ? `${vouchers.length} discount ${vouchers.length === 1 ? "voucher" : "vouchers"} ready to redeem`
                  : "View active discount codes & in-store QR passes"}
              </Text>
            </View>
          </View>
          <View style={styles.voucherBannerRight}>
            {vouchers.length > 0 && (
              <View style={styles.voucherCountBadge}>
                <Text style={styles.voucherCountText}>{vouchers.length}</Text>
              </View>
            )}
            <ChevronRight size={18} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        {/* Digital E-Bills Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Receipt size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Digital E-Bills & Receipts</Text>
          </View>

          {loadingBills ? (
            <ActivityIndicator size="small" color="#EA580C" style={{ marginVertical: 14 }} />
          ) : bills.length === 0 ? (
            <View style={styles.emptyBills}>
              <Text style={styles.emptyBillsText}>
                No digital bills received yet. When you scan your QR at partner stores, e-bills will automatically appear here!
              </Text>
            </View>
          ) : (
            bills.map((bill) => (
              <View key={bill.id} style={styles.billItem}>
                <View>
                  <Text style={styles.billStore}>{bill.storeName}</Text>
                  <Text style={styles.billNumber}>Bill #{bill.billNumber}</Text>
                  <Text style={styles.billDate}>
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.billTotal}>₹{bill.totalAmount.toFixed(2)}</Text>
                  {bill.discountAmount > 0 && (
                    <Text style={styles.billSavings}>
                      Saved ₹{bill.discountAmount.toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Settings & Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={18} color={notificationsEnabled ? "#EA580C" : "#94A3B8"} />
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.settingTitle}>Proximity Deal Alerts</Text>
                <Text style={[styles.settingDesc, osPermissionDenied && { color: "#EF4444" }]}>
                  {osPermissionDenied
                    ? "Disabled in system settings. Tap toggle to allow."
                    : "Notify when walking near high discount deals"}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: "#CBD5E1", true: "#FED7AA" }}
              thumbColor={notificationsEnabled ? "#EA580C" : "#94A3B8"}
            />
          </View>

          {/* Active Location & Radar Preference */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}
          >
            <MapPin size={18} color="#EA580C" />
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.menuTitle}>Active Location & Radar</Text>
              <Text style={styles.settingDesc} numberOfLines={1}>
                {locationName} • {isGPS ? "Live GPS Active" : "Manual Area"}
              </Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (user) {
                setShowEditProfile(true);
              } else {
                openAuthModal("Sign in to edit your profile details.");
              }
            }}
            activeOpacity={0.7}
          >
            <UserCog size={18} color="#EA580C" />
            <Text style={styles.menuTitle}>Edit Profile</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Saved Delivery Address in DB */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              (navigation as any).navigate("Cart");
            }}
            activeOpacity={0.7}
          >
            <MapPin size={18} color="#059669" />
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.menuTitle}>Delivery Address (Saved in Cloud/DB)</Text>
              <Text style={styles.addressSubtitle} numberOfLines={1}>
                {deliveryAddress || user?.address
                  ? `${(deliveryAddress || user?.address)?.houseDetails}, ${(deliveryAddress || user?.address)?.city}`
                  : "No address saved yet - tap to add"}
              </Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("PrivacyPolicy")}
            activeOpacity={0.7}
          >
            <Shield size={18} color="#64748B" />
            <Text style={styles.menuTitle}>Privacy Policy</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("TermsOfService")}
            activeOpacity={0.7}
          >
            <FileText size={18} color="#64748B" />
            <Text style={styles.menuTitle}>Terms of Service</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("RefundPolicy")}
            activeOpacity={0.7}
          >
            <RotateCcw size={18} color="#64748B" />
            <Text style={styles.menuTitle}>Refund & Cancellation Policy</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          {user && (
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={logout}
              activeOpacity={0.7}
            >
              <LogOut size={18} color="#DC2626" />
              <Text style={[styles.menuTitle, styles.logoutText]}>Sign Out</Text>
              <ChevronRight size={16} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>SmartShopper Mobile App</Text>
          <Text style={styles.footerVersion}>Version 1.0.0 (Native React Native)</Text>
          <Text style={styles.footerCompany}>JRINA Private Limited</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  scroll: {
    padding: 16
  },
  loyaltyCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  userPhone: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2
  },
  userEmail: {
    fontSize: 11,
    color: "#CBD5E1",
    marginTop: 1
  },
  guestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  guestIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FED7AA"
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6
  },
  guestSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8
  },
  guestLoginBtn: {
    backgroundColor: "#EA580C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 6,
    width: "100%",
    elevation: 3,
    shadowColor: "#EA580C",
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  guestLoginText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800"
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 4
  },
  logoutText: {
    color: "#DC2626"
  },
  idBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(234, 88, 12, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FB923C"
  },
  cardEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(234, 88, 12, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start"
  },
  cardEditText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FB923C"
  },
  qrActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8
  },
  qrActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  statVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 4
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2
  },
  voucherBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  voucherBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8
  },
  voucherIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center"
  },
  voucherBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A"
  },
  voucherBannerSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  voucherBannerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  voucherCountBadge: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  voucherCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800"
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A"
  },
  emptyBills: {
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 10
  },
  emptyBillsText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    textAlign: "center"
  },
  billItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  billStore: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A"
  },
  billNumber: {
    fontSize: 11,
    color: "#64748B"
  },
  billDate: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2
  },
  billTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A"
  },
  billSavings: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "700"
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 10
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A"
  },
  settingDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
    paddingLeft: 10
  },
  addressSubtitle: {
    fontSize: 11,
    color: "#64748B",
    paddingLeft: 10,
    marginTop: 2
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569"
  },
  footerVersion: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2
  },
  footerCompany: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2
  }
});
