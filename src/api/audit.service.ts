import type {
  AuditFiltersData,
  AuditSummary,
  AuditTransactionsResponse,
} from "../features/Audit/Audit.types";
import { apiClient } from "./apiClient";

class AuditService {
  async getTransactions(
    filters: AuditFiltersData,
    skip: number = 0,
    take: number = 50,
  ): Promise<AuditTransactionsResponse> {
    const params = new URLSearchParams();

    if (filters.familiarGroupId) {
      params.append("familiarGroupId", filters.familiarGroupId.toString());
    }
    if (filters.promoterId) {
      params.append("promoterId", filters.promoterId.toString());
    }
    if (filters.month) {
      params.append("month", filters.month.toString());
    }
    if (filters.year) {
      params.append("year", filters.year.toString());
    }

    params.append("skip", skip.toString());
    params.append("take", take.toString());

    const { data } = await apiClient.get<AuditTransactionsResponse>(
      `/audit/transactions?${params.toString()}`,
    );

    return data;
  }

  async getSummary(filters: AuditFiltersData): Promise<AuditSummary> {
    const params = new URLSearchParams();

    if (filters.familiarGroupId) {
      params.append("familiarGroupId", filters.familiarGroupId.toString());
    }
    if (filters.promoterId) {
      params.append("promoterId", filters.promoterId.toString());
    }
    if (filters.month) {
      params.append("month", filters.month.toString());
    }
    if (filters.year) {
      params.append("year", filters.year.toString());
    }

    const { data } = await apiClient.get<AuditSummary>(
      `/audit/summary?${params.toString()}`,
    );

    return data;
  }
}

export const auditService = new AuditService();
