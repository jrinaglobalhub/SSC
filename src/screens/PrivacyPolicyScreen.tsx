import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Building2,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
  FileText,
  ExternalLink,
  Trash2,
  RotateCcw
} from "lucide-react-native";

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleOpenEmail = (subject?: string, body?: string) => {
    const url = `mailto:info@jrina.online?subject=${encodeURIComponent(
      subject || "Privacy Inquiry - SmartShopper"
    )}&body=${encodeURIComponent(body || "")}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleOpenPhone = () => {
    Linking.openURL("tel:+916238624428").catch(() => {});
  };

  const handleOpenWebsite = () => {
    Linking.openURL("https://www.jrina.online").catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.headerSubtitle}>JRINA Private Limited</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <ShieldCheck size={20} color="#EA580C" />
          </View>
        </View>

        {/* Legal Policies Tab Bar */}
        <View style={styles.tabBarWrapper}>
          <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]} activeOpacity={1}>
            <ShieldCheck size={13} color="#EA580C" />
            <Text style={[styles.tabText, styles.tabTextActive]}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("TermsOfService")}
            activeOpacity={0.7}
          >
            <FileText size={13} color="#94A3B8" />
            <Text style={styles.tabText}>Terms of Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("RefundPolicy")}
            activeOpacity={0.7}
          >
            <RotateCcw size={13} color="#94A3B8" />
            <Text style={styles.tabText}>Refunds</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <View style={styles.titleIconBadge}>
                  <ShieldCheck size={22} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardMainTitle}>Consumer Privacy Policy</Text>
                  <Text style={styles.entitySub}>
                    Entity: <Text style={styles.bold}>JRINA Private Limited</Text> (Operating SmartShopper)
                  </Text>
                </View>
              </View>

              <View style={styles.effectiveBadge}>
                <Calendar size={13} color="#EA580C" />
                <Text style={styles.effectiveText}>Effective Date: October 2026 | Last Updated: October 2026</Text>
              </View>
            </View>

            {/* Intro Alert Box */}
            <View style={styles.introBox}>
              <Text style={styles.introText}>
                At <Text style={styles.bold}>SmartShopper</Text>, owned and operated by{" "}
                <Text style={styles.bold}>JRINA Private Limited</Text> (&quot;Company&quot;, &quot;we&quot;,
                &quot;our&quot;, or &quot;us&quot;), we take your privacy and personal data protection
                seriously. This Privacy Policy details the exact categories of data we collect, why we need
                it, how it is safeguarded under Indian law, and how you can exercise your privacy and account deletion rights.
              </Text>
            </View>

            {/* Section 1 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Information We Actually Collect</Text>
              </View>

              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Account Credentials:</Text> Full name, username, verified
                    email address, mobile phone number, and encrypted password hash (managed securely via
                    Supabase Auth).
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Consented Geolocation & Saved Hubs:</Text> Foreground GPS coordinates
                    (latitude/longitude) or user-selected geographic locations (e.g., Palode, Kerala). Your last
                    consented coordinates and source (&apos;gps&apos; or &apos;saved_address&apos;) are saved in our secure
                    push token database strictly to filter and deliver hyper-local deal alerts within a 5,000-metre
                    radius. We do not track continuous background movement or store historical location trails.
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Delivery Addresses:</Text> House/flat details, street area, city,
                    district, postal code, and delivery coordinates stored locally and synced to your profile for
                    order fulfillment.
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Vouchers & Transaction Records:</Text> Promotional voucher
                    claim codes, in-store redemption timestamps, unique Customer ID barcode passes (e.g., SS-CUS-xxxx),
                    and itemized digital E-Bills issued by partner merchants.
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>In-App Communications & Reviews:</Text> Direct customer-to-merchant
                    chat messages stored in our database for order inquiries, and consumer store ratings or reviews.
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Device & Push Tokens:</Text> Expo Push Notification tokens, Firebase
                    Cloud Messaging (FCM) tokens, device operating system, and diagnostic logs to ensure reliable
                    notification delivery.
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 2: Data We Do NOT Collect */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <Text style={styles.sectionHeading}>Data We Do NOT Collect or Store</Text>
              </View>
              <View style={styles.noticeBox}>
                <Lock size={16} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                <Text style={styles.noticeText}>
                  <Text style={styles.bold}>No Banking Credentials Stored:</Text> We do not collect or store
                  sensitive financial data such as credit/debit card numbers, CVVs, expiry dates, or NetBanking
                  passwords on our servers. Consumer purchases from partner stores are fulfilled via Cash on Delivery
                  (COD) or direct UPI transfer to the merchant.
                </Text>
              </View>
              <Text style={[styles.sectionLead, { marginTop: 8 }]}>
                We do not sell, rent, monetize, or lease your personal data or location coordinates to third-party
                advertising networks, brokers, or data aggregators.
              </Text>
            </View>

            {/* Section 3: Purpose of Processing */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>
                <Text style={styles.sectionHeading}>Purpose of Collection & Processing</Text>
              </View>

              <View style={styles.listContainer}>
                {[
                  "To generate and maintain your permanent Customer ID and Digital Loyalty Pass.",
                  "To compute real-time proximity to partner stores and display accurate store distances on the interactive map.",
                  "To deliver 5,000-metre geofenced deal notifications for active offers nearby.",
                  "To verify single-use discount vouchers upon scanning at merchant counters.",
                  "To facilitate direct in-app chat communication with partner store owners regarding orders and availability.",
                  "To deliver itemized digital E-Bills issued by merchants upon checkout.",
                  "To prevent fraudulent claims, duplicated vouchers, and automated bot access."
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 4: Authorized Third-Party Processors */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>Verified Third-Party Processors</Text>
              </View>
              <Text style={styles.sectionLead}>
                We partner with established cloud and infrastructure providers operating under strict security obligations:
              </Text>

              <View style={styles.listContainer}>
                {[
                  {
                    title: "Supabase Inc.",
                    desc: "Cloud database storage (PostgreSQL), secure user authentication, and encrypted Realtime WebSocket synchronization."
                  },
                  {
                    title: "Expo & Google Firebase (FCM)",
                    desc: "Device push notification routing for real-time deal alerts, merchant replies, and order updates."
                  },
                  {
                    title: "OpenStreetMap & Leaflet",
                    desc: "Open-source map tiles and geocoding services. No personal identity is transmitted to map servers."
                  },
                  {
                    title: "Google Gemini AI (Google LLC)",
                    desc: "Opt-in shopping assistant. Queries are processed with local offer context to provide natural language recommendations."
                  },
                  {
                    title: "Cashfree Payments India",
                    desc: "PCI-DSS certified payment aggregator utilized for platform subscriptions on merchant workstation services."
                  }
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>
                      <Text style={styles.bold}>{item.title}</Text> — {item.desc}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 5: Security & Row-Level Security */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>5</Text>
                </View>
                <Text style={styles.sectionHeading}>Data Protection & Security Controls</Text>
              </View>
              <Text style={styles.sectionLead}>
                We implement industry-standard technical safeguards, including HTTPS/TLS encryption in transit,
                Row-Level Security (RLS) policies on our PostgreSQL databases ensuring users only access authorized
                data, encrypted password hashing, and least-privilege service-role API boundaries.
              </Text>
            </View>

            {/* Section 6: Indian DPDP Act & Privacy Rights */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>6</Text>
                </View>
                <Text style={styles.sectionHeading}>Your Rights under Indian Privacy Laws</Text>
              </View>
              <Text style={styles.sectionLead}>
                Under the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices
                and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data
                Protection (DPDP) Act, 2023, you hold the following rights:
              </Text>

              <View style={styles.listContainer}>
                {[
                  "Right to Access: Request a summary of your personal data processed by SmartShopper.",
                  "Right to Correction: Update inaccurate profile details directly in the Account tab.",
                  "Right to Withdraw Consent: Turn off location permissions or notification toggles at any time via device settings.",
                  "Right to Erasure / Account Deletion: Permanently delete your user profile, voucher claims, and associated records."
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Deletion Card */}
              <View style={styles.deletionCard}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.deletionTitle}>Request Complete Data & Account Deletion</Text>
                  <Text style={styles.deletionDesc}>
                    Email our privacy desk at info@jrina.online to permanently erase your profile, voucher claims,
                    and stored addresses within 30 days.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deletionBtn}
                  onPress={() =>
                    handleOpenEmail(
                      "Account Deletion Request - SmartShopper",
                      "Dear JRINA Privacy Team,\n\nPlease permanently delete my SmartShopper Consumer account and associated personal data.\n\nMy Registered Phone: \nMy Registered Name: \n\nThank you."
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Trash2 size={14} color="#FFFFFF" />
                  <Text style={styles.deletionBtnText}>Submit Request</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 7: Grievance Officer & Contact */}
            <View style={[styles.sectionBlock, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>7</Text>
                </View>
                <Text style={styles.sectionHeading}>Grievance Officer & Corporate Contact</Text>
              </View>
              <Text style={styles.sectionLead}>
                In accordance with Rule 5(9) of the IT (Reasonable Security Practices) Rules, 2011, and the DPDP Act, 2023,
                inquiries, consent revocations, or grievances should be directed to our designated Grievance Desk:
              </Text>

              <View style={styles.contactGrid}>
                {/* Office */}
                <View style={styles.contactItem}>
                  <Building2 size={20} color="#EA580C" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>COMPANY & REGISTERED OFFICE</Text>
                    <Text style={styles.contactTitle}>JRINA Private Limited</Text>
                    <Text style={styles.contactDesc}>
                      Peringammala, Palode, Nedumangad, Thiruvananthapuram, Kerala, India - 695562
                    </Text>
                  </View>
                </View>

                {/* Email */}
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => handleOpenEmail("Privacy Inquiry & Grievance - SmartShopper")}
                  activeOpacity={0.7}
                >
                  <Mail size={20} color="#EA580C" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>GRIEVANCE & PRIVACY OFFICER</Text>
                    <Text style={[styles.contactTitle, styles.accentColor]}>info@jrina.online</Text>
                    <Text style={styles.contactDesc}>Redressal timeline: Acknowledgement within 24 hours, resolution within 15 days</Text>
                  </View>
                </TouchableOpacity>

                {/* Phone */}
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={handleOpenPhone}
                  activeOpacity={0.7}
                >
                  <Phone size={20} color="#10B981" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>SUPPORT HELPLINE / WHATSAPP</Text>
                    <Text style={[styles.contactTitle, { color: "#10B981" }]}>+91 6238624428</Text>
                    <Text style={styles.contactDesc}>Mon - Sat: 9:00 AM - 7:00 PM IST</Text>
                  </View>
                </TouchableOpacity>

                {/* Website */}
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={handleOpenWebsite}
                  activeOpacity={0.7}
                >
                  <Globe size={20} color="#EA580C" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>OFFICIAL CORPORATE PORTAL</Text>
                    <View style={styles.linkRow}>
                      <Text style={[styles.contactTitle, styles.accentColor]}>
                        https://www.jrina.online
                      </Text>
                      <ExternalLink size={12} color="#EA580C" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Accept Button */}
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Back to Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  container: {
    flex: 1,
    backgroundColor: "#0F172A"
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0F172A",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B"
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#1E293B"
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center"
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1
  },
  headerIconWrap: {
    padding: 6
  },
  tabBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#334155"
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 5
  },
  tabItemActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#EA580C"
  },
  tabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8"
  },
  tabTextActive: {
    color: "#EA580C",
    fontWeight: "800"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 36
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  cardHeader: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  titleIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center"
  },
  cardMainTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A"
  },
  entitySub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2
  },
  effectiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 12
  },
  effectiveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B"
  },
  introBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    padding: 12,
    marginTop: 14
  },
  introText: {
    fontSize: 12,
    color: "#7C2D12",
    lineHeight: 18
  },
  sectionBlock: {
    marginTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8
  },
  sectionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionNumberText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A"
  },
  sectionLead: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18
  },
  noticeBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 10,
    marginTop: 10
  },
  noticeText: {
    fontSize: 11,
    color: "#166534",
    lineHeight: 16,
    flex: 1
  },
  bulletList: {
    marginTop: 8,
    gap: 8
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  bulletIcon: {
    marginTop: 2,
    flexShrink: 0
  },
  bulletContent: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 18,
    flex: 1
  },
  listContainer: {
    marginTop: 6,
    gap: 6
  },
  dotItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  dot: {
    color: "#EA580C",
    fontSize: 14,
    lineHeight: 18
  },
  dotText: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 18,
    flex: 1
  },
  bold: {
    fontWeight: "700"
  },
  linkText: {
    color: "#EA580C",
    textDecorationLine: "underline"
  },
  deletionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    marginTop: 14
  },
  deletionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#991B1B"
  },
  deletionDesc: {
    fontSize: 11,
    color: "#7F1D1D",
    marginTop: 2,
    lineHeight: 15
  },
  deletionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4
  },
  deletionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  contactGrid: {
    marginTop: 12,
    gap: 10
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10
  },
  contactIcon: {
    marginTop: 2
  },
  contactSmall: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 1
  },
  contactDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15
  },
  accentColor: {
    color: "#EA580C"
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  doneBtn: {
    marginTop: 16,
    backgroundColor: "#EA580C",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF"
  }
});
