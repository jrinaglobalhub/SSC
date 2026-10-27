import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ticket, Store, Clock, QrCode, X, CheckCircle2 } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { VoucherDetails } from "../types";

export const VouchersScreen: React.FC = () => {
  const { vouchers } = useApp();
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherDetails | null>(null);

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>My Claimed Vouchers</Text>
        <Text style={styles.pageSubtitle}>
          Present these QR codes or coupon codes at the store billing counter
        </Text>
      </View>

      <FlatList
        data={vouchers}
        keyExtractor={(item, index) => item.code || String(index)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => setSelectedVoucher(item)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.storeRow}>
                <Store size={16} color="#EA580C" />
                <Text style={styles.storeName}>{item.storeName}</Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{item.discountTag}</Text>
              </View>
            </View>

            <View style={styles.codeRow}>
              <View>
                <Text style={styles.codeLabel}>VOUCHER CODE</Text>
                <Text style={styles.codeText}>{item.code}</Text>
              </View>

              <TouchableOpacity
                style={styles.qrButton}
                onPress={() => setSelectedVoucher(item)}
              >
                <QrCode size={16} color="#EA580C" />
                <Text style={styles.qrButtonText}>Show QR</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.statusRow}>
                <Clock size={12} color="#64748B" />
                <Text style={styles.footerText}>
                  Claimed: {new Date(item.claimedAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.readyText}>● Ready to redeem</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ticket size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No vouchers claimed yet</Text>
            <Text style={styles.emptySubtitle}>
              Explore exclusive deals and claim vouchers to save big on your next store visit!
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      {/* QR Redemption Modal */}
      {selectedVoucher ? (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedVoucher(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedVoucher(null)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalStoreName}>{selectedVoucher.storeName}</Text>
                  <Text style={styles.modalDiscount}>{selectedVoucher.discountTag}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedVoucher(null)} style={styles.modalCloseBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalQrWrapper}>
                <QRCode
                  value={`SMARTSHOPPER_VOUCHER:${selectedVoucher.code}`}
                  size={180}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>

              <Text style={styles.modalCodeLabel}>COUPON CODE</Text>
              <Text style={styles.modalCodeValue}>{selectedVoucher.code}</Text>

              <View style={styles.modalInstructionRow}>
                <CheckCircle2 size={16} color="#16A34A" />
                <Text style={styles.modalInstructionText}>
                  Show this QR code to the cashier before payment is finalized.
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A"
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  storeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A"
  },
  discountBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800"
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5
  },
  codeText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#EA580C",
    letterSpacing: 2,
    marginTop: 2
  },
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4
  },
  qrButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EA580C"
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  footerText: {
    fontSize: 11,
    color: "#64748B"
  },
  readyText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A"
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 40
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 340,
    padding: 20,
    alignItems: "center"
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16
  },
  modalStoreName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A"
  },
  modalDiscount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: 2
  },
  modalCloseBtn: {
    padding: 4
  },
  modalQrWrapper: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2
  },
  modalCodeLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 14
  },
  modalCodeValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#EA580C",
    letterSpacing: 2,
    marginTop: 2
  },
  modalInstructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8
  },
  modalInstructionText: {
    fontSize: 11,
    color: "#166534",
    flex: 1,
    lineHeight: 15
  }
});
