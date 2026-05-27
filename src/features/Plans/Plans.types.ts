export interface PlanResponse {
  id: number;
  name: string;
  monthlyFee: number | string;
  gracePeriodDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
