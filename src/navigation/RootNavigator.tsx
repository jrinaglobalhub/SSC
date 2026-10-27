import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Map as MapIcon, Tag, User, ShoppingCart } from "lucide-react-native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { MapScreen } from "../screens/MapScreen";
import { DealsScreen } from "../screens/DealsScreen";
import { CartScreen } from "../screens/CartScreen";
import { AccountScreen } from "../screens/AccountScreen";
import { PrivacyPolicyScreen } from "../screens/PrivacyPolicyScreen";
import { TermsOfServiceScreen } from "../screens/TermsOfServiceScreen";

import { GeofenceRadiusModal } from "../components/GeofenceRadiusModal";
import { StoreDetailsModal } from "../components/StoreDetailsModal";
import { VoucherRedeemModal } from "../components/VoucherRedeemModal";
import { CustomerCodeModal } from "../components/CustomerCodeModal";
import { AiAssistantModal } from "../components/AiAssistantModal";
import { AuthModal } from "../components/AuthModal";
import { NotificationModal } from "../components/NotificationModal";
import { BuyNowModal } from "../components/BuyNowModal";
import { CartModal } from "../components/CartModal";
import { useApp } from "../context/AppContext";
import { requestNotificationPermission } from "../services/notificationService";

export type RootStackParamList = {
  MainTabs: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs: React.FC = () => {
  const {
    setUser,
    showAuthModal,
    setShowAuthModal,
    authPromptReason,
    isInsideKerala,
    cartCount
  } = useApp();

  useEffect(() => {
    // Request system notification permission on app start (Android 13+ / iOS)
    requestNotificationPermission().catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#EA580C",
          tabBarInactiveTintColor: "#64748B",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E2E8F0",
            borderTopWidth: 1,
            height: Platform.OS === "ios" ? 84 : 64,
            paddingBottom: Platform.OS === "ios" ? 24 : 10,
            paddingTop: 8,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 4
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700"
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
        {isInsideKerala && (
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
        )}
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
    </View>
  );
};

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right"
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
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
