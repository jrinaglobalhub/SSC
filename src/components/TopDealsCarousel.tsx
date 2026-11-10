import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Ellipse,
  Path,
  G,
  Line
} from "react-native-svg";
import { Sparkles, ArrowRight, Tag, MapPin } from "lucide-react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { OfferItem, StoreProfile, SscBanner } from "../types";
import { formatDistance } from "../utils/geo";
import { useApp } from "../context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_MARGIN = 14;
export const BANNER_WIDTH = SCREEN_WIDTH - BANNER_MARGIN * 2;
export const BANNER_HEIGHT = 168;

// ============================================================================
// 1. CANONICAL CATEGORY ARCHITECTURE & AUTHORITATIVE RESOLUTION
// ============================================================================

export type DealCategoryKey =
  | "IT_SERVICES"
  | "GROCERIES"
  | "ELECTRONICS"
  | "FASHION"
  | "FOOD_DINING"
  | "BEAUTY_PERSONAL_CARE"
  | "HOME_LIVING"
  | "WELLNESS"
  | "DEFAULT";

export const CANONICAL_CATEGORY_LABELS: Record<DealCategoryKey, string> = {
  IT_SERVICES: "IT & Services",
  GROCERIES: "Groceries",
  ELECTRONICS: "Electronics",
  FASHION: "Fashion",
  FOOD_DINING: "Dining",
  BEAUTY_PERSONAL_CARE: "Beauty & Care",
  HOME_LIVING: "Home & Living",
  WELLNESS: "Wellness",
  DEFAULT: "Retail Store"
};

/**
 * Robust token-based category normalizer.
 * Maps any store or offer category string into a canonical DealCategoryKey.
 */
export function normalizeCategory(category?: string): DealCategoryKey {
  if (!category) return "DEFAULT";
  const cat = category.toLowerCase().trim();

  // IT & Services
  if (
    /\b(it|tech|software|hardware|developer|coding|code|web|cloud|saas|cyber|network|digital|data)\b/i.test(cat) ||
    cat.includes("it &") ||
    cat.includes("it service") ||
    cat.includes("information technology")
  ) {
    return "IT_SERVICES";
  }

  // Groceries & Fresh Market
  if (
    cat.includes("groc") ||
    cat.includes("supermarket") ||
    cat.includes("fruit") ||
    cat.includes("vegetable") ||
    cat.includes("market") ||
    cat.includes("fresh") ||
    cat.includes("organic") ||
    cat.includes("provision") ||
    cat.includes("dairy")
  ) {
    return "GROCERIES";
  }

  // Electronics & Gadgets
  if (
    cat.includes("electr") ||
    cat.includes("gadget") ||
    cat.includes("mobile") ||
    cat.includes("phone") ||
    cat.includes("laptop") ||
    cat.includes("computer") ||
    cat.includes("appliance") ||
    cat.includes("audio") ||
    cat.includes("camera") ||
    /\b(tv|television)\b/i.test(cat)
  ) {
    return "ELECTRONICS";
  }

  // Fashion & Apparel
  if (
    cat.includes("fash") ||
    cat.includes("cloth") ||
    cat.includes("apparel") ||
    cat.includes("wear") ||
    cat.includes("shoe") ||
    cat.includes("footwear") ||
    cat.includes("dress") ||
    cat.includes("boutique") ||
    cat.includes("handbag") ||
    cat.includes("jewelry") ||
    cat.includes("jewel")
  ) {
    return "FASHION";
  }

  // Food & Restaurants / Dining
  if (
    cat.includes("din") ||
    cat.includes("food") ||
    cat.includes("restaurant") ||
    cat.includes("cafe") ||
    cat.includes("bistro") ||
    cat.includes("baker") ||
    cat.includes("pizza") ||
    cat.includes("burger") ||
    cat.includes("beverage") ||
    cat.includes("snack") ||
    cat.includes("dessert") ||
    cat.includes("sweet") ||
    cat.includes("ice cream") ||
    cat.includes("cuisine")
  ) {
    return "FOOD_DINING";
  }

  // Beauty & Personal Care
  if (
    cat.includes("beauty") ||
    cat.includes("cosmetic") ||
    cat.includes("skincare") ||
    cat.includes("salon") ||
    cat.includes("spa") ||
    cat.includes("perfume") ||
    cat.includes("makeup")
  ) {
    return "BEAUTY_PERSONAL_CARE";
  }

  // Home & Living / Furniture
  if (
    cat.includes("home") ||
    cat.includes("living") ||
    cat.includes("furnit") ||
    cat.includes("decor") ||
    cat.includes("household") ||
    cat.includes("bedding") ||
    cat.includes("mattress") ||
    cat.includes("curtain")
  ) {
    return "HOME_LIVING";
  }

  // Wellness / Healthcare
  if (
    cat.includes("well") ||
    cat.includes("health") ||
    cat.includes("pharma") ||
    cat.includes("medic") ||
    cat.includes("fitness") ||
    cat.includes("ayurveda") ||
    cat.includes("clinic")
  ) {
    return "WELLNESS";
  }

  return "DEFAULT";
}

/**
 * Authoritative category resolution:
 * Ensures the category label, illustration, and merchant data ALWAYS agree.
 * - Prioritizes the verified merchant registered category in the stores table.
 * - Falls back to offer category if no store is matched.
 * - Prevents cross-category contamination (e.g., IT stores will never display Groceries).
 */
export function resolveAuthoritativeCategory(
  deal: OfferItem,
  matchedStore?: StoreProfile
): {
  canonicalKey: DealCategoryKey;
  displayLabel: string;
} {
  const storeCat = matchedStore?.category?.trim();
  const offerCat = deal.category?.trim();

  // Store category takes precedence as the primary authority for merchant deals
  const rawAuthoritative = storeCat || offerCat || "Retail Store";
  const canonicalKey = normalizeCategory(rawAuthoritative);

  // Derive canonical display label
  const displayLabel = storeCat || offerCat || CANONICAL_CATEGORY_LABELS[canonicalKey];

  return {
    canonicalKey,
    displayLabel
  };
}

export interface CategoryTheme {
  key: DealCategoryKey;
  label: string;
  bgGradient: [string, string, string];
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  stageAuraColor: string;
  waveColor1: string;
  waveColor2: string;
}

/**
 * Strict SmartShopper brand palette theme definitions.
 * All deal cards strictly adhere to SmartShopper's official brand orange and cream/peach tokens,
 * ensuring complete visual harmony across the application.
 */
export const CATEGORY_THEMES: Record<DealCategoryKey, CategoryTheme> = {
  IT_SERVICES: {
    key: "IT_SERVICES",
    label: "IT & Services",
    bgGradient: ["#FFFFFF", "#FFFBF7", "#FFF7ED"],
    accentColor: "#EA580C",
    accentBg: "#FFF7ED",
    accentBorder: "#FED7AA",
    stageAuraColor: "rgba(234, 88, 12, 0.12)",
    waveColor1: "rgba(234, 88, 12, 0.06)",
    waveColor2: "rgba(194, 65, 12, 0.08)"
  },
  GROCERIES: {
    key: "GROCERIES",
    label: "Groceries",
    bgGradient: ["#FFFFFF", "#FFFBF7", "#FFF7ED"],
    accentColor: "#EA580C",
    accentBg: "#FFF7ED",
    accentBorder: "#FED7AA",
    stageAuraColor: "rgba(234, 88, 12, 0.12)",
    waveColor1: "rgba(234, 88, 12, 0.06)",
    waveColor2: "rgba(194, 65, 12, 0.08)"
  },
  ELECTRONICS: {
    key: "ELECTRONICS",
    label: "Electronics",
    bgGradient: ["#FFFFFF", "#FFFBF7", "#FFF7ED"],
    accentColor: "#EA580C",
    accentBg: "#FFF7ED",
    accentBorder: "#FED7AA",
    stageAuraColor: "rgba(234, 88, 12, 0.12)",
    waveColor1: "rgba(234, 88, 12, 0.06)",
    waveColor2: "rgba(194, 65, 12, 0.08)"
  },
  FASHION: {
    key: "FASHION",
    label: "Fashion",
    bgGradient: ["#FFFFFF", "#FFFBF7", "#FFF7ED"],
    accentColor: "#EA580C",
    accentBg: "#FFF7ED",
    accentBorder: "#FED7AA",
    stageAuraColor: "rgba(234, 88, 12, 0.12)",
    waveColor1: "rgba(234, 88, 12, 0.06)",
    waveColor2: "rgba(194, 65, 12, 0.08)"
  },
  FOOD_DINING: {
    key: "FOOD_DINING",
    label: "Food & Dining",
    bgGradient: ["#FFFFFF", "#FFFBF7", "#FFF7ED"],
    accentColor: "#EA580C",
    accentBg: "#FFF7ED",
    accentBorder: "#FED7AA",
    stageAuraColor: "rgba(234, 88, 12, 0.12)",
    waveColor1: "rgba(234, 88, 12, 0.06)",
    waveColor2: "rgba(194, 65, 12, 0.08)"
  },
  BEAUTY_PERSONAL_CARE: {
    key: "BEAUTY_PERSONAL_CARE",
    label: "Beauty & Care",
    bgGradient: ["#FFFFFF", "#FFFBF7", "#FFF7ED"],
    accentColor: "#EA580C",
    accentBg: "#FFF7ED",
    accentBorder: "#FED7AA",
    stageAuraColor: "rgba(234, 88, 12, 0.12)",
    waveColor1: "rgba(234, 88, 12, 0.06)",
    waveColor2: "rgba(194, 65, 12, 0.08)"
  },
  HOME_LIVING: {
    key: "HOME_LIVING",
    label: "Home & Living",
    bgGradient: ["#FFFFFF", "#FFFBF7", "#FFF7ED"],
    accentColor: "#EA580C",
    accentBg: "#FFF7ED",
    accentBorder: "#FED7AA",
    stageAuraColor: "rgba(234, 88, 12, 0.12)",
    waveColor1: "rgba(234, 88, 12, 0.06)",
    waveColor2: "rgba(194, 65, 12, 0.08)"
  },
  WELLNESS: {
    key: "WELLNESS",
    label: "Wellness",
    bgGradient: ["#FFFFFF", "#FFFBF7", "#FFF7ED"],
    accentColor: "#EA580C",
    accentBg: "#FFF7ED",
    accentBorder: "#FED7AA",
    stageAuraColor: "rgba(234, 88, 12, 0.12)",
    waveColor1: "rgba(234, 88, 12, 0.06)",
    waveColor2: "rgba(194, 65, 12, 0.08)"
  },
  DEFAULT: {
    key: "DEFAULT",
    label: "Featured Deal",
    bgGradient: ["#FFFFFF", "#FFFBF7", "#FFF7ED"],
    accentColor: "#EA580C",
    accentBg: "#FFF7ED",
    accentBorder: "#FED7AA",
    stageAuraColor: "rgba(234, 88, 12, 0.12)",
    waveColor1: "rgba(234, 88, 12, 0.06)",
    waveColor2: "rgba(194, 65, 12, 0.08)"
  }
};

// ============================================================================
// 2. UNIVERSAL PROMOTIONAL BANNER (SLIDE 1 - PRESERVED INTACT)
// ============================================================================

export interface TopDealsPromoSlideProps {
  onPressCta?: () => void;
  slideWidth?: number;
}

/**
 * 2D Modern Vector Shopping Illustration for Slide 1
 */
export const ShoppingVectorArt2D: React.FC = () => {
  return (
    <Svg
      viewBox="0 0 170 150"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <LinearGradient id="vecBagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFF7ED" />
          <Stop offset="55%" stopColor="#FED7AA" />
          <Stop offset="100%" stopColor="#FDBA74" />
        </LinearGradient>
        <LinearGradient id="vecGiftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#EA580C" />
          <Stop offset="60%" stopColor="#D94E07" />
          <Stop offset="100%" stopColor="#9A3412" />
        </LinearGradient>
        <LinearGradient id="vecBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#FFF7ED" />
        </LinearGradient>
        <LinearGradient id="vecBasketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.38" />
          <Stop offset="100%" stopColor="#FFF7ED" stopOpacity="0.18" />
        </LinearGradient>
        <LinearGradient id="vecWheelRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#E2E8F0" />
        </LinearGradient>
      </Defs>

      {/* Ground Contact Shadow */}
      <Ellipse cx="94" cy="138" rx="58" ry="6" fill="#7C2D12" opacity="0.35" />

      {/* Overflowing Shopping Items */}
      <G>
        {/* Shopping Bag */}
        <G transform="rotate(-5, 62, 58)">
          <Path
            d="M 52 42 C 52 28, 72 28, 72 42"
            stroke="#EA580C"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <Path d="M 46 42 L 78 42 L 82 85 L 42 85 Z" fill="url(#vecBagGrad)" />
          <Path d="M 62 42 L 62 85" stroke="#EA580C" strokeWidth="1.2" opacity="0.35" />
        </G>

        {/* Product Box */}
        <G transform="rotate(7, 78, 68)">
          <Rect x="64" y="48" width="28" height="38" rx="3" fill="url(#vecBoxGrad)" />
          <Rect x="64" y="62" width="28" height="7" fill="#FED7AA" />
          <Circle cx="78" cy="55" r="2.5" fill="#EA580C" opacity="0.85" />
        </G>

        {/* Gift Box with ribbon and bow */}
        <G transform="rotate(10, 102, 64)">
          <Rect x="84" y="46" width="34" height="36" rx="4" fill="url(#vecGiftGrad)" />
          {/* Vertical ribbon */}
          <Rect x="98" y="46" width="6" height="36" fill="#FFF7ED" />
          {/* Horizontal ribbon */}
          <Rect x="84" y="61" width="34" height="6" fill="#FFF7ED" />
          {/* Ribbon Bow on top */}
          <Path d="M 101 46 C 93 37, 91 44, 101 46" fill="#FFFFFF" />
          <Path d="M 101 46 C 109 37, 111 44, 101 46" fill="#FFFFFF" />
          <Circle cx="101" cy="46" r="3.2" fill="#FED7AA" />
        </G>

        {/* Coupon Tag */}
        <G transform="rotate(-12, 126, 68)">
          <Path
            d="M 118 64 L 132 50 L 142 60 L 128 74 Z"
            fill="#FFF7ED"
            stroke="#EA580C"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <Circle cx="123" cy="62" r="2.2" fill="#EA580C" />
          <Path d="M 128 58 L 136 66" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
        </G>
      </G>

      {/* Stylized 2D Shopping Cart */}
      <G>
        <Path
          d="M 52 74 L 32 48 L 22 51"
          stroke="#FFFFFF"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Rect x="20" y="47" width="12" height="8" rx="4" fill="#1E293B" />

        {/* Chassis */}
        <Path d="M 68 128 L 124 128" stroke="#FFF7ED" strokeWidth="3.5" strokeLinecap="round" />
        <Path d="M 76 128 L 62 86" stroke="#FED7AA" strokeWidth="3.5" strokeLinecap="round" />
        <Path d="M 116 128 L 126 86" stroke="#FED7AA" strokeWidth="3.5" strokeLinecap="round" />

        {/* Basket */}
        <Path
          d="M 46 74 L 134 74 C 137 74, 139 76, 138 79 L 128 112 C 127 115, 124 117, 121 117 L 60 117 C 57 117, 54 115, 53 112 L 42 79 C 41 76, 43 74, 46 74 Z"
          fill="url(#vecBasketGrad)"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <Line x1="47" y1="88" x2="133" y2="88" stroke="#FFFFFF" strokeWidth="2.2" opacity="0.9" />
        <Line x1="51" y1="102" x2="127" y2="102" stroke="#FFFFFF" strokeWidth="2.2" opacity="0.9" />
        <Line x1="68" y1="74" x2="69" y2="117" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.65" />
        <Line x1="90" y1="74" x2="90" y2="117" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.65" />
        <Line x1="112" y1="74" x2="109" y2="117" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.65" />

        {/* Percentage / Super-Deal Circular Badge stamped on basket */}
        <G>
          <Circle cx="90" cy="95" r="13" fill="#EA580C" stroke="#FFFFFF" strokeWidth="2.2" />
          <Circle cx="86" cy="91" r="2.2" fill="#FFFFFF" />
          <Circle cx="94" cy="99" r="2.2" fill="#FFFFFF" />
          <Line x1="95" y1="90" x2="85" y2="100" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </G>

        {/* Wheels */}
        <G>
          <Circle cx="68" cy="128" r="11" fill="#1E293B" />
          <Circle cx="68" cy="128" r="8" fill="url(#vecWheelRim)" />
          <Circle cx="68" cy="128" r="3.5" fill="#EA580C" />
        </G>
        <G>
          <Circle cx="124" cy="128" r="11" fill="#1E293B" />
          <Circle cx="124" cy="128" r="8" fill="url(#vecWheelRim)" />
          <Circle cx="124" cy="128" r="3.5" fill="#EA580C" />
        </G>
      </G>

      {/* Decorative Stars */}
      <G>
        <Path
          d="M 148 24 Q 148 31 155 31 Q 148 31 148 38 Q 148 31 141 31 Q 148 31 148 24 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M 36 26 Q 36 32 42 32 Q 36 32 36 38 Q 36 32 30 32 Q 36 32 36 26 Z"
          fill="#FED7AA"
        />
        <Path
          d="M 154 74 Q 154 78 158 78 Q 154 78 154 82 Q 154 78 150 78 Q 154 78 154 74 Z"
          fill="#FFF7ED"
          opacity="0.9"
        />
        <Circle cx="142" cy="16" r="2.5" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="160" cy="52" r="2" fill="#FED7AA" opacity="0.8" />
        <Circle cx="24" cy="70" r="2" fill="#FFF7ED" opacity="0.6" />
      </G>
    </Svg>
  );
};

export const TopDealsPromoSlide: React.FC<TopDealsPromoSlideProps> = ({
  onPressCta,
  slideWidth = BANNER_WIDTH
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPressCta) {
      onPressCta();
    } else {
      (navigation as any).navigate("Deals");
    }
  };

  return (
    <View style={[styles.slideCard, { width: slideWidth }]}>
      {/* Continuous Warm Brand Orange Background with Abstract Curves */}
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="brandOrangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#EA580C" stopOpacity="1" />
            <Stop offset="35%" stopColor="#EA580C" stopOpacity="1" />
            <Stop offset="70%" stopColor="#D94E07" stopOpacity="1" />
            <Stop offset="100%" stopColor="#C2410C" stopOpacity="1" />
          </LinearGradient>

          <RadialGradient id="ambientWarmGlow" cx="25%" cy="25%" r="60%" fx="15%" fy="15%">
            <Stop offset="0%" stopColor="#FED7AA" stopOpacity="0.28" />
            <Stop offset="60%" stopColor="#EA580C" stopOpacity="0" />
            <Stop offset="100%" stopColor="#C2410C" stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="visualStageAura" cx="75%" cy="50%" r="50%" fx="72%" fy="45%">
            <Stop offset="0%" stopColor="#FFF7ED" stopOpacity="0.18" />
            <Stop offset="50%" stopColor="#FED7AA" stopOpacity="0.10" />
            <Stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
          </RadialGradient>

          <LinearGradient id="softCurve1" x1="0%" y1="0%" x2="100%" y2="80%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
            <Stop offset="60%" stopColor="#FED7AA" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
          </LinearGradient>

          <LinearGradient id="softCurve2" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFF7ED" stopOpacity="0.16" />
            <Stop offset="70%" stopColor="#FED7AA" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#C2410C" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" rx="20" ry="20" fill="url(#brandOrangeGradient)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientWarmGlow)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#visualStageAura)" />
        <Path d="M 160 0 C 210 35, 260 70, 250 168 L 360 168 L 360 0 Z" fill="url(#softCurve1)" />
        <Path d="M 190 168 C 230 110, 275 65, 360 45 L 360 168 Z" fill="url(#softCurve2)" />
        <Circle cx="82%" cy="22%" r="55" fill="#FED7AA" fillOpacity="0.10" />
        <Circle cx="88%" cy="80%" r="65" fill="#FFFFFF" fillOpacity="0.06" />
      </Svg>

      {/* Main Content Layout */}
      <View style={styles.bannerRow}>
        <View style={styles.leftColumn}>
          <View style={styles.brandSpotlightTag}>
            <Sparkles size={10} color="#FED7AA" />
            <Text style={styles.brandSpotlightText}>SMARTSHOPPER SPOTLIGHT</Text>
          </View>

          <View style={styles.headlinesWrap}>
            <Text style={styles.headline} numberOfLines={2}>
              Great Deals. Better Shopping.
            </Text>
            <Text style={styles.secondaryHeadline} numberOfLines={1}>
              All Around You!
            </Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            Discover exciting deals and offers from stores around you.
          </Text>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handlePress}
            activeOpacity={0.86}
          >
            <Text style={styles.ctaText}>Explore Deals →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightColumn}>
          <ShoppingVectorArt2D />
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// 3. CATEGORY-SPECIFIC 2D VECTOR ARTWORKS (100% Native SVG)
// ============================================================================

export const ItServicesVectorArt: React.FC = () => (
  <Svg viewBox="0 0 140 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <Defs>
      <LinearGradient id="itScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#F8FAFC" />
      </LinearGradient>
      <LinearGradient id="itBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EA580C" />
        <Stop offset="100%" stopColor="#C2410C" />
      </LinearGradient>
    </Defs>

    <Ellipse cx="70" cy="120" rx="48" ry="4" fill="#0F172A" opacity="0.12" />

    {/* Desktop Browser Window */}
    <G>
      <Rect
        x="12"
        y="18"
        width="106"
        height="72"
        rx="7"
        fill="url(#itScreenGrad)"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      <Path
        d="M 12 25 C 12 21, 16 18, 20 18 L 110 18 C 114 18, 118 21, 118 25 L 118 34 L 12 34 Z"
        fill="#F1F5F9"
      />
      <Circle cx="21" cy="26" r="2.8" fill="#EF4444" />
      <Circle cx="29" cy="26" r="2.8" fill="#F59E0B" />
      <Circle cx="37" cy="26" r="2.8" fill="#10B981" />
      <Rect x="46" y="22" width="58" height="8" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />

      {/* Code Editor Window Content */}
      <Line x1="22" y1="44" x2="52" y2="44" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="30" y1="53" x2="74" y2="53" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="30" y1="62" x2="62" y2="62" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      <Line x1="22" y1="71" x2="42" y2="71" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <Line x1="30" y1="80" x2="58" y2="80" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" />
    </G>

    {/* Floating Cloud / Coding Service Badge */}
    <G transform="translate(86, 38)">
      <Rect x="0" y="0" width="36" height="30" rx="6" fill="url(#itBadgeGrad)" />
      <Path
        d="M 11 9 L 7 15 L 11 21 M 25 9 L 29 15 L 25 21 M 20 8 L 16 22"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>

    {/* Laptop Base */}
    <Path d="M 4 94 L 126 94 L 118 103 L 12 103 Z" fill="#94A3B8" />
    <Rect x="54" y="96" width="22" height="4" rx="2" fill="#CBD5E1" />

    <Circle cx="124" cy="20" r="2" fill="#EA580C" />
    <Circle cx="132" cy="28" r="1.5" fill="#FED7AA" />
    <Line x1="124" y1="20" x2="132" y2="28" stroke="#FED7AA" strokeWidth="1" />
  </Svg>
);

export const GroceriesVectorArt: React.FC = () => (
  <Svg viewBox="0 0 140 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <Defs>
      <LinearGradient id="grocBagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FED7AA" />
        <Stop offset="100%" stopColor="#FDBA74" />
      </LinearGradient>
      <LinearGradient id="grocAppleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EF4444" />
        <Stop offset="100%" stopColor="#B91C1C" />
      </LinearGradient>
      <LinearGradient id="grocOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F97316" />
        <Stop offset="100%" stopColor="#EA580C" />
      </LinearGradient>
    </Defs>

    <Ellipse cx="70" cy="118" rx="46" ry="4" fill="#14532D" opacity="0.12" />

    {/* Fresh Grocery Bag */}
    <G>
      <Path
        d="M 52 46 L 52 28 C 52 20, 80 20, 80 28 L 80 46"
        stroke="#C2410C"
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 38 46 L 94 46 L 88 112 L 44 112 Z"
        fill="url(#grocBagGrad)"
        stroke="#EA580C"
        strokeWidth="1.5"
      />
      <Path d="M 44 112 L 66 94 L 88 112" stroke="#EA580C" strokeWidth="1" opacity="0.4" fill="none" />
    </G>

    {/* Milk / Juice Carton */}
    <G>
      <Path
        d="M 64 28 L 82 28 L 82 54 L 64 54 Z"
        fill="#FFFFFF"
        stroke="#86EFAC"
        strokeWidth="1.2"
      />
      <Path d="M 64 28 L 73 20 L 82 28 Z" fill="#DCFCE7" />
    </G>

    {/* Fresh Apple with Leaf */}
    <G>
      <Circle cx="44" cy="48" r="14" fill="url(#grocAppleGrad)" />
      <Path d="M 44 34 Q 46 27 43 24" stroke="#78350F" strokeWidth="2" fill="none" />
      <Path d="M 44 28 Q 53 25 50 31 Z" fill="#16A34A" />
      <Circle cx="39" cy="44" r="3" fill="#FFFFFF" opacity="0.4" />
    </G>

    {/* Citrus Orange */}
    <G>
      <Circle cx="94" cy="52" r="14" fill="url(#grocOrangeGrad)" />
      <Path d="M 96 38 Q 104 32 102 40 Z" fill="#15803D" />
      <Circle cx="90" cy="48" r="2.5" fill="#FFFFFF" opacity="0.4" />
    </G>

    {/* Carrot Peeking Out */}
    <G transform="rotate(15, 32, 68)">
      <Path d="M 28 66 L 38 46 L 46 52 Z" fill="#EA580C" />
      <Line x1="39" y1="46" x2="43" y2="34" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="42" y1="48" x2="50" y2="38" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
    </G>
  </Svg>
);

export const ElectronicsVectorArt: React.FC = () => (
  <Svg viewBox="0 0 140 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <Defs>
      <LinearGradient id="elecPhoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#0F172A" />
        <Stop offset="100%" stopColor="#1E293B" />
      </LinearGradient>
      <LinearGradient id="elecScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F8FAFC" />
        <Stop offset="100%" stopColor="#FFF7ED" />
      </LinearGradient>
      <LinearGradient id="elecWatchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EA580C" />
        <Stop offset="100%" stopColor="#C2410C" />
      </LinearGradient>
    </Defs>

    <Ellipse cx="70" cy="118" rx="46" ry="4" fill="#0F172A" opacity="0.12" />

    {/* Smartphone */}
    <G>
      <Rect
        x="22"
        y="22"
        width="44"
        height="84"
        rx="9"
        fill="url(#elecPhoneGrad)"
        stroke="#475569"
        strokeWidth="1.8"
      />
      <Rect x="25" y="26" width="38" height="76" rx="7" fill="url(#elecScreenGrad)" />
      <Circle cx="44" cy="30" r="1.8" fill="#0F172A" />
      <Rect x="28" y="38" width="32" height="16" rx="3" fill="#FFFFFF" />
      <Rect x="28" y="58" width="32" height="22" rx="3" fill="#FED7AA" opacity="0.9" />
      <Circle cx="35" cy="46" r="3" fill="#EA580C" />
      <Line x1="41" y1="46" x2="54" y2="46" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    </G>

    {/* Over-Ear Wireless Headphones */}
    <G>
      <Path
        d="M 58 46 C 58 14, 114 14, 114 46"
        stroke="#1E293B"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="54" y="42" width="10" height="22" rx="5" fill="#EA580C" />
      <Rect x="108" y="42" width="10" height="22" rx="5" fill="#EA580C" />
      <Circle cx="59" cy="44" r="2.5" fill="#E2E8F0" />
      <Circle cx="113" cy="44" r="2.5" fill="#E2E8F0" />
    </G>

    {/* Smartwatch */}
    <G>
      <Rect x="94" y="72" width="16" height="42" rx="3" fill="#334155" />
      <Circle cx="102" cy="93" r="16" fill="url(#elecPhoneGrad)" stroke="#94A3B8" strokeWidth="1.5" />
      <Circle cx="102" cy="93" r="13" fill="url(#elecWatchGrad)" />
      <Line x1="102" y1="93" x2="102" y2="85" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="102" y1="93" x2="109" y2="93" stroke="#FED7AA" strokeWidth="1.5" strokeLinecap="round" />
    </G>

    <Path
      d="M 76 26 C 82 26, 86 30, 86 36"
      stroke="#EA580C"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

export const FashionVectorArt: React.FC = () => (
  <Svg viewBox="0 0 140 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <Defs>
      <LinearGradient id="fashDressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF7ED" />
        <Stop offset="60%" stopColor="#FED7AA" />
        <Stop offset="100%" stopColor="#FDBA74" />
      </LinearGradient>
      <LinearGradient id="fashBagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EA580C" />
        <Stop offset="100%" stopColor="#C2410C" />
      </LinearGradient>
    </Defs>

    <Ellipse cx="70" cy="118" rx="46" ry="4" fill="#7C2D12" opacity="0.12" />

    {/* Wooden Hanger */}
    <G>
      <Path
        d="M 64 20 C 64 13, 72 13, 72 19 C 72 23, 64 25, 64 30"
        stroke="#B45309"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M 38 42 L 64 30 L 90 42 Z" fill="none" stroke="#D97706" strokeWidth="2.8" strokeLinejoin="round" />

      {/* Dress / Stylish Apparel */}
      <Path
        d="M 44 42 L 84 42 L 96 98 L 32 98 Z"
        fill="url(#fashDressGrad)"
        stroke="#EA580C"
        strokeWidth="1.5"
      />
      <Path d="M 56 42 C 60 50, 68 50, 72 42" stroke="#FFFFFF" strokeWidth="2" fill="none" />
      <Line x1="36" y1="70" x2="92" y2="70" stroke="#EA580C" strokeWidth="3" />
      <Rect x="60" y="67" width="8" height="6" rx="1.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
    </G>

    {/* Luxury Handbag */}
    <G>
      <Path
        d="M 94 68 C 94 54, 116 54, 116 68"
        stroke="#EA580C"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 88 68 L 122 68 L 118 108 L 92 108 Z"
        fill="url(#fashBagGrad)"
        stroke="#9A3412"
        strokeWidth="1.5"
      />
      <Path d="M 88 68 L 122 68 L 105 82 Z" fill="#9A3412" />
      <Circle cx="105" cy="82" r="2.8" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
    </G>

    <Path
      d="M 124 24 Q 124 30 130 30 Q 124 30 124 36 Q 124 30 118 30 Q 124 30 124 24 Z"
      fill="#EA580C"
    />
  </Svg>
);

export const FoodDiningVectorArt: React.FC = () => (
  <Svg viewBox="0 0 140 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <Defs>
      <LinearGradient id="foodBunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FBBF24" />
        <Stop offset="100%" stopColor="#D97706" />
      </LinearGradient>
      <LinearGradient id="foodCupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EA580C" />
        <Stop offset="100%" stopColor="#C2410C" />
      </LinearGradient>
    </Defs>

    <Ellipse cx="70" cy="118" rx="46" ry="4" fill="#78350F" opacity="0.14" />

    {/* Stacked Gourmet Burger */}
    <G>
      <Path
        d="M 28 64 C 28 42, 82 42, 82 64 Z"
        fill="url(#foodBunGrad)"
        stroke="#B45309"
        strokeWidth="1.2"
      />
      <Ellipse cx="42" cy="52" rx="1.8" ry="1" fill="#FFFFFF" />
      <Ellipse cx="55" cy="48" rx="1.8" ry="1" fill="#FFFFFF" />
      <Ellipse cx="68" cy="53" rx="1.8" ry="1" fill="#FFFFFF" />

      {/* Fresh Wavy Lettuce */}
      <Path
        d="M 24 64 Q 30 68 36 64 Q 42 68 48 64 Q 54 68 60 64 Q 66 68 72 64 Q 78 68 84 64"
        stroke="#22C55E"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />

      <Path d="M 26 68 L 84 68 L 72 77 L 64 68 L 46 77 L 38 68 Z" fill="#FBBF24" />
      <Rect x="26" y="73" width="58" height="9" rx="4.5" fill="#78350F" />
      <Path
        d="M 30 82 L 80 82 C 80 88, 76 92, 70 92 L 40 92 C 34 92, 30 88, 30 82 Z"
        fill="#D97706"
      />
    </G>

    {/* Cheesy Pizza Slice */}
    <G>
      <Path d="M 84 40 L 122 22 C 126 28, 128 36, 126 44 Z" fill="#B45309" />
      <Path d="M 84 40 L 120 26 C 122 32, 122 38, 120 42 Z" fill="#FCD34D" />
      <Circle cx="104" cy="34" r="3.5" fill="#DC2626" />
      <Circle cx="114" cy="36" r="3" fill="#DC2626" />
    </G>

    {/* Beverage Cup */}
    <G>
      <Line x1="108" y1="56" x2="114" y2="74" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      <Path
        d="M 94 74 L 120 74 L 116 108 L 98 108 Z"
        fill="url(#foodCupGrad)"
        stroke="#9A3412"
        strokeWidth="1.2"
      />
      <Rect x="96" y="85" width="22" height="12" rx="2" fill="#FED7AA" />
    </G>

    {/* Rising Aroma Steam */}
    <Path
      d="M 48 38 Q 52 30 48 22"
      stroke="#F59E0B"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
      opacity="0.75"
    />
  </Svg>
);

export const BeautyPersonalCareVectorArt: React.FC = () => (
  <Svg viewBox="0 0 140 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <Defs>
      <LinearGradient id="beautyBottleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF7ED" />
        <Stop offset="60%" stopColor="#FED7AA" />
        <Stop offset="100%" stopColor="#FDBA74" />
      </LinearGradient>
      <LinearGradient id="beautyLipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EA580C" />
        <Stop offset="100%" stopColor="#C2410C" />
      </LinearGradient>
    </Defs>

    <Ellipse cx="70" cy="118" rx="46" ry="4" fill="#7C2D12" opacity="0.12" />

    {/* Skincare Pump Bottle */}
    <G>
      <Rect
        x="36"
        y="44"
        width="34"
        height="66"
        rx="8"
        fill="url(#beautyBottleGrad)"
        stroke="#EA580C"
        strokeWidth="1.5"
      />
      <Rect x="41" y="58" width="24" height="36" rx="3" fill="#FFFFFF" opacity="0.95" />
      <Line x1="45" y1="68" x2="61" y2="68" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="45" y1="74" x2="57" y2="74" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />

      <Rect x="48" y="36" width="10" height="8" rx="2" fill="#FED7AA" stroke="#EA580C" strokeWidth="1" />
      <Path
        d="M 44 36 L 60 36 L 60 30 L 42 30 C 40 30, 38 32, 38 34 L 38 36 Z"
        fill="#EA580C"
      />
    </G>

    {/* Dropper Serum Vial */}
    <G>
      <Rect
        x="78"
        y="54"
        width="22"
        height="54"
        rx="6"
        fill="#FFFFFF"
        stroke="#FED7AA"
        strokeWidth="1.2"
      />
      <Rect x="80" y="70" width="18" height="36" rx="4" fill="#FED7AA" opacity="0.75" />
      <Rect x="83" y="48" width="12" height="6" rx="1.5" fill="#E2E8F0" />
      <Path d="M 85 48 L 93 48 L 93 38 C 93 34, 85 34, 85 38 Z" fill="#EA580C" />
    </G>

    {/* Gold Lipstick */}
    <G>
      <Rect x="108" y="76" width="16" height="34" rx="3" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
      <Path d="M 111 76 L 121 76 L 121 60 L 111 67 Z" fill="url(#beautyLipGrad)" />
    </G>

    <Path
      d="M 124 28 Q 124 34 130 34 Q 124 34 124 40 Q 124 34 118 34 Q 124 34 124 28 Z"
      fill="#EA580C"
    />
  </Svg>
);

export const HomeLivingVectorArt: React.FC = () => (
  <Svg viewBox="0 0 140 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <Defs>
      <LinearGradient id="homeChairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EA580C" />
        <Stop offset="100%" stopColor="#C2410C" />
      </LinearGradient>
    </Defs>

    <Ellipse cx="70" cy="118" rx="46" ry="4" fill="#78350F" opacity="0.14" />

    {/* Hanging Pendant Lamp */}
    <G>
      <Line x1="56" y1="10" x2="56" y2="28" stroke="#475569" strokeWidth="1.5" />
      <Path d="M 44 36 C 44 26, 68 26, 68 36 Z" fill="#0F172A" />
      <Path d="M 46 36 L 34 76 L 78 76 L 66 36 Z" fill="#FEF08A" opacity="0.22" />
    </G>

    {/* Scandinavian Modern Armchair */}
    <G>
      <Line x1="36" y1="88" x2="28" y2="112" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
      <Line x1="82" y1="88" x2="90" y2="112" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />

      <Path
        d="M 30 52 C 30 38, 88 38, 88 52 L 86 84 C 86 90, 32 90, 32 84 Z"
        fill="url(#homeChairGrad)"
        stroke="#9A3412"
        strokeWidth="1.5"
      />
      <Rect x="24" y="60" width="10" height="24" rx="4" fill="#D97706" />
      <Rect x="84" y="60" width="10" height="24" rx="4" fill="#D97706" />
      <Rect x="32" y="74" width="54" height="14" rx="4" fill="#FED7AA" />
    </G>

    {/* Indoor Potted Monstera Plant */}
    <G>
      <Path
        d="M 98 84 L 122 84 L 118 112 L 102 112 Z"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      <Path d="M 110 84 C 96 62, 104 46, 114 50 C 122 46, 126 62, 110 84" fill="#16A34A" />
      <Path d="M 112 84 C 122 70, 134 72, 128 82 Z" fill="#22C55E" />
    </G>
  </Svg>
);

export const WellnessVectorArt: React.FC = () => (
  <Svg viewBox="0 0 140 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <Defs>
      <LinearGradient id="wellHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EA580C" />
        <Stop offset="100%" stopColor="#C2410C" />
      </LinearGradient>
    </Defs>

    <Ellipse cx="70" cy="118" rx="46" ry="4" fill="#7C2D12" opacity="0.12" />

    {/* Vitality Heart */}
    <G>
      <Path
        d="M 64 38 C 64 24, 42 20, 36 36 C 28 58, 64 80, 64 86 C 64 80, 100 58, 92 36 C 86 20, 64 24, 64 38 Z"
        fill="url(#wellHeartGrad)"
        stroke="#9A3412"
        strokeWidth="1.5"
      />
      {/* ECG Pulse Line */}
      <Path
        d="M 32 54 L 46 54 L 52 42 L 60 66 L 68 48 L 74 54 L 96 54"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>

    {/* Medical Vitamin Capsule */}
    <G transform="rotate(-25, 96, 78)">
      <Path
        d="M 94 76 L 108 76 C 114 76, 118 80, 118 86 C 118 92, 114 96, 108 96 L 94 96 Z"
        fill="#EA580C"
      />
      <Path
        d="M 94 76 L 80 76 C 74 76, 70 80, 70 86 C 70 92, 74 96, 80 96 L 94 96 Z"
        fill="#FED7AA"
        stroke="#FDBA74"
        strokeWidth="1"
      />
      <Line x1="94" y1="76" x2="94" y2="96" stroke="#C2410C" strokeWidth="1.2" />
    </G>

    {/* Pure Droplet */}
    <Path
      d="M 112 36 C 112 36, 104 46, 104 52 C 104 57, 108 60, 112 60 C 116 60, 120 57, 120 52 C 120 46, 112 36, 112 36 Z"
      fill="#38BDF8"
    />
  </Svg>
);

export const DefaultRetailVectorArt: React.FC = () => (
  <Svg viewBox="0 0 140 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <Defs>
      <LinearGradient id="defBagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF7ED" />
        <Stop offset="60%" stopColor="#FED7AA" />
        <Stop offset="100%" stopColor="#FDBA74" />
      </LinearGradient>
      <LinearGradient id="defGiftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EA580C" />
        <Stop offset="100%" stopColor="#9A3412" />
      </LinearGradient>
    </Defs>

    <Ellipse cx="70" cy="118" rx="46" ry="4" fill="#7C2D12" opacity="0.14" />

    {/* Shopping Bag */}
    <G>
      <Path
        d="M 48 44 C 48 26, 72 26, 72 44"
        stroke="#EA580C"
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 38 44 L 82 44 L 88 102 L 32 102 Z"
        fill="url(#defBagGrad)"
        stroke="#EA580C"
        strokeWidth="1.5"
      />
      <Path d="M 60 44 L 60 102" stroke="#EA580C" strokeWidth="1" opacity="0.3" />
    </G>

    {/* Gift Box */}
    <G>
      <Rect x="76" y="58" width="34" height="42" rx="4" fill="url(#defGiftGrad)" />
      <Rect x="90" y="58" width="6" height="42" fill="#FFF7ED" />
      <Rect x="76" y="76" width="34" height="6" fill="#FFF7ED" />
      <Circle cx="93" cy="58" r="3.5" fill="#FED7AA" />
    </G>

    {/* Coupon Tag */}
    <G transform="rotate(-15, 108, 44)">
      <Path d="M 100 40 L 116 28 L 126 38 L 110 50 Z" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.5" />
      <Circle cx="106" cy="38" r="2.2" fill="#EA580C" />
    </G>

    <Path
      d="M 124 24 Q 124 30 130 30 Q 124 30 124 36 Q 124 30 118 30 Q 124 30 124 24 Z"
      fill="#EA580C"
    />
  </Svg>
);

export const CategoryIllustration: React.FC<{ categoryKey: DealCategoryKey }> = ({ categoryKey }) => {
  switch (categoryKey) {
    case "IT_SERVICES":
      return <ItServicesVectorArt />;
    case "GROCERIES":
      return <GroceriesVectorArt />;
    case "ELECTRONICS":
      return <ElectronicsVectorArt />;
    case "FASHION":
      return <FashionVectorArt />;
    case "FOOD_DINING":
      return <FoodDiningVectorArt />;
    case "BEAUTY_PERSONAL_CARE":
      return <BeautyPersonalCareVectorArt />;
    case "HOME_LIVING":
      return <HomeLivingVectorArt />;
    case "WELLNESS":
      return <WellnessVectorArt />;
    case "DEFAULT":
    default:
      return <DefaultRetailVectorArt />;
  }
};

// ============================================================================
// 4. ACTUAL STORE COVER IMAGE CIRCULAR CONTAINER
// ============================================================================

export interface MerchantLogoBadgeProps {
  deal: OfferItem;
  theme?: CategoryTheme;
  storeList?: StoreProfile[];
  size?: number;
}

/**
 * Displays the actual merchant STORE COVER IMAGE inside a crisp circular container.
 * - Extracts store cover image from store profile or deal data.
 * - Enforces circular mask and cover resizeMode to preserve image quality without stretching.
 * - Gracefully falls back to merchant initials only when no valid store cover image exists or fails to load.
 */
export const MerchantLogoBadge: React.FC<MerchantLogoBadgeProps> = ({
  deal,
  storeList = []
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const matched = storeList.find(
    (s) =>
      (deal.storeId && s.id === deal.storeId) ||
      (s.name && deal.storeName && s.name.toLowerCase().trim() === deal.storeName.toLowerCase().trim())
  );

  // Authoritative Store Cover Image Resolution
  const storeCoverUrl =
    matched?.coverImageUrl ||
    deal.storeCoverImageUrl ||
    (matched?.imageUrl && !matched.imageUrl.includes("photo-1542838132-92c53300491e") ? matched.imageUrl : undefined) ||
    (deal.storeImageUrl && !deal.storeImageUrl.includes("photo-1542838132-92c53300491e") ? deal.storeImageUrl : undefined) ||
    ((matched as any)?.image_url && !(matched as any).image_url.includes("photo-1542838132-92c53300491e") ? (matched as any).image_url : undefined);

  const hasValidCoverImage = Boolean(
    storeCoverUrl &&
    typeof storeCoverUrl === "string" &&
    storeCoverUrl.trim().length > 0 &&
    storeCoverUrl.startsWith("http")
  );

  // Compute initials fallback
  const storeName = deal.storeName || matched?.name || "SmartShopper";
  const words = storeName.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
  const initials = words.length >= 2
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : (storeName.slice(0, 2) || "SS").toUpperCase();

  const isMulti = /(&|\+| and |,\s*)/i.test(deal.storeName || "");

  if (isMulti) {
    return (
      <View style={styles.multiLogoContainer}>
        <View style={[styles.avatarCircle, styles.multiLogoBack]}>
          <Text style={[styles.avatarInitials, { fontSize: 8.5 }]}>{initials[0] || "S"}</Text>
        </View>
        <View style={[styles.avatarCircle, styles.multiLogoFront]}>
          {hasValidCoverImage && !imgFailed ? (
            <Image
              source={{ uri: storeCoverUrl }}
              style={styles.logoImg}
              resizeMode="cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <Text style={[styles.avatarInitials, { color: "#FFFFFF", fontSize: 8.5 }]}>
              {initials[1] || "S"}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.avatarCircle}>
      {hasValidCoverImage && !imgFailed ? (
        <Image
          source={{ uri: storeCoverUrl }}
          style={styles.logoImg}
          resizeMode="cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <Text style={styles.avatarInitials}>{initials}</Text>
      )}
    </View>
  );
};

// ============================================================================
// 5. UNIFIED SMARTSHOPPER BRAND CARD BACKGROUND
// ============================================================================

export const CategoryCardBackground: React.FC<{
  dealId: string;
  theme?: CategoryTheme;
}> = ({ dealId }) => {
  const gradId = `brandBg_${dealId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const auraId = `brandAura_${dealId.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
      <Defs>
        {/* Unified Warm SmartShopper Cream/White Gradient */}
        <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="50%" stopColor="#FFFBF7" />
          <Stop offset="100%" stopColor="#FFF7ED" />
        </LinearGradient>

        {/* Ambient Brand Orange Stage Glow under 2D illustration */}
        <RadialGradient id={auraId} cx="80%" cy="50%" r="55%" fx="75%" fy="45%">
          <Stop offset="0%" stopColor="rgba(234, 88, 12, 0.12)" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Card Base Gradient */}
      <Rect x="0" y="0" width="100%" height="100%" rx="20" ry="20" fill={`url(#${gradId})`} />

      {/* Brand Orange Stage Glow */}
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${auraId})`} />

      {/* Subtle SmartShopper Brand Wave Curves */}
      <G>
        <Path
          d="M 170 0 C 220 40, 260 70, 245 168 L 360 168 L 360 0 Z"
          fill="rgba(234, 88, 12, 0.05)"
        />
        <Path
          d="M 205 168 C 240 115, 280 65, 360 45 L 360 168 Z"
          fill="rgba(194, 65, 12, 0.07)"
        />
        <Circle cx="86%" cy="22%" r="45" fill="#FED7AA" fillOpacity="0.12" />
      </G>
    </Svg>
  );
};

// ============================================================================
// 6. CATEGORY-AWARE TOP DEAL SLIDE (SLIDE 2..N)
// ============================================================================

export interface CategoryDealSlideProps {
  deal: OfferItem;
  theme: CategoryTheme;
  storeList: StoreProfile[];
  onPress: (deal: OfferItem) => void;
  slideWidth?: number;
}

export const CategoryDealSlide: React.FC<CategoryDealSlideProps> = ({
  deal,
  theme,
  storeList,
  onPress,
  slideWidth = BANNER_WIDTH
}) => {
  const { getStoreRoadDistance } = useApp();
  const isStoreDeal = !deal.offerPrice || deal.offerPrice === "₹0";

  // Look up matched store
  const matched = storeList.find(
    (s) =>
      (deal.storeId && s.id === deal.storeId) ||
      (s.name && deal.storeName && s.name.toLowerCase().trim() === deal.storeName.toLowerCase().trim())
  );

  const roadInfo = getStoreRoadDistance(deal.storeId || deal.storeName || matched?.id || matched?.name);

  // Authoritative category resolution:
  // Guarantees category label, illustration, and merchant data always agree
  const { canonicalKey, displayLabel } = resolveAuthoritativeCategory(deal, matched);

  return (
    <TouchableOpacity
      style={[styles.featuredDealSlide, { width: slideWidth }]}
      activeOpacity={0.92}
      onPress={() => onPress(deal)}
    >
      {/* Strict SmartShopper Brand Background */}
      <CategoryCardBackground dealId={deal.id} theme={theme} />

      {/* Main Content Layout: Left Details (~60%) & Right 2D Vector Illustration (~40%) */}
      <View style={styles.dealSlideContent}>
        {/* LEFT COLUMN: Store Cover, Store Name, Category Pill, Distance, Description, Price & CTA */}
        <View style={styles.dealSlideLeft}>
          {/* Top Meta: Actual Store Cover Image + Store Name + Category Pill + Distance */}
          <View style={styles.dealTopMetaRow}>
            <MerchantLogoBadge deal={deal} theme={theme} storeList={storeList} />

            <View style={styles.dealStoreInfoCol}>
              <Text style={styles.dealStoreName} numberOfLines={1}>
                {deal.storeName}
              </Text>

              <View style={styles.dealSubMetaRow}>
                {/* Authoritative Category Pill in SmartShopper Brand Styling */}
                <View style={styles.dealCategoryPill}>
                  <Text style={styles.dealCategoryText} numberOfLines={1}>
                    {displayLabel}
                  </Text>
                </View>

                <View style={styles.dealDistancePill}>
                  <MapPin size={9} color="#EA580C" />
                  <Text style={styles.dealDistanceText}>
                    {roadInfo ? `${roadInfo.formatted} Road Distance` : "Road distance unavailable"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Discount Highlight Banner */}
          <View style={styles.dealDiscountBanner}>
            <Tag size={10} color="#FFFFFF" />
            <Text style={styles.dealDiscountText} numberOfLines={1}>
              {deal.discountTag}
            </Text>
          </View>

          {/* Short Description */}
          <Text style={styles.dealDescription} numberOfLines={2}>
            {deal.description}
          </Text>

          {/* Bottom Action Row: Pricing & Claim Button */}
          <View style={styles.dealBottomRow}>
            {/* Price Box */}
            {!isStoreDeal ? (
              <View style={styles.dealPriceBox}>
                <Text style={styles.dealOfferPrice}>{deal.offerPrice}</Text>
                {deal.originalPrice ? (
                  <Text style={styles.dealOrigPrice}>{deal.originalPrice}</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.dealStorewideBadge}>
                <Text style={styles.dealStorewideText}>STORE SPECIAL</Text>
              </View>
            )}

            {/* Claim Deal CTA Button in SmartShopper Brand Orange */}
            <TouchableOpacity
              style={styles.dealClaimBtn}
              onPress={() => onPress(deal)}
              activeOpacity={0.84}
            >
              <Text style={styles.dealClaimBtnText}>Claim Deal</Text>
              <ArrowRight size={10} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* RIGHT COLUMN: Category-Specific 2D Vector Illustration */}
        <View style={styles.dealSlideRight}>
          <CategoryIllustration categoryKey={canonicalKey} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// 7. TOP DEALS CAROUSEL CONTAINER & PROMOTIONAL BANNER SLIDE
// ============================================================================

export interface SscPromotionalBannerSlideProps {
  banner: SscBanner;
  slideWidth?: number;
  onPress?: (banner: SscBanner) => void;
}

export const SscPromotionalBannerSlide: React.FC<SscPromotionalBannerSlideProps> = ({
  banner,
  slideWidth = BANNER_WIDTH,
  onPress
}) => {
  return (
    <TouchableOpacity
      style={[styles.promotionalBannerCard, { width: slideWidth }]}
      onPress={() => onPress?.(banner)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: banner.imageUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {(banner.title || banner.subtitle) ? (
        <View style={styles.promotionalBannerScrim}>
          {banner.title ? (
            <Text style={styles.promotionalBannerTitle} numberOfLines={1}>
              {banner.title}
            </Text>
          ) : null}
          {banner.subtitle ? (
            <Text style={styles.promotionalBannerSubtitle} numberOfLines={1}>
              {banner.subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export interface TopDealsCarouselProps {
  deals?: OfferItem[];
  stores?: StoreProfile[];
  banners?: SscBanner[];
  onPressDeal?: (deal: OfferItem) => void;
  onPressExplore?: () => void;
  onPressBanner?: (banner: SscBanner) => void;
}

export const TopDealsCarousel: React.FC<TopDealsCarouselProps> = ({
  deals = [],
  stores,
  banners = [],
  onPressDeal,
  onPressExplore,
  onPressBanner
}) => {
  const isFocused = useIsFocused();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isInteractingRef = useRef(false);

  // Fallback to useApp stores if not passed via props
  let contextStores: StoreProfile[] = [];
  try {
    const appCtx = useApp();
    if (appCtx && appCtx.stores) {
      contextStores = appCtx.stores;
    }
  } catch {
    // Non-context test environment fallback
  }
  const allStores = stores || contextStores || [];

  const activeBanners = banners.filter((b) => b.isActive !== false);
  // Take up to 4 top featured deals for carousel slides
  const featuredDeals = deals.slice(0, 4);
  const totalSlides = (activeBanners.length > 0 ? activeBanners.length : 1) + featuredDeals.length;

  // Auto-swipe timer effect (pauses on screen blur or user interaction)
  useEffect(() => {
    if (!isFocused || totalSlides <= 1) return;

    const timer = setInterval(() => {
      if (isInteractingRef.current || !scrollRef.current) return;

      setActiveIndex((prev) => {
        const next = (prev + 1) % totalSlides;
        scrollRef.current?.scrollTo({
          x: next * (BANNER_WIDTH + 8),
          animated: true
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [isFocused, totalSlides]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (BANNER_WIDTH + 8));
    if (index >= 0 && index < totalSlides) {
      setActiveIndex(index);
    }
  };

  const handleDealCardPress = (deal: OfferItem) => {
    if (onPressDeal) {
      onPressDeal(deal);
    }
  };

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={BANNER_WIDTH + 8}
        snapToAlignment="center"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onTouchStart={() => {
          isInteractingRef.current = true;
        }}
        onTouchEnd={() => {
          setTimeout(() => {
            isInteractingRef.current = false;
          }, 3000);
        }}
        onScrollBeginDrag={() => {
          isInteractingRef.current = true;
        }}
        onScrollEndDrag={() => {
          setTimeout(() => {
            isInteractingRef.current = false;
          }, 3000);
        }}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {/* Dynamic Promotional Banners (from SSA) or Fallback Universal Promo Slide */}
        {activeBanners.length > 0 ? (
          activeBanners.map((banner) => (
            <SscPromotionalBannerSlide
              key={`promo_bnr_${banner.id}`}
              banner={banner}
              slideWidth={BANNER_WIDTH}
              onPress={onPressBanner}
            />
          ))
        ) : (
          <TopDealsPromoSlide
            slideWidth={BANNER_WIDTH}
            onPressCta={onPressExplore}
          />
        )}

        {/* Category-Aware Top Deal Banner Slides */}
        {featuredDeals.map((deal) => {
          const catKey = normalizeCategory(deal.category);
          const theme = CATEGORY_THEMES[catKey] || CATEGORY_THEMES.DEFAULT;

          return (
            <CategoryDealSlide
              key={`featured_${deal.id}`}
              deal={deal}
              theme={theme}
              storeList={allStores}
              onPress={handleDealCardPress}
              slideWidth={BANNER_WIDTH}
            />
          );
        })}
      </ScrollView>

      {/* Pagination Dots (Only if multiple slides exist) */}
      {totalSlides > 1 && (
        <View style={styles.paginationRow}>
          {Array.from({ length: totalSlides }).map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <View
                key={`dot_${idx}`}
                style={[
                  styles.paginationDot,
                  isActive && styles.paginationDotActive
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

// ============================================================================
// 8. STYLES
// ============================================================================

const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: 10
  },
  scrollContent: {
    paddingHorizontal: BANNER_MARGIN,
    gap: 8
  },

  /* ------------------- PROMOTIONAL BANNER SLIDE ------------------- */
  promotionalBannerCard: {
    height: BANNER_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.25)",
    elevation: 4,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backgroundColor: "#0F172A",
    position: "relative"
  },
  promotionalBannerScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(15, 23, 42, 0.65)"
  },
  promotionalBannerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2
  },
  promotionalBannerSubtitle: {
    color: "#FED7AA",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2
  },

  /* ------------------- PROMO SLIDE (SLIDE 1) ------------------- */
  slideCard: {
    height: BANNER_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.35)",
    elevation: 4,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    backgroundColor: "#EA580C"
  },
  bannerRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 12
  },
  leftColumn: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
    paddingRight: 6,
    zIndex: 2
  },
  brandSpotlightTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(15, 23, 42, 0.22)",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 4
  },
  brandSpotlightText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#FED7AA",
    letterSpacing: 0.6
  },
  headlinesWrap: {
    marginTop: 2,
    marginBottom: 2
  },
  headline: {
    fontSize: 16.5,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 20.5,
    letterSpacing: -0.3,
    textShadowColor: "rgba(0, 0, 0, 0.18)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  secondaryHeadline: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FED7AA",
    lineHeight: 17,
    marginTop: 1
  },
  description: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 14.5,
    marginBottom: 4
  },
  ctaButton: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 18,
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)"
  },
  ctaText: {
    color: "#EA580C",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.1
  },
  rightColumn: {
    width: "44%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "transparent"
  },

  /* ------------------- FEATURED DEAL SLIDE (SLIDE 2..N) ------------------- */
  featuredDealSlide: {
    height: BANNER_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FED7AA",
    elevation: 3,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    backgroundColor: "#FFFFFF"
  },
  dealSlideContent: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center"
  },
  dealSlideLeft: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
    paddingRight: 6,
    zIndex: 2
  },

  /* Top Meta with Actual Store Cover Image */
  dealTopMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  dealStoreInfoCol: {
    flex: 1
  },
  dealStoreName: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.2
  },
  dealSubMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2
  },
  dealCategoryPill: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5
  },
  dealCategoryText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#EA580C",
    letterSpacing: 0.2
  },
  dealDistancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  dealDistanceText: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#64748B"
  },

  /* Store Cover Image Circular Container */
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: "900",
    color: "#EA580C"
  },
  logoImg: {
    width: "100%",
    height: "100%"
  },
  multiLogoContainer: {
    width: 46,
    height: 34,
    position: "relative"
  },
  multiLogoBack: {
    position: "absolute",
    left: 0,
    top: 0
  },
  multiLogoFront: {
    position: "absolute",
    left: 12,
    top: 0,
    elevation: 3,
    borderColor: "#FFFFFF"
  },

  /* Discount Badge */
  dealDiscountBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    gap: 3.5,
    marginVertical: 2
  },
  dealDiscountText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.2
  },

  /* Description */
  dealDescription: {
    fontSize: 9.5,
    color: "#475569",
    lineHeight: 13,
    fontWeight: "500"
  },

  /* Bottom Row: Price & Claim CTA */
  dealBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2
  },
  dealPriceBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4
  },
  dealOfferPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: "#EA580C"
  },
  dealOrigPrice: {
    fontSize: 10,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  dealStorewideBadge: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5
  },
  dealStorewideText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#EA580C"
  },
  dealClaimBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 14,
    gap: 3.5,
    elevation: 2
  },
  dealClaimBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF"
  },

  /* Right Side Illustration Container */
  dealSlideRight: {
    width: "38%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "transparent"
  },

  /* ------------------- PAGINATION DOTS ------------------- */
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 8
  },
  paginationDot: {
    width: 6,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E8F0"
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: "#EA580C"
  }
});
