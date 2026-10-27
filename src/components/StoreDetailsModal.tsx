import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import {
  X,
  MapPin,
  Phone,
  Clock,
  Navigation2,
  Tag,
  Calendar,
  Lock,
  Send,
  LogIn,
  AlertTriangle,
  Zap,
  Info,
  ShieldCheck,
  CheckCircle2,
  Store as StoreIcon,
  Package,
  Search,
  Check
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { formatDistance, calculateDistanceInMeters } from "../utils/geo";
import { ChatMessage, CatalogItem } from "../types";
import {
  fetchStoreChatMessages,
  sendStoreChatMessage,
  subscribeToStoreChat,
  fetchStoreCatalog
} from "../api/supabase";

const WEEKLY_SCHEDULE = [
  { day: "Monday", hours: "9:00 AM - 7:00 PM" },
  { day: "Tuesday", hours: "9:00 AM - 7:00 PM" },
  { day: "Wednesday", hours: "9:00 AM - 7:00 PM" },
  { day: "Thursday", hours: "9:00 AM - 7:00 PM" },
  { day: "Friday", hours: "9:00 AM - 7:00 PM" },
  { day: "Saturday", hours: "9:00 AM - 7:00 PM" },
  { day: "Sunday", hours: "9:00 AM - 7:00 PM" }
];

export const StoreDetailsModal: React.FC = () => {
  const {
    selectedStore,
    setSelectedStore,
    storeModalTab,
    setStoreModalTab,
    allOffers,
    setSelectedOfferForVoucher,
    user,
    openAuthModal,
    location,
    isInsideKerala
  } = useApp();

  const [activeTab, setActiveTab] = useState<"overview" | "hours" | "chat" | "catalog" | "reviews">(
    storeModalTab || "overview"
  );

  useEffect(() => {
    if (selectedStore && storeModalTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(storeModalTab);
    }
  }, [selectedStore, storeModalTab]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  // Catalog State
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>("All");

  const store = selectedStore;

  // SENSITIVE RULE:
  // User MUST be inside Kerala AND store MUST be within 5,000 meters (5 km)
  const userDistanceToStore = store
    ? calculateDistanceInMeters(location, { latitude: store.lat, longitude: store.lng })
    : 999999;

  const isCatalogEligible = isInsideKerala && userDistanceToStore <= 5000;

  // Load chat messages when store changes or when chat tab is selected
  useEffect(() => {
    if (!store) return;

    let isMounted = true;
    async function loadChat() {
      const msgs = await fetchStoreChatMessages(store!.id, user?.id);
      if (isMounted) {
        setMessages(msgs);
      }
    }
    loadChat();

    // Subscribe to realtime messages for this store
    const unsubscribe = subscribeToStoreChat(store.id, (newMsg) => {
      if (!isMounted) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [store?.id, user?.id]);

  // Load Catalog if user clicks Catalog tab and is eligible
  useEffect(() => {
    if (!store || activeTab !== "catalog" || !isCatalogEligible) return;

    let isMounted = true;
    async function loadCatalog() {
      setIsLoadingCatalog(true);
      const items = await fetchStoreCatalog(store!.id);
      if (isMounted) {
        setCatalogItems(items);
        setIsLoadingCatalog(false);
      }
    }
    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [store?.id, activeTab, isCatalogEligible]);

  useEffect(() => {
    if (activeTab === "chat") {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeTab, messages.length]);

  if (!store) return null;

  const storeOffers = allOffers.filter(
    (o) => o.storeId === store.id || o.storeName.toLowerCase() === store.name.toLowerCase()
  );

  const handleCall = () => {
    if (store.phone) {
      Linking.openURL(`tel:${store.phone}`);
    }
  };

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
    Linking.openURL(url);
  };

  const handleSendMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isSending || !user) return;

    setIsSending(true);
    setRateLimitWarning(null);

    const res = await sendStoreChatMessage(store.id, store.name, user, trimmed);

    setIsSending(false);

    if (res.success && res.message) {
      setChatInput("");
      setMessages((prev) => [...prev, res.message!]);
    } else {
      setRateLimitWarning(res.error || "Failed to send message. Please try again.");
      setTimeout(() => setRateLimitWarning(null), 4000);
    }
  };

  // Filter Catalog Items
  const catalogCategories = ["All", ...Array.from(new Set(catalogItems.map((c) => c.category || "General")))];

  const filteredCatalogItems = catalogItems.filter((item) => {
    const matchesCat = selectedCatalogCategory === "All" || item.category === selectedCatalogCategory;
    const matchesSearch =
      !catalogSearch.trim() ||
      item.name.toLowerCase().includes(catalogSearch.toLowerCase().trim()) ||
      (item.category && item.category.toLowerCase().includes(catalogSearch.toLowerCase().trim()));
    return matchesCat && matchesSearch;
  });

  const handleCloseModal = () => {
    setSelectedStore(null);
    setStoreModalTab("overview");
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={handleCloseModal}
    >
      <Pressable style={styles.overlay} onPress={handleCloseModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {/* Header Image Banner with Call & Directions Actions */}
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri:
                    store.imageUrl ||
                    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleCloseModal}
                activeOpacity={0.8}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Header Bottom Bar: Info & Quick Action Buttons */}
              <View style={styles.headerInfoRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={styles.headerBadges}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {store.category?.toUpperCase() || "STORE"}
                      </Text>
                    </View>
                    <View style={styles.openNowBadge}>
                      <Clock size={10} color="#FFFFFF" />
                      <Text style={styles.openNowText}>OPEN NOW</Text>
                    </View>
                  </View>
                  <Text style={styles.storeTitle} numberOfLines={1}>
                    {store.name}
                  </Text>
                </View>

                {/* Call & Directions Action Buttons side-by-side */}
                <View style={styles.headerActions}>
                  {store.phone ? (
                    <TouchableOpacity
                      style={styles.headerCallBtn}
                      onPress={handleCall}
                      activeOpacity={0.85}
                    >
                      <Phone size={13} color="#EA580C" />
                      <Text style={styles.headerCallBtnText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.directionsBtn}
                    onPress={handleDirections}
                    activeOpacity={0.85}
                  >
                    <Navigation2 size={13} color="#FFFFFF" />
                    <Text style={styles.directionsBtnText}>Directions</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Sub-tab Navigation (Overview | Hours | Chat with Owner | Catalog | Reviews) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabBar}
              contentContainerStyle={styles.tabBarContent}
            >
              <TouchableOpacity
                style={[styles.tabItem, activeTab === "overview" && styles.tabItemActive]}
                onPress={() => setActiveTab("overview")}
              >
                <Text style={[styles.tabText, activeTab === "overview" && styles.tabTextActive]}>
                  Overview
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === "hours" && styles.tabItemActive]}
                onPress={() => setActiveTab("hours")}
              >
                <Text style={[styles.tabText, activeTab === "hours" && styles.tabTextActive]}>
                  Hours
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === "chat" && styles.tabItemActive]}
                onPress={() => setActiveTab("chat")}
              >
                <Text style={[styles.tabText, activeTab === "chat" && styles.tabTextActive]}>
                  Chat with Owner
                </Text>
              </TouchableOpacity>

              {/* SENSITIVE FEATURE: CATALOG TAB */}
              {isCatalogEligible ? (
                <TouchableOpacity
                  style={[styles.tabItem, activeTab === "catalog" && styles.tabItemActive]}
                  onPress={() => setActiveTab("catalog")}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={[styles.tabText, activeTab === "catalog" && styles.tabTextActive]}>
                      Catalog
                    </Text>
                    <View style={styles.liveNearbyBadge}>
                      <Text style={styles.liveNearbyText}>5KM</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.disabledTabItem}
                  onPress={() => setActiveTab("catalog")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.disabledTabText}>Catalog</Text>
                  <View style={styles.disabledBadge}>
                    <Lock size={9} color="#64748B" />
                    <Text style={styles.disabledBadgeText}>LOCKED</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Reviews Tab (Permanently Disabled as per spec) */}
              <View style={styles.disabledTabItem}>
                <Text style={styles.disabledTabText}>Reviews</Text>
                <View style={styles.disabledBadge}>
                  <Lock size={9} color="#64748B" />
                  <Text style={styles.disabledBadgeText}>DISABLED</Text>
                </View>
              </View>
            </ScrollView>

            {/* TAB CONTENT */}
            <View style={styles.tabBody}>
              {/* TAB 1: OVERVIEW REDESIGNED */}
              {activeTab === "overview" && (
                <ScrollView
                  style={styles.scrollableTab}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Verified Partner & Trust Banner */}
                  <View style={styles.trustBanner}>
                    <View style={styles.trustBannerIcon}>
                      <ShieldCheck size={20} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Text style={styles.trustBannerTitle}>Verified SmartShopper Partner</Text>
                        <CheckCircle2 size={12} color="#16A34A" />
                      </View>
                      <Text style={styles.trustBannerSub}>
                        {store.verifiedBillsCount && store.verifiedBillsCount > 0
                          ? `${store.verifiedBillsCount} verified buyer bills redeemed at this store`
                          : "Exclusive proximity discounts and customer perks"}
                      </Text>
                    </View>
                  </View>

                  {/* Redesigned Contact & Location Card */}
                  <View style={styles.contactCard}>
                    <Text style={styles.cardHeaderTitle}>LOCATION & CONTACT</Text>

                    {/* Address Row */}
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconBox}>
                        <MapPin size={16} color="#EA580C" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Address</Text>
                        <Text style={styles.infoValue}>{store.address || "Kochi, Kerala"}</Text>
                      </View>
                    </View>

                    {/* Distance Row */}
                    {store.distanceInMeters ? (
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}>
                          <Navigation2 size={16} color="#EA580C" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>Distance</Text>
                          <Text style={[styles.infoValue, { color: "#EA580C", fontWeight: "700" }]}>
                            {formatDistance(store.distanceInMeters)} away from your current location
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {/* Phone Row with Interactive Tap-to-Call */}
                    {store.phone ? (
                      <TouchableOpacity
                        style={styles.infoRowInteractive}
                        onPress={handleCall}
                        activeOpacity={0.7}
                      >
                        <View style={styles.infoIconBox}>
                          <Phone size={16} color="#EA580C" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>Phone Number</Text>
                          <Text style={styles.infoValue}>{store.phone}</Text>
                        </View>
                        <View style={styles.tapToCallPill}>
                          <Text style={styles.tapToCallText}>Tap to Call</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {/* Operating Hours Row */}
                    <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                      <View style={styles.infoIconBox}>
                        <Clock size={16} color="#EA580C" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>{"Today's Hours"}</Text>
                        <Text style={styles.infoValue}>{store.operatingHours || "9:00 AM - 7:00 PM"}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Store Profile & Description Card */}
                  <View style={styles.sectionCard}>
                    <View style={styles.cardHeaderRow}>
                      <Info size={14} color="#EA580C" />
                      <Text style={styles.cardHeaderTitle}>STORE PROFILE & INFO</Text>
                    </View>
                    <Text style={styles.sectionCardText}>
                      {store.description ||
                        `${store.name} is a verified SmartShopper retail partner offering customer perks, authentic deals, and real-time digital vouchers.`}
                    </Text>
                  </View>

                  {/* Active Deals at this Store */}
                  <View style={styles.dealsSection}>
                    <View style={styles.dealsHeaderRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Zap size={16} color="#EA580C" />
                        <Text style={styles.dealsTitle}>
                          Active Deals ({storeOffers.length})
                        </Text>
                      </View>
                      <Text style={styles.dealsSubtitle}>Instant Voucher Drops</Text>
                    </View>

                    {storeOffers.length === 0 ? (
                      <View style={styles.emptyDealsCard}>
                        <StoreIcon size={24} color="#94A3B8" />
                        <Text style={styles.noDeals}>No active deal drops right now at this store.</Text>
                      </View>
                    ) : (
                      storeOffers.map((offer) => (
                        <View key={offer.id} style={styles.dealItem}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.dealTagRow}>
                              <Tag size={12} color="#DC2626" />
                              <Text style={styles.dealTag}>{offer.discountTag}</Text>
                            </View>
                            <Text style={styles.dealDesc} numberOfLines={2}>
                              {offer.description}
                            </Text>
                            {offer.offerPrice ? (
                              <Text style={styles.dealPrice}>
                                Now {offer.offerPrice}{" "}
                                {offer.originalPrice ? (
                                  <Text style={styles.dealOrigPrice}>{offer.originalPrice}</Text>
                                ) : null}
                              </Text>
                            ) : null}
                          </View>

                          <TouchableOpacity
                            style={styles.claimMiniBtn}
                            onPress={() => setSelectedOfferForVoucher(offer)}
                            activeOpacity={0.85}
                          >
                            <Zap size={13} color="#FFFFFF" />
                            <Text style={styles.claimMiniText}>Claim</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                </ScrollView>
              )}

              {/* TAB 2: HOURS */}
              {activeTab === "hours" && (
                <ScrollView
                  style={styles.scrollableTab}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  <View style={styles.hoursHeaderRow}>
                    <View style={styles.hoursHeaderLeft}>
                      <Calendar size={15} color="#EA580C" />
                      <Text style={styles.hoursHeaderTitle}>Weekly Operating Hours</Text>
                    </View>
                    <View style={styles.hoursBadge}>
                      <Text style={styles.hoursBadgeText}>
                        {store.operatingHours || "9:00 AM - 7:00 PM"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.scheduleBox}>
                    {WEEKLY_SCHEDULE.map((item, idx) => (
                      <View
                        key={item.day}
                        style={[
                          styles.scheduleRow,
                          idx === WEEKLY_SCHEDULE.length - 1 && { borderBottomWidth: 0 }
                        ]}
                      >
                        <Text style={styles.scheduleDay}>{item.day}</Text>
                        <Text style={styles.scheduleTime}>
                          {store.operatingHours || item.hours}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              {/* TAB 3: CHAT WITH OWNER */}
              {activeTab === "chat" && (
                <View style={styles.chatContainer}>
                  {/* Chat Sub-header */}
                  <View style={styles.chatHeader}>
                    <View style={styles.chatHeaderLeft}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                        Live Chat with {store.name}
                      </Text>
                    </View>
                    <Text style={styles.chatHeaderStatus}>Store Owner Online</Text>
                  </View>

                  {/* Messages Scroll Area */}
                  <ScrollView
                    ref={chatScrollRef}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {messages.length === 0 ? (
                      <View style={styles.emptyChatBox}>
                        <Text style={styles.emptyChatText}>
                          Ask the store owner about product availability or deal validity.
                        </Text>
                      </View>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender === "customer";
                        return (
                          <View
                            key={msg.id}
                            style={[
                              styles.messageBubbleWrapper,
                              isMe ? styles.messageWrapperRight : styles.messageWrapperLeft
                            ]}
                          >
                            <View
                              style={[
                                styles.messageBubble,
                                isMe ? styles.messageBubbleCustomer : styles.messageBubbleStore
                              ]}
                            >
                              <Text
                                style={[
                                  styles.messageText,
                                  isMe ? styles.messageTextCustomer : styles.messageTextStore
                                ]}
                              >
                                {msg.text}
                              </Text>
                            </View>
                            <Text style={styles.messageTimestamp}>{msg.timestamp}</Text>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>

                  {/* Rate Limit Alert */}
                  {rateLimitWarning ? (
                    <View style={styles.warningBox}>
                      <AlertTriangle size={13} color="#D97706" />
                      <Text style={styles.warningText}>{rateLimitWarning}</Text>
                    </View>
                  ) : null}

                  {/* Chat Input Bar or Sign In Prompt */}
                  {!user ? (
                    <View style={styles.signInPromptBar}>
                      <View style={styles.signInPromptLeft}>
                        <LogIn size={15} color="#EA580C" />
                        <Text style={styles.signInPromptText}>
                          Please sign in to send messages to the store owner.
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.signInBtn}
                        onPress={() => openAuthModal("Sign in to chat with the store owner")}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.signInBtnText}>Sign In</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.chatInputBar}>
                      <TextInput
                        style={styles.chatInput}
                        placeholder="Type a message to store owner..."
                        placeholderTextColor="#94A3B8"
                        value={chatInput}
                        onChangeText={setChatInput}
                        multiline={false}
                        returnKeyType="send"
                        onSubmitEditing={handleSendMessage}
                      />
                      <TouchableOpacity
                        style={[
                          styles.sendBtn,
                          (!chatInput.trim() || isSending) && styles.sendBtnDisabled
                        ]}
                        onPress={handleSendMessage}
                        disabled={!chatInput.trim() || isSending}
                        activeOpacity={0.8}
                      >
                        {isSending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Send size={15} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* TAB 4: PRODUCT CATALOG (ENABLED ONLY INSIDE KERALA WITHIN 5KM) */}
              {activeTab === "catalog" && (
                <View style={styles.catalogTabContainer}>
                  {isCatalogEligible ? (
                    <>
                      {/* Active 5km In-Store Proximity Pill */}
                      <View style={styles.proximitySuccessPill}>
                        <MapPin size={13} color="#16A34A" />
                        <Text style={styles.proximitySuccessText}>
                          Unlocked: You are within {formatDistance(userDistanceToStore)} in Kerala
                        </Text>
                      </View>

                      {/* Search Bar for Catalog */}
                      <View style={styles.catalogSearchBar}>
                        <Search size={14} color="#94A3B8" />
                        <TextInput
                          style={styles.catalogSearchInput}
                          placeholder="Search store inventory..."
                          placeholderTextColor="#94A3B8"
                          value={catalogSearch}
                          onChangeText={setCatalogSearch}
                        />
                        {catalogSearch ? (
                          <TouchableOpacity onPress={() => setCatalogSearch("")}>
                            <X size={14} color="#64748B" />
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      {/* Category Pills */}
                      {catalogCategories.length > 1 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.catPillsScroll}
                          contentContainerStyle={styles.catPillsContent}
                        >
                          {catalogCategories.map((cat) => {
                            const isSel = selectedCatalogCategory === cat;
                            return (
                              <TouchableOpacity
                                key={cat}
                                style={[styles.catPill, isSel && styles.catPillActive]}
                                onPress={() => setSelectedCatalogCategory(cat)}
                              >
                                <Text style={[styles.catPillText, isSel && styles.catPillTextActive]}>
                                  {cat}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      ) : null}

                      {/* Catalog Items List */}
                      {isLoadingCatalog ? (
                        <View style={styles.catalogLoadingBox}>
                          <ActivityIndicator size="large" color="#EA580C" />
                          <Text style={styles.catalogLoadingText}>Loading store inventory...</Text>
                        </View>
                      ) : (
                        <ScrollView
                          style={styles.scrollableTab}
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={styles.catalogGridContent}
                        >
                          {filteredCatalogItems.length === 0 ? (
                            <View style={styles.emptyCatalogCard}>
                              <Package size={32} color="#94A3B8" />
                              <Text style={styles.emptyCatalogTitle}>No products found</Text>
                              <Text style={styles.emptyCatalogSub}>
                                {"The store owner hasn't listed products in this category yet."}
                              </Text>
                            </View>
                          ) : (
                            filteredCatalogItems.map((item) => (
                              <View key={item.id} style={styles.catalogItemCard}>
                                <Image
                                  source={{ uri: item.imageUrl }}
                                  style={styles.catalogItemImg}
                                  resizeMode="cover"
                                />
                                <View style={styles.catalogItemInfo}>
                                  <View style={styles.catalogItemTag}>
                                    <Text style={styles.catalogItemTagText}>{item.category || "Item"}</Text>
                                  </View>
                                  <Text style={styles.catalogItemName} numberOfLines={2}>
                                    {item.name}
                                  </Text>
                                  <View style={styles.catalogItemPrices}>
                                    <Text style={styles.catalogItemOfferPrice}>
                                      {item.offerPrice || "Special Price"}
                                    </Text>
                                    {item.originalPrice ? (
                                      <Text style={styles.catalogItemOrigPrice}>{item.originalPrice}</Text>
                                    ) : null}
                                  </View>
                                </View>
                              </View>
                            ))
                          )}
                        </ScrollView>
                      )}
                    </>
                  ) : (
                    /* LOCKED STATE: OUTSIDE KERALA OR BEYOND 5KM */
                    <View style={styles.lockedCatalogCard}>
                      <View style={styles.lockedIconCircle}>
                        <Lock size={28} color="#EA580C" />
                      </View>
                      <Text style={styles.lockedTitle}>Product Catalog Locked</Text>
                      <Text style={styles.lockedDesc}>
                        {!isInsideKerala
                          ? "Store catalogs are exclusively available when you are located inside Kerala."
                          : `This store's product catalog is only accessible when you are within a 5 km proximity. You are currently ${formatDistance(userDistanceToStore)} away.`}
                      </Text>
                      <View style={styles.lockedRequirementBox}>
                        <View style={styles.lockedReqRow}>
                          {isInsideKerala ? (
                            <Check size={14} color="#16A34A" />
                          ) : (
                            <X size={14} color="#DC2626" />
                          )}
                          <Text
                            style={[
                              styles.lockedReqText,
                              { color: isInsideKerala ? "#16A34A" : "#DC2626" }
                            ]}
                          >
                            Located Inside Kerala: {isInsideKerala ? "Verified" : "Outside State"}
                          </Text>
                        </View>

                        <View style={styles.lockedReqRow}>
                          {userDistanceToStore <= 5000 ? (
                            <Check size={14} color="#16A34A" />
                          ) : (
                            <X size={14} color="#DC2626" />
                          )}
                          <Text
                            style={[
                              styles.lockedReqText,
                              { color: userDistanceToStore <= 5000 ? "#16A34A" : "#DC2626" }
                            ]}
                          >
                            Within 5 km Radius: {formatDistance(userDistanceToStore)} ({userDistanceToStore <= 5000 ? "Eligible" : "Too far"})
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
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
    height: "100%",
    maxHeight: 670,
    display: "flex",
    flexDirection: "column"
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 145,
    backgroundColor: "#0F172A"
  },
  image: {
    width: "100%",
    height: "100%",
    opacity: 0.75
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.45)"
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  headerInfoRow: {
    position: "absolute",
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between"
  },
  headerBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4
  },
  categoryBadge: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  openNowBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 4
  },
  openNowText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900"
  },
  storeTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  headerCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6.5,
    borderRadius: 9,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  headerCallBtnText: {
    color: "#EA580C",
    fontSize: 11,
    fontWeight: "900"
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: 9,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3
  },
  directionsBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900"
  },

  /* Tabs Bar */
  tabBar: {
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    maxHeight: 46
  },
  tabBarContent: {
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  tabItemActive: {
    borderBottomColor: "#EA580C",
    backgroundColor: "#FFFFFF"
  },
  tabText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B"
  },
  tabTextActive: {
    color: "#EA580C"
  },
  liveNearbyBadge: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4
  },
  liveNearbyText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900"
  },
  disabledTabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    opacity: 0.65,
    gap: 4
  },
  disabledTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8"
  },
  disabledBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
    gap: 2
  },
  disabledBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#64748B"
  },

  /* Body */
  tabBody: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  scrollableTab: {
    flex: 1
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 32,
    gap: 12
  },

  /* Redesigned Overview Elements */
  trustBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    padding: 12,
    borderRadius: 14,
    gap: 10
  },
  trustBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center"
  },
  trustBannerTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#166534"
  },
  trustBannerSub: {
    fontSize: 11,
    color: "#15803D",
    marginTop: 1
  },

  contactCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.6
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 10
  },
  infoRowInteractive: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 10
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase"
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 1
  },
  tapToCallPill: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  tapToCallText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EA580C"
  },

  sectionCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    gap: 6
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  sectionCardText: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18
  },

  dealsSection: {
    marginTop: 2,
    gap: 8
  },
  dealsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  dealsTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A"
  },
  dealsSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8"
  },
  emptyDealsCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  noDeals: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic"
  },
  dealItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  dealTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  dealTag: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626"
  },
  dealDesc: {
    fontSize: 11,
    color: "#334155",
    marginTop: 2
  },
  dealPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#059669",
    marginTop: 2
  },
  dealOrigPrice: {
    fontSize: 10,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  claimMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4
  },
  claimMiniText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800"
  },

  /* Hours Styles */
  hoursHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  hoursHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  hoursHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A"
  },
  hoursBadge: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  hoursBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EA580C"
  },
  scheduleBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    overflow: "hidden"
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  scheduleDay: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A"
  },
  scheduleTime: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500"
  },

  /* Chat Tab Styles */
  chatContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    display: "flex",
    flexDirection: "column"
  },
  chatHeader: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981"
  },
  chatHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800"
  },
  chatHeaderStatus: {
    color: "#FB923C",
    fontSize: 10,
    fontWeight: "800"
  },
  messagesList: {
    flex: 1
  },
  messagesContent: {
    padding: 12,
    gap: 10
  },
  emptyChatBox: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyChatText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center"
  },
  messageBubbleWrapper: {
    maxWidth: "80%"
  },
  messageWrapperRight: {
    alignSelf: "flex-end",
    alignItems: "flex-end"
  },
  messageWrapperLeft: {
    alignSelf: "flex-start",
    alignItems: "flex-start"
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14
  },
  messageBubbleCustomer: {
    backgroundColor: "#EA580C",
    borderBottomRightRadius: 2
  },
  messageBubbleStore: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderBottomLeftRadius: 2
  },
  messageText: {
    fontSize: 12,
    fontWeight: "500"
  },
  messageTextCustomer: {
    color: "#FFFFFF"
  },
  messageTextStore: {
    color: "#0F172A"
  },
  messageTimestamp: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 2,
    paddingHorizontal: 2
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 10,
    marginBottom: 4,
    borderRadius: 8,
    gap: 6
  },
  warningText: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "700",
    flex: 1
  },
  signInPromptBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  signInPromptLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1
  },
  signInPromptText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
    flex: 1
  },
  signInBtn: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8
  },
  signInBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900"
  },
  chatInputBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: "#0F172A"
  },
  sendBtn: {
    backgroundColor: "#EA580C",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center"
  },
  sendBtnDisabled: {
    backgroundColor: "#CBD5E1"
  },

  /* Catalog Tab Styles */
  catalogTabContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  proximitySuccessPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6
  },
  proximitySuccessText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "800"
  },
  catalogSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8
  },
  catalogSearchInput: {
    flex: 1,
    fontSize: 12,
    color: "#0F172A",
    padding: 0
  },
  catPillsScroll: {
    maxHeight: 36,
    marginBottom: 6
  },
  catPillsContent: {
    paddingHorizontal: 12,
    gap: 6,
    alignItems: "center"
  },
  catPill: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  catPillActive: {
    backgroundColor: "#EA580C",
    borderColor: "#C2410C"
  },
  catPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B"
  },
  catPillTextActive: {
    color: "#FFFFFF"
  },
  catalogLoadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 40
  },
  catalogLoadingText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600"
  },
  catalogGridContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 32
  },
  emptyCatalogCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  emptyCatalogTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A"
  },
  emptyCatalogSub: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center"
  },
  catalogItemCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  catalogItemImg: {
    width: 80,
    height: 80,
    backgroundColor: "#F1F5F9"
  },
  catalogItemInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between"
  },
  catalogItemTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start"
  },
  catalogItemTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#475569"
  },
  catalogItemName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A"
  },
  catalogItemPrices: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6
  },
  catalogItemOfferPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#059669"
  },
  catalogItemOrigPrice: {
    fontSize: 10,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },

  /* Locked Catalog State */
  lockedCatalogCard: {
    flex: 1,
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  lockedIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A"
  },
  lockedDesc: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 290
  },
  lockedRequirementBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 8
  },
  lockedReqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  lockedReqText: {
    fontSize: 11,
    fontWeight: "700"
  }
});
