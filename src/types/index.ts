export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OfferItem {
  id: string;
  storeId?: string;
  storeName: string;
  title?: string;
  category: string;
  discountTag: string;
  originalPrice: string;
  offerPrice: string;
  distanceInMeters?: number;
  expiresAt: string;
  expiresInMinutes?: number;
  verifiedBillReviewsCount?: number;
  priceFairnessScore?: number;
  imageUrl: string;
  mapCoords?: { x: number; y: number };
  isHotspot?: boolean;
  couponCode?: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  operatingHours?: string;
  storeDescription?: string;
  storeImageUrl?: string;
  storeCoverImageUrl?: string;
  dealTargetType?: "STORE" | "PRODUCT";
  targetProductId?: string;
  startAt?: string;
  endAt?: string;
  expiryDurationType?: "PRESET" | "CUSTOM";
  offerPercentage?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  isPro?: boolean;
  isRecommended?: boolean;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  originalPrice: string;
  offerPrice: string;
  imageUrl: string;
  inStock: boolean;
  sku?: string;
  description?: string;
  storeId?: string;
  storeName?: string;
  distanceInMeters?: number;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface CartItem {
  product: CatalogItem;
  quantity: number;
  isUnavailable?: boolean;
  unavailableReason?: string;
}

export type CustomerOrderStatus =
  | "PENDING_MERCHANT_ACCEPTANCE"
  | "MERCHANT_ACCEPTED"
  | "MERCHANT_REJECTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "DELIVERY_ASSIGNED"
  | "DELIVERY_ACCEPTED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "pending"
  | "received"
  | "confirmed"
  | "preparing"
  | "ready"
  | "ready_for_pickup"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export type CustomerOrderPaymentMethod = "cod" | "prepaid";
export type CustomerOrderPaymentStatus = "pending" | "paid" | "collected" | "refund_pending" | "refunded" | "failed";
export type OtpVerificationStatus = "pending" | "verified" | "expired";

export interface CustomerOrderProductSnapshot {
  id: string;
  productId?: string;
  name: string;
  category?: string;
  originalPrice?: string;
  offerPrice: string;
  imageUrl: string;
  quantity: number;
  sku?: string;
  isDeleted?: boolean;
  replacementEligible?: boolean;
  replacementPolicy?: string;
  preparedQuantity?: number;
  isReady?: boolean;
  isCancelled?: boolean;
  replacementStatus?: "none" | "proposed" | "accepted" | "rejected";
  replacementTitle?: string;
  replacementPrice?: number;
  replacementReason?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  customerId?: string;
  items: CustomerOrderProductSnapshot[];
  itemSubtotal: number;
  roadDistanceKm: number;
  deliveryCharge: number;
  platformFee: number;
  totalCodAmount: number;
  deliveryOption?: "pickup" | "delivery";
  status: CustomerOrderStatus;
  paymentMethod: CustomerOrderPaymentMethod;
  paymentStatus: CustomerOrderPaymentStatus;
  deliveryAddress: DeliveryAddress;
  otp: string;
  otpVerified: boolean;
  otpStatus: OtpVerificationStatus;
  createdAt: string;
  receivedAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  idempotencyKey?: string;
  isPrepaid?: boolean;
  deliveryPartner?: {
    id: string;
    name: string;
    phone: string;
    vehicle_type?: string;
    vehicle_reg_number?: string;
    vehicleNumber?: string;
    rating?: number;
    status?: string;
  };
  history?: Array<{
    previous_status?: string;
    new_status: string;
    actor_type: string;
    reason?: string;
    created_at: string;
  }>;
  replacementRequested?: boolean;
  replacementStatus?: "requested" | "under_review" | "approved" | "rejected" | "completed";
  replacementReason?: string;
  replacementRequestedAt?: string;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  houseDetails: string;
  streetArea: string;
  city: string;
  district: string;
  pincode: string;
  addressType: "Home" | "Work" | "Other";
  lat?: number;
  lng?: number;
  landmark?: string;
}

export interface StoreProfile {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  operatingHours: string;
  radarRadiusMeters?: number;
  lat: number;
  lng: number;
  priceFairnessScore?: number;
  verifiedBillsCount?: number;
  description?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  distanceInMeters?: number; // Air distance via Haversine (strictly used for 5km geofencing)
  roadDistanceInMeters?: number; // Actual road distance via Valhalla
  roadDurationMinutes?: number; // Estimated driving duration in minutes
  roadDistanceFormatted?: string; // Formatted road distance string e.g. "5.8 km by road"
}

export interface NavigationManeuver {
  instruction: string;
  type: number;
  distanceMeters: number;
  timeSeconds: number;
  beginShapeIndex: number;
  endShapeIndex: number;
  streetName?: string;
  iconType:
    | "straight"
    | "left"
    | "right"
    | "slight-left"
    | "slight-right"
    | "sharp-left"
    | "sharp-right"
    | "u-turn"
    | "roundabout"
    | "destination"
    | "depart";
}

export interface NavigationRouteData {
  origin: Coordinates;
  destination: Coordinates;
  coordinates: [number, number][]; // [lat, lng]
  distanceKm: number;
  distanceMeters: number;
  durationMinutes: number;
  formattedDistance: string;
  formattedDuration: string;
  etaTimestamp: string;
  maneuvers: NavigationManeuver[];
  status: "OK" | "FALLBACK" | "FAILED";
  distanceType?: "ROAD_DISTANCE" | "STRAIGHT_LINE_DISTANCE" | "ROUTING_UNAVAILABLE";
  provider?: "FOSSGIS_VALHALLA" | "FOSSGIS_OSRM" | "PROJECT_OSRM" | "HAVERSINE_FALLBACK";
}

export interface VoucherDetails {
  id?: string;
  code: string;
  offerId: string;
  storeName: string;
  discountTag: string;
  originalPrice: string;
  offerPrice: string;
  customerName: string;
  customerPhone: string;
  claimedAt: string;
  expiresAt?: string;
  isRedeemed: boolean;
  redeemedAt?: string;
}

export interface UserSession {
  id: string;
  customerId: string;
  username?: string;
  email?: string;
  name: string;
  phone: string;
  isVerified?: boolean;
  avatarInitials?: string;
  role?: string;
  address?: DeliveryAddress;
  referralCode?: string;
  referredBy?: string;
}

export interface BillItem {
  id?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  storeId?: string;
  storeName?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  status?: string;
  items?: BillItem[];
}

export interface DealNotification {
  id: string;
  storeName: string;
  discountTag: string;
  description: string;
  receivedAt: string;
  isRead: boolean;
  offerId?: string;
  offer?: OfferItem;
  storeId?: string;
  type?: "deal" | "chat";
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "store";
  text: string;
  timestamp: string;
  read?: boolean;
  sender_id?: string;
  customer_id?: string;
}

export interface ChatThread {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  unreadCount?: number;
  lastMessage?: string;
  lastTimestamp?: string;
  messages: ChatMessage[];
}

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: { screen?: string } | undefined;
  OrderDetails: { orderId: string };
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  RefundPolicy: undefined;
  Vouchers: undefined;
  ProductDetails: {
    productId: string;
    product?: CatalogItem;
  };
  Cart: undefined;
  Wishlist: undefined;
  ForgotPassword: undefined;
  ResetPassword: { url?: string; token?: string; type?: string } | undefined;
};

export interface SscBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkType: "store" | "deal" | "category" | "custom_url" | "none";
  targetId?: string;
  targetName?: string;
  customUrl?: string;
  displayOrder: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  clicksCount?: number;
  impressionsCount?: number;
}


