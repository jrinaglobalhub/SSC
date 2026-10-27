import React, { useState } from "react";
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
  Platform,
  Linking
} from "react-native";
import {
  X,
  ShieldCheck,
  User,
  Lock,
  Phone,
  Mail,
  UserPlus,
  LogIn,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Check
} from "lucide-react-native";
import {
  checkUsernameAvailability,
  registerUserInDatabase,
  loginUserInDatabase,
  resendVerificationEmail
} from "../api/supabase";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { UserSession, RootStackParamList } from "../types";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccessLogin: (user: UserSession) => void;
  initialPromptReason?: string;
}

type AuthMode = "login" | "register" | "email_sent";

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSuccessLogin,
  initialPromptReason
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mode, setMode] = useState<AuthMode>("login");

  const handleOpenTerms = () => {
    onClose();
    navigation.navigate("TermsOfService");
  };

  const handleOpenPrivacy = () => {
    onClose();
    navigation.navigate("PrivacyPolicy");
  };

  // Login state
  const [loginEmailOrUsername, setLoginEmailOrUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [isAgreedToTerms, setIsAgreedToTerms] = useState(false);
  const [regError, setRegError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Email sent state
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Username validation state
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available?: boolean; message?: string }>({});

  const handleUsernameBlur = async () => {
    const clean = regUsername.trim();
    if (!clean || clean.length < 3) {
      setUsernameStatus({ available: false, message: "Username must be at least 3 characters." });
      return;
    }
    setUsernameChecking(true);
    const res = await checkUsernameAvailability(clean);
    setUsernameChecking(false);
    if (!res.available) {
      setUsernameStatus({ available: false, message: res.reason });
    } else {
      setUsernameStatus({ available: true, message: "Username is available!" });
    }
  };

  const handleLoginSubmit = async () => {
    if (!loginEmailOrUsername.trim() || !loginPassword) return;

    setLoginError("");
    setUnconfirmedEmail(null);
    setIsLoggingIn(true);

    const res = await loginUserInDatabase({
      emailOrUsername: loginEmailOrUsername.trim(),
      password: loginPassword,
      role: "consumer"
    });

    setIsLoggingIn(false);

    if (res.success && res.user) {
      onSuccessLogin(res.user);
      onClose();
    } else if (res.emailNotConfirmed) {
      setLoginError(res.message || "Please verify your email address before signing in.");
      setUnconfirmedEmail(loginEmailOrUsername.includes("@") ? loginEmailOrUsername.trim() : null);
    } else {
      setLoginError(res.message || "Login failed. Invalid credentials.");
    }
  };

  const handleRegisterSubmit = async () => {
    setRegError("");

    if (!regEmail.trim() || !regEmail.includes("@")) {
      setRegError("Please provide a valid email address.");
      return;
    }
    if (regUsername.trim().length < 3) {
      setRegError("Username must be at least 3 characters long.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters long.");
      return;
    }
    if (!regFullName.trim()) {
      setRegError("Please enter your full name.");
      return;
    }
    if (!isAgreedToTerms) {
      setRegError("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    const availability = await checkUsernameAvailability(regUsername);
    if (!availability.available) {
      setRegError(availability.reason || "Username is already taken.");
      return;
    }

    setIsRegistering(true);

    const res = await registerUserInDatabase({
      email: regEmail.trim(),
      username: regUsername.trim(),
      password: regPassword,
      fullName: regFullName.trim(),
      phone: regPhone.trim(),
      role: "consumer"
    });

    setIsRegistering(false);

    if (res.success) {
      if (res.emailConfirmationRequired) {
        setRegisteredEmail(regEmail.trim());
        setMode("email_sent");
      } else if (res.user) {
        onSuccessLogin(res.user);
        onClose();
      }
    } else {
      setRegError(res.message || "Registration failed.");
    }
  };

  const handleResend = async (email: string) => {
    if (!email) return;
    setIsResending(true);
    setResendStatus(null);
    const res = await resendVerificationEmail(email);
    setIsResending(false);
    setResendStatus(res.message);
  };

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
              <View style={styles.iconCircle}>
                <ShieldCheck size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {mode === "login"
                    ? "Consumer Login"
                    : mode === "register"
                    ? "Create Account"
                    : "Verify Email"}
                </Text>
                <Text style={styles.headerSub}>SmartShopper Authentication</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Toggle Tabs (Only in login / register modes) */}
          {mode !== "email_sent" && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === "login" && styles.tabBtnActive]}
                onPress={() => {
                  setMode("login");
                  setLoginError("");
                }}
                activeOpacity={0.8}
              >
                <LogIn size={15} color={mode === "login" ? "#0F172A" : "#64748B"} />
                <Text style={[styles.tabBtnText, mode === "login" && styles.tabBtnTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, mode === "register" && styles.tabBtnActiveRegister]}
                onPress={() => {
                  setMode("register");
                  setRegError("");
                }}
                activeOpacity={0.8}
              >
                <UserPlus size={15} color={mode === "register" ? "#FFFFFF" : "#64748B"} />
                <Text
                  style={[
                    styles.tabBtnText,
                    mode === "register" ? styles.tabBtnTextActiveRegister : null
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Optional Prompt Reason Banner */}
          {initialPromptReason && mode !== "email_sent" && (
            <View style={styles.banner}>
              <Sparkles size={16} color="#EA580C" />
              <Text style={styles.bannerText}>{initialPromptReason}</Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* LOGIN MODE */}
            {mode === "login" && (
              <View style={styles.form}>
                {Boolean(loginError) && (
                  <View style={styles.errorBox}>
                    <View style={styles.errorRow}>
                      <AlertCircle size={16} color="#DC2626" style={{ marginTop: 2 }} />
                      <Text style={styles.errorText}>{loginError}</Text>
                    </View>
                    {unconfirmedEmail && (
                      <View style={styles.resendRow}>
                        <Text style={styles.resendPrompt}>{"Didn't receive verification email?"}</Text>
                        <TouchableOpacity
                          onPress={() => handleResend(unconfirmedEmail)}
                          disabled={isResending}
                        >
                          <Text style={styles.resendAction}>
                            {isResending ? "Resending..." : "Resend Link"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {resendStatus && <Text style={styles.resendStatusText}>{resendStatus}</Text>}
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email or Username</Text>
                  <View style={styles.inputWrapper}>
                    <User size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter email or username"
                      placeholderTextColor="#94A3B8"
                      value={loginEmailOrUsername}
                      onChangeText={setLoginEmailOrUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showLoginPassword}
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowLoginPassword(!showLoginPassword)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {showLoginPassword ? (
                        <EyeOff size={16} color="#94A3B8" />
                      ) : (
                        <Eye size={16} color="#94A3B8" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (!loginEmailOrUsername || !loginPassword || isLoggingIn) && styles.btnDisabled
                  ]}
                  onPress={handleLoginSubmit}
                  disabled={!loginEmailOrUsername || !loginPassword || isLoggingIn}
                  activeOpacity={0.85}
                >
                  {isLoggingIn ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Sign In with Credentials</Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* REGISTER MODE */}
            {mode === "register" && (
              <View style={styles.form}>
                {Boolean(regError) && (
                  <View style={styles.errorBox}>
                    <View style={styles.errorRow}>
                      <AlertCircle size={16} color="#DC2626" style={{ marginTop: 2 }} />
                      <Text style={styles.errorText}>{regError}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="name@example.com"
                      placeholderTextColor="#94A3B8"
                      value={regEmail}
                      onChangeText={setRegEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Unique Username</Text>
                  <View style={styles.inputWrapper}>
                    <User size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. alex_shopper"
                      placeholderTextColor="#94A3B8"
                      value={regUsername}
                      onChangeText={(t) => {
                        setRegUsername(t.replace(/\s+/g, ""));
                        setUsernameStatus({});
                      }}
                      onBlur={handleUsernameBlur}
                      autoCapitalize="none"
                    />
                  </View>
                  {usernameChecking && (
                    <Text style={styles.helperText}>Checking username availability...</Text>
                  )}
                  {Boolean(usernameStatus.message) && (
                    <Text
                      style={[
                        styles.helperText,
                        usernameStatus.available ? styles.helperSuccess : styles.helperError
                      ]}
                    >
                      {usernameStatus.message}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Min 6 characters"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showRegPassword}
                      value={regPassword}
                      onChangeText={setRegPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowRegPassword(!showRegPassword)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {showRegPassword ? (
                        <EyeOff size={16} color="#94A3B8" />
                      ) : (
                        <Eye size={16} color="#94A3B8" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <User size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Alex Johnson"
                      placeholderTextColor="#94A3B8"
                      value={regFullName}
                      onChangeText={setRegFullName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Phone (Optional)</Text>
                  <View style={styles.inputWrapper}>
                    <Phone size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="10-digit number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={regPhone}
                      onChangeText={(t) => setRegPhone(t.replace(/\D/g, ""))}
                    />
                  </View>
                </View>

                {/* Terms Agreement Checkbox */}
                <View style={styles.termsRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, isAgreedToTerms && styles.checkboxActive]}
                    onPress={() => setIsAgreedToTerms(!isAgreedToTerms)}
                    activeOpacity={0.8}
                  >
                    {isAgreedToTerms && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </TouchableOpacity>
                  <Text style={styles.termsText} onPress={() => setIsAgreedToTerms(!isAgreedToTerms)}>
                    I agree to the{" "}
                    <Text
                      style={styles.termsLink}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleOpenTerms();
                      }}
                    >
                      Terms & Conditions
                    </Text>{" "}
                    and{" "}
                    <Text
                      style={styles.termsLink}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleOpenPrivacy();
                      }}
                    >
                      Privacy Policy
                    </Text>{" "}
                    of JRINA Private Limited.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (!regEmail ||
                      !regUsername ||
                      !regPassword ||
                      !regFullName ||
                      !isAgreedToTerms ||
                      usernameStatus.available === false ||
                      isRegistering) &&
                      styles.btnDisabled
                  ]}
                  onPress={handleRegisterSubmit}
                  disabled={
                    !regEmail ||
                    !regUsername ||
                    !regPassword ||
                    !regFullName ||
                    !isAgreedToTerms ||
                    usernameStatus.available === false ||
                    isRegistering
                  }
                  activeOpacity={0.85}
                >
                  {isRegistering ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Complete Registration</Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* EMAIL SENT MODE */}
            {mode === "email_sent" && (
              <View style={styles.emailSentContainer}>
                <View style={styles.emailSentIcon}>
                  <Mail size={32} color="#EA580C" />
                </View>
                <Text style={styles.emailSentTitle}>Verify Your Email Address</Text>
                <Text style={styles.emailSentDesc}>
                  {"We've sent a verification link to\n"}
                  <Text style={{ fontWeight: "800", color: "#0F172A" }}>{registeredEmail}</Text>.
                  {"\nPlease check your inbox or spam folder and confirm your email to sign in."}
                </Text>

                {Boolean(resendStatus) && (
                  <View style={styles.resendSuccessBox}>
                    <Text style={styles.resendSuccessText}>{resendStatus}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => handleResend(registeredEmail)}
                  disabled={isResending}
                  activeOpacity={0.8}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color="#0F172A" />
                  ) : (
                    <>
                      <RefreshCw size={14} color="#0F172A" />
                      <Text style={styles.secondaryBtnText}>Resend Verification Email</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    setMode("login");
                    setLoginEmailOrUsername(registeredEmail);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Proceed to Sign In</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
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
  iconCircle: {
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  tabBtnActiveRegister: {
    backgroundColor: "#EA580C"
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B"
  },
  tabBtnTextActive: {
    color: "#0F172A"
  },
  tabBtnTextActiveRegister: {
    color: "#FFFFFF"
  },
  banner: {
    backgroundColor: "#FFF7ED",
    borderBottomWidth: 1,
    borderBottomColor: "#FED7AA",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  bannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9A3412",
    flex: 1
  },
  bodyScroll: {
    padding: 20
  },
  form: {
    gap: 14
  },
  inputGroup: {
    gap: 5
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155"
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
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    padding: 0
  },
  helperText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2
  },
  helperSuccess: {
    color: "#059669"
  },
  helperError: {
    color: "#DC2626"
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    borderRadius: 12,
    gap: 10,
    marginTop: 4
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1
  },
  checkboxActive: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C"
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: "#475569",
    lineHeight: 16
  },
  termsLink: {
    color: "#EA580C",
    fontWeight: "700",
    textDecorationLine: "underline"
  },
  primaryBtn: {
    backgroundColor: "#EA580C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
    elevation: 3,
    shadowColor: "#EA580C",
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  btnDisabled: {
    backgroundColor: "#CBD5E1",
    elevation: 0
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800"
  },
  secondaryBtn: {
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  secondaryBtnText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800"
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    borderRadius: 12,
    gap: 8
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  errorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
    flex: 1,
    lineHeight: 16
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#FECACA"
  },
  resendPrompt: {
    fontSize: 11,
    color: "#B91C1C"
  },
  resendAction: {
    fontSize: 11,
    fontWeight: "900",
    color: "#EA580C",
    textDecorationLine: "underline"
  },
  resendStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669"
  },
  emailSentContainer: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 12
  },
  emailSentIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FFF7ED",
    borderWidth: 2,
    borderColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center"
  },
  emailSentTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A"
  },
  emailSentDesc: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280
  },
  resendSuccessBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 10,
    borderRadius: 10,
    width: "100%"
  },
  resendSuccessText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
    textAlign: "center"
  }
});
