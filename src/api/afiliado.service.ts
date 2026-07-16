import axios from "axios";

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

export interface Benefit {
  id: number;
  name: string;
  description: string | null;
  minMonthsActive: number | null;
  maxMonthsActive: number | null;
  freeDescription: string | null;
}

export interface AfiliadoPublicData {
  affiliate: {
    id: number;
    firstName: string;
    lastName: string;
    documentNumber: string;
    birthDate: string;
    isHolder: boolean;
    familiarGroupId: number;
    createdAt: string;
  };
  group: {
    id: number;
    name: string;
    holderFullName: string;
    isActive: boolean;
    chargeDay: number;
    planStatus: string;
    gracePeriodEndsAt: string | null;
    createdAt: string;
    plan: {
      id: number;
      name: string;
      monthlyFee: number | string;
      gracePeriodDays: number;
      benefits: Benefit[];
    } | null;
    affiliates: Array<{
      id: number;
      firstName: string;
      lastName: string;
      documentNumber: string;
      birthDate: string;
      isHolder: boolean;
      createdAt: string;
    }>;
    currentAccount: {
      balanceCapital: number | string;
      balanceInterest: number | string;
      advanceBalance: number | string;
    } | null;
    paymentMethods: Array<{
      id: number;
      type: string;
      last4: string | null;
      brand: string | null;
      priority: number;
      gateway: string;
    }>;
    billingPeriods: Array<{
      id: number;
      month: number;
      year: number;
      status: string;
      amountDue: number | string;
      dueDate: string;
    }>;
  };
}

export interface PayDeudaCardPayload {
  gateway: string;
  type: string;
  priority: number;
  cardNumber?: string;
  cvv?: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  documentNumber?: string;
  deviceFingerprintId?: string;
  paywayPaymentMethodId?: number;
  brand?: string;
}

export interface PayDeudaRequest {
  billingPeriodIds: number[];
  existingPaymentMethodId?: number;
  paymentMethod?: PayDeudaCardPayload;
}

export interface PayDeudaResult {
  billingPeriodId: number;
  month: number;
  year: number;
  amountDue: number;
  success: boolean;
  result: string;
  failureMessage: string | null;
}

export interface PayDeudaResponse {
  results: PayDeudaResult[];
  newPaymentMethodId?: number;
  totalCharged: number;
}

export async function pagarDeuda(
  dni: string,
  payload: PayDeudaRequest,
): Promise<PayDeudaResponse> {
  const { data } = await publicClient.post<PayDeudaResponse>(
    `/public/afiliado/${dni}/pagar`,
    payload,
  );
  return data;
}

/**
 * Fetch public affiliate data.
 * @param recaptchaToken Optional reCAPTCHA v2 token from the search form.
 *   When present it is validated server-side. Absent on direct URL access
 *   (QR scan, shared link) — rate limiting is the fallback protection.
 */
export async function getAfiliadoByDni(
  dni: string,
  recaptchaToken?: string,
): Promise<AfiliadoPublicData> {
  const headers: Record<string, string> = {};
  if (recaptchaToken) {
    headers["x-recaptcha-token"] = recaptchaToken;
  }

  const { data } = await publicClient.get<AfiliadoPublicData>(
    `/public/afiliado/${dni}`,
    { headers },
  );
  return data;
}
