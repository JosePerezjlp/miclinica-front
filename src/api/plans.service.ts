import apiClient from "./apiClient";
import type {
  CreatePlanRequest,
  PlanResponse,
  UpdatePlanRequest,
} from "../features/Plans/Plans.types";

export const plansService = {
  async list() {
    const { data } = await apiClient.get<PlanResponse[]>("/plans");
    return data;
  },

  async create(payload: CreatePlanRequest) {
    const { data } = await apiClient.post<PlanResponse>("/plans", payload);
    return data;
  },

  async update(id: number, payload: UpdatePlanRequest) {
    const { data } = await apiClient.patch<PlanResponse>(
      `/plans/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: number) {
    const { data } = await apiClient.delete<PlanResponse>(`/plans/${id}`);
    return data;
  },
};
