import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { X, User, Phone, CheckCircle2 } from "lucide-react-native";
import { useApp } from "../context/AppContext";

export const CustomerCodeModal: React.FC = () => {
  const { showCustomerCode, setShowCustomerCode, user } = useApp();

  if (!showCustomerCode) return null;

  const customerId = user?.customerId || "SSC-84920";
  const customerName = user?.name || "Smart Consumer";
  const customerPhone = user?.phone || "+91 98765 43210";

  return (
    <Modal
      visible={showCustomerCode}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCustomerCode(false)}
    >
      <Pressable style={styles.overlay} onPress={() => setShowCustomerCode(false)}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Card Top */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/icon-192.png")}
                style={{ width: 32, height: 32, borderRadius: 8 }}
                resizeMode="contain"
              />
              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#F97316" }}>Smart</Text>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#FFFFFF" }}>Shopper</Text>
                </View>
                <Text style={styles.cardType}>Digital Loyalty Pass</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowCustomerCode(false)} style={styles.closeBtn}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* User Details */}
          <View style={styles.userSection}>
            <View style={styles.userRow}>
              <User size={15} color="#94A3B8" />
              <Text style={styles.userName}>{customerName}</Text>
            </View>
            <View style={styles.userRow}>
              <Phone size={15} color="#94A3B8" />
              <Text style={styles.userPhone}>{customerPhone}</Text>
            </View>
          </View>

          {/* QR Code Container */}
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={customerId}
                size={180}
                color="#0F172A"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.customerIdText}>{customerId}</Text>
            <View style={styles.verifiedRow}>
              <CheckCircle2 size={14} color="#22C55E" />
              <Text style={styles.verifiedText}>Verified Shopper ID</Text>
            </View>
          </View>

          {/* Footer Instruction */}
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              Scan at partner store cash counters to automatically receive e-bills and exclusive loyalty discounts.
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  card: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    width: "100%",
    maxWidth: 360,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: "#334155"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#020617",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B"
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  cardType: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    letterSpacing: 0.5
  },
  closeBtn: {
    padding: 4
  },
  userSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 6
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC"
  },
  userPhone: {
    fontSize: 13,
    color: "#94A3B8"
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: 18
  },
  qrWrapper: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 3
  },
  customerIdText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F97316",
    letterSpacing: 3,
    marginTop: 12
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4
  },
  verifiedText: {
    fontSize: 12,
    color: "#4ADE80",
    fontWeight: "700"
  },
  footer: {
    backgroundColor: "#020617",
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#1E293B"
  },
  footerNote: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16
  }
});
