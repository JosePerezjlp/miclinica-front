import apiClient from "./apiClient";
import type {
  Benefit,
  CreateBenefitRequest,
  UpdateBenefitRequest,
} from "../features/Benefits/Benefits.types";

export const benefitsService = {
  async list() {
    const { data } = await apiClient.get<Benefit[]>("/benefits");
    return data;
  },

  async create(payload: CreateBenefitRequest) {
    const { data } = await apiClient.post<Benefit>("/benefits", payload);
    return data;
  },

  async update(id: number, payload: UpdateBenefitRequest) {
    const { data } = await apiClient.patch<Benefit>(
      `/benefits/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: number) {
    const { data } = await apiClient.delete<Benefit>(`/benefits/${id}`);
    return data;
  },
};
