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
  ExternalLink
} from "lucide-react-native";

export const RefundPolicyScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleOpenEmail = (subject?: string, body?: string) => {
    const url = `mailto:info@jrina.online?subject=${encodeURIComponent(
      subject || "Inquiry - SmartShopper Refunds"
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
            <Text style={styles.headerTitle}>Refund & Cancellation</Text>
            <Text style={styles.headerSubtitle}>JRINA Private Limited</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <RotateCcw size={20} color="#EA580C" />
          </View>
        </View>

        {/* Legal Policies Tab Bar for seamless switching */}
        <View style={styles.tabBarWrapper}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("PrivacyPolicy")}
            activeOpacity={0.7}
          >
            <ShieldCheck size={13} color="#94A3B8" />
            <Text style={styles.tabText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("TermsOfService")}
            activeOpacity={0.7}
          >
            <FileText size={13} color="#94A3B8" />
            <Text style={styles.tabText}>Terms of Service</Text>
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
                  <Text style={styles.cardMainTitle}>Refund & Cancellation Policy</Text>
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
                This Refund and Cancellation Policy governs consumer transactions, in-store redemptions,
                and digital orders placed via the <Text style={styles.bold}>SmartShopper Consumer (SSC)</Text> application
                and website (<Text style={styles.linkText} onPress={() => Linking.openURL("https://ssc.jrina.online")}>ssc.jrina.online</Text>),
                operated by <Text style={styles.bold}>JRINA Private Limited</Text> (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).
                Please review this policy to understand our platform role, order cancellation procedures, and refund mechanisms.
              </Text>
            </View>

            {/* Section 1: Platform Role & Transaction Model */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Platform Role & Transaction Structure</Text>
              </View>
              <Text style={styles.sectionLead}>
                SmartShopper operates exclusively as an online hyper-local technology intermediary connecting consumers with independent retail stores, supermarkets, restaurants, and service outlets (&quot;Partner Merchants&quot;).
              </Text>
              <View style={styles.noticeBox}>
                <AlertTriangle size={16} color="#FB923C" style={{ marginTop: 2, flexShrink: 0 }} />
                <Text style={styles.noticeText}>
                  <Text style={styles.bold}>Important Commercial Distinction:</Text> JRINA Private Limited is <Text style={styles.bold}>not</Text> the seller, manufacturer, packer, or distributor of consumer merchandise displayed in merchant store catalogs. Contractual sales of physical goods occur directly between the purchasing consumer and the designated independent Partner Merchant.
                </Text>
              </View>
            </View>

            {/* Section 2: Consumer Purchases & Payment Methods */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <Text style={styles.sectionHeading}>Consumer Purchases & Payment Methods</Text>
              </View>
              <Text style={styles.sectionLead}>
                Orders placed via the SmartShopper consumer cart or direct Buy Now workflow support the following fulfillment and payment arrangements:
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Cash on Delivery (COD):</Text> Payment is collected in cash or store UPI by the merchant&apos;s delivery staff or at the merchant&apos;s checkout counter upon physical handover and inspection of goods.
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Direct Merchant UPI / QR:</Text> Payments made via UPI QR codes are transferred directly from the customer&apos;s banking app to the merchant&apos;s registered UPI VPA. No funds are held in escrow or settled by JRINA Private Limited for retail merchandise purchases.
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>In-Store Counter Purchases:</Text> Direct point-of-sale transactions where discounts are applied by scanning the shopper&apos;s Digital ID Pass are settled directly at the counter.
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 3: Consumer Order Cancellation */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>
                <Text style={styles.sectionHeading}>Order Cancellation by Consumer</Text>
              </View>
              <View style={styles.listContainer}>
                {[
                  "Cancellation Prior to Merchant Dispatch: You may cancel an order free of charge before the merchant packs, prepares (for perishable/food items), or dispatches the order by messaging the store via In-App Store Chat or contacting their listed phone number.",
                  "Cancellation After Dispatch: Once an order has been dispatched for delivery by the merchant's staff, cancellation is subject to the individual merchant's store return policy.",
                  "Perishable & Custom Goods: Fresh food, groceries, perishable dairy, or customized items cannot be cancelled once preparation has commenced.",
                  "Zero Advance Deduction: Because retail purchases on SmartShopper are fulfilled via COD or direct merchant payment, consumers face no automatic card deductions upon order placement."
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 4: Damaged, Defective, or Incorrect Items */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>Damaged, Missing, or Defective Products</Text>
              </View>
              <Text style={styles.sectionLead}>
                Consumers have full statutory protection under the Consumer Protection Act, 2019, and the Consumer Protection (E-Commerce) Rules, 2020. In the event of:
              </Text>
              <View style={styles.listContainer}>
                {[
                  "Damaged, tampered, or broken merchandise received upon delivery.",
                  "Incorrect items or missing quantities compared to the order summary.",
                  "Expired products or goods failing stated merchant specifications."
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>{item}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.sectionLead, { marginTop: 8 }]}>
                Consumers should immediately decline delivery for COD packages or notify the merchant via In-App Chat within 24 hours of receipt. Partner Merchants are legally obligated to replace defective goods or issue an immediate refund through the original payment channel.
              </Text>
            </View>

            {/* Section 5: Promotional Vouchers & Discount Claims */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>5</Text>
                </View>
                <Text style={styles.sectionHeading}>Promotional Vouchers & Claimed Deals</Text>
              </View>
              <View style={styles.listContainer}>
                {[
                  "Vouchers and coupons claimed within SmartShopper are promotional discounts and have no monetary or cash redemption value.",
                  "Claiming a voucher is completely free for consumers and does not incur any charge.",
                  "Expired or unredeemed vouchers cannot be refunded or exchanged for cash.",
                  "If a partner merchant wrongfully refuses to honor an active, validly claimed voucher within its stated expiration window, please report the incident to our Grievance Desk at info@jrina.online for immediate merchant compliance review."
                ].map((item, idx) => (
                  <View key={idx} style={styles.dotItem}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dotText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 6: Platform Subscriptions & Merchant SaaS Billing */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>6</Text>
                </View>
                <Text style={styles.sectionHeading}>Platform Fees & Merchant Subscriptions</Text>
              </View>
              <Text style={styles.sectionLead}>
                While the SmartShopper Consumer app is 100% free for shoppers, JRINA Private Limited provides optional paid SaaS subscriptions and workstation tools to Partner Merchants (via the SSM platform) processed via certified payment aggregators (Cashfree Payments):
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Duplicate or Failed Billing:</Text> Any inadvertent duplicate debit or failed transaction where funds were deducted is automatically initiated for refund within 48 hours and credited within 5-7 business days.
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <CheckCircle2 size={16} color="#10B981" style={styles.bulletIcon} />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.bold}>Billing Disputes:</Text> Paid service subscribers may dispute charges within 7 business days of billing by emailing info@jrina.online.
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 7: Grievance Escalation & Contact */}
            <View style={[styles.sectionBlock, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>7</Text>
                </View>
                <Text style={styles.sectionHeading}>Grievance Redressal & Support Desk</Text>
              </View>
              <Text style={styles.sectionLead}>
                If you encounter any unresolved merchant dispute, incorrect billing record, or fulfillment concern, our consumer support team is here to help mediate:
              </Text>

              <View style={styles.contactGrid}>
                {/* Office */}
                <View style={styles.contactItem}>
                  <Building2 size={20} color="#EA580C" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>OPERATING COMPANY & REGISTERED OFFICE</Text>
                    <Text style={styles.contactTitle}>JRINA Private Limited</Text>
                    <Text style={styles.contactDesc}>
                      Peringammala, Palode, Nedumangad, Thiruvananthapuram, Kerala, India - 695562
                    </Text>
                  </View>
                </View>

                {/* Email */}
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => handleOpenEmail("Refund & Order Dispute - SmartShopper")}
                  activeOpacity={0.7}
                >
                  <Mail size={20} color="#EA580C" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>REFUNDS & GRIEVANCES</Text>
                    <Text style={[styles.contactTitle, styles.accentColor]}>info@jrina.online</Text>
                    <Text style={styles.contactDesc}>Average response within 24-48 business hours</Text>
                  </View>
                </TouchableOpacity>

                {/* Helpline */}
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={handleOpenPhone}
                  activeOpacity={0.7}
                >
                  <Phone size={20} color="#10B981" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSmall}>CUSTOMER SUPPORT HELPLINE / WHATSAPP</Text>
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

          {/* Bottom Back Button */}
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
