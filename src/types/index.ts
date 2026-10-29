export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OfferItem {
  id: string;
  storeId?: string;
  storeName: string;
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
}

export interface CartItem {
  product: CatalogItem;
  quantity: number;
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
  logoUrl?: string;
  distanceInMeters?: number;
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
  MainTabs: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  RefundPolicy: undefined;
  Vouchers: undefined;
};

