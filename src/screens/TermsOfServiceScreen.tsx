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
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  MapPin,
  ShoppingBag,
  Coins
} from "lucide-react-native";

export const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleOpenEmail = (subject?: string) => {
    const url = `mailto:info@jrina.online?subject=${encodeURIComponent(
      subject || "Terms Inquiry - SmartShopper"
    )}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleOpenPhone = () => {
    Linking.openURL("tel:6238624428").catch(() => {});
  };

  const handleOpenWebsite = () => {
    Linking.openURL("https://ssc.jrina.online").catch(() => {});
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
            <Text style={styles.tabText}>Privacy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]} activeOpacity={1}>
            <FileText size={13} color="#EA580C" />
            <Text style={[styles.tabText, styles.tabTextActive]}>Terms</Text>
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
                  <Text style={styles.cardMainTitle}>SmartShopper Consumer</Text>
                  <Text style={styles.entitySub}>Terms & Conditions</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.effectiveBadge}>
                  <Calendar size={13} color="#EA580C" />
                  <Text style={styles.effectiveText}>Effective & Last Updated: 28 October 2026</Text>
                </View>
              </View>
            </View>

            {/* Quick Meta Card */}
            <View style={styles.companyPill}>
              <View style={styles.companyPillRow}>
                <Building2 size={15} color="#0F172A" />
                <Text style={styles.companyPillText}>
                  Operated by: <Text style={styles.bold}>JRINA Private Limited</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.companyPillRow}
                onPress={handleOpenWebsite}
                activeOpacity={0.7}
              >
                <Globe size={15} color="#EA580C" />
                <Text style={[styles.companyPillText, styles.linkText]}>https://ssc.jrina.online</Text>
                <ExternalLink size={12} color="#EA580C" />
              </TouchableOpacity>
            </View>

            {/* Section 1: Acceptance of Terms */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Acceptance of Terms</Text>
              </View>
              <Text style={styles.bodyText}>
                These Terms & Conditions govern your use of SmartShopper Consumer (&ldquo;SSC&rdquo;),
                operated by JRINA Private Limited (&ldquo;JRINA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;,
                or &ldquo;our&rdquo;).
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                By accessing or using SSC, you agree to these Terms to the extent permitted by applicable
                law. Nothing in these Terms limits any consumer right that cannot lawfully be excluded.
              </Text>
            </View>

            {/* Section 2: Regional Availability */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <Text style={styles.sectionHeading}>Regional Availability</Text>
              </View>
              <Text style={styles.bodyText}>SSC provides region-dependent functionality.</Text>

              <View style={styles.regionalGrid}>
                <View style={[styles.regionalCard, styles.keralaCard]}>
                  <View style={styles.regionalHeader}>
                    <ShoppingBag size={16} color="#047857" />
                    <Text style={styles.keralaTitle}>Kerala</Text>
                  </View>
                  <Text style={styles.regionalDesc}>
                    Eligible users in Kerala may access purchasing functionality enabled in the application,
                    subject to merchant participation, product availability, serviceability, payment
                    arrangements, and checkout conditions.
                  </Text>
                </View>

                <View style={[styles.regionalCard, styles.outsideCard]}>
                  <View style={styles.regionalHeader}>
                    <MapPin size={16} color="#64748B" />
                    <Text style={styles.outsideTitle}>Outside Kerala</Text>
                  </View>
                  <Text style={styles.regionalDesc}>
                    Outside Kerala, SSC is limited to discovering merchants and viewing deals. Purchase
                    functionality through SSC is not available in these locations unless expressly
                    introduced and communicated by JRINA.
                  </Text>
                </View>
              </View>

              <Text style={[styles.subnote, styles.topGap]}>
                The availability of a feature depends on the user&apos;s service location and the
                functionality actually enabled in the application.
              </Text>
            </View>

            {/* Section 3: Nature of the Platform */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>
                <Text style={styles.sectionHeading}>Nature of the Platform</Text>
              </View>
              <Text style={styles.bodyText}>
                SSC helps users discover merchants and explore available deals. Where purchasing
                functionality is enabled, it may also support the applicable order and delivery process.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                The role of JRINA in an individual transaction depends on the actual business
                arrangement. A participating merchant may remain responsible for the goods or services
                it sells.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Nothing in these Terms automatically makes JRINA the seller of every product or service
                displayed on SSC.
              </Text>
            </View>

            {/* Section 4: User Accounts */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>User Accounts</Text>
              </View>
              <Text style={styles.bodyText}>
                Users must provide accurate information when registering and maintain reasonable account
                security.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                You must not impersonate another person, submit deliberately false information, misuse
                another person&apos;s account, or attempt unauthorised access to the service.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                JRINA may take proportionate action against misuse, fraud, security threats, or unlawful
                activity, subject to applicable law.
              </Text>
            </View>

            {/* Section 5: Merchant Listings and Deals */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>5</Text>
                </View>
                <Text style={styles.sectionHeading}>Merchant Listings and Deals</Text>
              </View>
              <Text style={styles.bodyText}>
                Merchant information and deals may be provided by participating merchants.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Availability, price, stock, validity, eligibility, and redemption conditions may change.
                Users should review the displayed conditions and confirm material details with the
                merchant where necessary.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Merchants are responsible for information they supply and for meeting their legal
                obligations. JRINA will handle reports of misleading or inaccurate listings through an
                appropriate review process.
              </Text>
              <Text style={[styles.subnote, styles.topGap]}>
                Nothing in this section removes rights that consumers may have under applicable law.
              </Text>
            </View>

            {/* Section 6: Purchases and Payments */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>6</Text>
                </View>
                <Text style={styles.sectionHeading}>Purchases and Payments</Text>
              </View>
              <Text style={styles.bodyText}>
                Purchasing functionality is available only in eligible locations where it is enabled.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Before confirming a purchase, review the final payable amount, applicable platform fee,
                delivery charge, taxes where applicable, delivery information, cancellation terms, and
                other transaction conditions disclosed at checkout.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Payment arrangements and the role of JRINA, a merchant, or a payment provider depend on
                the actual transaction flow.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Outside Kerala, SSC is limited to deal discovery and does not provide purchasing
                functionality through the platform under the current model.
              </Text>
            </View>

            {/* Section 7: Platform Fee and Delivery Charges */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>7</Text>
                </View>
                <Text style={styles.sectionHeading}>Platform Fee and Delivery Charges</Text>
              </View>
              <View style={styles.highlightPill}>
                <Coins size={16} color="#EA580C" />
                <Text style={styles.highlightPillText}>
                  Where applicable, a platform fee of <Text style={styles.bold}>₹1</Text> may be charged for an eligible transaction.
                </Text>
              </View>
              <Text style={[styles.bodyText, styles.topGap]}>
                Applicable fees must be disclosed before the user confirms the transaction.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Delivery charges may apply depending on the service and destination.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                The ordinary refund treatment of these charges is explained in the Refund & Cancellation
                Policy. Mandatory consumer rights and legally required refunds are not excluded.
              </Text>
            </View>

            {/* Section 8: Cancellation and Refunds */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>8</Text>
                </View>
                <Text style={styles.sectionHeading}>Cancellation and Refunds</Text>
              </View>
              <Text style={styles.bodyText}>
                Cancellation and refund requests are assessed according to the transaction, the service
                provided, the reason for the request, the applicable transaction terms, and applicable law.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Where a merchant or external payment provider handles a transaction, the user may need to
                contact that party. JRINA may assist with complaints where appropriate.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                The platform fee and delivery charges are ordinarily non-refundable under the conditions
                described in the Refund & Cancellation Policy, subject to mandatory legal rights.
              </Text>
            </View>

            {/* Section 9: Location and Notifications */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>9</Text>
                </View>
                <Text style={styles.sectionHeading}>Location and Notifications</Text>
              </View>
              <Text style={styles.bodyText}>
                SSC may request GPS permission for nearby merchant discovery and related
                location-dependent features.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Users may deny or revoke permission through device settings. Notifications may depend on
                device settings, connectivity, and the functioning of relevant providers. Delivery of every
                notification cannot be guaranteed.
              </Text>
            </View>

            {/* Section 10: Acceptable Use */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>10</Text>
                </View>
                <Text style={styles.sectionHeading}>Acceptable Use</Text>
              </View>
              <Text style={styles.bodyText}>You must not:</Text>
              <View style={styles.bulletList}>
                {[
                  "Use SSC for unlawful, fraudulent, or deceptive activity.",
                  "Interfere with the security or operation of the service.",
                  "Attempt to access accounts or data without authorisation.",
                  "Submit malicious code or abuse platform functionality.",
                  "Misrepresent merchants, deals, prices, or transactions.",
                  "Infringe intellectual-property or other legal rights."
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <AlertTriangle size={15} color="#DC2626" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 11: Intellectual Property */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>11</Text>
                </View>
                <Text style={styles.sectionHeading}>Intellectual Property</Text>
              </View>
              <Text style={styles.bodyText}>
                SSC&apos;s software, branding, original designs, and JRINA-owned content are protected by
                applicable law.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                You may use the service for lawful personal purposes. Reproduction or commercial
                exploitation of JRINA-owned material requires permission unless otherwise permitted by law.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Merchant logos, images, and other merchant-provided content may belong to their respective
                owners.
              </Text>
            </View>

            {/* Section 12: Third-Party Services */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>12</Text>
                </View>
                <Text style={styles.sectionHeading}>Third-Party Services</Text>
              </View>
              <Text style={styles.bodyText}>
                SSC may rely on external services for hosting, authentication, mapping, payments,
                notifications, or other functionality where implemented.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Third-party services may have their own terms and privacy policies. This section does not
                exclude obligations imposed on JRINA by applicable law.
              </Text>
            </View>

            {/* Section 13: Service Availability */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>13</Text>
                </View>
                <Text style={styles.sectionHeading}>Service Availability</Text>
              </View>
              <Text style={styles.bodyText}>
                We may update, maintain, modify, or discontinue features as reasonably necessary.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                We aim to maintain a reliable service but cannot guarantee uninterrupted or error-free
                operation. This does not remove obligations that apply under consumer-protection law.
              </Text>
            </View>

            {/* Section 14: Complaints and Grievances */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>14</Text>
                </View>
                <Text style={styles.sectionHeading}>Complaints and Grievances</Text>
              </View>
              <Text style={styles.bodyText}>For support, complaints, or grievances, contact:</Text>

              <View style={styles.contactCard}>
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => handleOpenEmail("SmartShopper Support Inquiry")}
                  activeOpacity={0.7}
                >
                  <Mail size={16} color="#EA580C" />
                  <Text style={styles.contactItemText}>
                    <Text style={styles.bold}>Email:</Text> info@jrina.online
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={handleOpenPhone}
                  activeOpacity={0.7}
                >
                  <Phone size={16} color="#059669" />
                  <Text style={styles.contactItemText}>
                    <Text style={styles.bold}>Phone:</Text> 6238624428
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.bodyText, styles.topGap]}>
                Include relevant order or transaction details where available. Do not send passwords,
                PINs, or card security codes.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Complaints will be handled according to applicable law and the relevant grievance process.
              </Text>
            </View>

            {/* Section 15: Limitation of Liability */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>15</Text>
                </View>
                <Text style={styles.sectionHeading}>Limitation of Liability</Text>
              </View>
              <Text style={styles.bodyText}>
                To the extent permitted by law, JRINA is not responsible for independent merchant
                representations or transactions conducted directly between users and merchants where JRINA
                is not the seller or payment recipient.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                This does not exclude responsibility for JRINA&apos;s own acts or omissions where liability
                cannot lawfully be excluded, nor does it limit mandatory consumer rights.
              </Text>
            </View>

            {/* Section 16: Suspension and Termination */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>16</Text>
                </View>
                <Text style={styles.sectionHeading}>Suspension and Termination</Text>
              </View>
              <Text style={styles.bodyText}>Users may stop using SSC at any time.</Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                JRINA may restrict or terminate access for legitimate reasons, including serious misuse,
                fraud, security risks, or legal requirements, subject to applicable law.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Account closure does not automatically remove information that must lawfully be retained.
              </Text>
            </View>

            {/* Section 17: Changes to These Terms */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>17</Text>
                </View>
                <Text style={styles.sectionHeading}>Changes to These Terms</Text>
              </View>
              <Text style={styles.bodyText}>
                We may update these Terms when SSC, its business model, or applicable law changes.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                The latest version will be published on the SSC website. Notice or consent will be
                provided where required by law.
              </Text>
            </View>

            {/* Section 18: Governing Law and Disputes */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>18</Text>
                </View>
                <Text style={styles.sectionHeading}>Governing Law and Disputes</Text>
              </View>
              <Text style={styles.bodyText}>These Terms are subject to applicable laws of India.</Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Disputes will be handled through legally applicable procedures. Nothing in these Terms
                prevents a consumer from approaching a competent consumer authority or forum where legally
                entitled to do so.
              </Text>
            </View>

            {/* Section 19: Contact Information */}
            <View style={[styles.sectionBlock, styles.noBorder]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>19</Text>
                </View>
                <Text style={styles.sectionHeading}>Contact Information</Text>
              </View>

              <View style={styles.finalContactBox}>
                <Text style={styles.finalContactTitle}>JRINA Private Limited</Text>
                <View style={styles.finalContactRow}>
                  <Globe size={15} color="#EA580C" />
                  <TouchableOpacity onPress={() => Linking.openURL("https://jrina.online")}>
                    <Text style={styles.finalLinkText}>Website: https://jrina.online</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.finalContactRow}>
                  <Globe size={15} color="#EA580C" />
                  <TouchableOpacity onPress={handleOpenWebsite}>
                    <Text style={styles.finalLinkText}>SmartShopper: https://ssc.jrina.online</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.finalContactRow}>
                  <Mail size={15} color="#EA580C" />
                  <TouchableOpacity onPress={() => handleOpenEmail("Terms Inquiry")}>
                    <Text style={styles.finalLinkText}>Email: info@jrina.online</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.finalContactRow}>
                  <Phone size={15} color="#059669" />
                  <TouchableOpacity onPress={handleOpenPhone}>
                    <Text style={styles.finalLinkText}>Phone: 6238624428</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.subnote, styles.topGap]}>
                These Terms should be read together with the Privacy Policy and Refund & Cancellation Policy.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A"
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  headerTitleWrap: {
    flex: 1
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A"
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500"
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center"
  },
  tabBarWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  tabItemActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74"
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B"
  },
  tabTextActive: {
    color: "#EA580C",
    fontWeight: "700"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  cardHeader: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10
  },
  titleIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center"
  },
  cardMainTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A"
  },
  entitySub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 1
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  effectiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 6
  },
  effectiveText: {
    fontSize: 11,
    color: "#C2410C",
    fontWeight: "600"
  },
  companyPill: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6
  },
  companyPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  companyPillText: {
    fontSize: 13,
    color: "#334155"
  },
  linkText: {
    color: "#EA580C",
    fontWeight: "600"
  },
  sectionBlock: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  noBorder: {
    borderBottomWidth: 0,
    paddingBottom: 6
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  sectionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700"
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1
  },
  bodyText: {
    fontSize: 13.5,
    color: "#334155",
    lineHeight: 20
  },
  topGap: {
    marginTop: 8
  },
  bold: {
    fontWeight: "700",
    color: "#0F172A"
  },
  regionalGrid: {
    marginTop: 10,
    gap: 10
  },
  regionalCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1
  },
  keralaCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0"
  },
  outsideCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0"
  },
  regionalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4
  },
  keralaTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#047857"
  },
  outsideTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569"
  },
  regionalDesc: {
    fontSize: 12.5,
    color: "#334155",
    lineHeight: 18
  },
  highlightPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderColor: "#FFEDD5",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    gap: 8
  },
  highlightPillText: {
    flex: 1,
    fontSize: 13,
    color: "#C2410C",
    lineHeight: 18
  },
  subnote: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic",
    lineHeight: 17
  },
  bulletList: {
    marginTop: 10,
    gap: 8
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  bulletIcon: {
    marginTop: 2
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: "#334155",
    lineHeight: 19
  },
  contactCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginTop: 10,
    gap: 10
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  contactItemText: {
    fontSize: 13,
    color: "#334155"
  },
  finalContactBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginTop: 8,
    gap: 8
  },
  finalContactTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2
  },
  finalContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  finalLinkText: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500"
  }
});