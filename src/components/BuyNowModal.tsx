import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import {
  X,
  Store,
  MapPin,
  CheckCircle2,
  Phone,
  Navigation2,
  Zap,
  Truck,
  ArrowRight
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { formatDistance } from "../utils/geo";

export const BuyNowModal: React.FC = () => {
  const { buyNowProduct, setBuyNowProduct, user, stores } = useApp();

  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"pickup" | "delivery">("pickup");
  const [paymentOption, setPaymentOption] = useState<"cod" | "upi">("cod");
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState("");

  useEffect(() => {
    if (buyNowProduct) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantity(1);
      setIsSuccess(false);
      setCustomerName(user?.name || "");
      setCustomerPhone(user?.phone || "");
    }
  }, [buyNowProduct, user]);

  if (!buyNowProduct) return null;

  const matchedStore = stores.find(
    (s) => s.id === buyNowProduct.storeId || s.name.toLowerCase() === buyNowProduct.storeName?.toLowerCase()
  );

  const priceNum = parseFloat(buyNowProduct.offerPrice.replace(/[^\d.]/g, "")) || 0;
  const originalPriceNum = parseFloat(buyNowProduct.originalPrice.replace(/[^\d.]/g, "")) || priceNum;
  const itemTotal = priceNum * quantity;
  const totalSavings = Math.max(0, (originalPriceNum - priceNum) * quantity);

  const handleConfirmOrder = () => {
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      Alert.alert("Contact Details Required", "Please enter a valid 10-digit mobile number for order verification.");
      return;
    }

    const orderId = "SS-ORD-" + Math.floor(100000 + Math.random() * 900000);
    setConfirmedOrderId(orderId);
    setIsSuccess(true);
  };

  const handleClose = () => {
    setBuyNowProduct(null);
    setIsSuccess(false);
  };

  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.zapIconCircle}>
                  <Zap size={16} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Instant Checkout</Text>
                  <Text style={styles.headerSub}>5 KM Local Verified Partner Store</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {isSuccess ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.successScroll}>
                <View style={styles.successBadgeCircle}>
                  <CheckCircle2 size={42} color="#16A34A" />
                </View>
                <Text style={styles.successTitle}>Order Placed Successfully!</Text>
                <Text style={styles.successSub}>
                  Your local order has been dispatched to {buyNowProduct.storeName || "the store"}.
                </Text>

                <View style={styles.orderIdCard}>
                  <Text style={styles.orderIdLabel}>ORDER REFERENCE ID</Text>
                  <Text style={styles.orderIdValue}>{confirmedOrderId}</Text>
                  <Text style={styles.orderIdHelp}>Show this reference ID at the store or when receiving your order.</Text>
                </View>

                {matchedStore && (
                  <View style={styles.storeContactBox}>
                    <Text style={styles.storeContactTitle}>STORE CONTACT & LOCATION</Text>
                    <Text style={styles.storeContactName}>{matchedStore.name}</Text>
                    <Text style={styles.storeContactAddress}>{matchedStore.address}</Text>

                    <View style={styles.storeActionButtons}>
                      {matchedStore.phone ? (
                        <TouchableOpacity
                          style={styles.storeCallBtn}
                          onPress={() => Linking.openURL("tel:" + matchedStore.phone)}
                          activeOpacity={0.8}
                        >
                          <Phone size={14} color="#FFFFFF" />
                          <Text style={styles.storeCallBtnText}>Call Store</Text>
                        </TouchableOpacity>
                      ) : null}

                      <TouchableOpacity
                        style={styles.storeNavBtn}
                        onPress={() => {
                          const url = "https://www.google.com/maps/dir/?api=1&destination=" + matchedStore.lat + "," + matchedStore.lng;
                          Linking.openURL(url);
                        }}
                        activeOpacity={0.8}
                      >
                        <Navigation2 size={14} color="#EA580C" />
                        <Text style={styles.storeNavBtnText}>Get Directions</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.doneBtn} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={styles.doneBtnText}>Continue Shopping</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Product Summary Card */}
                <View style={styles.productSummaryCard}>
                  <Image source={{ uri: buyNowProduct.imageUrl }} style={styles.productThumb} resizeMode="cover" />
                  <View style={styles.productSummaryInfo}>
                    <Text style={styles.productSummaryName} numberOfLines={2}>
                      {buyNowProduct.name}
                    </Text>
                    <View style={styles.productSummaryStoreRow}>
                      <Store size={12} color="#64748B" />
                      <Text style={styles.productSummaryStoreName} numberOfLines={1}>
                        {buyNowProduct.storeName || "Local Partner Store"}
                      </Text>
                      {buyNowProduct.distanceInMeters != null && (
                        <View style={styles.distanceBadge}>
                          <Text style={styles.distanceText}>{formatDistance(buyNowProduct.distanceInMeters)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.offerPrice}>{buyNowProduct.offerPrice}</Text>
                      {buyNowProduct.originalPrice ? (
                        <Text style={styles.origPrice}>{buyNowProduct.originalPrice}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* Quantity Selector */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardLabel}>SELECT QUANTITY</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyDisplay}>{quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Delivery / Pickup Method */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardLabel}>ORDER FULFILLMENT</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[styles.optionCard, deliveryOption === "pickup" && styles.optionCardActive]}
                      onPress={() => setDeliveryOption("pickup")}
                      activeOpacity={0.8}
                    >
                      <Store size={16} color={deliveryOption === "pickup" ? "#EA580C" : "#64748B"} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionTitle, deliveryOption === "pickup" && styles.optionTitleActive]}>
                          Store Pickup (Free)
                        </Text>
                        <Text style={styles.optionSub}>Pick up in 30 mins at store</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.optionCard, deliveryOption === "delivery" && styles.optionCardActive]}
                      onPress={() => setDeliveryOption("delivery")}
                      activeOpacity={0.8}
                    >
                      <Truck size={16} color={deliveryOption === "delivery" ? "#EA580C" : "#64748B"} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionTitle, deliveryOption === "delivery" && styles.optionTitleActive]}>
                          Local Delivery
                        </Text>
                        <Text style={styles.optionSub}>Delivered within 5 km</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Customer Contact Input */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardLabel}>CUSTOMER DETAILS</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#94A3B8"
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number (10 digits) *"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                  />
                </View>

                {/* Payment Method */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardLabel}>PAYMENT METHOD</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[styles.optionCard, paymentOption === "cod" && styles.optionCardActive]}
                      onPress={() => setPaymentOption("cod")}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.optionTitle, paymentOption === "cod" && styles.optionTitleActive]}>
                        💵 Pay at Store / COD
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.optionCard, paymentOption === "upi" && styles.optionCardActive]}
                      onPress={() => setPaymentOption("upi")}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.optionTitle, paymentOption === "upi" && styles.optionTitleActive]}>
                        ⚡ UPI / QR Payment
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bill Breakdown */}
                <View style={styles.billCard}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Price ({quantity}x)</Text>
                    <Text style={styles.billValue}>₹{itemTotal}</Text>
                  </View>
                  {totalSavings > 0 && (
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, { color: "#16A34A" }]}>You Save</Text>
                      <Text style={[styles.billValue, { color: "#16A34A" }]}>-₹{totalSavings}</Text>
                    </View>
                  )}
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Delivery / Pickup Fee</Text>
                    <Text style={[styles.billValue, { color: "#16A34A" }]}>FREE</Text>
                  </View>
                  <View style={[styles.billRow, styles.billTotalRow]}>
                    <Text style={styles.billTotalLabel}>Total Amount</Text>
                    <Text style={styles.billTotalValue}>₹{itemTotal}</Text>
                  </View>
                </View>

                {/* Confirm Order Button */}
                <TouchableOpacity style={styles.confirmOrderBtn} onPress={handleConfirmOrder} activeOpacity={0.85}>
                  <Zap size={16} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.confirmOrderText}>CONFIRM ORDER • ₹{itemTotal}</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </ScrollView>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "flex-end"
  },
  keyboardContainer: {
    width: "100%",
    maxHeight: "92%"
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    maxHeight: 680
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF"
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  zapIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A"
  },
  headerSub: {
    fontSize: 11,
    color: "#64748B"
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center"
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12
  },
  productSummaryCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 12
  },
  productThumb: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: "#E2E8F0"
  },
  productSummaryInfo: {
    flex: 1,
    justifyContent: "space-between"
  },
  productSummaryName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 18
  },
  productSummaryStoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2
  },
  productSummaryStoreName: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600"
  },
  distanceBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  distanceText: {
    fontSize: 9,
    color: "#166534",
    fontWeight: "800"
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 4
  },
  offerPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#059669"
  },
  origPrice: {
    fontSize: 12,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 8
  },
  sectionCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center"
  },
  qtyBtnDisabled: {
    opacity: 0.4
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A"
  },
  qtyDisplay: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    minWidth: 24,
    textAlign: "center"
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8
  },
  optionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    gap: 8
  },
  optionCardActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#EA580C"
  },
  optionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155"
  },
  optionTitleActive: {
    color: "#EA580C"
  },
  optionSub: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 1
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: "#0F172A"
  },
  billCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    gap: 6
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  billLabel: {
    fontSize: 12,
    color: "#64748B"
  },
  billValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A"
  },
  billTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    marginTop: 4
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A"
  },
  billTotalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#EA580C"
  },
  confirmOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  confirmOrderText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3
  },
  successScroll: {
    padding: 24,
    alignItems: "center",
    gap: 12
  },
  successBadgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center"
  },
  successSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18
  },
  orderIdCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4,
    marginVertical: 6
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5
  },
  orderIdValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#EA580C",
    letterSpacing: 1
  },
  orderIdHelp: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 2
  },
  storeContactBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    gap: 6
  },
  storeContactTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5
  },
  storeContactName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A"
  },
  storeContactAddress: {
    fontSize: 11,
    color: "#64748B"
  },
  storeActionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6
  },
  storeCallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6
  },
  storeCallBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800"
  },
  storeNavBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6
  },
  storeNavBtnText: {
    color: "#EA580C",
    fontSize: 12,
    fontWeight: "800"
  },
  doneBtn: {
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800"
  }
});
