import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MapPin, Clock, Ticket, Sparkles } from "lucide-react-native";
import { OfferItem } from "../types";
import { formatDistance, formatTimeLeft } from "../utils/geo";
import { useApp } from "../context/AppContext";

interface DealCardProps {
  offer: OfferItem;
  onPressStore?: () => void;
  cardWidth?: number;
}

export const DealCard: React.FC<DealCardProps> = ({ offer, onPressStore, cardWidth }) => {
  const { setSelectedOfferForVoucher, setSelectedStore, stores } = useApp();

  // Live countdown ticker
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(offer.endAt, offer.expiresInMinutes));

  useEffect(() => {
    // If under 24 hours (isUrgent), update every second for live countdown
    const timer = setInterval(() => {
      setTimeLeft(formatTimeLeft(offer.endAt, offer.expiresInMinutes));
    }, timeLeft.isUrgent ? 1000 : 30000);

    return () => clearInterval(timer);
  }, [offer.endAt, offer.expiresInMinutes, timeLeft.isUrgent]);

  const handleCardPress = () => {
    if (onPressStore) {
      onPressStore();
      return;
    }
    const matchedStore = stores.find((s) => s.id === offer.storeId || s.name === offer.storeName);
    if (matchedStore) {
      setSelectedStore(matchedStore);
    }
  };

  const isStoreDeal = offer.dealTargetType === "STORE" || !offer.offerPrice || offer.offerPrice === "₹0";

  return (
    <TouchableOpacity
      style={[styles.card, cardWidth ? { width: cardWidth, flex: undefined } : null]}
      activeOpacity={0.88}
      onPress={handleCardPress}
    >
      {/* Top Header: Category Tag & Distance */}
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {offer.category || "Offer"}
          </Text>
        </View>

        <View style={styles.distanceBadge}>
          <MapPin size={10} color="#EA580C" />
          <Text style={styles.distanceText}>{formatDistance(offer.distanceInMeters)}</Text>
        </View>
      </View>

      {/* Store Name */}
      <View style={styles.storeRow}>
        <Text style={styles.storeName} numberOfLines={1}>
          {offer.storeName}
        </Text>
      </View>

      {/* Main Deal Offer Tag / Discount Highlight */}
      <View style={styles.discountContainer}>
        <View style={styles.discountBadge}>
          <Sparkles size={11} color="#DC2626" />
          <Text style={styles.discountText} numberOfLines={1}>
            {offer.discountTag}
          </Text>
        </View>
      </View>

      {/* Short Description */}
      <Text style={styles.description} numberOfLines={2}>
        {offer.description}
      </Text>

      {/* Price Row */}
      {!isStoreDeal ? (
        <View style={styles.priceRow}>
          <Text style={styles.offerPrice}>{offer.offerPrice}</Text>
          {offer.originalPrice ? (
            <Text style={styles.originalPrice}>{offer.originalPrice}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.storeDealBox}>
          <Text style={styles.storeDealLabel}>Store-wide Special</Text>
        </View>
      )}

      {/* Expiry Countdown Box */}
      <View style={[styles.expiryRow, timeLeft.isUrgent && styles.expiryRowUrgent]}>
        <Clock size={11} color={timeLeft.isUrgent ? "#DC2626" : "#64748B"} />
        <Text
          style={[styles.expiryText, timeLeft.isUrgent && styles.expiryTextUrgent]}
          numberOfLines={1}
        >
          {timeLeft.text}
        </Text>
      </View>

      {/* Claim Button */}
      <TouchableOpacity
        style={styles.claimButton}
        onPress={() => setSelectedOfferForVoucher(offer)}
        activeOpacity={0.82}
      >
        <Ticket size={13} color="#FFFFFF" />
        <Text style={styles.claimButtonText}>Claim Deal</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    justifyContent: "space-between"
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
    gap: 4
  },
  categoryBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: "60%"
  },
  categoryText: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "700"
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  distanceText: {
    color: "#EA580C",
    fontSize: 9,
    fontWeight: "800"
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 4
  },
  storeName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1
  },
  discountContainer: {
    marginBottom: 4
  },
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: "flex-start",
    gap: 3,
    maxWidth: "100%"
  },
  discountText: {
    color: "#DC2626",
    fontSize: 10,
    fontWeight: "900"
  },
  description: {
    fontSize: 10,
    color: "#64748B",
    lineHeight: 14,
    minHeight: 28,
    marginBottom: 4
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 5
  },
  offerPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#059669"
  },
  originalPrice: {
    fontSize: 10,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  storeDealBox: {
    marginBottom: 5
  },
  storeDealLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EA580C"
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 5,
    gap: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  expiryRowUrgent: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FFE4E6"
  },
  expiryText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#475569"
  },
  expiryTextUrgent: {
    color: "#DC2626"
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 6,
    borderRadius: 7,
    gap: 4,
    elevation: 1,
    shadowColor: "#EA580C",
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  claimButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900"
  }
});

