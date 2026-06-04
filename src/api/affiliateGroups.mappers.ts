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
  cardType?: string;
  documentNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  deviceFingerprintId?: string;
}): CreateGroupPaymentMethodRequest {
  if (input.gateway === "MOBBEX") {
    return {
      gateway: input.gateway,
      type: "CARD",
      priority: input.priority ?? 1,
      holderName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
      brand: input.cardType,
      documentNumber: input.documentNumber
        ? toDigits(input.documentNumber)
        : undefined,
      email: input.email?.trim() || undefined,
      address: input.address?.trim() || undefined,
      city: input.city?.trim() || undefined,
      province: input.province?.trim() || undefined,
      postalCode: input.postalCode?.trim() || undefined,
      phone: input.phone ? toDigits(input.phone) : undefined,
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
      email: input.email?.trim() || undefined,
      address: input.address?.trim() || undefined,
      city: input.city?.trim() || undefined,
      province: input.province?.trim() || undefined,
      postalCode: input.postalCode?.trim() || undefined,
      phone: input.phone ? toDigits(input.phone) : undefined,
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
    brand: input.cardType,
    last4: cardNumber.slice(-4),
    documentNumber: input.documentNumber
      ? toDigits(input.documentNumber)
      : undefined,
    email: input.email?.trim() || undefined,
    address: input.address?.trim() || undefined,
    city: input.city?.trim() || undefined,
    province: input.province?.trim() || undefined,
    postalCode: input.postalCode?.trim() || undefined,
    phone: input.phone ? toDigits(input.phone) : undefined,
    deviceFingerprintId: input.deviceFingerprintId?.trim() || undefined,
  };
}

export function buildCashSandboxPayment(input: {
  amount: number;
  createdBy: string;
  reference?: string;
  notes?: string;
  paidAt?: string;
}): CreateManualPaymentRequest {
  return {
    amount: input.amount,
    method: "CASH",
    createdBy: input.createdBy,
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
        address: payload.address.trim() || undefined,
        email: payload.email.trim() || undefined,
        phone: payload.phone.trim() || undefined,
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
      cardType: payload.cardType,
      documentNumber: payload.dni,
      email: payload.email,
      address: payload.address,
      city: payload.city,
      province: payload.province,
      postalCode: payload.postalCode,
      phone: payload.phone,
      deviceFingerprintId: payload.deviceFingerprintId,
    }),
  };
}

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
    affiliates: mapCashFormToAffiliateRequests(payload),
    initialManualPayment:
      Number(payload.planAmount ?? 0) > 0
        ? buildCashSandboxPayment({
            amount: Number(payload.planAmount),
            createdBy: payload.seller,
            notes: `Pago manual inicial en efectivo del plan ${payload.plan}`,
          })
        : undefined,
  };
}
