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
