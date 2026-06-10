export type TransactionKind =
  | "DEBIT_CAPITAL"
  | "DEBIT_INTEREST"
  | "CREDIT_PAYMENT_AUTO"
  | "CREDIT_PAYMENT_MANUAL"
  | "CREDIT_ADVANCE"
  | "CREDIT_DISCOUNT";

export type BillingStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PARTIAL"
  | "PAID"
  | "FAILED"
  | "EXEMPT";
export type ChargeAttemptResult =
  | "SUCCESS"
  | "FAILED_INSUFFICIENT_FUNDS"
  | "FAILED_CARD_EXPIRED"
  | "FAILED_CARD_BLOCKED"
  | "FAILED_CBU_INVALID"
  | "FAILED_GATEWAY_TIMEOUT"
  | "FAILED_GATEWAY_ERROR"
  | "FAILED_TOKEN_INVALID"
  | "SKIPPED";

export type PaymentGateway = "SIRO" | "PAYWAY" | "MOBBEX";
export type ManualPaymentMethod = "CARD" | "CASH" | "TRANSFER";
export type DebtFilter = "debe" | "no_debe";

export interface ChargeAttempt {
  id: number;
  gateway: PaymentGateway;
  attemptNumber: number;
  result: ChargeAttemptResult;
  scheduledAt: string;
  executedAt?: string | null;
  amountCharged?: string | null;
  failureMessage?: string | null;
}

export interface BillingPeriodData {
  id: number;
  month: number;
  year: number;
  amountDue: string;
  status: BillingStatus;
}

export interface ManualPaymentData {
  id: number;
  amount: string;
  method: ManualPaymentMethod;
  paidAt: string;
  createdBy: string;
  reference?: string | null;
}

export interface DiscountData {
  id: number;
  amount: string;
  type: string;
  appliedBy: string;
  reason?: string | null;
  createdAt: string;
}

export interface FamiliarGroupData {
  id: number;
  name: string;
  holderFullName: string;
  promoterId?: number | null;
  promoter?: {
    id: number;
    name: string;
  } | null;
  cityId?: number | null;
  city?: {
    id: number;
    name: string;
    code: string;
  } | null;
  chargeDay?: number | null;
}

export interface TransactionDetail {
  id: number;
  createdAt: string;
  kind: TransactionKind;
  amountCapital: string;
  amountInterest: string;
  description?: string | null;
  familiarGroup: FamiliarGroupData;
  billingPeriod?: BillingPeriodData | null;
  manualPayment?: ManualPaymentData | null;
  discount?: DiscountData | null;
  chargeAttempts?: ChargeAttempt[];
}

export interface AuditTransactionsResponse {
  data: TransactionDetail[];
  total: number;
}

export interface AuditSummaryByGroup {
  familiarGroupId: number;
  familiarGroupName: string;
  promoterId?: number | null;
  promoterName?: string | null;
  transactions: number;
  totalDebit: string;
  totalCredit: string;
}

export interface AuditSummary {
  totalTransactions: number;
  totalDebit: string;
  totalCredit: string;
  totalBonification: string;
  failedAttempts: number;
  successAttempts: number;
  periodStart: string;
  periodEnd: string;
  byFamiliarGroup: AuditSummaryByGroup[];
}

export interface AuditFiltersData {
  familiarGroupId?: number;
  promoterId?: number;
  month?: number;
  year?: number;
  cityId?: number;
  debtFilter?: DebtFilter;
  chargeDayRange?: string;
}

export type AuditView = "transactions" | "summary";
