export interface CityResponse {
  id: number;
  name: string;
  description: string | null;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCityRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCityRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}
