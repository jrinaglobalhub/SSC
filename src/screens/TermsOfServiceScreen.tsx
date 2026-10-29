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
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  CheckCircle2
} from "lucide-react-native";

export const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation<any>();

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

        {/* Legal Policies Tab Bar */}
        <View style={styles.tabBarWrapper}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("PrivacyPolicy")}
            activeOpacity={0.7}
          >
            <ShieldCheck size={13} color="#94A3B8" />
            <Text style={styles.tabText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]} activeOpacity={1}>
            <FileText size={13} color="#EA580C" />
            <Text style={[styles.tabText, styles.tabTextActive]}>Terms of Service</Text>
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
                <Text style={styles.effectiveText}>Effective Date: October 2026 | Last Updated: October 2026</Text>
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
                &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By accessing, registering for, or using
                our Consumer Mobile Application, Customer Digital Pass, promotional vouchers, or order services,
                you agree to be bound by these Terms and Conditions and our Privacy Policy.
              </Text>
            </View>

            {/* Section 1 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Platform Role & Independent Merchants</Text>
              </View>
              <Text style={styles.sectionLead}>
                SmartShopper operates exclusively as a technology marketplace connecting consumers with
                participating offline retail stores, supermarkets, restaurants, and service outlets (&quot;Merchants&quot;).
              </Text>
              <View style={styles.noticeBox}>
                <AlertTriangle size={16} color="#FB923C" style={{ marginTop: 2, flexShrink: 0 }} />
                <Text style={styles.noticeText}>
                  <Text style={styles.bold}>Independent Merchant Responsibility:</Text> Merchants independently
                  determine, publish, price, and fulfill their respective discounts, deals, and products. While
                  JRINA Private Limited verifies merchant profiles during onboarding, the Merchant remains solely
                  responsible for product quality, tax invoicing, stock availability, and physical delivery, subject
                  to mandatory protections under the Consumer Protection Act, 2019.
                </Text>
              </View>
            </View>

            {/* Section 2 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <Text style={styles.sectionHeading}>Eligibility & Account Security</Text>
              </View>
              <View style={styles.listContainer}>
                {[
                  "You must be at least 18 years of age or possess legal parental/guardian authorization to use the SmartShopper consumer platform.",
                  "You agree to provide accurate, truthful, and authentic registration details (full name, phone number, and verified email address).",
                  "You are responsible for safeguarding your login credentials and are responsible for all activities occurring under your account.",
                  "Guest users may browse nearby stores and deals within an active radar; creating an authenticated profile is required to claim vouchers, save delivery addresses, and place orders."
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
                <Text style={styles.sectionHeading}>Customer Digital ID & Loyalty Pass</Text>
              </View>
              <Text style={styles.sectionLead}>
                Each registered consumer is issued a unique permanent Customer ID (e.g.,{" "}
                <Text style={styles.codeText}>SS-CUS-xxxx</Text>) represented via an ISO-compliant QR Code and
                Code 128 Barcode within the app.
              </Text>
              <Text style={[styles.sectionLead, { marginTop: 6 }]}>
                Presenting your Customer Digital Pass at participating merchant checkouts enables cashiers to link
                eligible counter discounts and record digital E-Bills. Your Digital Pass is strictly personal to your
                registered identity and non-transferable.
              </Text>
            </View>

            {/* Section 4 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>Voucher Claiming, Expiry & Redemption</Text>
              </View>
              <View style={styles.listContainer}>
                {[
                  "Claiming a promotional voucher generates a unique alphanumeric code and verification QR code.",
                  "Vouchers must be redeemed at the designated store location prior to their countdown expiry time.",
                  "Vouchers hold no monetary cash value, cannot be converted to cash, and are subject to merchant terms (such as minimum purchase requirements) stated on the offer card.",
                  "Participating merchants verify voucher authenticity using their merchant scanning workstation before applying discounts at checkout."
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
                <Text style={styles.sectionHeading}>Consumer Orders, Delivery & Payments</Text>
              </View>
              <Text style={styles.sectionLead}>
                SmartShopper provides a shopping cart and Buy Now workflow for verified merchant products within a 5 km proximity:
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Fulfillment Options:</Text> Shoppers can select between Store Pickup or Direct Merchant Delivery to their saved address.
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Direct Consumer Payment:</Text> Payments for retail goods are made directly to the merchant upon delivery/pickup via Cash on Delivery (COD) or store UPI QR. JRINA Private Limited does not collect, hold, or process retail merchandise payments.
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Physical Tax Invoices:</Text> The physical tax invoice issued by the merchant at point-of-sale constitutes the statutory proof of purchase for warranties and tax records.
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 6 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>6</Text>
                </View>
                <Text style={styles.sectionHeading}>Distinction from JRINA Paid Services</Text>
              </View>
              <Text style={styles.sectionLead}>
                SmartShopper Consumer (SSC) is 100% free for shoppers. Any paid platform subscriptions, workstation
                licensing fees, or premium merchant services provided by JRINA Private Limited apply strictly to
                registered business merchants (SSM) and are billed via certified payment aggregators (Cashfree Payments).
              </Text>
            </View>

            {/* Section 7 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>7</Text>
                </View>
                <Text style={styles.sectionHeading}>Geographic Radar & Location Services</Text>
              </View>
              <Text style={styles.sectionLead}>
                SmartShopper calculates proximity distances to local stores using device GPS coordinates or user-selected
                localities (e.g., Palode, Kerala). While we compute accurate Haversine distances and utilize OpenStreetMap
                geocodes, GPS precision may vary depending on device hardware, satellite connectivity, or system permissions.
              </Text>
            </View>

            {/* Section 8 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>8</Text>
                </View>
                <Text style={styles.sectionHeading}>Reviews, In-App Chat & Community Guidelines</Text>
              </View>
              <View style={styles.listContainer}>
                {[
                  "Consumers may post ratings, reviews, and message store owners regarding inventory and order status.",
                  "All communications must remain truthful, courteous, and lawful.",
                  "Posting defamatory, obscene, harassing, competitor-sabotaging, or fraudulent reviews is strictly prohibited and grounds for immediate account termination."
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
                <Text style={styles.sectionHeading}>Prohibited Conduct & Anti-Scraping</Text>
              </View>
              <View style={styles.listContainer}>
                {[
                  "Bypassing platform authentication, tampering with single-use voucher QR codes, or creating fake accounts.",
                  "Employing automated bots, scrapers, or extraction crawlers on our deal feeds or merchant databases.",
                  "Interfering with the normal operation, network infrastructure, or security of our Supabase backend."
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 10 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>10</Text>
                </View>
                <Text style={styles.sectionHeading}>Intellectual Property Rights</Text>
              </View>
              <Text style={styles.sectionLead}>
                All trademarks, logos, brand assets, source code, UI designs, and radar algorithms associated with
                SmartShopper are the exclusive intellectual property of JRINA Private Limited. Merchant trade names,
                product trademarks, and logos displayed remain the property of their respective owners.
              </Text>
            </View>

            {/* Section 11 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>11</Text>
                </View>
                <Text style={styles.sectionHeading}>Limitation of Liability & Disclaimers</Text>
              </View>
              <Text style={styles.sectionLead}>
                To the fullest extent permitted by applicable law, SmartShopper is provided on an &quot;as-is&quot; and
                &quot;as-available&quot; basis. JRINA Private Limited shall not be liable for indirect, incidental, or
                consequential damages resulting from store transactions, merchant fulfillment delays, merchant product
                defects, or temporary network interruptions, without prejudice to mandatory statutory consumer rights under
                Indian law.
              </Text>
            </View>

            {/* Section 12 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>12</Text>
                </View>
                <Text style={styles.sectionHeading}>Account Termination & Data Deletion</Text>
              </View>
              <Text style={styles.sectionLead}>
                You may request complete account closure and personal data erasure at any time by emailing{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => handleOpenEmail("Account Deletion Request - SmartShopper")}
                >
                  info@jrina.online
                </Text>
                . We process verified requests within 30 days in accordance with our Privacy Policy.
              </Text>
            </View>

            {/* Section 13 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>13</Text>
                </View>
                <Text style={styles.sectionHeading}>Governing Law & Jurisdiction</Text>
              </View>
              <Text style={styles.sectionLead}>
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic
                of India. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction
                of the competent courts in Thiruvananthapuram, Kerala, India.
              </Text>
            </View>

            {/* Grievance & Corporate Office */}
            <View style={[styles.sectionBlock, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.sectionHeading}>Grievance Officer & Registered Office</Text>
              <Text style={[styles.sectionLead, { marginTop: 6 }]}>
                For legal inquiries, terms clarification, or platform grievances:
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
                  onPress={() => handleOpenEmail("Terms & Legal Inquiry - SmartShopper")}
                  activeOpacity={0.7}
                >
                  <Mail size={20} color="#EA580C" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>SUPPORT & GRIEVANCES</Text>
                    <Text style={[styles.contactTitle, styles.accentColor]}>info@jrina.online</Text>
                    <Text style={styles.contactDesc}>Response within 24-48 business hours</Text>
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
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 10,
    marginTop: 10
  },
  noticeText: {
    fontSize: 11,
    color: "#92400E",
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
  codeText: {
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#EA580C"
  },
  bold: {
    fontWeight: "700"
  },
  linkText: {
    color: "#EA580C",
    textDecorationLine: "underline"
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
