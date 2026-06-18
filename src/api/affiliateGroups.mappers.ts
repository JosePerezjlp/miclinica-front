import type {
  AutomaticAffiliateGroupFormData,
  CashAffiliateGroupFormData,
  CashMember,
  CreateAffiliateRequest,
  CreateGroupRequest,
  CreateGroupPaymentMethodRequest,
  CreateManualPaymentRequest,
  PaymentGatewayProvider,
} from "../features/AffiliateGroups/AffiliateGroups.types";

function toDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeManualPaymentCreatedBy(value?: string): string {
  const normalized = value?.trim();
  return normalized || "La clinica";
}

function buildAutomaticFallbackEmail(input: {
  firstName: string;
  lastName: string;
  documentNumber?: string;
}): string {
  const normalizedName = `${input.firstName.trim()}${input.lastName.trim()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  const normalizedDocument = toDigits(input.documentNumber ?? "");
  const identifier = normalizedDocument || normalizedName || "titular";

  return `pagos+${identifier}@miclinica.local`;
}

export function mapCashMemberToAffiliateRequest(
  member: CashMember,
  isHolder = false,
): CreateAffiliateRequest {
  const parsedBirthDate = new Date(member.birthDate);

  return {
    firstName: member.firstName.trim(),
    lastName: member.lastName.trim(),
    documentNumber: toDigits(member.dni),
    birthDate:
      member.birthDate && !Number.isNaN(parsedBirthDate.getTime())
        ? parsedBirthDate.toISOString()
        : member.birthDate,
    address: member.address.trim() || undefined,
    email: member.email.trim() || undefined,
    phone: member.phone.trim() || undefined,
    isHolder,
  };
}

export function mapCashFormToAffiliateRequests(
  payload: CashAffiliateGroupFormData,
): CreateAffiliateRequest[] {
  return payload.members.map((member, index) =>
    mapCashMemberToAffiliateRequest(member, index === 0),
  );
}

export function mapAutomaticFormToPaymentMethodRequest(input: {
  gateway: PaymentGatewayProvider;
  paymentMethod: "card" | "cbu";
  priority?: number;
  cbu?: string;
  cardNumber?: string;
  cardMonth?: string;
  cardYear?: string;
  cardCvv?: string;
  firstName: string;
  lastName: string;
  documentNumber?: string;
  deviceFingerprintId?: string;
  paywayPaymentMethodId?: number;
}): CreateGroupPaymentMethodRequest {
  if (input.gateway === "MOBBEX") {
    return {
      gateway: input.gateway,
      type: "CARD",
      priority: input.priority ?? 1,
      holderName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
      documentNumber: input.documentNumber
        ? toDigits(input.documentNumber)
        : undefined,
    };
  }

  if (input.paymentMethod === "cbu") {
    return {
      gateway: input.gateway,
      type: "CBU",
      priority: input.priority ?? 1,
      rawToken: toDigits(input.cbu ?? ""),
      holderName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
      brand: "CBU",
      documentNumber: input.documentNumber
        ? toDigits(input.documentNumber)
        : undefined,
    };
  }

  const expiryMonth = Number.parseInt(input.cardMonth ?? "", 10);
  const rawYear = Number.parseInt(input.cardYear ?? "", 10);
  const expiryYear = rawYear < 100 ? 2000 + rawYear : rawYear;
  const cardNumber = toDigits(input.cardNumber ?? "");
  const cardCvv = toDigits(input.cardCvv ?? "");

  return {
    gateway: input.gateway,
    type: "CARD",
    priority: input.priority ?? 1,
    cardNumber,
    cvv: cardCvv,
    expiryMonth,
    expiryYear,
    holderName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
    last4: cardNumber.slice(-4),
    documentNumber: input.documentNumber
      ? toDigits(input.documentNumber)
      : undefined,
    deviceFingerprintId: input.deviceFingerprintId?.trim() || undefined,
    paywayPaymentMethodId: input.paywayPaymentMethodId,
  };
}

export function buildCashSandboxPayment(input: {
  amount: number;
  amountDue?: number;
  discountAmount?: number;
  discountReason?: string;
  createdBy?: string;
  reference?: string;
  notes?: string;
  paidAt?: string;
}): CreateManualPaymentRequest {
  return {
    amount: input.amount,
    amountDue: input.amountDue,
    discountAmount: input.discountAmount,
    discountReason: input.discountReason,
    method: "CASH",
    createdBy: normalizeManualPaymentCreatedBy(input.createdBy),
    reference: input.reference,
    notes: input.notes,
    paidAt: input.paidAt ?? new Date().toISOString(),
  };
}

export function mapAutomaticFormToCreateGroupRequest(
  payload: AutomaticAffiliateGroupFormData,
): CreateGroupRequest {
  const holderFirstName = payload.firstName.trim();
  const holderLastName = payload.lastName.trim();
  const holderFullName = `${holderFirstName} ${holderLastName}`.trim();

  return {
    name: holderLastName
      ? `${holderLastName} Family`
      : `${holderFirstName} Group`,
    holderFullName,
    planId: payload.planId,
    planName: payload.gateway === "MOBBEX" ? payload.plan : undefined,
    affiliates: [
      {
        firstName: holderFirstName,
        lastName: holderLastName,
        documentNumber: toDigits(payload.dni),
        birthDate: new Date().toISOString(),
        isHolder: true,
      },
    ],
    paymentMethod: mapAutomaticFormToPaymentMethodRequest({
      gateway: payload.gateway,
      paymentMethod: payload.paymentMethod,
      priority: 1,
      cbu: payload.cbu,
      cardNumber: payload.cardNumber,
      cardMonth: payload.cardMonth,
      cardYear: payload.cardYear,
      cardCvv: payload.cardCvv,
      firstName: payload.firstName,
      lastName: payload.lastName,
      documentNumber: payload.dni,
      deviceFingerprintId: payload.deviceFingerprintId,
      paywayPaymentMethodId: payload.paywayPaymentMethodId,
    }),
  };
}

export { buildAutomaticFallbackEmail };

export function mapCashFormToCreateGroupRequest(
  payload: CashAffiliateGroupFormData,
): CreateGroupRequest {
  const holder = payload.members[0];
  const holderFullName = holder
    ? `${holder.firstName.trim()} ${holder.lastName.trim()}`.trim()
    : "Cash Group";

  return {
    name: holder?.lastName?.trim()
      ? `${holder.lastName.trim()} Family`
      : "Cash Group",
    holderFullName,
    planId: payload.planId,
    promoterId: payload.promoterId,
    cityId: payload.cityId,
    affiliates: mapCashFormToAffiliateRequests(payload),
    initialManualPayment:
      Number(payload.paidAmount ?? 0) > 0
        ? buildCashSandboxPayment({
            amount: Number(payload.paidAmount),
            amountDue: Number(payload.planAmount ?? 0),
            discountAmount: Number(payload.discountAmount ?? 0),
            discountReason:
              Number(payload.discountAmount ?? 0) > 0
                ? payload.discountReason?.trim() ||
                  `Bonificación inicial del plan ${payload.plan}`
                : undefined,
            createdBy: payload.seller,
            notes: `Pago manual inicial en efectivo del plan ${payload.plan}`,
          })
        : undefined,
  };
}
