import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { X, CheckCircle, Ticket, Store, ShieldCheck } from "lucide-react-native";
import { useApp } from "../context/AppContext";

export const VoucherRedeemModal: React.FC = () => {
  const { selectedOfferForVoucher, setSelectedOfferForVoucher, claimVoucher } = useApp();
  const [claimedCode, setClaimedCode] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  if (!selectedOfferForVoucher) return null;

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const v = await claimVoucher(selectedOfferForVoucher);
      setClaimedCode(v.code);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClose = () => {
    setClaimedCode(null);
    setSelectedOfferForVoucher(null);
  };

  const offer = selectedOfferForVoucher;

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.dealBadge}>
                <Text style={styles.dealBadgeText}>{offer.discountTag}</Text>
              </View>
              <Text style={styles.categoryText}>{offer.category}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Store Info */}
          <View style={styles.storeRow}>
            <Store size={18} color="#EA580C" />
            <Text style={styles.storeName}>{offer.storeName}</Text>
          </View>
          <Text style={styles.description}>{offer.description}</Text>

          {/* Pricing */}
          {offer.offerPrice && offer.offerPrice !== "₹0" ? (
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Deal Price:</Text>
              <Text style={styles.offerPrice}>{offer.offerPrice}</Text>
              {offer.originalPrice ? (
                <Text style={styles.originalPrice}>{offer.originalPrice}</Text>
              ) : null}
            </View>
          ) : null}

          {/* QR Code or Claim Action */}
          {claimedCode ? (
            <View style={styles.qrContainer}>
              <View style={styles.successRow}>
                <CheckCircle size={18} color="#16A34A" />
                <Text style={styles.successText}>Voucher Claimed Successfully!</Text>
              </View>

              <View style={styles.qrBox}>
                <QRCode
                  value={`SMARTSHOPPER_VOUCHER:${claimedCode}|${offer.id}`}
                  size={160}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>

              <Text style={styles.codeLabel}>VOUCHER CODE</Text>
              <Text style={styles.codeValue}>{claimedCode}</Text>
              <Text style={styles.instructions}>
                Show this QR code at the counter during billing to claim your discount.
              </Text>
            </View>
          ) : (
            <View style={styles.claimPrompt}>
              <View style={styles.infoBox}>
                <ShieldCheck size={16} color="#EA580C" />
                <Text style={styles.infoText}>
                  Instant in-store digital redemption. No advance payment required.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleClaim}
                disabled={isClaiming}
                activeOpacity={0.8}
              >
                {isClaiming ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ticket size={18} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Get Instant Voucher</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 360,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  dealBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  dealBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800"
  },
  categoryText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600"
  },
  closeBtn: {
    padding: 4
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6
  },
  storeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A"
  },
  description: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 12
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16
  },
  priceLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600"
  },
  offerPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#059669"
  },
  originalPrice: {
    fontSize: 13,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  qrContainer: {
    alignItems: "center",
    paddingTop: 8
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14
  },
  successText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A"
  },
  qrBox: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2
  },
  codeLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 14
  },
  codeValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#EA580C",
    letterSpacing: 2,
    marginTop: 2
  },
  instructions: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16
  },
  claimPrompt: {
    paddingTop: 4
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: "#C2410C",
    lineHeight: 15
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700"
  }
});
