export interface PromoterCity {
  id: number;
  name: string;
  code: string;
}

export interface PromoterResponse {
  id: number;
  name: string;
  percentage: number | string;
  isActive: boolean;
  isInternal: boolean;
  cityId: number | null;
  city: PromoterCity | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromoterRequest {
  name: string;
  percentage: number;
  isActive?: boolean;
  isInternal?: boolean;
  cityId?: number | null;
}

export interface UpdatePromoterRequest {
  name?: string;
  percentage?: number;
  isActive?: boolean;
  isInternal?: boolean;
  cityId?: number | null;
}
