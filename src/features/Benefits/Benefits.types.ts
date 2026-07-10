export interface BenefitPlanSummary {
  id: number;
  name: string;
}

export interface Benefit {
  id: number;
  name: string;
  description: string | null;
  minMonthsActive: number | null;
  maxMonthsActive: number | null;
  requiresGateway: string | null;
  requiresMethodType: string | null;
  requiresCardBrand: string | null;
  requiresBank: string | null;
  minMethodCount: number | null;
  discountPercent: number | string | null;
  discountFixed: number | string | null;
  freeDescription: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  plans: BenefitPlanSummary[];
}

export interface CreateBenefitRequest {
  name: string;
  description?: string;
  minMonthsActive?: number;
  maxMonthsActive?: number;
  requiresGateway?: string;
  requiresMethodType?: string;
  requiresCardBrand?: string;
  requiresBank?: string;
  minMethodCount?: number;
  discountPercent?: number;
  discountFixed?: number;
  freeDescription?: string;
  planIds?: number[];
}

export interface UpdateBenefitRequest extends Partial<CreateBenefitRequest> {
  isActive?: boolean;
}
