import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
  Platform
} from "react-native";
import { Sparkles, X, Heart } from "lucide-react-native";
import { FestivalGreeting } from "../types";

interface FestivalGreetingModalProps {
  visible: boolean;
  greeting: FestivalGreeting | null;
  onDismiss: () => void;
}

export const FestivalGreetingModal: React.FC<FestivalGreetingModalProps> = ({
  visible,
  greeting,
  onDismiss
}) => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;

  if (!greeting) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.card, isNarrow && { width: "94%" }]}>
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onDismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <View style={styles.closeBtnCircle}>
              <X size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Festival Artwork Header */}
          <View style={styles.artworkContainer}>
            <Image
              source={{ uri: greeting.artworkUrl }}
              style={styles.artworkImage}
              resizeMode="cover"
            />
            {/* Subtle Gradient / Scrim */}
            <View style={styles.scrimOverlay} />
          </View>

          {/* Card Body */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Festival Badge */}
            <View style={styles.festivalBadge}>
              <Sparkles size={12} color="#FC4E03" style={{ marginRight: 4 }} />
              <Text style={styles.festivalBadgeText}>
                {greeting.festivalName.toUpperCase()} CELEBRATION
              </Text>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.titleText}>{greeting.title}</Text>
            {greeting.subtitle ? (
              <Text style={styles.subtitleText}>{greeting.subtitle}</Text>
            ) : null}

            {/* Message Body */}
            <Text style={styles.messageText}>{greeting.message}</Text>

            {/* Sender / Branding */}
            <View style={styles.senderContainer}>
              <Heart size={11} color="#EA580C" style={{ marginRight: 5 }} />
              <Text style={styles.senderText}>{greeting.senderText}</Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onDismiss}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>
                {greeting.buttonText || "Wish You The Same!"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  card: {
    width: "100%",
    maxWidth: 350,
    maxHeight: "84%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
    position: "relative"
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10
  },
  closeBtnCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center"
  },
  artworkContainer: {
    width: "100%",
    height: 180,
    backgroundColor: "#FFF7ED",
    position: "relative"
  },
  artworkImage: {
    width: "100%",
    height: "100%"
  },
  scrimOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.05)"
  },
  bodyScroll: {
    width: "100%"
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    alignItems: "center"
  },
  festivalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    marginBottom: 8
  },
  festivalBadgeText: {
    color: "#FC4E03",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  titleText: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 4
  },
  subtitleText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#EA580C",
    textAlign: "center",
    marginBottom: 10
  },
  messageText: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16
  },
  senderContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  senderText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#64748B"
  },
  actionBtn: {
    width: "100%",
    backgroundColor: "#FC4E03",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FC4E03",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.2
  }
});
