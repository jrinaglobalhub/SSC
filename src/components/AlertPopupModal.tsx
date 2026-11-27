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
  Linking
} from "react-native";
import {
  AlertTriangle,
  Info,
  X,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  BellRing
} from "lucide-react-native";
import { AlertPopup } from "../types";

interface AlertPopupModalProps {
  visible: boolean;
  alert: AlertPopup | null;
  onDismiss: () => void;
  onAction?: (actionType: "none" | "screen" | "url", actionTarget?: string) => void;
}

export const AlertPopupModal: React.FC<AlertPopupModalProps> = ({
  visible,
  alert,
  onDismiss,
  onAction
}) => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;

  if (!alert) return null;

  const isCritical = alert.priority === "critical";
  const isHigh = alert.priority === "high";

  const themeColors = isCritical
    ? {
        accent: "#DC2626",
        badgeBg: "#FEF2F2",
        badgeBorder: "#FCA5A5",
        badgeText: "#DC2626",
        btnBg: "#DC2626"
      }
    : isHigh
    ? {
        accent: "#D97706",
        badgeBg: "#FFFBEB",
        badgeBorder: "#FDE68A",
        badgeText: "#B45309",
        btnBg: "#D97706"
      }
    : {
        accent: "#FC4E03",
        badgeBg: "#FFF7ED",
        badgeBorder: "#FFEDD5",
        badgeText: "#EA580C",
        btnBg: "#FC4E03"
      };

  const handleButtonPress = () => {
    if (alert.buttonActionType === "url" && alert.buttonActionTarget) {
      Linking.openURL(alert.buttonActionTarget).catch(() => {});
    }
    if (onAction) {
      onAction(alert.buttonActionType, alert.buttonActionTarget);
    } else {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => {
        if (alert.isDismissible) onDismiss();
      }}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Background dismiss touch handler (only if dismissible) */}
        {alert.isDismissible && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onDismiss}
          />
        )}

        <View
          style={[
            styles.card,
            isNarrow && { width: "94%" },
            isCritical && { borderColor: "#DC2626", borderWidth: 2 }
          ]}
        >
          {/* Close button if dismissible */}
          {alert.isDismissible && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onDismiss}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <View style={styles.closeBtnCircle}>
                <X size={16} color="#64748B" />
              </View>
            </TouchableOpacity>
          )}

          {/* Optional Banner Image */}
          {alert.imageUrl ? (
            <View style={styles.bannerContainer}>
              <Image
                source={{ uri: alert.imageUrl }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          ) : null}

          {/* Body Content */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Priority & Type Tag Row */}
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.priorityTag,
                  {
                    backgroundColor: themeColors.badgeBg,
                    borderColor: themeColors.badgeBorder
                  }
                ]}
              >
                {isCritical ? (
                  <AlertTriangle size={12} color={themeColors.accent} style={{ marginRight: 4 }} />
                ) : (
                  <Info size={12} color={themeColors.accent} style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.priorityTagText, { color: themeColors.badgeText }]}>
                  {alert.priority.toUpperCase()} &bull; {alert.popupType.replace("_", " ").toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>{alert.title}</Text>

            {/* Message Body */}
            <Text style={styles.messageText}>{alert.message}</Text>

            {/* Action / Acknowledge Button */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: themeColors.btnBg }]}
              onPress={handleButtonPress}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>
                {alert.buttonText || "Acknowledge"}
              </Text>
              {alert.buttonActionType === "url" ? (
                <ExternalLink size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
              ) : alert.buttonActionType === "screen" ? (
                <ChevronRight size={15} color="#FFFFFF" style={{ marginLeft: 4 }} />
              ) : null}
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
    maxHeight: "82%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center"
  },
  bannerContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#F8FAFC"
  },
  bannerImage: {
    width: "100%",
    height: "100%"
  },
  bodyScroll: {
    width: "100%"
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  priorityTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1
  },
  priorityTagText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  titleText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 10
  },
  messageText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 19,
    marginBottom: 20
  },
  actionBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12.5,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.2
  }
});
