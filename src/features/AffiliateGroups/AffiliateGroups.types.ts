export type AffiliateStatus = "active" | "suspended" | "no-coverage";

export type PaymentMode = "automatic" | "cash";
export type PaymentGatewayProvider = "SIRO" | "PAYWAY" | "MOBBEX";
export type PaymentMethodType = "CARD" | "CBU";
export type ManualPaymentMethod = "CARD" | "CASH" | "TRANSFER";

export interface AffiliateGroupsRow {
  id: number;
  groupName: string;
  titular: string;
  inscriptionDate: string;
  dni: string;
  phone: string;
  plan: string;
  status: AffiliateStatus;
  paymentMethod: "card" | "cbu" | "cash";
  paidMonths: string[];
}

export interface CashMember {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  dni: string;
  address: string;
  email: string;
  phone: string;
  inscriptionDate: string;
}

export interface AutomaticAffiliateGroupFormData {
  mode: "automatic";
  gateway: PaymentGatewayProvider;
  plan: string;
  planId?: number;
  mobbexSubscriptionId: string;
  mobbexWebhook?: string;
  paymentMethod: "card" | "cbu";
  cbu: string;
  cardNumber: string;
  cardMonth: string;
  cardYear: string;
  cardCvv: string;
  firstName: string;
  lastName: string;
  dni: string;
  deviceFingerprintId: string;
}

export interface CashAffiliateGroupFormData {
  mode: "cash";
  promoterId?: number;
  promoterName?: string;
  seller?: string;
  plan: string;
  planId?: number;
  planAmount?: number;
  paidAmount?: number;
  discountAmount?: number;
  discountReason?: string;
  city: string;
  cityId?: number | null;
  members: CashMember[];
}

export type CreateAffiliateGroupModalPayload =
  | AutomaticAffiliateGroupFormData
  | CashAffiliateGroupFormData;

export interface CreateAffiliateRequest {
  firstName: string;
  lastName: string;
  documentNumber: string;
  birthDate: string;
  address?: string;
  email?: string;
  phone?: string;
  isHolder?: boolean;
}

export interface CreateGroupRequest {
  name?: string;
  holderFullName?: string;
  planId?: number;
  promoterId?: number;
  cityId?: number | null;
  planName?: string;
  affiliates: CreateAffiliateRequest[];
  paymentMethod?: CreateGroupPaymentMethodRequest;
  initialManualPayment?: CreateManualPaymentRequest;
}

export interface GroupResponse {
  id: number;
  name: string;
  holderFullName: string;
  planId?: number | null;
  promoterId?: number | null;
  cityId?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  promoter?: {
    id: number;
    name: string;
    percentage: number | string;
    isActive: boolean;
    isInternal: boolean;
  } | null;
  city?: {
    id: number;
    name: string;
    code: string;
  } | null;
  plan?: {
    id?: number;
    name: string;
  } | null;
  planStatus?: string | null;
  affiliates: Array<{
    id: number;
    firstName: string;
    lastName: string;
    documentNumber: string;
    birthDate: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    isHolder: boolean;
    isActive: boolean;
  }>;
  paymentMethods: Array<{
    id: number;
    gateway: PaymentGatewayProvider;
    type: PaymentMethodType;
    priority: number;
    last4?: string | null;
    brand?: string | null;
    holderName?: string | null;
    expiresAt?: string | null;
  }>;
  initialCharge?: {
    executed: boolean;
    skippedReason?: string;
    billingPeriodId?: number;
    amountDue?: number;
    success?: boolean;
    attemptId?: number;
    result?: string;
  };
}

export interface FamiliarGroupsFilters {
  page?: number;
  pageSize?: number;
  dni?: string;
  paymentType?: "all" | "card" | "cbu" | "cash";
}

export interface FamiliarGroupsPaginatedResponse {
  items: GroupResponse[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface MobbexSubscriptionSummary {
  uid: string;
  name: string;
  description: string;
  type: string;
  status: string;
  total: number;
  currency: string;
  interval: string;
  returnUrl: string;
  webhook: string;
  test: boolean;
}

export interface MobbexGroupSubscriberResponse {
  result: boolean;
  code?: string;
  error?: string;
  subscriptionId: string;
  subscriberUid?: string;
  sourceUrl?: string;
}

export interface CreateGroupSubmitResult {
  group: GroupResponse;
  mobbexSourceUrl?: string;
}

export interface UpdateAffiliateRequest {
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  birthDate?: string;
  address?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CreateGroupPaymentMethodRequest {
  gateway: PaymentGatewayProvider;
  type: PaymentMethodType;
  priority: number;
  rawToken?: string;
  cardNumber?: string;
  cvv?: string;
  expiryMonth?: number;
  expiryYear?: number;
  last4?: string;
  brand?: string;
  holderName?: string;
  documentNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  deviceFingerprintId?: string;
}

export interface GroupPaymentMethodResponse {
  id: number;
  familiarGroupId: number;
  gateway: PaymentGatewayProvider;
  type: PaymentMethodType;
  priority: number;
  isActive: boolean;
  last4?: string | null;
  brand?: string | null;
  holderName?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PaymentAttemptResponse {
  id: number;
  billingPeriodId: number;
  groupPaymentMethodId: number;
  gateway: PaymentGatewayProvider;
  attemptNumber: number;
  scheduledAt: string;
  executedAt?: string | null;
  result: string;
  gatewayTransactionId?: string | null;
  gatewayResponse?: Record<string, unknown> | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  amountCharged?: string | number | null;
  createdAt: string;
}

export interface CreateManualPaymentRequest {
  amount: number;
  billingPeriodId?: number;
  amountDue?: number;
  discountAmount?: number;
  discountReason?: string;
  method: ManualPaymentMethod;
  paidAt: string;
  createdBy?: string;
  reference?: string;
  notes?: string;
}

export interface ManualPaymentResponse {
  id: number;
  familiarGroupId: number;
  amount: string | number;
  method: ManualPaymentMethod;
  paidAt: string;
  createdBy: string;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SettleDebtRequest {
  amount: number;
  discountAmount?: number;
  discountReason?: string;
  method: ManualPaymentMethod;
  paidAt: string;
  createdBy?: string;
  reference?: string;
  notes?: string;
}
