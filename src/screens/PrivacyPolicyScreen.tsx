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
  Trash2
} from "lucide-react-native";

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleOpenEmail = (subject?: string, body?: string) => {
    const url = `mailto:info@jrina.online?subject=${encodeURIComponent(
      subject || "Inquiry - SmartShopper"
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
                    Entity: <Text style={styles.bold}>JRINA Private Limited</Text> (SmartShopper)
                  </Text>
                </View>
              </View>

              <View style={styles.effectiveBadge}>
                <Calendar size={13} color="#EA580C" />
                <Text style={styles.effectiveText}>Effective Date: 12 October 2026</Text>
              </View>
            </View>

            {/* Intro Alert Box */}
            <View style={styles.introBox}>
              <Text style={styles.introText}>
                At <Text style={styles.bold}>SmartShopper</Text>, owned and operated by{" "}
                <Text style={styles.bold}>JRINA Private Limited</Text> (&quot;Company&quot;, &quot;we&quot;,
                &quot;our&quot;, or &quot;us&quot;), we take your privacy and personal data protection
                seriously. This Privacy Policy details the exact categories of data we collect, why we need
                it, how it is safeguarded, and how you can exercise your privacy and account deletion rights.
              </Text>
            </View>

            {/* Section 1 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Information We Collect</Text>
              </View>

              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Account Information:</Text> Full name, username, verified
                    email address, mobile phone number, and encrypted password hash (managed securely via
                    Supabase Auth).
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Location Data:</Text> Device GPS coordinates
                    (latitude/longitude) or user-selected geographic hubs. Location data is used strictly in
                    real-time to compute proximity to nearby merchant stores and filter relevant geofenced
                    offers. We do not sell or monetize location trails.
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Vouchers & Transaction Activity:</Text> Promotional voucher
                    claim codes, redemption timestamps, itemized digital E-Bills, Customer ID barcode scans,
                    and receipt image uploads for verified reviews.
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <Lock size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Payment Details:</Text> For merchant SaaS billing or any platform
                    fees, transactions are processed by certified third-party payment aggregators (Cashfree
                    Payments). We do not store credit/debit card numbers or CVVs on our servers.
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <FileText size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Device Diagnostics:</Text> Browser type, operating system, IP
                    address, and platform performance telemetry to safeguard against fraud and ensure optimal app
                    performance.
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 2 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <Text style={styles.sectionHeading}>Purpose of Collection & Processing</Text>
              </View>

              <View style={styles.listContainer}>
                {[
                  "To generate and manage your permanent Customer ID and Digital Card.",
                  "To deliver proximity-based deals, calculate accurate store distances, and power the interactive map.",
                  "To synchronize claimed vouchers and verify redemptions with partner merchant point-of-sale systems.",
                  "To store and deliver your itemized digital E-Bills securely.",
                  "To provide consumer customer support and respond to user inquiries.",
                  "To prevent fraudulent claims, duplicated vouchers, and malicious bot activity."
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 3 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>
                <Text style={styles.sectionHeading}>Authorized Third-Party Service Providers</Text>
              </View>
              <Text style={styles.sectionLead}>
                We work with trusted third-party cloud infrastructure providers who operate under strict data
                protection and confidentiality agreements:
              </Text>

              <View style={styles.listContainer}>
                {[
                  {
                    title: "Supabase Inc.",
                    desc: "Secure user authentication, PostgreSQL database storage, and real-time syncing."
                  },
                  {
                    title: "OpenStreetMap & Leaflet",
                    desc: "Map rendering and geocoding services."
                  },
                  {
                    title: "Cashfree Payments India",
                    desc: "PCI-DSS compliant payment processing for platform subscription services."
                  },
                  {
                    title: "Google Gemini AI",
                    desc: "Optional, opt-in AI deal recommendations assistant. Only anonymized deal and query context is transmitted."
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

            {/* Section 4 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>Data Protection & Security Standards</Text>
              </View>
              <Text style={styles.sectionLead}>
                We implement modern cryptographic controls, SSL/TLS transmission encryption, Row-Level Security
                (RLS) on PostgreSQL databases, and strict access controls. Only authorized operations can access
                user profile data.
              </Text>
            </View>

            {/* Section 5 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>5</Text>
                </View>
                <Text style={styles.sectionHeading}>Your Privacy Rights & Account Deletion</Text>
              </View>
              <Text style={styles.sectionLead}>
                In compliance with applicable privacy legislation in India, you retain full rights to inspect,
                rectify, or request permanent deletion of your personal data.
              </Text>

              <View style={styles.deletionCard}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.deletionTitle}>Request Complete Account & Data Deletion</Text>
                  <Text style={styles.deletionDesc}>
                    E-mail our Data Protection Officer at info@jrina.online to permanently remove your profile,
                    voucher history, and records.
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

            {/* Section 6 - Grievance */}
            <View style={[styles.sectionBlock, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>6</Text>
                </View>
                <Text style={styles.sectionHeading}>Grievance Officer & Contact Information</Text>
              </View>
              <Text style={styles.sectionLead}>
                For questions regarding this policy, data protection concerns, or legal notices, contact our
                Grievance Officer:
              </Text>

              <View style={styles.contactGrid}>
                {/* Office */}
                <View style={styles.contactItem}>
                  <Building2 size={20} color="#EA580C" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>COMPANY & REGISTERED OFFICE</Text>
                    <Text style={styles.contactTitle}>JRINA Private Limited</Text>
                    <Text style={styles.contactDesc}>
                      Peringammala, Thiruvananthapuram, Kerala, India
                    </Text>
                  </View>
                </View>

                {/* Website */}
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={handleOpenWebsite}
                  activeOpacity={0.7}
                >
                  <Globe size={20} color="#EA580C" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>OFFICIAL WEBSITE</Text>
                    <View style={styles.linkRow}>
                      <Text style={[styles.contactTitle, styles.accentColor]}>
                        https://www.jrina.online
                      </Text>
                      <ExternalLink size={12} color="#EA580C" />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Email */}
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => handleOpenEmail("Support Inquiry - SmartShopper")}
                  activeOpacity={0.7}
                >
                  <Mail size={20} color="#EA580C" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>SUPPORT & GRIEVANCES</Text>
                    <Text style={[styles.contactTitle, styles.accentColor]}>info@jrina.online</Text>
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
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(234, 88, 12, 0.15)"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  mainCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 20
  },
  cardHeader: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    marginBottom: 16
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10
  },
  titleIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(234, 88, 12, 0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  cardMainTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  entitySub: {
    fontSize: 12,
    color: "#CBD5E1",
    marginTop: 2
  },
  effectiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#0F172A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155"
  },
  effectiveText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8"
  },
  introBox: {
    backgroundColor: "rgba(234, 88, 12, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.25)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20
  },
  introText: {
    fontSize: 12.5,
    color: "#E2E8F0",
    lineHeight: 20
  },
  bold: {
    fontWeight: "700",
    color: "#FFFFFF"
  },
  sectionBlock: {
    marginBottom: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#334155"
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  sectionNumber: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionNumberText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FB923C"
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    flex: 1
  },
  sectionLead: {
    fontSize: 12.5,
    color: "#CBD5E1",
    lineHeight: 19,
    marginBottom: 10
  },
  bulletList: {
    gap: 10
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  bulletIcon: {
    marginTop: 2,
    flexShrink: 0
  },
  bulletContent: {
    flex: 1,
    fontSize: 12.5,
    color: "#CBD5E1",
    lineHeight: 19
  },
  listContainer: {
    gap: 8,
    paddingLeft: 4
  },
  dotItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  dot: {
    fontSize: 14,
    color: "#EA580C",
    lineHeight: 18
  },
  dotText: {
    flex: 1,
    fontSize: 12.5,
    color: "#CBD5E1",
    lineHeight: 19
  },
  deletionCard: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "column",
    gap: 12,
    marginTop: 10
  },
  deletionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  deletionDesc: {
    fontSize: 11.5,
    color: "#94A3B8",
    lineHeight: 17,
    marginTop: 3
  },
  deletionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#DC2626",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: "flex-start"
  },
  deletionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700"
  },
  contactGrid: {
    gap: 10,
    marginTop: 6
  },
  contactItem: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  contactIcon: {
    flexShrink: 0
  },
  contactSmall: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5
  },
  contactTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 1
  },
  contactDesc: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  accentColor: {
    color: "#FB923C"
  },
  doneBtn: {
    backgroundColor: "#EA580C",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800"
  }
});
