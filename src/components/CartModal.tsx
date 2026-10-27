import React from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable
} from "react-native";
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  ShoppingBag
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { formatDistance } from "../utils/geo";

export const CartModal: React.FC = () => {
  const {
    showCartModal,
    setShowCartModal,
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    setBuyNowProduct
  } = useApp();

  if (!showCartModal) return null;

  const totalAmount = cart.reduce((sum, item) => {
    const p = parseFloat(item.product.offerPrice.replace(/[^\d.]/g, "")) || 0;
    return sum + p * item.quantity;
  }, 0);

  const totalOriginal = cart.reduce((sum, item) => {
    const orig = parseFloat(item.product.originalPrice.replace(/[^\d.]/g, "")) || 0;
    const p = parseFloat(item.product.offerPrice.replace(/[^\d.]/g, "")) || 0;
    return sum + (orig > 0 ? orig : p) * item.quantity;
  }, 0);

  const savings = Math.max(0, totalOriginal - totalAmount);

  const handleCheckoutAll = () => {
    if (cart.length > 0) {
      setShowCartModal(false);
      // Checkout first item or aggregate
      setBuyNowProduct(cart[0].product);
    }
  };

  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={() => setShowCartModal(false)}>
      <Pressable style={styles.overlay} onPress={() => setShowCartModal(false)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.cartIconCircle}>
                <ShoppingCart size={16} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Shopping Cart</Text>
                <Text style={styles.headerSub}>{cart.length} unique items</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {cart.length > 0 && (
                <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowCartModal(false)} style={styles.closeBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <View style={styles.emptyIconCircle}>
                <ShoppingBag size={36} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
              <Text style={styles.emptySub}>
                Browse verified local store products within 5 km in Kerala and add them to your cart.
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => setShowCartModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.browseBtnText}>Explore Products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cartList}>
                {cart.map((item) => {
                  const p = parseFloat(item.product.offerPrice.replace(/[^\d.]/g, "")) || 0;
                  const itemSubtotal = p * item.quantity;
                  return (
                    <View key={item.product.id} style={styles.cartItemCard}>
                      <Image source={{ uri: item.product.imageUrl }} style={styles.cartItemThumb} resizeMode="cover" />
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemTitle} numberOfLines={2}>
                          {item.product.name}
                        </Text>
                        <View style={styles.cartItemStoreRow}>
                          <Store size={10} color="#64748B" />
                          <Text style={styles.cartItemStoreName} numberOfLines={1}>
                            {item.product.storeName || "Local Store"}
                          </Text>
                        </View>
                        <View style={styles.cartItemPriceRow}>
                          <Text style={styles.cartItemPrice}>₹{itemSubtotal}</Text>
                          {item.product.originalPrice ? (
                            <Text style={styles.cartItemOrigPrice}>{item.product.originalPrice}</Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Quantity & Delete Actions */}
                      <View style={styles.cartItemActions}>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </TouchableOpacity>

                        <View style={styles.counterRow}>
                          <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus size={12} color="#0F172A" />
                          </TouchableOpacity>
                          <Text style={styles.counterNum}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus size={12} color="#0F172A" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Price Breakdown */}
                <View style={styles.priceBreakdownCard}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Subtotal</Text>
                    <Text style={styles.priceVal}>₹{totalAmount}</Text>
                  </View>
                  {savings > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { color: "#16A34A" }]}>Total Savings</Text>
                      <Text style={[styles.priceVal, { color: "#16A34A" }]}>-₹{savings}</Text>
                    </View>
                  )}
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Local Delivery / Pickup</Text>
                    <Text style={[styles.priceVal, { color: "#16A34A" }]}>FREE</Text>
                  </View>
                  <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalVal}>₹{totalAmount}</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Checkout Bar */}
              <View style={styles.bottomBar}>
                <View>
                  <Text style={styles.bottomTotalLabel}>Total Payable</Text>
                  <Text style={styles.bottomTotalVal}>₹{totalAmount}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckoutAll} activeOpacity={0.85}>
                  <Text style={styles.checkoutBtnText}>Checkout</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
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
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    maxHeight: 620
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  cartIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
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
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearBtnText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700"
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center"
  },
  emptyCartBox: {
    padding: 40,
    alignItems: "center",
    gap: 10
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A"
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: "#EA580C",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10
  },
  browseBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800"
  },
  cartList: {
    padding: 14,
    gap: 10
  },
  cartItemCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    gap: 10,
    alignItems: "center"
  },
  cartItemThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#F1F5F9"
  },
  cartItemInfo: {
    flex: 1,
    justifyContent: "space-between",
    gap: 3
  },
  cartItemTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 16
  },
  cartItemStoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  cartItemStoreName: {
    fontSize: 10,
    color: "#64748B"
  },
  cartItemPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6
  },
  cartItemPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#059669"
  },
  cartItemOrigPrice: {
    fontSize: 10,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  cartItemActions: {
    alignItems: "flex-end",
    gap: 8
  },
  deleteBtn: {
    padding: 4
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1"
  },
  counterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  counterNum: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    minWidth: 18,
    textAlign: "center"
  },
  priceBreakdownCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginTop: 6
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  priceLabel: {
    fontSize: 11,
    color: "#64748B"
  },
  priceVal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A"
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    marginTop: 4
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A"
  },
  totalVal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#EA580C"
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF"
  },
  bottomTotalLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700"
  },
  bottomTotalVal: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A"
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800"
  }
});
