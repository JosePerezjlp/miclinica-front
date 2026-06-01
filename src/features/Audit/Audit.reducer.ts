import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  AuditFiltersData,
  AuditSummary,
  AuditTransactionsResponse,
} from "./Audit.types";
import {
  GET_AUDIT_TRANSACTIONS,
  GET_AUDIT_TRANSACTIONS_SUCCESS,
  GET_AUDIT_TRANSACTIONS_ERROR,
  GET_AUDIT_SUMMARY,
  GET_AUDIT_SUMMARY_SUCCESS,
  GET_AUDIT_SUMMARY_ERROR,
  SET_AUDIT_FILTERS,
  SET_AUDIT_VIEW,
} from "./Audit.action";

interface AuditState {
  transactions: AuditTransactionsResponse | null;
  summary: AuditSummary | null;
  filters: AuditFiltersData;
  view: "transactions" | "summary";
  loading: boolean;
  error: string | null;
}

const initialState: AuditState = {
  transactions: null,
  summary: null,
  filters: {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
  view: "transactions",
  loading: false,
  error: null,
};

export const auditReducer = (
  state = initialState,
  action: PayloadAction<unknown>,
): AuditState => {
  switch (action.type) {
    case GET_AUDIT_TRANSACTIONS:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_AUDIT_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        transactions: action.payload as AuditTransactionsResponse,
      };

    case GET_AUDIT_TRANSACTIONS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload as string,
      };

    case GET_AUDIT_SUMMARY:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_AUDIT_SUMMARY_SUCCESS:
      return {
        ...state,
        loading: false,
        summary: action.payload as AuditSummary,
      };

    case GET_AUDIT_SUMMARY_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload as string,
      };

    case SET_AUDIT_FILTERS:
      return {
        ...state,
        filters: action.payload as AuditFiltersData,
      };

    case SET_AUDIT_VIEW:
      return {
        ...state,
        view: action.payload as "transactions" | "summary",
      };

    default:
      return state;
  }
};
