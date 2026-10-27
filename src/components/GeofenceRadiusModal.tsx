import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable
} from "react-native";
import { Navigation, X, Check } from "lucide-react-native";
import { useApp } from "../context/AppContext";

const RADII = [
  { label: "500 m", value: 500, desc: "Walking Distance" },
  { label: "1 km", value: 1000, desc: "Immediate Neighborhood" },
  { label: "2 km", value: 2000, desc: "Local Area (Default)" },
  { label: "5 km", value: 5000, desc: "Town / City Center" },
  { label: "10 km", value: 10000, desc: "Extended Suburbs" },
  { label: "25 km", value: 25000, desc: "Metro Region" },
  { label: "50 km", value: 50000, desc: "District Wide" },
  { label: "All / Unlimited", value: 999999, desc: "Any Distance" }
];

export const GeofenceRadiusModal: React.FC = () => {
  const {
    showRadiusModal,
    setShowRadiusModal,
    geofenceRadius,
    setGeofenceRadius,
    resetToGPSLocation,
    isGPS,
    locationName
  } = useApp();

  return (
    <Modal
      visible={showRadiusModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRadiusModal(false)}
    >
      <Pressable style={styles.overlay} onPress={() => setShowRadiusModal(false)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Geofence Radar</Text>
              <Text style={styles.subtitle}>Select deal radius & target location</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowRadiusModal(false)}
              style={styles.closeBtn}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Live GPS Button */}
            <TouchableOpacity
              style={[styles.gpsButton, isGPS && styles.gpsActive]}
              onPress={async () => {
                await resetToGPSLocation();
                setShowRadiusModal(false);
              }}
            >
              <Navigation size={18} color={isGPS ? "#16A34A" : "#EA580C"} />
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsText}>
                  {isGPS ? "Current Location (Live GPS Active)" : "Use Real GPS Location"}
                </Text>
                <Text style={styles.gpsSub}>{locationName}</Text>
              </View>
              {isGPS && <Check size={18} color="#16A34A" />}
            </TouchableOpacity>

            {/* Radius Options */}
            <Text style={styles.sectionTitle}>PROXIMITY RADIUS</Text>
            <View style={styles.grid}>
              {RADII.map((r) => {
                const isSelected = geofenceRadius === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.radiusItem, isSelected && styles.radiusSelected]}
                    onPress={() => {
                      setGeofenceRadius(r.value);
                      setShowRadiusModal(false);
                    }}
                  >
                    <Text style={[styles.radiusLabel, isSelected && styles.radiusLabelSelected]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.radiusDesc, isSelected && styles.radiusDescSelected]}>
                      {r.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: "85%"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A"
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  scroll: {
    marginTop: 14
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: 12,
    marginBottom: 18
  },
  gpsActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0"
  },
  gpsText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A"
  },
  gpsSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 10
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20
  },
  radiusItem: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  radiusSelected: {
    backgroundColor: "#EA580C",
    borderColor: "#C2410C"
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A"
  },
  radiusLabelSelected: {
    color: "#FFFFFF"
  },
  radiusDesc: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2
  },
  radiusDescSelected: {
    color: "#FED7AA"
  }
});
