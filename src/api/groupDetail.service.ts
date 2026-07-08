import type { GroupDetailData } from "../features/AffiliateGroups/AffiliateGroups.detail.types";
import apiClient from "./apiClient";

// Helper to convert numeric strings to numbers in deeply nested objects
const transformNumericStrings = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") {
    const num = Number(obj);
    return !isNaN(num) && obj.trim() !== "" ? num : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(transformNumericStrings);
  }
  if (typeof obj === "object") {
    const transformed: any = {};
    for (const key in obj) {
      transformed[key] = transformNumericStrings(obj[key]);
    }
    return transformed;
  }
  return obj;
};

export const getGroupDetail = async (
  groupId: number,
): Promise<GroupDetailData> => {
  const { data } = await apiClient.get(`/groups/${groupId}`);
  return transformNumericStrings(data);
};

export const updateGroupInfo = async (
  groupId: number,
  payload: {
    name?: string;
    holderFullName?: string;
    isActive?: boolean;
    chargeDay?: number;
    promoterId?: number;
    cityId?: number;
  },
): Promise<GroupDetailData> => {
  const { data } = await apiClient.patch(`/groups/${groupId}`, payload);
  return transformNumericStrings(data);
};

export const addAffiliate = async (
  groupId: number,
  payload: {
    firstName: string;
    lastName: string;
    documentNumber: string;
    birthDate: string;
    address?: string;
    email?: string;
    phone?: string;
    isHolder?: boolean;
  },
): Promise<GroupDetailData> => {
  const { data } = await apiClient.post(
    `/groups/${groupId}/affiliates`,
    payload,
  );
  return transformNumericStrings(data);
};

export const updateAffiliate = async (
  groupId: number,
  affiliateId: number,
  payload: {
    firstName?: string;
    lastName?: string;
    documentNumber?: string;
    birthDate?: string;
    address?: string;
    email?: string;
    phone?: string;
    isVerified?: boolean;
  },
): Promise<GroupDetailData> => {
  const { data } = await apiClient.patch(
    `/groups/${groupId}/affiliates/${affiliateId}`,
    payload,
  );
  return transformNumericStrings(data);
};

export const removeAffiliate = async (
  groupId: number,
  affiliateId: number,
): Promise<GroupDetailData> => {
  const { data } = await apiClient.delete(
    `/groups/${groupId}/affiliates/${affiliateId}`,
  );
  return transformNumericStrings(data);
};

export const addPaymentMethod = async (
  groupId: number,
  payload: Record<string, unknown>,
) => {
  const { data } = await apiClient.post(
    `/groups/${groupId}/payment-methods`,
    payload,
  );
  return transformNumericStrings(data);
};

export const updatePaymentMethod = async (
  groupId: number,
  methodId: number,
  payload: {
    priority?: number;
    isActive?: boolean;
  },
): Promise<GroupDetailData> => {
  const { data } = await apiClient.patch(
    `/groups/${groupId}/payment-methods/${methodId}`,
    payload,
  );
  return transformNumericStrings(data);
};

export const runPaymentAttempt = async (
  groupId: number,
  payload: {
    amountDue?: number;
    billingPeriodId?: number;
    paymentMethodId?: number;
  },
): Promise<{
  groupId: number;
  billingPeriodId: number;
  month: number;
  year: number;
  usedGateway: string;
  usedMethodId: number;
  amountDue: number;
  execution: { success: boolean; attemptId: number; result: string };
}> => {
  const { data } = await apiClient.post(
    `/groups/${groupId}/payment-attempts/run-now`,
    payload,
  );
  return transformNumericStrings(data);
};

export const setPaymentAutomation = async (
  groupId: number,
  payload: {
    enabled: boolean;
    primaryMethodId?: number;
    backupMethodIds?: number[];
  },
) => {
  const { data } = await apiClient.post(
    `/groups/${groupId}/payment-methods/automation`,
    payload,
  );
  return transformNumericStrings(data);
};

export const removePaymentMethod = async (
  groupId: number,
  methodId: number,
): Promise<GroupDetailData> => {
  const { data } = await apiClient.delete(
    `/groups/${groupId}/payment-methods/${methodId}`,
  );
  return transformNumericStrings(data);
};

export const updatePlan = async (
  groupId: number,
  payload: {
    planId?: number;
    planStatus?: string;
  },
): Promise<GroupDetailData> => {
  const { data } = await apiClient.patch(`/groups/${groupId}/plan`, payload);
  return transformNumericStrings(data);
};

export const applyDiscount = async (
  groupId: number,
  payload: {
    billingPeriodId: number;
    amount: number;
    type: "PARTIAL" | "TOTAL";
    reason?: string;
    appliedBy: string;
  },
): Promise<{ id: number }> => {
  const { data } = await apiClient.post(
    `/groups/${groupId}/billing/discounts`,
    payload,
  );
  return data;
};

export const updateManualPayment = async (
  groupId: number,
  paymentId: number,
  payload: {
    amount?: number;
    paidAt?: string;
    reference?: string;
    notes?: string;
  },
): Promise<GroupDetailData> => {
  await apiClient.patch(
    `/groups/${groupId}/billing/manual-payments/${paymentId}`,
    payload,
  );
  const { data } = await apiClient.get(`/groups/${groupId}`);
  return transformNumericStrings(data);
};

export const checkSiroStatus = async (
  groupId: number,
  billingPeriodId: number,
): Promise<{
  billingPeriodId: number;
  billingPeriodStatus: string;
  nroTransaccion?: string;
  estado?: string;
  estadoLabel?: string;
  cantidadErrores?: number;
  isError?: boolean;
  siroStatus?: Record<string, unknown> | null;
  message?: string;
}> => {
  const { data } = await apiClient.post(
    `/groups/${groupId}/payment-attempts/check-siro-status`,
    { billingPeriodId },
  );
  return data;
};
