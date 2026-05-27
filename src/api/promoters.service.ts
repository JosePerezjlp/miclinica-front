import apiClient from "./apiClient";
import type {
  CreatePromoterRequest,
  PromoterResponse,
  UpdatePromoterRequest,
} from "../features/Promoters/Promoters.types";

export const promotersService = {
  async list() {
    const { data } = await apiClient.get<PromoterResponse[]>("/promoters");
    return data;
  },

  async create(payload: CreatePromoterRequest) {
    const { data } = await apiClient.post<PromoterResponse>(
      "/promoters",
      payload,
    );
    return data;
  },

  async update(id: number, payload: UpdatePromoterRequest) {
    const { data } = await apiClient.patch<PromoterResponse>(
      `/promoters/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: number) {
    const { data } = await apiClient.delete<PromoterResponse>(
      `/promoters/${id}`,
    );
    return data;
  },
};
