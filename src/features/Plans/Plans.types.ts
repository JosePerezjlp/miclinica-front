export interface PlanBenefitSummary {
  id: number;
  name: string;
}

export interface PlanResponse {
  id: number;
  name: string;
  monthlyFee: number | string;
  gracePeriodDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  benefits?: PlanBenefitSummary[];
}

export interface CreatePlanRequest {
  name: string;
  monthlyFee: number;
  gracePeriodDays?: number;
}

export interface UpdatePlanRequest {
  name?: string;
  monthlyFee?: number;
  gracePeriodDays?: number;
  isActive?: boolean;
}
