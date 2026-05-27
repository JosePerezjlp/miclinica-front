export interface PromoterResponse {
  id: number;
  name: string;
  percentage: number | string;
  isActive: boolean;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromoterRequest {
  name: string;
  percentage: number;
  isActive?: boolean;
  isInternal?: boolean;
}

export interface UpdatePromoterRequest {
  name?: string;
  percentage?: number;
  isActive?: boolean;
  isInternal?: boolean;
}
