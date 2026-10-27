import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from "react-native";
import { Bell, BellOff, X, Store, CheckCheck, Trash2, Tag, ChevronRight, MessageSquare } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import {
  getEffectiveNotificationState,
  requestNotificationPermission
} from "../services/notificationService";
import { registerDevicePushToken } from "../services/pushTokenService";

export const NotificationModal: React.FC = () => {
  const {
    notifications,
    showNotificationsModal,
    setShowNotificationsModal,
    markAllNotificationsRead,
    clearNotifications,
    setSelectedOfferForVoucher,
    openStoreChat,
    allOffers,
    user,
    location,
    isGPS,
    deliveryAddress
  } = useApp();

  const [isAlertsEnabled, setIsAlertsEnabled] = useState<boolean>(true);

  // Sync notification permission state when modal opens
  useEffect(() => {
    if (showNotificationsModal) {
      getEffectiveNotificationState().then(setIsAlertsEnabled);
    }
  }, [showNotificationsModal]);

  const handleEnableAlerts = async () => {
    const granted = await requestNotificationPermission();
    setIsAlertsEnabled(granted);
    if (granted) {
      registerDevicePushToken({
        userId: user?.id,
        location,
        isGPS,
        deliveryAddress
      }).catch(() => {});
    }
  };

  const handleSelectNotification = (item: any) => {
    if (item.type === "chat" || item.storeId || item.id?.startsWith("msg_notif_")) {
      setShowNotificationsModal(false);
      openStoreChat(item.storeId || item.storeName);
    } else if (item.offerId) {
      const matched = allOffers.find((o) => o.id === item.offerId);
      if (matched) {
        setShowNotificationsModal(false);
        setSelectedOfferForVoucher(matched);
      }
    }
  };

  const getFormattedTimeAgo = (isoString: string) => {
    try {
      const past = new Date(isoString).getTime();
      const diff = Math.max(0, new Date().getTime() - past);
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <Modal
      visible={showNotificationsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowNotificationsModal(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Bell size={18} color="#EA580C" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.headerTitle}>Deal Alerts</Text>
                  <View style={styles.broadcastPill}>
                    <Text style={styles.broadcastText}>Live</Text>
                  </View>
                </View>
                <Text style={styles.headerSub}>Real-time store offers & discounts</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowNotificationsModal(false)}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Enable Alerts Banner: Displays ONLY if user has not yet enabled alerts */}
          {!isAlertsEnabled && (
            <View style={styles.permissionBanner}>
              <View style={styles.permissionLeft}>
                <View style={styles.permissionIconInactive}>
                  <BellOff size={16} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.permissionTitle}>Turn On Deal Alerts</Text>
                  <Text style={styles.permissionSubtitle}>
                    Enable notifications to get local deals and instant discount drops
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.enableAlertsBtn}
                onPress={handleEnableAlerts}
                activeOpacity={0.8}
              >
                <Text style={styles.enableAlertsBtnText}>Enable</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action bar if notifications exist */}
          {notifications.length > 0 && (
            <View style={styles.actionBar}>
              <Text style={styles.notifCountText}>
                {notifications.length} {notifications.length === 1 ? "Notification" : "Notifications"}
              </Text>
              <View style={styles.actionBtnsGroup}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={markAllNotificationsRead}
                  activeOpacity={0.7}
                >
                  <CheckCheck size={14} color="#059669" />
                  <Text style={styles.markReadText}>Mark read</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={clearNotifications}
                  activeOpacity={0.7}
                >
                  <Trash2 size={14} color="#DC2626" />
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Notifications List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Bell size={32} color="#CBD5E1" />
                </View>
                <Text style={styles.emptyTitle}>No Notifications Yet</Text>
                <Text style={styles.emptySubtitle}>
                  You will get instant push alerts whenever partner stores publish flash deals or discount drops!
                </Text>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
                  onPress={() => handleSelectNotification(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.storeIconWrapper, item.type === "chat" && { backgroundColor: "#EFF6FF" }]}>
                      {item.type === "chat" ? (
                        <MessageSquare size={15} color="#2563EB" />
                      ) : (
                        <Store size={15} color="#EA580C" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.storeNameText} numberOfLines={1}>
                        {item.storeName}
                      </Text>
                      <Text style={styles.timeText}>{getFormattedTimeAgo(item.receivedAt)}</Text>
                    </View>
                    <View style={[styles.dealTagBadge, item.type === "chat" && { backgroundColor: "#EFF6FF", borderColor: "#DBEAFE" }]}>
                      {item.type === "chat" ? (
                        <MessageSquare size={10} color="#2563EB" />
                      ) : (
                        <Tag size={10} color="#DC2626" />
                      )}
                      <Text style={[styles.dealTagText, item.type === "chat" && { color: "#2563EB" }]}>
                        {item.discountTag}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.descText} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.tapActionRow}>
                    <Text style={[styles.tapActionText, item.type === "chat" && { color: "#2563EB" }]}>
                      {item.type === "chat" ? "Tap to open chat" : "Tap to view deal"}
                    </Text>
                    <ChevronRight size={13} color={item.type === "chat" ? "#2563EB" : "#EA580C"} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  header: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(234, 88, 12, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.3)",
    alignItems: "center",
    justifyContent: "center"
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  broadcastPill: {
    backgroundColor: "rgba(234, 88, 12, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6
  },
  broadcastText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FB923C",
    textTransform: "uppercase"
  },
  headerSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1
  },
  closeBtn: {
    padding: 4
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  notifCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase"
  },
  actionBtnsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  markReadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669"
  },
  clearText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626"
  },
  listContainer: {
    padding: 16,
    gap: 10
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A"
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18
  },
  notifCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6
  },
  notifCardUnread: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA"
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  storeIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center"
  },
  storeNameText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A"
  },
  timeText: {
    fontSize: 10,
    color: "#94A3B8"
  },
  dealTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 3
  },
  dealTagText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#DC2626"
  },
  descText: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 16
  },
  tapActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2
  },
  tapActionText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EA580C"
  },
  permissionBanner: {
    backgroundColor: "#FFF7ED",
    borderBottomWidth: 1,
    borderColor: "#FFEDD5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  permissionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  permissionIconInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center"
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A"
  },
  permissionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1
  },
  enableAlertsBtn: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2
  },
  enableAlertsBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3
  }
});
