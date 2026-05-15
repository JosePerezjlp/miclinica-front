import apiClient from "./apiClient";
import type {
  CreateGroupPaymentMethodRequest,
  GroupPaymentMethodResponse,
  PaymentAttemptResponse,
  PaymentGatewayProvider,
} from "../features/AffiliateGroups/AffiliateGroups.types";

export interface RegisterSandboxCardInput {
  groupId: number;
  gateway: PaymentGatewayProvider;
  priority?: number;
  cardNumber: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
  brand?: string;
  documentNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  deviceFingerprintId?: string;
}

export const paymentsService = {
  async createGroupPaymentMethod(
    groupId: number,
    payload: CreateGroupPaymentMethodRequest,
  ) {
    const { data } = await apiClient.post<GroupPaymentMethodResponse>(
      `/groups/${groupId}/payment-methods`,
      payload,
    );
    return data;
  },

  async listGroupPaymentMethods(groupId: number) {
    const { data } = await apiClient.get<GroupPaymentMethodResponse[]>(
      `/groups/${groupId}/payment-methods`,
    );
    return data;
  },

  async deactivateGroupPaymentMethod(groupId: number, methodId: number) {
    const { data } = await apiClient.delete<GroupPaymentMethodResponse>(
      `/groups/${groupId}/payment-methods/${methodId}`,
    );
    return data;
  },

  async listPaymentAttempts(groupId: number) {
    const { data } = await apiClient.get<PaymentAttemptResponse[]>(
      `/groups/${groupId}/payment-attempts`,
    );
    return data;
  },

  async registerSandboxCard(input: RegisterSandboxCardInput) {
    return this.createGroupPaymentMethod(input.groupId, {
      gateway: input.gateway,
      type: "CARD",
      priority: input.priority ?? 1,
      cardNumber: input.cardNumber,
      cvv: input.cvv,
      expiryMonth: input.expiryMonth,
      expiryYear: input.expiryYear,
      holderName: input.holderName,
      brand: input.brand,
      last4: input.cardNumber.replace(/\D/g, "").slice(-4),
      documentNumber: input.documentNumber,
      email: input.email,
      address: input.address,
      city: input.city,
      province: input.province,
      postalCode: input.postalCode,
      phone: input.phone,
      deviceFingerprintId: input.deviceFingerprintId,
    });
  },
};
