import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import {
  X,
  User,
  AtSign,
  Phone,
  Mail,
  Lock,
  Check,
  AlertCircle,
  Save,
  ShieldCheck
} from "lucide-react-native";
import { useApp } from "../context/AppContext";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { user, updateUserProfile } = useApp();

  const [fullName, setFullName] = useState(() => user?.name || "");
  const [username, setUsername] = useState(() => user?.username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync state whenever modal opens or user changes (deferred)
  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) {
        if (user) {
          setFullName(user.name || "");
          setUsername(user.username || "");
        }
        setErrorMsg("");
        setSuccessMsg("");
      }
    });
    return () => {
      mounted = false;
    };
  }, [user, visible]);

  // Compute live avatar initials preview
  const liveInitials = (fullName.trim() || user?.name || "SC")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    const cleanName = fullName.trim();
    if (!cleanName) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername && cleanUsername.length < 3) {
      setErrorMsg("Username must be at least 3 characters long.");
      return;
    }

    setIsSaving(true);
    const res = await updateUserProfile({
      fullName: cleanName,
      username: cleanUsername || undefined
    });
    setIsSaving(false);

    if (res.success) {
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.message || "Failed to update profile. Please try again.");
    }
  };

  if (!user) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <User size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <Text style={styles.headerSub}>Update your personal identity</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Live Avatar Preview */}
            <View style={styles.avatarPreviewContainer}>
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarText}>{liveInitials}</Text>
              </View>
              <View style={styles.avatarMeta}>
                <Text style={styles.avatarName} numberOfLines={1}>
                  {fullName.trim() || user.name}
                </Text>
                <View style={styles.customerIdChip}>
                  <ShieldCheck size={12} color="#EA580C" />
                  <Text style={styles.customerIdText}>{user.customerId}</Text>
                </View>
              </View>
            </View>

            {/* Error / Success Feedback Banner */}
            {Boolean(errorMsg) && (
              <View style={styles.alertError}>
                <AlertCircle size={16} color="#DC2626" style={{ marginTop: 2 }} />
                <Text style={styles.alertErrorText}>{errorMsg}</Text>
              </View>
            )}

            {Boolean(successMsg) && (
              <View style={styles.alertSuccess}>
                <Check size={16} color="#16A34A" style={{ marginTop: 2 }} />
                <Text style={styles.alertSuccessText}>{successMsg}</Text>
              </View>
            )}

            {/* Editable Form */}
            <View style={styles.form}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={16} color="#64748B" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your name"
                    placeholderTextColor="#94A3B8"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputWrapper}>
                  <AtSign size={16} color="#64748B" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Choose username"
                    placeholderTextColor="#94A3B8"
                    value={username}
                    onChangeText={(t) => setUsername(t.replace(/\s+/g, ""))}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Mobile Phone - LOCKED / READ ONLY */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Mobile Phone</Text>
                  <View style={styles.lockedTag}>
                    <Lock size={10} color="#94A3B8" />
                    <Text style={styles.lockedTagText}>Locked</Text>
                  </View>
                </View>
                <View style={[styles.inputWrapper, styles.inputDisabled]}>
                  <Phone size={16} color="#94A3B8" />
                  <TextInput
                    style={[styles.textInput, styles.textDisabled]}
                    value={user.phone || "Not linked"}
                    editable={false}
                    selectTextOnFocus={false}
                  />
                </View>
                <Text style={styles.helperNote}>Mobile number cannot be edited at this time.</Text>
              </View>

              {/* Email Address - LOCKED / READ ONLY */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.lockedTag}>
                    <Lock size={10} color="#94A3B8" />
                    <Text style={styles.lockedTagText}>Locked</Text>
                  </View>
                </View>
                <View style={[styles.inputWrapper, styles.inputDisabled]}>
                  <Mail size={16} color="#94A3B8" />
                  <TextInput
                    style={[styles.textInput, styles.textDisabled]}
                    value={user.email || "Not provided"}
                    editable={false}
                    selectTextOnFocus={false}
                  />
                </View>
                <Text style={styles.helperNote}>Email address cannot be edited at this time.</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={16} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "90%",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12
  },
  header: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  headerSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1
  },
  closeBtn: {
    padding: 4
  },
  bodyScroll: {
    padding: 20
  },
  avatarPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 14,
    marginBottom: 16
  },
  avatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  avatarMeta: {
    flex: 1
  },
  avatarName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A"
  },
  customerIdChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(234, 88, 12, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 5
  },
  customerIdText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EA580C"
  },
  alertError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14
  },
  alertErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626"
  },
  alertSuccess: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14
  },
  alertSuccessText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A"
  },
  form: {
    gap: 14
  },
  inputGroup: {
    gap: 5
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155"
  },
  lockedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  lockedTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8"
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10
  },
  inputDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0"
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    padding: 0
  },
  textDisabled: {
    color: "#64748B"
  },
  helperNote: {
    fontSize: 11,
    color: "#94A3B8",
    fontStyle: "italic",
    paddingLeft: 2
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B"
  },
  saveBtn: {
    flex: 2,
    backgroundColor: "#EA580C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: "#EA580C",
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  btnDisabled: {
    backgroundColor: "#CBD5E1",
    elevation: 0
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF"
  }
});
