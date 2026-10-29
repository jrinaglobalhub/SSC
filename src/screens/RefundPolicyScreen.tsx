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
  RotateCcw,
  Calendar,
  Building2,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ExternalLink,
  MapPin,
  ShoppingBag,
  Coins,
  Truck
} from "lucide-react-native";

export const RefundPolicyScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleOpenEmail = (subject?: string) => {
    const url = `mailto:info@jrina.online?subject=${encodeURIComponent(
      subject || "Refund & Cancellation Inquiry - SmartShopper"
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
            <Text style={styles.headerTitle}>Refund & Cancellation</Text>
            <Text style={styles.headerSubtitle}>JRINA Private Limited</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <RotateCcw size={20} color="#EA580C" />
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

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("TermsOfService")}
            activeOpacity={0.7}
          >
            <FileText size={13} color="#94A3B8" />
            <Text style={styles.tabText}>Terms</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]} activeOpacity={1}>
            <RotateCcw size={13} color="#EA580C" />
            <Text style={[styles.tabText, styles.tabTextActive]}>Refunds</Text>
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
                  <RotateCcw size={22} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardMainTitle}>SmartShopper Consumer</Text>
                  <Text style={styles.entitySub}>Refund & Cancellation Policy</Text>
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

            {/* Section 1: Scope */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Scope</Text>
              </View>
              <Text style={styles.bodyText}>
                SmartShopper Consumer (&ldquo;SSC&rdquo;) provides merchant and deal discovery outside
                Kerala and supports purchasing functionality in Kerala where enabled.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                This policy explains the ordinary treatment of cancellations, platform fees, delivery
                charges, and refund requests involving SSC-related transactions.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                All refund decisions remain subject to applicable law and mandatory consumer rights.
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

              <View style={styles.regionalGrid}>
                <View style={[styles.regionalCard, styles.keralaCard]}>
                  <View style={styles.regionalHeader}>
                    <ShoppingBag size={16} color="#047857" />
                    <Text style={styles.keralaTitle}>Kerala</Text>
                  </View>
                  <Text style={styles.regionalDesc}>
                    Eligible users may access purchasing functionality where enabled in SSC. The
                    applicable checkout conditions, payment arrangements, delivery service, and refund
                    terms will depend on the transaction.
                  </Text>
                </View>

                <View style={[styles.regionalCard, styles.outsideCard]}>
                  <View style={styles.regionalHeader}>
                    <MapPin size={16} color="#64748B" />
                    <Text style={styles.outsideTitle}>Outside Kerala</Text>
                  </View>
                  <Text style={styles.regionalDesc}>
                    SSC is limited to deal and merchant discovery. Purchasing functionality through SSC is
                    not available in these locations under the current model.
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 3: Platform Fee — ₹1 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>
                <Text style={styles.sectionHeading}>Platform Fee — ₹1</Text>
              </View>

              <View style={styles.feeHighlightBox}>
                <Coins size={18} color="#EA580C" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.feeTitle}>Nominal Platform Fee: ₹1</Text>
                  <Text style={styles.feeDesc}>
                    Where applicable, a platform fee of ₹1 may be charged for an eligible transaction.
                    The fee must be disclosed before the transaction is confirmed.
                  </Text>
                </View>
              </View>

              <Text style={[styles.bodyText, styles.topGap]}>
                The platform fee is ordinarily non-refundable once the relevant platform service has been
                provided or the transaction has been processed.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                However, a refund may be considered or required where the fee was charged incorrectly,
                charged more than once, the relevant service was not provided, or applicable law
                otherwise requires a refund.
              </Text>
            </View>

            {/* Section 4: Delivery Charges */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>Delivery Charges</Text>
              </View>
              <View style={styles.deliveryPill}>
                <Truck size={16} color="#0284C7" />
                <Text style={styles.deliveryPillText}>
                  Delivery charges, where applicable, will be disclosed before order confirmation.
                </Text>
              </View>
              <Text style={[styles.bodyText, styles.topGap]}>
                Delivery charges are ordinarily non-refundable once the delivery service has been completed.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Where delivery has not been performed, an order is cancelled before the service is
                provided, delivery fails, or another circumstance gives rise to a legally required
                refund, the request will be assessed based on the facts and applicable law.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                This policy does not exclude refunds or other remedies that are legally required.
              </Text>
            </View>

            {/* Section 5: Order Cancellation */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>5</Text>
                </View>
                <Text style={styles.sectionHeading}>Order Cancellation</Text>
              </View>
              <Text style={styles.bodyText}>
                A cancellation request should be submitted as early as possible through the available
                order or support channel.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Whether an order can be cancelled depends on its status, whether fulfilment or delivery has
                begun, the relevant transaction terms, and applicable law.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Any applicable cancellation fee or other deduction must be disclosed where required and
                must comply with applicable law.
              </Text>
              <Text style={[styles.subnote, styles.topGap]}>
                No cancellation request will override a mandatory legal right to a refund or other remedy.
              </Text>
            </View>

            {/* Section 6: Refund Eligibility */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>6</Text>
                </View>
                <Text style={styles.sectionHeading}>Refund Eligibility</Text>
              </View>
              <Text style={styles.bodyText}>Refund requests are assessed individually, considering:</Text>
              <View style={styles.bulletList}>
                {[
                  "The nature and status of the transaction.",
                  "Whether the relevant product or service was provided.",
                  "The reason for cancellation or the refund request.",
                  "Whether a payment was duplicated or incorrectly collected.",
                  "The role of JRINA, the merchant, and the payment provider.",
                  "The applicable transaction terms and mandatory legal requirements."
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <CheckCircle2 size={15} color="#059669" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.bodyText, styles.topGap]}>
                The platform fee and delivery charges are ordinarily non-refundable as described above,
                subject to legally required refunds and other applicable consumer rights.
              </Text>
            </View>

            {/* Section 7: Refund Processing */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>7</Text>
                </View>
                <Text style={styles.sectionHeading}>Refund Processing</Text>
              </View>
              <Text style={styles.bodyText}>
                Where JRINA is responsible for processing a refund, the applicable process and expected
                timeline will be communicated according to the transaction terms and payment-provider
                arrangements.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Where the merchant or an external payment provider is responsible for a transaction,
                users may need to contact that party.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                SSC does not promise a universal refund-processing period. Any legally prescribed
                deadline takes precedence over an internal review process.
              </Text>
            </View>

            {/* Section 8: How to Request Assistance */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>8</Text>
                </View>
                <Text style={styles.sectionHeading}>How to Request Assistance</Text>
              </View>
              <Text style={styles.bodyText}>
                For cancellation, refund, or transaction-related assistance, contact:
              </Text>

              <View style={styles.contactCard}>
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => handleOpenEmail("Refund Request Assistance")}
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
                Please provide, where available:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Your name or SSC account identifier.",
                  "The order or transaction reference.",
                  "The merchant's details.",
                  "The date of the transaction.",
                  "A short explanation of the issue."
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <CheckCircle2 size={14} color="#64748B" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.securityWarningBox}>
                <AlertTriangle size={16} color="#D97706" />
                <Text style={styles.securityWarningText}>
                  Never share your password, PIN, card CVV, or other unnecessary sensitive payment credentials.
                </Text>
              </View>
            </View>

            {/* Section 9: Consumer Rights */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>9</Text>
                </View>
                <Text style={styles.sectionHeading}>Consumer Rights</Text>
              </View>
              <Text style={styles.bodyText}>
                Nothing in this policy excludes or restricts rights or remedies available under
                applicable Indian law, including remedies for misleading representations, unfair trade
                practices, deficient services, or other legally recognised grounds.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Where JRINA, a merchant, or another service provider is legally responsible for a refund
                or other remedy, the applicable obligation remains in force.
              </Text>
            </View>

            {/* Section 10: Policy Changes */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>10</Text>
                </View>
                <Text style={styles.sectionHeading}>Policy Changes</Text>
              </View>
              <Text style={styles.bodyText}>
                JRINA may update this policy to reflect changes to SSC, its transaction arrangements, or
                applicable law. The latest version will be published on the SSC website with its effective
                or last-updated date.
              </Text>
            </View>

            {/* Section 11: Contact Information */}
            <View style={[styles.sectionBlock, styles.noBorder]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>11</Text>
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
                  <TouchableOpacity onPress={() => handleOpenEmail("Refund Policy Inquiry")}>
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
                This policy must be read with the SSC Privacy Policy and Terms & Conditions.
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
  feeHighlightBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF7ED",
    borderColor: "#FFEDD5",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 10
  },
  feeTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#C2410C",
    marginBottom: 4
  },
  feeDesc: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18
  },
  deliveryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    gap: 8
  },
  deliveryPillText: {
    flex: 1,
    fontSize: 13,
    color: "#0369A1",
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
  securityWarningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8
  },
  securityWarningText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 17
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