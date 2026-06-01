import apiClient from "./apiClient";

export interface DashboardSummaryResponse {
  metrics: {
    totalAffiliates: number;
    activeAffiliates: number;
    overdueInstallments: number;
    overdueInGracePeriod: number;
    affiliatesWithoutCoverage: number;
    debtTotal: number;
    expiringCards: number;
    failedDebits: {
      total: number;
      card: number;
      cbu: number;
    };
    newAffiliations: {
      currentMonth: number;
      previousMonth: number;
      trend?: string;
    };
  };
  collections: {
    paywayCard: number;
    siroCbu: number;
    cash: number;
  };
}

export const dashboardService = {
  async getSummary() {
    const { data } =
      await apiClient.get<DashboardSummaryResponse>("/dashboard/summary");
    return data;
  },
};
