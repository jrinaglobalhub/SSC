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
  FileText,
  Calendar,
  Building2,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  AlertTriangle
} from "lucide-react-native";

export const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleOpenEmail = (subject?: string, body?: string) => {
    const url = `mailto:info@jrina.online?subject=${encodeURIComponent(
      subject || "Inquiry - SmartShopper Terms"
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
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
            <Text style={styles.headerSubtitle}>JRINA Private Limited</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <FileText size={20} color="#EA580C" />
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
                  <FileText size={22} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardMainTitle}>Consumer Terms & Conditions</Text>
                  <Text style={styles.entitySub}>
                    Operating Entity: <Text style={styles.bold}>JRINA Private Limited</Text> (SmartShopper Operator)
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
                Welcome to <Text style={styles.bold}>SmartShopper</Text> (
                <Text style={styles.linkText} onPress={() => Linking.openURL("https://ssc.jrina.online")}>
                  ssc.jrina.online
                </Text>
                ), operated by <Text style={styles.bold}>JRINA Private Limited</Text> (&quot;Company&quot;,
                &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By accessing, browsing, registering for,
                or using our Consumer Application, Customer Digital ID Card, or promotional voucher features,
                you acknowledge and agree to be bound by these Terms and Conditions.
              </Text>
            </View>

            {/* Section 1 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Platform Role & Independent Merchant Offers</Text>
              </View>
              <Text style={styles.sectionLead}>
                SmartShopper operates exclusively as a technology platform connecting consumers with
                participating offline retail stores, restaurants, service outlets, and local businesses
                (&quot;Merchants&quot;).
              </Text>
              <View style={styles.noticeBox}>
                <AlertTriangle size={16} color="#FB923C" style={{ marginTop: 2, flexShrink: 0 }} />
                <Text style={styles.noticeText}>
                  <Text style={styles.bold}>Important Notice:</Text> Merchants independently create, publish,
                  price, and honor their respective deals, discounts, vouchers, and product availability. While
                  JRINA Private Limited verifies merchant credentials during onboarding, the Merchant remains
                  solely responsible for the accuracy of offer descriptions, quality of goods and services,
                  stock availability, pricing, statutory taxes, and fulfillment, subject to applicable Indian
                  consumer protection laws.
                </Text>
              </View>
            </View>

            {/* Section 2 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <Text style={styles.sectionHeading}>Eligibility & Consumer Account Responsibilities</Text>
              </View>
              <View style={styles.listContainer}>
                {[
                  "You must be at least 18 years of age or possess legal parental/guardian authorization to use the SmartShopper consumer platform.",
                  "You agree to provide accurate, current, and authentic registration details (full name, verified email, and contact number).",
                  "You are responsible for maintaining the confidentiality of your login credentials and are fully liable for all activities under your account."
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
                <Text style={styles.sectionHeading}>SmartShopper Digital Card & Customer ID</Text>
              </View>
              <Text style={styles.sectionLead}>
                Upon account creation, each consumer is assigned a unique permanent Customer ID (e.g.,{" "}
                <Text style={styles.codeText}>SS-CUS-xxxx</Text>) represented via an interactive
                ISO-compliant QR Code and Code 128 Barcode.
              </Text>
              <Text style={styles.sectionLead}>
                Presenting your Digital Card at partner merchant checkouts enables cashiers to link verified
                itemized purchases, record digital E-Bills, and validate eligible consumer discounts. Your
                Digital Card is personal to your registered identity and non-transferable.
              </Text>
            </View>

            {/* Section 4 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>Voucher Claiming, Expiry & Redemption Rules</Text>
              </View>
              <View style={styles.listContainer}>
                {[
                  "Promotional vouchers claimed on SmartShopper generate a unique alphanumeric voucher code and QR code.",
                  "Vouchers must be redeemed at the designated merchant store prior to their stated expiration window or countdown timer.",
                  "Vouchers hold no cash equivalent, cannot be exchanged for cash, and are subject to merchant terms (such as minimum purchase values or maximum discount caps) disclosed in the offer card.",
                  "Merchants reserve the right to verify voucher authenticity via their Merchant redemption scanner prior to applying discounts at checkout."
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 5 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>5</Text>
                </View>
                <Text style={styles.sectionHeading}>Itemized Digital E-Bills & Records</Text>
              </View>
              <Text style={styles.sectionLead}>
                SmartShopper provides itemized digital E-Bills sent by participating merchants upon scanning
                your Customer ID. These records serve as a convenient paperless summary of your store visit and
                purchases. Physical tax invoices issued by the merchant at point-of-sale remain the official
                legal tax document for statutory warranty and return claims with the respective merchant.
              </Text>
            </View>

            {/* Section 6 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>6</Text>
                </View>
                <Text style={styles.sectionHeading}>Verified Buyer Reviews & Price Fairness Ratings</Text>
              </View>
              <View style={styles.listContainer}>
                {[
                  'Consumers may submit ratings, feedback, and upload receipt photos to receive "Verified Shopper" badges.',
                  "Reviews must reflect genuine personal store visits and honest purchasing experiences.",
                  "Submitting fraudulent, defamatory, abusive, competitor-sabotaging, or fabricated purchase claims is strictly prohibited and grounds for immediate account suspension."
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 7 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>7</Text>
                </View>
                <Text style={styles.sectionHeading}>Geographic Services, Geofencing & Accuracy</Text>
              </View>
              <Text style={styles.sectionLead}>
                SmartShopper uses your device GPS coordinates or manually selected locality hubs to calculate
                distances to nearby stores and deals. While we utilize accurate Haversine distance computations
                and OpenStreetMap coordinates, real-time map precision may vary depending on device hardware,
                signal availability, or browser permissions.
              </Text>
            </View>

            {/* Section 8 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>8</Text>
                </View>
                <Text style={styles.sectionHeading}>Prohibited Activities & Misuse</Text>
              </View>
              <View style={styles.listContainer}>
                {[
                  "Attempting to bypass authentication, scrape proprietary offer feeds, or inject unauthorized automated bots.",
                  "Duplicating, forging, or illegally circulating single-use voucher QR codes.",
                  "Harassing merchant staff, store owners, or JRINA Private Limited personnel through chat, messaging, or support channels."
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 9 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>9</Text>
                </View>
                <Text style={styles.sectionHeading}>Intellectual Property</Text>
              </View>
              <Text style={styles.sectionLead}>
                All trademarks, logos, brand assets, source code, UI designs, and digital materials associated
                with SmartShopper are the exclusive intellectual property of JRINA Private Limited. Merchant
                trade names and logos displayed remain the property of their respective owners.
              </Text>
            </View>

            {/* Section 10 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>10</Text>
                </View>
                <Text style={styles.sectionHeading}>Limitation of Liability & Disclaimers</Text>
              </View>
              <Text style={styles.sectionLead}>
                To the fullest extent permitted by applicable law, JRINA Private Limited provides the platform
                on an &quot;as-is&quot; and &quot;as-available&quot; basis without warranties of any kind.
                JRINA Private Limited shall not be liable for any indirect, incidental, punitive, or
                consequential damages resulting from store transactions, merchant fulfillment defaults, product
                defects, or temporary network outages.
              </Text>
            </View>

            {/* Section 11 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>11</Text>
                </View>
                <Text style={styles.sectionHeading}>Account Termination & Deletion</Text>
              </View>
              <Text style={styles.sectionLead}>
                Consumers may request voluntary account closure and complete profile deletion at any time via
                the Account tab or by emailing{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => handleOpenEmail("Account Deletion Request - SmartShopper")}
                >
                  info@jrina.online
                </Text>
                . We process verified deletion requests promptly in accordance with our Privacy Policy.
              </Text>
            </View>

            {/* Section 12 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>12</Text>
                </View>
                <Text style={styles.sectionHeading}>Governing Law & Jurisdiction</Text>
              </View>
              <Text style={styles.sectionLead}>
                These Terms & Conditions are governed by and construed in accordance with the laws of India.
                Any disputes arising out of or in connection with the platform shall be subject to the
                exclusive jurisdiction of the competent courts in Thiruvananthapuram, Kerala, India.
              </Text>
            </View>

            {/* Grievance & Registered Office */}
            <View style={[styles.sectionBlock, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.sectionHeading}>Grievance Officer & Registered Office</Text>
              <Text style={[styles.sectionLead, { marginTop: 6 }]}>
                For legal notices, platform terms clarification, or grievances:
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
                  onPress={() => handleOpenEmail("Legal Inquiry - SmartShopper Terms")}
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
  linkText: {
    color: "#FB923C",
    fontWeight: "700",
    textDecorationLine: "underline"
  },
  codeText: {
    backgroundColor: "#0F172A",
    color: "#FB923C",
    fontFamily: "monospace",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "700"
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
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: 6
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: "#CBD5E1",
    lineHeight: 18
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
  contactGrid: {
    gap: 10,
    marginTop: 10
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
