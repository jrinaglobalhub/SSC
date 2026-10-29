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
  FileText,
  ExternalLink,
  RotateCcw,
  MapPin,
  ShoppingBag
} from "lucide-react-native";

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleOpenEmail = (subject?: string) => {
    const url = `mailto:info@jrina.online?subject=${encodeURIComponent(
      subject || "Privacy Inquiry - SmartShopper"
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
            <Text style={[styles.tabText, styles.tabTextActive]}>Privacy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("TermsOfService")}
            activeOpacity={0.7}
          >
            <FileText size={13} color="#94A3B8" />
            <Text style={styles.tabText}>Terms</Text>
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
                  <Text style={styles.cardMainTitle}>SmartShopper Consumer</Text>
                  <Text style={styles.entitySub}>Privacy Policy</Text>
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

            {/* Section 1: Introduction */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Introduction</Text>
              </View>
              <Text style={styles.bodyText}>
                JRINA Private Limited (&ldquo;JRINA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
                operates SmartShopper Consumer (&ldquo;SSC&rdquo;), a platform that helps users discover
                local merchants, explore deals, and access purchasing functionality where available.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                This Privacy Policy explains how information may be collected, used, stored, and shared
                when you use SSC.
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
              <Text style={styles.bodyText}>
                SSC provides different functionality depending on the user&apos;s location.
              </Text>

              <View style={styles.regionalGrid}>
                <View style={[styles.regionalCard, styles.keralaCard]}>
                  <View style={styles.regionalHeader}>
                    <ShoppingBag size={16} color="#047857" />
                    <Text style={styles.keralaTitle}>Kerala, India</Text>
                  </View>
                  <Text style={styles.regionalDesc}>
                    Eligible users may access available purchasing functionality, subject to merchant
                    participation, serviceability, and checkout conditions.
                  </Text>
                </View>

                <View style={[styles.regionalCard, styles.outsideCard]}>
                  <View style={styles.regionalHeader}>
                    <MapPin size={16} color="#64748B" />
                    <Text style={styles.outsideTitle}>Outside Kerala</Text>
                  </View>
                  <Text style={styles.regionalDesc}>
                    SSC is limited to merchant and deal discovery. Purchase functionality through SSC is
                    not available in these locations unless JRINA expressly introduces it.
                  </Text>
                </View>
              </View>

              <Text style={[styles.subnote, styles.topGap]}>
                The information processed may vary depending on the features you use.
              </Text>
            </View>

            {/* Section 3: Information We May Collect */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>
                <Text style={styles.sectionHeading}>Information We May Collect</Text>
              </View>

              <View style={styles.subItem}>
                <Text style={styles.subItemTitle}>3.1 Account information</Text>
                <Text style={styles.bodyText}>
                  Depending on the registration and authentication features you use, SSC may process
                  your name, email address, phone number, account identifier, and authentication-related
                  information.
                </Text>
              </View>

              <View style={styles.subItem}>
                <Text style={styles.subItemTitle}>3.2 Location information</Text>
                <Text style={styles.bodyText}>
                  SSC may request GPS location permission to identify nearby merchants and display
                  location-relevant deals.
                </Text>
                <Text style={[styles.bodyText, styles.topGap]}>
                  You can deny or revoke location permission through your device settings. Some
                  location-dependent features may then become unavailable or less accurate.
                </Text>
                <View style={styles.verifiedBox}>
                  <CheckCircle2 size={15} color="#0284C7" />
                  <Text style={styles.verifiedText}>
                    Background location collection, continuous tracking, and precise-location storage
                    will not be represented as practices unless verified in the deployed application.
                  </Text>
                </View>
              </View>

              <View style={styles.subItem}>
                <Text style={styles.subItemTitle}>3.3 Order and transaction information</Text>
                <Text style={styles.bodyText}>
                  Where purchasing functionality is available in Kerala, SSC may process information
                  necessary to support an order, such as order references, merchant details, selected
                  products or services, delivery information, transaction status, and refund requests,
                  to the extent those features are implemented.
                </Text>
                <Text style={[styles.bodyText, styles.topGap]}>
                  Payment credentials should be handled by the applicable payment provider where its
                  integration is used. The precise data flow must be verified against the production
                  implementation.
                </Text>
              </View>

              <View style={styles.subItem}>
                <Text style={styles.subItemTitle}>3.4 Technical information</Text>
                <Text style={styles.bodyText}>
                  Depending on enabled functionality, technical information may include device and
                  application identifiers, notification tokens, operating-system information, crash
                  reports, and diagnostic events.
                </Text>
              </View>

              <View style={styles.subItem}>
                <Text style={styles.subItemTitle}>3.5 Support communications</Text>
                <Text style={styles.bodyText}>
                  If you contact us, we may process your contact details and the information you
                  provide to respond to your enquiry, investigate a complaint, or address a refund request.
                </Text>
              </View>
            </View>

            {/* Section 4: How We Use Information */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>How We Use Information</Text>
              </View>
              <Text style={styles.bodyText}>Information may be used, where applicable, to:</Text>
              <View style={styles.bulletList}>
                {[
                  "Create and maintain user accounts.",
                  "Display nearby merchants and deals.",
                  "Support purchasing and order fulfilment in eligible locations.",
                  "Coordinate order and delivery-related information.",
                  "Process or investigate transaction and refund requests.",
                  "Provide customer support and grievance handling.",
                  "Maintain application security and reliability.",
                  "Meet applicable legal and regulatory obligations."
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <CheckCircle2 size={15} color="#EA580C" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.subnote, styles.topGap]}>
                We will not claim that a particular feature collects information unless that collection
                is supported by the actual implementation.
              </Text>
            </View>

            {/* Section 5: Location Permission */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>5</Text>
                </View>
                <Text style={styles.sectionHeading}>Location Permission</Text>
              </View>
              <Text style={styles.bodyText}>
                Location permission is requested to support location-dependent functionality.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                You may disable location access through your device settings. This may affect nearby
                merchant discovery and related features.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                The exact frequency of GPS access, location precision, retention period, and whether
                coordinates are stored on a server depend on the deployed application and must be
                verified before publication.
              </Text>
            </View>

            {/* Section 6: Sharing of Information */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>6</Text>
                </View>
                <Text style={styles.sectionHeading}>Sharing of Information</Text>
              </View>
              <Text style={styles.bodyText}>
                Information may be shared with relevant parties when necessary to provide the service,
                subject to applicable law. These may include:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Participating merchants involved in an order or customer enquiry.",
                  "Delivery partners, where delivery functionality is used.",
                  "Payment providers handling an eligible transaction.",
                  "Hosting, database, authentication, mapping, and notification providers actually used by SSC.",
                  "Authorities where disclosure is required by law."
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <CheckCircle2 size={15} color="#0284C7" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.bodyText, styles.topGap]}>
                The information shared will depend on the transaction and the role of each party. We will
                not claim that all listed providers are active integrations without verifying the
                production configuration.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                For purchases completed directly with a merchant outside SSC, the merchant&apos;s own
                privacy and payment arrangements may apply.
              </Text>
            </View>

            {/* Section 7: Platform Fees and Delivery Information */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>7</Text>
                </View>
                <Text style={styles.sectionHeading}>Platform Fees and Delivery Information</Text>
              </View>
              <Text style={styles.bodyText}>
                Where applicable, SSC may process information concerning the platform fee, delivery
                charge, order status, and related refund requests.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                The current fee and refund terms are described in the Refund & Cancellation Policy. The
                actual amounts and terms applicable to a transaction will be disclosed where required
                before confirmation.
              </Text>
            </View>

            {/* Section 8: Data Retention */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>8</Text>
                </View>
                <Text style={styles.sectionHeading}>Data Retention</Text>
              </View>
              <Text style={styles.bodyText}>
                We retain information for as long as reasonably necessary for the relevant service,
                support, security, accounting, and legal purposes, subject to applicable law.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Retention periods may vary by data category. Information may need to be retained where
                legally required, including for legitimate transaction records or dispute resolution.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Specific retention and deletion timelines must be confirmed against the actual
                database, backup, and account-deletion processes.
              </Text>
            </View>

            {/* Section 9: Account Deletion and Data Requests */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>9</Text>
                </View>
                <Text style={styles.sectionHeading}>Account Deletion and Data Requests</Text>
              </View>
              <Text style={styles.bodyText}>
                To request account deletion or ask about personal information, contact:
              </Text>

              <View style={styles.contactCard}>
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => handleOpenEmail("Account Deletion Request")}
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
                We may request reasonable verification before processing a request.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Requests will be handled in accordance with applicable law. Certain information may need
                to be retained where legally required.
              </Text>
            </View>

            {/* Section 10: Security */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>10</Text>
                </View>
                <Text style={styles.sectionHeading}>Security</Text>
              </View>
              <Text style={styles.bodyText}>
                JRINA takes reasonable measures appropriate to the service to protect information
                against unauthorised access, loss, misuse, and disclosure.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                No online service can guarantee absolute security. Specific claims about encryption,
                security audits, certifications, or database access controls will be made only when
                verified.
              </Text>
            </View>

            {/* Section 11: Children's Privacy */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>11</Text>
                </View>
                <Text style={styles.sectionHeading}>Children&apos;s Privacy</Text>
              </View>
              <Text style={styles.bodyText}>
                SSC must be used in accordance with applicable age-related laws and safeguards. Where
                applicable law requires parental consent or additional protections for children, those
                requirements must be followed.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                The relevant age threshold and consent process must be reviewed against the actual
                registration flow and applicable Indian law before publication.
              </Text>
            </View>

            {/* Section 12: Your Privacy Rights */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>12</Text>
                </View>
                <Text style={styles.sectionHeading}>Your Privacy Rights</Text>
              </View>
              <Text style={styles.bodyText}>
                Subject to applicable law and its effective provisions, you may have rights concerning
                access, correction, updating, deletion, withdrawal of consent, and grievance
                redressal.
              </Text>
              <Text style={[styles.bodyText, styles.topGap]}>
                Contact us to raise a privacy concern or exercise a right. Withdrawing a permission may
                make a related feature unavailable but does not automatically invalidate processing
                lawfully carried out before withdrawal.
              </Text>
            </View>

            {/* Section 13: Changes to This Policy */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>13</Text>
                </View>
                <Text style={styles.sectionHeading}>Changes to This Policy</Text>
              </View>
              <Text style={styles.bodyText}>
                We may update this policy to reflect changes to SSC, our data practices, or applicable
                law. The latest version will be published on the SSC website with its effective or
                last-updated date.
              </Text>
            </View>

            {/* Section 14: Contact Information */}
            <View style={[styles.sectionBlock, styles.noBorder]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>14</Text>
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
                  <TouchableOpacity onPress={() => handleOpenEmail("Privacy Policy Inquiry")}>
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
                This policy must be verified against actual production data flows and reviewed for
                applicable legal requirements before publication.
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
  subnote: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic",
    lineHeight: 17
  },
  subItem: {
    marginTop: 12,
    paddingLeft: 4
  },
  subItemTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4
  },
  verifiedBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8
  },
  verifiedText: {
    flex: 1,
    fontSize: 12,
    color: "#0369A1",
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