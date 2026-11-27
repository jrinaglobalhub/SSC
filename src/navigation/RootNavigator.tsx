import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet, Platform, Animated, Easing, Linking } from "react-native";
import { AppText as Text } from "../components/common/AppText";
import { BottomTabBar, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Home, Map as MapIcon, Tag, User, ShoppingCart } from "lucide-react-native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { MapScreen } from "../screens/MapScreen";
import { DealsScreen } from "../screens/DealsScreen";
import { CartScreen } from "../screens/CartScreen";
import { AccountScreen } from "../screens/AccountScreen";
import { PrivacyPolicyScreen } from "../screens/PrivacyPolicyScreen";
import { TermsOfServiceScreen } from "../screens/TermsOfServiceScreen";
import { RefundPolicyScreen } from "../screens/RefundPolicyScreen";
import { VouchersScreen } from "../screens/VouchersScreen";
import { ReceiptsScreen } from "../screens/ReceiptsScreen";
import { ProductDetailsScreen } from "../screens/ProductDetailsScreen";
import { WishlistScreen } from "../screens/WishlistScreen";
import { OrderDetailsScreen } from "../screens/OrderDetailsScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { ResetPasswordScreen } from "../screens/ResetPasswordScreen";
import { getHasCompletedOnboarding } from "../utils/onboarding";
import { setNavigatorMounted } from "../services/deepLinkService";
import { CatalogItem } from "../types";

import { GeofenceRadiusModal } from "../components/GeofenceRadiusModal";
import { LocationPickerModal } from "../components/LocationPickerModal";
import { StoreDetailsModal } from "../components/StoreDetailsModal";
import { VoucherRedeemModal } from "../components/VoucherRedeemModal";
import { CustomerCodeModal } from "../components/CustomerCodeModal";
import { AiAssistantModal } from "../components/AiAssistantModal";
import { AuthModal } from "../components/AuthModal";
import { NotificationModal } from "../components/NotificationModal";
import { BuyNowModal } from "../components/BuyNowModal";
import { CartModal } from "../components/CartModal";
import { FestivalGreetingModal } from "../components/FestivalGreetingModal";
import { AlertPopupModal } from "../components/AlertPopupModal";
import { FestivalGreeting, AlertPopup } from "../types";
import {
  getActiveFestivalGreeting,
  getActiveAlertPopups,
  recordPopupMetric,
  subscribeToActivePopupsAndGreetings
} from "../api/supabase";
import { useApp } from "../context/AppContext";
import { requestNotificationPermission } from "../services/notificationService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: { screen?: string } | undefined;
  OrderDetails: { orderId: string };
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  RefundPolicy: undefined;
  Vouchers: undefined;
  Receipts: undefined;
  ProductDetails: {
    productId: string;
    product?: CatalogItem;
  };
  Cart: undefined;
  Wishlist: undefined;
  ForgotPassword: undefined;
  ResetPassword: { url?: string; token?: string; type?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    setUser,
    showAuthModal,
    setShowAuthModal,
    authPromptReason,
    isInsideKerala,
    cartCount,
    isTabBarVisible,
    setIsTabBarVisible,
    seasonalTheme
  } = useApp();

  // Festival Greetings and Alert Popups State & Priority Queue
  const [activeGreeting, setActiveGreeting] = useState<FestivalGreeting | null>(null);
  const [showGreetingModal, setShowGreetingModal] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<AlertPopup | null>(null);
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);

  const sessionDismissedAlertsRef = useRef<Set<string>>(new Set());
  const sessionDismissedGreetingsRef = useRef<Set<string>>(new Set());
  const isEvaluatingRef = useRef<boolean>(false);

  const evaluatePopupsAndGreetings = useCallback(async () => {
    if (isEvaluatingRef.current) return;
    isEvaluatingRef.current = true;
    try {
      // 1. Fetch active alerts in priority order (Critical > High > Normal)
      const activeAlerts = await getActiveAlertPopups();
      let candidateAlert: AlertPopup | null = null;

      for (const a of activeAlerts) {
        if (sessionDismissedAlertsRef.current.has(a.id)) continue;
        if (a.displayFrequency === "once") {
          const dismissed = await AsyncStorage.getItem(`@ssc_alert_dismissed_${a.id}`);
          if (dismissed) continue;
        } else if (a.displayFrequency === "until_acknowledged") {
          const ack = await AsyncStorage.getItem(`@ssc_alert_acknowledged_${a.id}`);
          if (ack) continue;
        }
        candidateAlert = a;
        break;
      }

      if (candidateAlert) {
        setShowGreetingModal(false);
        setActiveGreeting(null);
        setActiveAlert(candidateAlert);
        setShowAlertModal(true);
        recordPopupMetric("alert", candidateAlert.id, "view").catch(() => {});
        return;
      }

      // 2. If no eligible alert, check for active festival greeting
      const greeting = await getActiveFestivalGreeting();
      if (greeting && !sessionDismissedGreetingsRef.current.has(greeting.id)) {
        const seen = await AsyncStorage.getItem(`@ssc_festival_greeting_seen_${greeting.id}`);
        if (!seen) {
          setActiveAlert(null);
          setShowAlertModal(false);
          setActiveGreeting(greeting);
          setShowGreetingModal(true);
          recordPopupMetric("greeting", greeting.id, "view").catch(() => {});
          return;
        }
      }
    } catch (err) {
      console.warn("[MainTabs] evaluatePopupsAndGreetings error:", err);
    } finally {
      isEvaluatingRef.current = false;
    }
  }, []);

  const handleDismissAlert = useCallback(async () => {
    if (!activeAlert) return;
    const alertId = activeAlert.id;
    sessionDismissedAlertsRef.current.add(alertId);
    recordPopupMetric("alert", alertId, "dismiss").catch(() => {});
    if (activeAlert.displayFrequency === "once") {
      await AsyncStorage.setItem(`@ssc_alert_dismissed_${alertId}`, "true").catch(() => {});
    }
    setShowAlertModal(false);
    setActiveAlert(null);
  }, [activeAlert]);

  const handleAlertAction = useCallback(async (actionType: "none" | "screen" | "url", actionTarget?: string) => {
    if (!activeAlert) return;
    const alertId = activeAlert.id;
    sessionDismissedAlertsRef.current.add(alertId);
    recordPopupMetric("alert", alertId, "acknowledge").catch(() => {});
    // Mark as acknowledged
    await AsyncStorage.setItem(`@ssc_alert_acknowledged_${alertId}`, "true").catch(() => {});
    if (activeAlert.displayFrequency === "once") {
      await AsyncStorage.setItem(`@ssc_alert_dismissed_${alertId}`, "true").catch(() => {});
    }
    setShowAlertModal(false);
    setActiveAlert(null);

    if (actionType === "screen" && actionTarget) {
      try {
        navigation.navigate(actionTarget);
      } catch (e) {
        console.warn("[MainTabs] Could not navigate to screen:", actionTarget, e);
      }
    } else if (actionType === "url" && actionTarget) {
      Linking.openURL(actionTarget).catch(() => {});
    }
  }, [activeAlert, navigation]);

  const handleDismissGreeting = useCallback(async () => {
    if (!activeGreeting) return;
    const greetingId = activeGreeting.id;
    sessionDismissedGreetingsRef.current.add(greetingId);
    recordPopupMetric("greeting", greetingId, "dismiss").catch(() => {});
    // First-entry-per-festival: mark as seen permanently
    await AsyncStorage.setItem(`@ssc_festival_greeting_seen_${greetingId}`, "true").catch(() => {});
    setShowGreetingModal(false);
    setActiveGreeting(null);
  }, [activeGreeting]);

  useEffect(() => {
    // Initial evaluation when app tabs mount
    evaluatePopupsAndGreetings();

    // Real-time listener: immediately reflect SSA publishes, toggles, schedules
    const unsubscribe = subscribeToActivePopupsAndGreetings(() => {
      evaluatePopupsAndGreetings();
    });

    return () => {
      unsubscribe();
    };
  }, [evaluatePopupsAndGreetings]);

  useEffect(() => {
    // Request system notification permission on app start (Android 13+ / iOS)
    requestNotificationPermission().catch(() => {});
  }, []);

  const tabHeight = 62 + insets.bottom;
  const tabPaddingBottom = insets.bottom > 0 ? insets.bottom : 8;
  const [tabBarTranslateY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(tabBarTranslateY, {
      toValue: isTabBarVisible ? 0 : tabHeight + 12,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [isTabBarVisible, tabHeight, tabBarTranslateY]);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenListeners={{
          state: () => {
            if (!isTabBarVisible) {
              setIsTabBarVisible(true);
            }
          }
        }}
        tabBar={(props) => (
          <Animated.View
            pointerEvents={isTabBarVisible ? "auto" : "none"}
            style={[
              styles.animatedTabBarWrapper,
              { transform: [{ translateY: tabBarTranslateY }] }
            ]}
          >
            <BottomTabBar {...props} />
          </Animated.View>
        )}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#EA580C",
          tabBarInactiveTintColor: seasonalTheme.tabBarInactiveColor,
          tabBarStyle: {
            backgroundColor: seasonalTheme.tabBarBackgroundColor,
            borderTopColor: seasonalTheme.headerBorderColor,
            borderTopWidth: 1,
            height: tabHeight,
            paddingBottom: tabPaddingBottom,
            paddingTop: 6,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 4
          },
          tabBarLabelStyle: {
            fontFamily: "Inter-Bold",
            fontSize: 11,
            fontWeight: "700",
            ...Platform.select({ android: { includeFontPadding: false } })
          }
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
                <Home size={20} color={color} />
              </View>
            )
          }}
        />
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarLabel: "Map",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
                <MapIcon size={20} color={color} />
              </View>
            )
          }}
        />
        <Tab.Screen
          name="Deals"
          component={DealsScreen}
          options={{
            tabBarLabel: "Deals",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
                <Tag size={20} color={color} />
              </View>
            )
          }}
        />
        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{
            tabBarLabel: "Cart",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconActive, styles.relativeIcon]}>
                <ShoppingCart size={20} color={color} />
                {cartCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{cartCount > 99 ? "99+" : cartCount}</Text>
                  </View>
                )}
              </View>
            )
          }}
        />
        <Tab.Screen
          name="Account"
          component={AccountScreen}
          options={{
            tabBarLabel: "Account",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
                <User size={20} color={color} />
              </View>
            )
          }}
        />
      </Tab.Navigator>

      {/* Global Modals */}
      <GeofenceRadiusModal />
      <LocationPickerModal />
      <StoreDetailsModal />
      <VoucherRedeemModal />
      <CustomerCodeModal />
      <AiAssistantModal />
      <NotificationModal />
      <BuyNowModal />
      <CartModal />
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccessLogin={async (loggedInUser) => {
          setUser(loggedInUser);
          // Request notification permission immediately upon login
          await requestNotificationPermission();
        }}
        initialPromptReason={authPromptReason}
      />

      {/* Festival Greetings & Alert Popups */}
      <FestivalGreetingModal
        visible={showGreetingModal}
        greeting={activeGreeting}
        onDismiss={handleDismissGreeting}
      />
      <AlertPopupModal
        visible={showAlertModal}
        alert={activeAlert}
        onDismiss={handleDismissAlert}
        onAction={handleAlertAction}
      />
    </View>
  );
};

export const RootNavigator: React.FC = () => {
  const [isOnboardingReady, setIsOnboardingReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getHasCompletedOnboarding()
      .then((completed) => {
        if (isMounted) {
          setHasCompletedOnboarding(completed);
          setIsOnboardingReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasCompletedOnboarding(true);
          setIsOnboardingReady(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isOnboardingReady) {
      setNavigatorMounted(true);
    }
    return () => {
      setNavigatorMounted(false);
    };
  }, [isOnboardingReady]);

  if (!isOnboardingReady) {
    return <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} />;
  }

  return (
    <Stack.Navigator
      initialRouteName={hasCompletedOnboarding ? "MainTabs" : "Onboarding"}
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right"
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen} />
      <Stack.Screen name="Vouchers" component={VouchersScreen} />
      <Stack.Screen name="Receipts" component={ReceiptsScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  animatedTabBarWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0
  },
  tabIconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14
  },
  tabIconActive: {
    backgroundColor: "#FFF7ED"
  },
  relativeIcon: {
    position: "relative"
  },
  tabBadge: {
    position: "absolute",
    top: -2,
    right: 2,
    backgroundColor: "#EA580C",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF"
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800"
  }
});
