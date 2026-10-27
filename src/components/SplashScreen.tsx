import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Platform
} from "react-native";

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 2200
}) => {
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const [scaleAnim] = useState(() => new Animated.Value(0.92));
  const [contentFadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // 1. Smooth entrance animation
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();

    // 2. Hold, then fade out smoothly like WhatsApp
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true
      }).start(() => {
        if (onFinish) {
          onFinish();
        }
      });
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, fadeAnim, contentFadeAnim, scaleAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Center Branding (SmartShopper Logo & Name) */}
      <Animated.View
        style={[
          styles.centerContainer,
          {
            opacity: contentFadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image
          source={require("../../assets/icon-192.png")}
          style={styles.appLogo}
          resizeMode="contain"
        />
        <View style={styles.brandTitleRow}>
          <Text style={styles.brandSmart}>Smart</Text>
          <Text style={styles.brandShopper}>Shopper</Text>
        </View>
      </Animated.View>

      {/* Bottom Footer: "from" and JRINA Logo (WhatsApp Business Style) */}
      <Animated.View style={[styles.bottomContainer, { opacity: contentFadeAnim }]}>
        <Text style={styles.fromText}>from</Text>
        <Image
          source={require("../../assets/jrina-logo.png")}
          style={styles.jrinaLogo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 99999,
    elevation: 99999,
    alignItems: "center",
    justifyContent: "space-between"
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60
  },
  appLogo: {
    width: 88,
    height: 88,
    marginBottom: 16,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  brandSmart: {
    fontSize: 28,
    fontWeight: "900",
    color: "#EA580C",
    letterSpacing: -0.5
  },
  brandShopper: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5
  },
  bottomContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 44 : 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  fromText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
    letterSpacing: 1.5,
    textTransform: "lowercase"
  },
  jrinaLogo: {
    width: 125,
    height: 38
  }
});
