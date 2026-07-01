import { createAsyncThunk } from "@reduxjs/toolkit";
import { affiliatesService } from "../../api/affiliates.service";
import * as groupDetailService from "../../api/groupDetail.service";
import type { GroupDetailData } from "./AffiliateGroups.detail.types";

export const getGroupDetailThunk = createAsyncThunk<
  GroupDetailData,
  number,
  {
    rejectValue: { message: string };
  }
>("groupDetail/getDetail", async (groupId, { rejectWithValue }) => {
  try {
    return await groupDetailService.getGroupDetail(groupId);
  } catch (error: any) {
    return rejectWithValue({
      message:
        error?.response?.data?.message ||
        "Error al obtener los detalles del grupo",
    });
  }
});

export const updateGroupInfoThunk = createAsyncThunk<
  GroupDetailData,
  { groupId: number; payload: any },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/updateInfo",
  async ({ groupId, payload }, { rejectWithValue }) => {
    try {
      return await groupDetailService.updateGroupInfo(groupId, payload);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Error al actualizar la información del grupo",
      });
    }
  },
);

export const addAffiliateThunk = createAsyncThunk<
  GroupDetailData,
  { groupId: number; payload: any },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/addAffiliate",
  async ({ groupId, payload }, { rejectWithValue }) => {
    try {
      return await groupDetailService.addAffiliate(groupId, payload);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Error al agregar el afiliado",
      });
    }
  },
);

export const registerManualPaymentThunk = createAsyncThunk<
  GroupDetailData,
  {
    groupId: number;
    payload: {
      amount: number;
      billingPeriodId?: number;
      method: "CARD" | "CASH" | "TRANSFER";
      paidAt: string;
      createdBy?: string;
      reference?: string;
      notes?: string;
    };
  },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/registerManualPayment",
  async ({ groupId, payload }, { rejectWithValue }) => {
    try {
      await affiliatesService.registerManualPayment(groupId, payload);
      return await groupDetailService.getGroupDetail(groupId);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Error al registrar el pago manual",
      });
    }
  },
);

export const settleDebtThunk = createAsyncThunk<
  GroupDetailData,
  {
    groupId: number;
    payload: {
      amount: number;
      discountAmount?: number;
      discountReason?: string;
      method: "CARD" | "CASH" | "TRANSFER";
      paidAt: string;
      createdBy?: string;
      reference?: string;
      notes?: string;
    };
  },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/settleDebt",
  async ({ groupId, payload }, { rejectWithValue }) => {
    try {
      await affiliatesService.settleDebt(groupId, payload);
      return await groupDetailService.getGroupDetail(groupId);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Error al saldar la deuda total",
      });
    }
  },
);

export const updateAffiliateThunk = createAsyncThunk<
  GroupDetailData,
  { groupId: number; affiliateId: number; payload: any },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/updateAffiliate",
  async ({ groupId, affiliateId, payload }, { rejectWithValue }) => {
    try {
      return await groupDetailService.updateAffiliate(
        groupId,
        affiliateId,
        payload,
      );
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Error al actualizar el afiliado",
      });
    }
  },
);

export const removeAffiliateThunk = createAsyncThunk<
  GroupDetailData,
  { groupId: number; affiliateId: number },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/removeAffiliate",
  async ({ groupId, affiliateId }, { rejectWithValue }) => {
    try {
      return await groupDetailService.removeAffiliate(groupId, affiliateId);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Error al eliminar el afiliado",
      });
    }
  },
);

export const addPaymentMethodThunk = createAsyncThunk<
  GroupDetailData,
  { groupId: number; payload: any },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/addPaymentMethod",
  async ({ groupId, payload }, { rejectWithValue }) => {
    try {
      const {
        chargePendingNow,
        amountDue,
        mobbexSubscriptionId: _mobbexSubscriptionId,
        mobbexWebhook: _mobbexWebhook,
        ...paymentMethodPayload
      } = payload;

      await groupDetailService.addPaymentMethod(groupId, paymentMethodPayload);

      if (paymentMethodPayload.gateway !== "MOBBEX" && chargePendingNow) {
        await groupDetailService.runPaymentAttempt(groupId, {
          amountDue:
            typeof amountDue === "number" && amountDue > 0
              ? amountDue
              : undefined,
        });
      }

      return await groupDetailService.getGroupDetail(groupId);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Error al agregar la forma de pago",
      });
    }
  },
);

export const updatePaymentMethodThunk = createAsyncThunk<
  GroupDetailData,
  { groupId: number; methodId: number; payload: any },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/updatePaymentMethod",
  async ({ groupId, methodId, payload }, { rejectWithValue }) => {
    try {
      await groupDetailService.updatePaymentMethod(groupId, methodId, payload);
      return await groupDetailService.getGroupDetail(groupId);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Error al actualizar la forma de pago",
      });
    }
  },
);

export const removePaymentMethodThunk = createAsyncThunk<
  GroupDetailData,
  { groupId: number; methodId: number },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/removePaymentMethod",
  async ({ groupId, methodId }, { rejectWithValue }) => {
    try {
      await groupDetailService.removePaymentMethod(groupId, methodId);
      return await groupDetailService.getGroupDetail(groupId);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Error al eliminar la forma de pago",
      });
    }
  },
);

export const setPaymentAutomationThunk = createAsyncThunk<
  GroupDetailData,
  {
    groupId: number;
    payload: {
      enabled: boolean;
      primaryMethodId?: number;
      backupMethodIds?: number[];
    };
  },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/setPaymentAutomation",
  async ({ groupId, payload }, { rejectWithValue }) => {
    try {
      await groupDetailService.setPaymentAutomation(groupId, payload);
      return await groupDetailService.getGroupDetail(groupId);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Error al cambiar el modo de cobro automático",
      });
    }
  },
);

export const settleDebtByGatewayThunk = createAsyncThunk<
  GroupDetailData,
  { groupId: number; paymentMethodId: number; billingPeriodIds: number[] },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/settleDebtByGateway",
  async ({ groupId, paymentMethodId, billingPeriodIds }, { rejectWithValue }) => {
    try {
      for (const billingPeriodId of billingPeriodIds) {
        const attemptResult = await groupDetailService.runPaymentAttempt(groupId, {
          billingPeriodId,
          paymentMethodId,
        });
        if (!attemptResult.execution.success) {
          const resultCode = attemptResult.execution.result ?? "FAILED";
          const label = GATEWAY_RESULT_LABELS[resultCode] ?? `Cobro rechazado (${resultCode})`;
          return rejectWithValue({ message: label });
        }
      }
      return await groupDetailService.getGroupDetail(groupId);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Error al procesar el cobro de la deuda",
      });
    }
  },
);

export const chargeNowForPeriodThunk = createAsyncThunk<
  GroupDetailData,
  { groupId: number; billingPeriodId: number },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/chargeNowForPeriod",
  async ({ groupId, billingPeriodId }, { rejectWithValue }) => {
    try {
      const attemptResult = await groupDetailService.runPaymentAttempt(groupId, { billingPeriodId });
      const groupData = await groupDetailService.getGroupDetail(groupId);
      if (!attemptResult.execution.success) {
        const resultCode = attemptResult.execution.result ?? "FAILED";
        const label = GATEWAY_RESULT_LABELS[resultCode] ?? `Cobro rechazado (${resultCode})`;
        return rejectWithValue({ message: label });
      }
      return groupData;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Error al intentar el cobro",
      });
    }
  },
);

const GATEWAY_RESULT_LABELS: Record<string, string> = {
  FAILED_INSUFFICIENT_FUNDS: "Fondos insuficientes en la tarjeta.",
  FAILED_CARD_EXPIRED: "La tarjeta está vencida.",
  FAILED_CARD_BLOCKED: "La tarjeta está bloqueada.",
  FAILED_TOKEN_INVALID: "El token de la tarjeta expiró. Eliminá y volvé a agregar la forma de pago.",
  FAILED_GATEWAY_ERROR: "Error en el gateway de pago. Revisá los logs.",
  FAILED_GATEWAY_TIMEOUT: "Tiempo de espera agotado en el gateway.",
  FAILED_CBU_INVALID: "CBU inválido o no tiene adhesión de Débito Directo vigente en SIRO. Verificá que sea un CBU bancario real (no un CVU de billetera digital).",
};

export const checkBillingPeriodSiroStatusThunk = createAsyncThunk<
  {
    billingPeriodId: number;
    billingPeriodStatus: string;
    nroTransaccion?: string;
    estado?: string;
    estadoLabel?: string;
    cantidadErrores?: number;
    isError?: boolean;
    siroStatus?: Record<string, unknown> | null;
    message?: string;
    groupData?: GroupDetailData;
  },
  { groupId: number; billingPeriodId: number },
  { rejectValue: { message: string } }
>(
  "groupDetail/checkBillingPeriodSiroStatus",
  async ({ groupId, billingPeriodId }, { rejectWithValue }) => {
    try {
      const statusResult = await groupDetailService.checkSiroStatus(groupId, billingPeriodId);
      const groupData = await groupDetailService.getGroupDetail(groupId);
      return { ...statusResult, groupData };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Error al consultar el estado SIRO",
      });
    }
  },
);

export const updatePlanThunk = createAsyncThunk<
  GroupDetailData,
  { groupId: number; payload: any },
  {
    rejectValue: { message: string };
  }
>(
  "groupDetail/updatePlan",
  async ({ groupId, payload }, { rejectWithValue }) => {
    try {
      return await groupDetailService.updatePlan(groupId, payload);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Error al actualizar el plan",
      });
    }
  },
);
