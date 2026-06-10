import apiClient from "./apiClient";
import type {
  CityResponse,
  CreateCityRequest,
  UpdateCityRequest,
} from "../features/Cities/Cities.types";

export const citiesService = {
  async list() {
    const { data } = await apiClient.get<CityResponse[]>("/cities");
    return data;
  },

  async create(payload: CreateCityRequest) {
    const { data } = await apiClient.post<CityResponse>("/cities", payload);
    return data;
  },

  async update(id: number, payload: UpdateCityRequest) {
    const { data } = await apiClient.patch<CityResponse>(
      `/cities/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: number) {
    const { data } = await apiClient.delete<CityResponse>(`/cities/${id}`);
    return data;
  },
};
