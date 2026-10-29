import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Linking,
  Alert
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import {
  ShoppingCart,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  Phone,
  Navigation2,
  Check,
  Truck,
  X,
  Navigation,
  Compass
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { formatDistance } from "../utils/geo";
import { DeliveryAddress } from "../types";


export const CartScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    user,
    location,
    locationName,
    isGPS,
    stores,
    deliveryAddress,
    saveDeliveryAddress
  } = useApp();

  const [address, setAddress] = useState<DeliveryAddress | null>(deliveryAddress || user?.address || null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editAddress, setEditAddress] = useState<DeliveryAddress>({
    fullName: user?.name || "",
    phone: user?.phone || "",
    houseDetails: "",
    streetArea: "",
    city: "",
    district: "Kerala",
    pincode: "",
    addressType: "Home",
    lat: isGPS ? location?.latitude : undefined,
    lng: isGPS ? location?.longitude : undefined
  });
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  const [deliveryOption, setDeliveryOption] = useState<"pickup" | "delivery">("pickup");
  const [paymentOption, setPaymentOption] = useState<"cod" | "upi">("cod");
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState("");

  // Sync address from context / user database profile or AsyncStorage
  useEffect(() => {
    async function loadAddress() {
      // 1. If context or user profile has address from database, prioritize it
      const currentAddr = deliveryAddress || user?.address;
      if (currentAddr) {
        setAddress(currentAddr);
        setEditAddress(currentAddr);
        return;
      }

      // 2. Fallback to AsyncStorage
      try {
        const raw = await AsyncStorage.getItem("@smartshopper_delivery_address");
        if (raw) {
          const parsed: DeliveryAddress = JSON.parse(raw);
          setAddress(parsed);
          setEditAddress(parsed);
        } else {
          setAddress(null);
          setEditAddress({
            fullName: user?.name || "",
            phone: user?.phone || "",
            houseDetails: "",
            streetArea: locationName && isGPS ? locationName.split(",")[0] : "",
            city: locationName && isGPS ? (locationName.split(",")[0] || "") : "",
            district: "Kerala",
            pincode: "",
            addressType: "Home",
            lat: isGPS ? location?.latitude : undefined,
            lng: isGPS ? location?.longitude : undefined
          });
        }
      } catch (e) {}
    }
    loadAddress();
  }, [user, location, locationName, deliveryAddress, isGPS]);

  const saveAddress = async (newAddr: DeliveryAddress) => {
    setAddress(newAddr);
    // Saves to both Supabase (if logged in) and AsyncStorage via AppContext
    await saveDeliveryAddress(newAddr);
  };

  const handleOpenAddAddress = () => {
    setEditAddress({
      fullName: user?.name || address?.fullName || "",
      phone: user?.phone || address?.phone || "",
      houseDetails: address?.houseDetails || "",
      streetArea: address?.streetArea || (locationName && isGPS ? locationName.split(",")[0] : ""),
      city: address?.city || "",
      district: address?.district || "Kerala",
      pincode: address?.pincode || "",
      addressType: address?.addressType || "Home",
      lat: address?.lat ?? (isGPS ? location?.latitude : undefined),
      lng: address?.lng ?? (isGPS ? location?.longitude : undefined)
    });
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = () => {
    if (address) {
      setEditAddress({ ...address });
    } else {
      handleOpenAddAddress();
      return;
    }
    setShowAddressModal(true);
  };

  const handleSaveEditAddress = async () => {
    if (!editAddress.fullName.trim() || !editAddress.phone.trim()) {
      Alert.alert("Required Fields", "Please enter receiver's name and contact phone number.");
      return;
    }
    if (!editAddress.houseDetails.trim() || !editAddress.streetArea.trim()) {
      Alert.alert("Required Fields", "Please enter house/building details and street area.");
      return;
    }

    const toSave: DeliveryAddress = { ...editAddress };

    // Validate coordinates. If missing or invalid, attempt geocoding from street/city/district/pincode
    const hasValidCoords =
      typeof toSave.lat === "number" &&
      typeof toSave.lng === "number" &&
      !isNaN(toSave.lat) &&
      !isNaN(toSave.lng) &&
      (toSave.lat !== 0 || toSave.lng !== 0) &&
      toSave.lat >= -90 && toSave.lat <= 90 &&
      toSave.lng >= -180 && toSave.lng <= 180;

    if (!hasValidCoords) {
      try {
        const query = [toSave.streetArea, toSave.city, toSave.district, toSave.pincode]
          .filter(Boolean)
          .join(", ");
        if (query) {
          const geocoded = await Location.geocodeAsync(query).catch(() => []);
          if (geocoded && geocoded.length > 0 && geocoded[0].latitude && geocoded[0].longitude) {
            toSave.lat = Number(geocoded[0].latitude.toFixed(6));
            toSave.lng = Number(geocoded[0].longitude.toFixed(6));
          }
        }
      } catch (err) {
        console.warn("[CartScreen] Geocoding address error:", err);
      }
    }

    await saveAddress(toSave);
    setShowAddressModal(false);
  };

  const handleDeleteAddress = () => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this delivery address? You will need to add an address before placing an order.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setAddress(null);
            setShowAddressModal(false);
            // Deletes from both Supabase (if logged in) and AsyncStorage
            await saveDeliveryAddress(null);
          }
        }
      ]
    );
  };

  // High-accuracy live GPS location auto-fetch
  const handleAutofillGps = async () => {
    setIsFetchingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is needed to auto-fetch your current address and coordinates."
        );
        setIsFetchingGps(false);
        return;
      }

      // Fast check: start with quick position or last known
      let curCoords: { latitude: number; longitude: number } | null = null;
      const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
      if (lastKnown?.coords) {
        curCoords = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude
        };
      }

      // Fresh high/balanced accuracy fix with timeout
      try {
        const fresh = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((res) => setTimeout(() => res(null), 3500))
        ]);
        if (fresh && fresh.coords) {
          curCoords = {
            latitude: fresh.coords.latitude,
            longitude: fresh.coords.longitude
          };
        }
      } catch (err) {}

      if (!curCoords) {
        Alert.alert("GPS Fix Unavailable", "Could not acquire a live GPS position. Please check your device location settings.");
        setIsFetchingGps(false);
        return;
      }

      const currentLat = Number(curCoords.latitude.toFixed(6));
      const currentLng = Number(curCoords.longitude.toFixed(6));

      // Reverse geocode to obtain street, city, district, postal code
      const geoResults = await Location.reverseGeocodeAsync(curCoords).catch(() => []);
      const geo = geoResults && geoResults.length > 0 ? geoResults[0] : null;

      const detectedStreet = [geo?.street, geo?.name, geo?.district]
        .filter(Boolean)
        .join(", ");
      const detectedCity = geo?.city || geo?.subregion || geo?.district || "";
      const detectedDistrict = geo?.district || geo?.subregion || geo?.region || "";
      const detectedPostal = geo?.postalCode || "";

      const updatedAddr: DeliveryAddress = {
        ...editAddress,
        streetArea: detectedStreet || (locationName ? locationName.split(",")[0] : "Current Location"),
        city: detectedCity,
        district: detectedDistrict,
        pincode: detectedPostal,
        lat: currentLat,
        lng: currentLng
      };

      setEditAddress(updatedAddr);
    } catch (e) {
      console.warn("GPS Autofill error:", e);
      Alert.alert("GPS Error", "Could not fetch current coordinates. Please check GPS settings.");
    } finally {
      setIsFetchingGps(false);
    }
  };

  // Calculations
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

  const handlePlaceOrder = () => {
    if (!address) {
      Alert.alert("Delivery Address Required", "Please add a delivery address to complete your order.");
      handleOpenAddAddress();
      return;
    }

    if (!address.phone || address.phone.length < 10) {
      Alert.alert("Address Incomplete", "Please provide a valid 10-digit phone number in your delivery address.");
      handleOpenEditAddress();
      return;
    }

    const orderId = "SS-ORD-" + Math.floor(100000 + Math.random() * 900000);
    setConfirmedOrderId(orderId);
    setIsSuccess(true);
  };

  // Find store of first item for contact info in success screen
  const primaryStore = cart.length > 0
    ? stores.find(
        (s) => s.id === cart[0].product.storeId || s.name.toLowerCase() === cart[0].product.storeName?.toLowerCase()
      )
    : null;

  return (
    <View style={styles.container}>
      <Header />

      {isSuccess && address ? (
        /* ORDER PLACED CONFIRMATION SCREEN */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={46} color="#16A34A" />
          </View>
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successSub}>
            Your local order has been verified and forwarded to the local partner store in Kerala.
          </Text>

          <View style={styles.orderIdBox}>
            <Text style={styles.orderIdLabel}>ORDER REFERENCE NUMBER</Text>
            <Text style={styles.orderIdValue}>{confirmedOrderId}</Text>
            <Text style={styles.orderIdHelp}>Show this order number at the store counter or to the delivery partner.</Text>
          </View>

          {/* Delivery Address Summary */}
          <View style={styles.confirmedAddressBox}>
            <Text style={styles.boxTitle}>DELIVERING TO</Text>
            <Text style={styles.confirmedName}>{address.fullName} • {address.phone}</Text>
            <Text style={styles.confirmedAddressText}>
              {address.houseDetails}, {address.streetArea}, {address.city}, {address.district} - {address.pincode}
            </Text>
            <View style={styles.pillType}>
              <Text style={styles.pillTypeText}>{address.addressType.toUpperCase()}</Text>
            </View>
          </View>

          {primaryStore && (
            <View style={styles.storeDetailsCard}>
              <Text style={styles.boxTitle}>PARTNER STORE CONTACT</Text>
              <Text style={styles.storeNameText}>{primaryStore.name}</Text>
              <Text style={styles.storeAddressText}>{primaryStore.address}</Text>

              <View style={styles.storeActionRow}>
                {primaryStore.phone ? (
                  <TouchableOpacity
                    style={styles.storeCallButton}
                    onPress={() => Linking.openURL("tel:" + primaryStore.phone)}
                    activeOpacity={0.8}
                  >
                    <Phone size={14} color="#FFFFFF" />
                    <Text style={styles.storeCallButtonText}>Call Store</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.storeDirectionsButton}
                  onPress={() => {
                    const url = "https://www.google.com/maps/dir/?api=1&destination=" + primaryStore.lat + "," + primaryStore.lng;
                    Linking.openURL(url);
                  }}
                  activeOpacity={0.8}
                >
                  <Navigation2 size={14} color="#EA580C" />
                  <Text style={styles.storeDirectionsButtonText}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.continueShoppingBtn}
            onPress={() => {
              clearCart();
              setIsSuccess(false);
              (navigation as any).navigate("Home");
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.continueShoppingText}>Back to Home & Explore</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* CART & ADDRESS SCREEN */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Top Title Bar */}
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <View style={styles.cartIconCircle}>
                <ShoppingCart size={18} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.screenTitle}>My Cart</Text>
                <Text style={styles.screenSub}>5 KM Local Stores in Kerala</Text>
              </View>
            </View>
            {cart.length > 0 && (
              <TouchableOpacity onPress={clearCart} style={styles.clearBtn} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>Clear Cart</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* CRUCIAL SECTION: DELIVERY ADDRESS */}
          <View style={styles.addressSection}>
            <View style={styles.addressHeaderRow}>
              <View style={styles.addressHeaderLeft}>
                <MapPin size={16} color="#EA580C" />
                <Text style={styles.addressSectionTitle}>DELIVERY ADDRESS</Text>
              </View>
              {address ? (
                <View style={styles.addressHeaderActions}>
                  <TouchableOpacity
                    style={styles.deleteAddressHeaderBtn}
                    onPress={handleDeleteAddress}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={12} color="#EF4444" />
                    <Text style={styles.deleteAddressHeaderBtnText}>Delete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editAddressBtn}
                    onPress={handleOpenEditAddress}
                    activeOpacity={0.8}
                  >
                    <Edit2 size={12} color="#EA580C" />
                    <Text style={styles.editAddressBtnText}>Change / Edit</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {address ? (
              <View style={styles.addressCard}>
                <View style={styles.addressCardTop}>
                  <Text style={styles.addressName}>{address.fullName}</Text>
                  <View style={styles.addressTypeBadge}>
                    <Text style={styles.addressTypeBadgeText}>{address.addressType}</Text>
                  </View>
                </View>

                <Text style={styles.addressLine}>
                  {address.houseDetails}, {address.streetArea}
                </Text>
                <Text style={styles.addressCity}>
                  {address.city}, {address.district}, Kerala - {address.pincode}
                </Text>
                <Text style={styles.addressPhone}>📱 Phone: {address.phone}</Text>

                {/* Coordinates Pill */}
                {address.lat && address.lng ? (
                  <View style={styles.coordsBadgeRow}>
                    <Compass size={12} color="#0284C7" />
                    <Text style={styles.coordsBadgeText}>
                      GPS: {address.lat.toFixed(5)}° N, {address.lng.toFixed(5)}° E
                    </Text>
                    <View style={styles.gpsVerifiedDot} />
                    <Text style={styles.gpsVerifiedText}>Saved</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              /* EMPTY ADDRESS STATE: ADD DELIVERY ADDRESS */
              <TouchableOpacity
                style={styles.noAddressCard}
                onPress={handleOpenAddAddress}
                activeOpacity={0.8}
              >
                <View style={styles.noAddressIconBox}>
                  <Plus size={20} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noAddressTitle}>Add Delivery Address</Text>
                  <Text style={styles.noAddressSub}>
                    {user?.name
                      ? `Auto-filling details for ${user.name} (${user.phone || "No phone"})`
                      : "Tap to set up your delivery/pickup location in Kerala"}
                  </Text>
                </View>
                <View style={styles.addAddressActionBtn}>
                  <Text style={styles.addAddressActionText}>+ Add</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* CART ITEMS LIST */}
          {cart.length === 0 ? (
            <View style={styles.emptyCartCard}>
              <View style={styles.emptyIconCircle}>
                <ShoppingBag size={42} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
              <Text style={styles.emptySub}>
                Add products from verified stores within 5 km of your location in Kerala.
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => (navigation as any).navigate("Home")}
                activeOpacity={0.85}
              >
                <Text style={styles.exploreBtnText}>Explore Products Near You</Text>
                <ArrowRight size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Product Items */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionHeading}>CART ITEMS ({cart.length})</Text>
                {cart.map((item) => {
                  const p = parseFloat(item.product.offerPrice.replace(/[^\d.]/g, "")) || 0;
                  const itemSubtotal = p * item.quantity;

                  return (
                    <View key={item.product.id} style={styles.cartItemCard}>
                      <Image
                        source={{ uri: item.product.imageUrl }}
                        style={styles.itemThumb}
                        resizeMode="cover"
                      />

                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle} numberOfLines={2}>
                          {item.product.name}
                        </Text>

                        <View style={styles.itemStoreRow}>
                          <Store size={10} color="#64748B" />
                          <Text style={styles.itemStoreName} numberOfLines={1}>
                            {item.product.storeName || "Partner Store"}
                          </Text>
                          {item.product.distanceInMeters != null && (
                            <View style={styles.itemDistPill}>
                              <Text style={styles.itemDistText}>
                                {formatDistance(item.product.distanceInMeters)}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.itemPriceRow}>
                          <Text style={styles.itemOfferPrice}>₹{itemSubtotal}</Text>
                          {item.product.originalPrice ? (
                            <Text style={styles.itemOrigPrice}>{item.product.originalPrice}</Text>
                          ) : null}
                        </View>

                        {/* Quantity & Delete Controls */}
                        <View style={styles.itemControlsRow}>
                          <View style={styles.qtyCounter}>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus size={12} color="#0F172A" />
                            </TouchableOpacity>
                            <Text style={styles.qtyNumber}>{item.quantity}</Text>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus size={12} color="#0F172A" />
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => removeFromCart(item.product.id)}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={13} color="#EF4444" />
                            <Text style={styles.removeBtnText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Order Fulfillment Method */}
              <View style={styles.fulfillmentSection}>
                <Text style={styles.sectionHeading}>ORDER FULFILLMENT</Text>
                <View style={styles.fulfillmentRow}>
                  <TouchableOpacity
                    style={[styles.fulfillmentCard, deliveryOption === "pickup" && styles.fulfillmentCardActive]}
                    onPress={() => setDeliveryOption("pickup")}
                    activeOpacity={0.8}
                  >
                    <Store size={16} color={deliveryOption === "pickup" ? "#EA580C" : "#64748B"} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fulfillmentTitle, deliveryOption === "pickup" && styles.fulfillmentTitleActive]}>
                        Store Pickup (Free)
                      </Text>
                      <Text style={styles.fulfillmentSub}>Instant pickup at store</Text>
                    </View>
                    {deliveryOption === "pickup" && <Check size={16} color="#EA580C" />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.fulfillmentCard, deliveryOption === "delivery" && styles.fulfillmentCardActive]}
                    onPress={() => setDeliveryOption("delivery")}
                    activeOpacity={0.8}
                  >
                    <Truck size={16} color={deliveryOption === "delivery" ? "#EA580C" : "#64748B"} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fulfillmentTitle, deliveryOption === "delivery" && styles.fulfillmentTitleActive]}>
                        Local Delivery
                      </Text>
                      <Text style={styles.fulfillmentSub}>Within 5 km radius</Text>
                    </View>
                    {deliveryOption === "delivery" && <Check size={16} color="#EA580C" />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Payment Method */}
              <View style={styles.fulfillmentSection}>
                <Text style={styles.sectionHeading}>PAYMENT METHOD</Text>
                <View style={styles.fulfillmentRow}>
                  <TouchableOpacity
                    style={[styles.fulfillmentCard, paymentOption === "cod" && styles.fulfillmentCardActive]}
                    onPress={() => setPaymentOption("cod")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.fulfillmentTitle, paymentOption === "cod" && styles.fulfillmentTitleActive]}>
                      💵 Pay at Store / COD
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.fulfillmentCard, paymentOption === "upi" && styles.fulfillmentCardActive]}
                    onPress={() => setPaymentOption("upi")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.fulfillmentTitle, paymentOption === "upi" && styles.fulfillmentTitleActive]}>
                      ⚡ UPI / QR Payment
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Price Details Breakdown */}
              <View style={styles.priceBreakdownCard}>
                <Text style={styles.sectionHeading}>PRICE DETAILS ({cart.length} ITEMS)</Text>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Total MRP</Text>
                  <Text style={styles.breakdownValue}>₹{totalOriginal > 0 ? totalOriginal : totalAmount}</Text>
                </View>

                {savings > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: "#16A34A" }]}>Product Savings</Text>
                    <Text style={[styles.breakdownValue, { color: "#16A34A" }]}>-₹{savings}</Text>
                  </View>
                )}

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Delivery / Pickup Fee</Text>
                  <Text style={[styles.breakdownValue, { color: "#16A34A" }]}>FREE</Text>
                </View>

                <View style={[styles.breakdownRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Total Amount</Text>
                  <Text style={styles.grandTotalValue}>₹{totalAmount}</Text>
                </View>

                {savings > 0 && (
                  <View style={styles.savingsBanner}>
                    <Text style={styles.savingsBannerText}>
                      🎉 You will save ₹{savings} on this 5 km local store order!
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* STICKY BOTTOM CHECKOUT BAR (WHEN CART NOT EMPTY) */}
      {!isSuccess && cart.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.bottomTotal}>₹{totalAmount}</Text>
          </View>
          <TouchableOpacity
            style={styles.placeOrderBtn}
            onPress={handlePlaceOrder}
            activeOpacity={0.85}
          >
            <Text style={styles.placeOrderBtnText}>PLACE ORDER</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* EDIT ADDRESS MODAL */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddressModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MapPin size={18} color="#EA580C" />
                <Text style={styles.modalTitle}>
                  {address ? "Edit Delivery Address" : "Add Delivery Address"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddressModal(false)} style={styles.closeBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              {/* GPS Auto Fetch Button */}
              <TouchableOpacity
                style={[styles.gpsAutofillBtn, isFetchingGps && styles.gpsAutofillBtnLoading]}
                onPress={handleAutofillGps}
                disabled={isFetchingGps}
                activeOpacity={0.8}
              >
                {isFetchingGps ? (
                  <ActivityIndicator size="small" color="#EA580C" />
                ) : (
                  <Navigation size={16} color="#EA580C" />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.gpsAutofillText}>
                    {isFetchingGps ? "Auto-Fetching Live GPS Coordinates..." : "Auto-Fetch Current Location & Lat/Lng"}
                  </Text>
                  <Text style={styles.gpsAutofillSub}>
                    {editAddress.lat && editAddress.lng
                      ? `Lat: ${editAddress.lat.toFixed(5)}° N, Lng: ${editAddress.lng.toFixed(5)}° E`
                      : "Tap to detect exact GPS latitude & longitude"}
                  </Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editAddress.fullName}
                onChangeText={(v) => setEditAddress((p) => ({ ...p, fullName: v }))}
                placeholder="Receiver's name"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Mobile Phone Number (10 digits) *</Text>
              <TextInput
                style={styles.textInput}
                value={editAddress.phone}
                onChangeText={(v) => setEditAddress((p) => ({ ...p, phone: v }))}
                placeholder="10-digit phone number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.inputLabel}>House / Flat / Building Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editAddress.houseDetails}
                onChangeText={(v) => setEditAddress((p) => ({ ...p, houseDetails: v }))}
                placeholder="House / Apartment / Floor"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Street / Area / Landmark *</Text>
              <TextInput
                style={styles.textInput}
                value={editAddress.streetArea}
                onChangeText={(v) => setEditAddress((p) => ({ ...p, streetArea: v }))}
                placeholder="Street address or landmark"
                placeholderTextColor="#94A3B8"
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>City / Town *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editAddress.city}
                    onChangeText={(v) => setEditAddress((p) => ({ ...p, city: v }))}
                    placeholder="City"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>PIN Code *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editAddress.pincode}
                    onChangeText={(v) => setEditAddress((p) => ({ ...p, pincode: v }))}
                    placeholder="682030"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              {/* Precise Latitude & Longitude */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Latitude (Auto-detected)</Text>
                  <TextInput
                    style={[styles.textInput, styles.coordInput]}
                    value={editAddress.lat != null ? String(editAddress.lat) : ""}
                    onChangeText={(v) => {
                      const num = parseFloat(v);
                      setEditAddress((p) => ({ ...p, lat: isNaN(num) ? undefined : num }));
                    }}
                    placeholder="e.g. 10.0159"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Longitude (Auto-detected)</Text>
                  <TextInput
                    style={[styles.textInput, styles.coordInput]}
                    value={editAddress.lng != null ? String(editAddress.lng) : ""}
                    onChangeText={(v) => {
                      const num = parseFloat(v);
                      setEditAddress((p) => ({ ...p, lng: isNaN(num) ? undefined : num }));
                    }}
                    placeholder="e.g. 76.3419"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Address Type</Text>
              <View style={styles.typeRow}>
                {(["Home", "Work", "Other"] as const).map((t) => {
                  const isSel = editAddress.addressType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeBtn, isSel && styles.typeBtnActive]}
                      onPress={() => setEditAddress((p) => ({ ...p, addressType: t }))}
                    >
                      <Text style={[styles.typeBtnText, isSel && styles.typeBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.saveAddressBtn}
                onPress={handleSaveEditAddress}
                activeOpacity={0.85}
              >
                <Text style={styles.saveAddressBtnText}>SAVE & USE THIS ADDRESS</Text>
              </TouchableOpacity>

              {address ? (
                <TouchableOpacity
                  style={styles.deleteAddressModalBtn}
                  onPress={handleDeleteAddress}
                  activeOpacity={0.8}
                >
                  <Trash2 size={13} color="#EF4444" />
                  <Text style={styles.deleteAddressModalBtnText}>Delete This Address</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 110,
    gap: 12
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  cartIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center"
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A"
  },
  screenSub: {
    fontSize: 11,
    color: "#64748B"
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  clearBtnText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700"
  },
  /* ADDRESS SECTION */
  addressSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  addressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  addressHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  addressSectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.6
  },
  addressHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  deleteAddressHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  deleteAddressHeaderBtnText: {
    color: "#EF4444",
    fontSize: 10.5,
    fontWeight: "800"
  },
  editAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  editAddressBtnText: {
    color: "#EA580C",
    fontSize: 10.5,
    fontWeight: "800"
  },
  addressCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    gap: 4
  },
  addressCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  addressName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A"
  },
  addressTypeBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4
  },
  addressTypeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#475569"
  },
  addressLine: {
    fontSize: 12,
    color: "#334155"
  },
  addressCity: {
    fontSize: 11,
    color: "#64748B"
  },
  addressPhone: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2
  },
  coordsBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
    marginTop: 4,
    alignSelf: "flex-start"
  },
  coordsBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0369A1"
  },
  noAddressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#FDBA74",
    borderRadius: 14,
    padding: 14,
    gap: 12
  },
  noAddressIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center"
  },
  noAddressTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#EA580C"
  },
  noAddressSub: {
    fontSize: 11,
    color: "#7C2D12",
    marginTop: 2
  },
  addAddressActionBtn: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  addAddressActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900"
  },
  gpsVerifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#16A34A"
  },
  gpsVerifiedText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#16A34A"
  },
  /* EMPTY CART */
  emptyCartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    padding: 36,
    alignItems: "center",
    gap: 8
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A"
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    marginTop: 6
  },
  exploreBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800"
  },
  /* ITEMS LIST */
  itemsSection: {
    gap: 8
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5
  },
  cartItemCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 12
  },
  itemThumb: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: "#F1F5F9"
  },
  itemInfo: {
    flex: 1,
    gap: 3
  },
  itemTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 17
  },
  itemStoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  itemStoreName: {
    fontSize: 10.5,
    color: "#64748B"
  },
  itemDistPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  itemDistText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#166534"
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 2
  },
  itemOfferPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#059669"
  },
  itemOrigPrice: {
    fontSize: 11,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  itemControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6
  },
  qtyCounter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  qtyNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    minWidth: 20,
    textAlign: "center"
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4
  },
  removeBtnText: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "700"
  },
  /* FULFILLMENT */
  fulfillmentSection: {
    gap: 6
  },
  fulfillmentRow: {
    flexDirection: "row",
    gap: 8
  },
  fulfillmentCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    gap: 8
  },
  fulfillmentCardActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#EA580C"
  },
  fulfillmentTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155"
  },
  fulfillmentTitleActive: {
    color: "#EA580C"
  },
  fulfillmentSub: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 1
  },
  /* BREAKDOWN */
  priceBreakdownCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    gap: 8
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#64748B"
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A"
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    marginTop: 4
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A"
  },
  grandTotalValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#EA580C"
  },
  savingsBanner: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    padding: 8,
    borderRadius: 8,
    marginTop: 4
  },
  savingsBannerText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#166534",
    textAlign: "center"
  },
  /* BOTTOM BAR */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8
  },
  bottomLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#64748B"
  },
  bottomTotal: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A"
  },
  placeOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  placeOrderBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  /* SUCCESS SCREEN */
  successContainer: {
    padding: 24,
    alignItems: "center",
    gap: 12
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  successTitle: {
    fontSize: 19,
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
  orderIdBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5
  },
  orderIdValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#EA580C",
    letterSpacing: 1
  },
  orderIdHelp: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center"
  },
  confirmedAddressBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    gap: 4
  },
  boxTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5
  },
  confirmedName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A"
  },
  confirmedAddressText: {
    fontSize: 11.5,
    color: "#475569",
    lineHeight: 16
  },
  pillType: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4
  },
  pillTypeText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#334155"
  },
  storeDetailsCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    gap: 4
  },
  storeNameText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A"
  },
  storeAddressText: {
    fontSize: 11,
    color: "#64748B"
  },
  storeActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6
  },
  storeCallButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6
  },
  storeCallButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800"
  },
  storeDirectionsButton: {
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
  storeDirectionsButtonText: {
    color: "#EA580C",
    fontSize: 12,
    fontWeight: "800"
  },
  continueShoppingBtn: {
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8
  },
  continueShoppingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800"
  },
  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    maxHeight: 650
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A"
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center"
  },
  formScroll: {
    padding: 16,
    gap: 8,
    paddingBottom: 32
  },
  gpsAutofillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
    marginBottom: 6
  },
  gpsAutofillBtnLoading: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5"
  },
  gpsAutofillText: {
    color: "#EA580C",
    fontSize: 11.5,
    fontWeight: "900"
  },
  gpsAutofillSub: {
    color: "#9A3412",
    fontSize: 9.5,
    fontWeight: "600",
    marginTop: 1
  },
  coordInput: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
    color: "#0369A1",
    fontWeight: "700"
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#475569",
    marginTop: 2
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: "#0F172A"
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2
  },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
    borderRadius: 8
  },
  typeBtnActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#EA580C"
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B"
  },
  typeBtnTextActive: {
    color: "#EA580C",
    fontWeight: "900"
  },
  saveAddressBtn: {
    backgroundColor: "#EA580C",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12
  },
  saveAddressBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.4
  },
  deleteAddressModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 8
  },
  deleteAddressModalBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "800"
  }
});
