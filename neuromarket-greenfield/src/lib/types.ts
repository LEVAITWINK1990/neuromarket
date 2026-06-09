export type UserRole = "BUYER" | "SELLER" | "ADMIN";
export type ProductType =
  | "LICENSE_KEY"
  | "VOUCHER_CODE"
  | "DIGITAL_FILE"
  | "MANUAL_DELIVERY"
  | "SERVICE"
  | "AFFILIATE_OFFER";
export type DeliveryType = "INSTANT" | "MANUAL" | "EXTERNAL_LINK";
export type ProductStatus = "PUBLISHED" | "PENDING_REVIEW" | "SUSPENDED";
export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "DELIVERED" | "COMPLETED" | "DISPUTED";
export type VerificationStatus = "NOT_REQUESTED" | "PENDING" | "APPROVED";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isBanned?: boolean;
  sellerId?: string;
  isEmailVerified: boolean;
};

export type DemoSeller = {
  id: string;
  displayName: string;
  country: string;
  rating: number;
  bio: string;
  verified: boolean;
  pendingBalance: number;
  availableBalance: number;
  withdrawnBalance: number;
  responseTime: string;
};

export type DemoCategory = {
  id: string;
  slug: string;
  label: string;
  teaser: string;
  accent: string;
};

export type DemoProduct = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice: number;
  rating: number;
  ratingCount: number;
  salesCount: number;
  sellerId: string;
  categoryId: string;
  productType: ProductType;
  deliveryType: DeliveryType;
  status: ProductStatus;
  verified: boolean;
  smart: boolean;
  coverage: string;
  validity: string;
  refundPolicy: string;
  termsOfUse: string;
  whatYouReceive: string[];
  faq: { question: string; answer: string }[];
  cover: {
    from: string;
    via: string;
    to: string;
    glyph: string;
    eyebrow: string;
  };
};

export type DemoOrder = {
  id: string;
  productId: string;
  buyerId: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  deliveredAsset: string;
  deliveryHint: string;
};

export type DemoDispute = {
  id: string;
  orderId: string;
  buyerId: string;
  createdAt: string;
  reason: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
};

export type DemoPayout = {
  id: string;
  sellerId: string;
  amount: number;
  method: string;
  status: "REQUESTED" | "PROCESSING" | "PAID";
  createdAt: string;
};

export type DemoVerificationRequest = {
  id: string;
  sellerId: string;
  note: string;
  status: VerificationStatus;
  createdAt: string;
};

export type DemoStoreShape = {
  currentUser: DemoUser | null;
  wishlist: string[];
  compare: string[];
  orders: DemoOrder[];
  disputes: DemoDispute[];
  customProducts: DemoProduct[];
  payouts: DemoPayout[];
  verifications: DemoVerificationRequest[];
};
