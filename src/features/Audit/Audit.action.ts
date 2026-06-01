import type { ThunkAction } from "redux-thunk";
import type { Action } from "redux";
import toast from "react-hot-toast";
import { auditService } from "../../api/audit.service";
import type {
  AuditFiltersData,
  AuditSummary,
  AuditTransactionsResponse,
} from "./Audit.types";
import type { RootState } from "../../store/store";

export const GET_AUDIT_TRANSACTIONS = "GET_AUDIT_TRANSACTIONS";
export const GET_AUDIT_TRANSACTIONS_SUCCESS = "GET_AUDIT_TRANSACTIONS_SUCCESS";
export const GET_AUDIT_TRANSACTIONS_ERROR = "GET_AUDIT_TRANSACTIONS_ERROR";

export const GET_AUDIT_SUMMARY = "GET_AUDIT_SUMMARY";
export const GET_AUDIT_SUMMARY_SUCCESS = "GET_AUDIT_SUMMARY_SUCCESS";
export const GET_AUDIT_SUMMARY_ERROR = "GET_AUDIT_SUMMARY_ERROR";

export const SET_AUDIT_FILTERS = "SET_AUDIT_FILTERS";
export const SET_AUDIT_VIEW = "SET_AUDIT_VIEW";

type AuditThunk<R> = ThunkAction<R, RootState, unknown, Action<string>>;

// Action creators
export const onGetAuditTransactions = () => ({
  type: GET_AUDIT_TRANSACTIONS as typeof GET_AUDIT_TRANSACTIONS,
});

export const onGetAuditTransactionsSuccess = (payload: AuditTransactionsResponse) => ({
  type: GET_AUDIT_TRANSACTIONS_SUCCESS as typeof GET_AUDIT_TRANSACTIONS_SUCCESS,
  payload,
});

export const onGetAuditTransactionsError = (error: string) => ({
  type: GET_AUDIT_TRANSACTIONS_ERROR as typeof GET_AUDIT_TRANSACTIONS_ERROR,
  payload: error,
});

export const onGetAuditSummary = () => ({
  type: GET_AUDIT_SUMMARY as typeof GET_AUDIT_SUMMARY,
});

export const onGetAuditSummarySuccess = (payload: AuditSummary) => ({
  type: GET_AUDIT_SUMMARY_SUCCESS as typeof GET_AUDIT_SUMMARY_SUCCESS,
  payload,
});

export const onGetAuditSummaryError = (error: string) => ({
  type: GET_AUDIT_SUMMARY_ERROR as typeof GET_AUDIT_SUMMARY_ERROR,
  payload: error,
});

export const onSetAuditFilters = (filters: AuditFiltersData) => ({
  type: SET_AUDIT_FILTERS as typeof SET_AUDIT_FILTERS,
  payload: filters,
});

export const onSetAuditView = (view: "transactions" | "summary") => ({
  type: SET_AUDIT_VIEW as typeof SET_AUDIT_VIEW,
  payload: view,
});

// Thunks
export const getAuditTransactionsThunk =
  (filters: AuditFiltersData, skip?: number, take?: number): AuditThunk<void> =>
  async (dispatch) => {
    dispatch(onGetAuditTransactions());
    try {
      const data = await auditService.getTransactions(filters, skip, take);
      dispatch(onGetAuditTransactionsSuccess(data));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      dispatch(onGetAuditTransactionsError(errorMessage));
      toast.error("Error al cargar transacciones de auditoría");
    }
  };

export const getAuditSummaryThunk =
  (filters: AuditFiltersData): AuditThunk<void> =>
  async (dispatch) => {
    dispatch(onGetAuditSummary());
    try {
      const data = await auditService.getSummary(filters);
      dispatch(onGetAuditSummarySuccess(data));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      dispatch(onGetAuditSummaryError(errorMessage));
      toast.error("Error al cargar resumen de auditoría");
    }
  };
