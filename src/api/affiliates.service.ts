import apiClient from "./apiClient";
import type {
  CreateAffiliateRequest,
  CreateManualPaymentRequest,
  ManualPaymentResponse,
  SettleDebtRequest,
  UpdateAffiliateRequest,
} from "../features/AffiliateGroups/AffiliateGroups.types";

export interface AffiliateResponse {
  id: number;
  familiarGroupId: number;
  firstName: string;
  lastName: string;
  documentNumber: string;
  birthDate: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  isHolder: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const affiliatesService = {
  async create(groupId: number, payload: CreateAffiliateRequest) {
    const { data } = await apiClient.post<AffiliateResponse>(
      `/groups/${groupId}/affiliates`,
      payload,
    );
    return data;
  },

  async createBatch(groupId: number, payloads: CreateAffiliateRequest[]) {
    return Promise.all(
      payloads.map((payload) => this.create(groupId, payload)),
    );
  },

  async list(groupId: number) {
    const { data } = await apiClient.get<AffiliateResponse[]>(
      `/groups/${groupId}/affiliates`,
    );
    return data;
  },

  async findByDocumentNumber(documentNumber: string) {
    const { data } = await apiClient.get<AffiliateResponse[]>(`/affiliates`, {
      params: { documentNumber },
    });
    return data;
  },

  async update(
    groupId: number,
    affiliateId: number,
    payload: UpdateAffiliateRequest,
  ) {
    const { data } = await apiClient.patch<AffiliateResponse>(
      `/groups/${groupId}/affiliates/${affiliateId}`,
      payload,
    );
    return data;
  },

  async remove(groupId: number, affiliateId: number) {
    const { data } = await apiClient.delete<AffiliateResponse>(
      `/groups/${groupId}/affiliates/${affiliateId}`,
    );
    return data;
  },

  async removeById(affiliateId: number) {
    const { data } = await apiClient.delete<AffiliateResponse>(
      `/affiliates/${affiliateId}`,
    );
    return data;
  },

  async registerManualPayment(
    groupId: number,
    payload: CreateManualPaymentRequest,
  ) {
    const { data } = await apiClient.post<ManualPaymentResponse>(
      `/groups/${groupId}/billing/manual-payments`,
      payload,
    );
    return data;
  },

  async listManualPayments(groupId: number) {
    const { data } = await apiClient.get<ManualPaymentResponse[]>(
      `/groups/${groupId}/billing/manual-payments`,
    );
    return data;
  },

  async settleDebt(groupId: number, payload: SettleDebtRequest) {
    const { data } = await apiClient.post(
      `/groups/${groupId}/billing/settlements`,
      payload,
    );
    return data;
  },
};
