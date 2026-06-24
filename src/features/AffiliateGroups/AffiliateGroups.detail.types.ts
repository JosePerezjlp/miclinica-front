export interface GroupDetailData {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  holderFullName: string;
  isActive: boolean;
  chargeDay: number;
  planId: number | null;
  promoterId: number | null;
  planStatus: string;
  gracePeriodEndsAt: string | null;
  rating: string;
  ratingUpdatedAt: string | null;
  promoter: {
    id: number;
    createdAt: string;
    updatedAt: string;
    name: string;
    percentage: number;
    isActive: boolean;
    isInternal: boolean;
  } | null;
  plan: {
    id: number;
    name: string;
    monthlyFee: number;
    gracePeriodDays: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  paymentMethods: Array<{
    id: number;
    createdAt: string;
    updatedAt: string;
    gateway: string;
    type: string;
    priority: number;
    isActive: boolean;
    last4: string | null;
    brand: string | null;
    holderName: string | null;
    expiresAt: string | null;
    deletedAt: string | null;
  }>;
  affiliates: Array<{
    id: number;
    createdAt: string;
    updatedAt: string;
    familiarGroupId: number;
    firstName: string;
    lastName: string;
    documentNumber: string;
    birthDate: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    isHolder: boolean;
    isVerified: boolean;
  }>;
  billingPeriods: Array<{
    id: number;
    createdAt: string;
    updatedAt: string;
    familiarGroupId: number;
    month: number;
    year: number;
    dueDate: string;
    amountDue: number;
    status: string;
    attempts: Array<{
      result: string;
      failureCode: string | null;
      failureMessage: string | null;
      gateway: string;
    }>;
  }>;
  payments: Array<{
    id: number;
    createdAt: string;
    updatedAt: string;
    familiarGroupId: number;
    amount: number;
    month: number;
    year: number;
    status: string;
    gateway: string;
    gatewayTransactionId: string | null;
    billingPeriodId: number | null;
    chargeAttemptId: number | null;
  }>;
  manualPayments: Array<{
    id: number;
    familiarGroupId: number;
    billingPeriodId?: number | null;
    amount: number;
    method: string;
    paidAt: string;
    month: number;
    year: number;
    reference: string | null;
    notes: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }>;
  currentAccount: {
    id: number;
    familiarGroupId: number;
    balanceCapital: number;
    balanceInterest: number;
    advanceBalance: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  discounts: Array<{
    id: number;
    familiarGroupId: number;
    billingPeriodId: number | null;
    type: string;
    amount: number;
    reason: string | null;
    appliedBy: string;
    createdAt: string;
  }>;
}

export interface GroupDetailState {
  data: GroupDetailData | null;
  loading: boolean;
  error: string | null;
}

export interface UpdateGroupInfoPayload {
  name?: string;
  holderFullName?: string;
  isActive?: boolean;
  chargeDay?: number;
}

export interface AddAffiliatePayload {
  firstName: string;
  lastName: string;
  documentNumber: string;
  birthDate: string;
  address?: string;
  email?: string;
  phone?: string;
  isHolder?: boolean;
}

export interface UpdateAffiliatePayload {
  id: number;
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  birthDate?: string;
  address?: string;
  email?: string;
  phone?: string;
  isVerified?: boolean;
}

export interface AddPaymentMethodPayload {
  gateway: string;
  type: string;
  priority?: number;
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
  mobbexSubscriptionId?: string;
  mobbexWebhook?: string;
  chargePendingNow?: boolean;
  amountDue?: number;
}

export interface UpdatePaymentMethodPayload {
  id: number;
  priority?: number;
  isActive?: boolean;
}

export interface UpdatePlanPayload {
  planId?: number;
  planStatus?: string;
}
