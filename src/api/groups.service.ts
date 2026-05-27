import apiClient from "./apiClient";
import type {
  CreateGroupRequest,
  GroupResponse,
} from "../features/AffiliateGroups/AffiliateGroups.types";

export const groupsService = {
  async create(payload: CreateGroupRequest) {
    const { data } = await apiClient.post<GroupResponse>("/groups", payload);
    return data;
  },  
};

export const familiarGroupGet = {
  async getGroups() {
    const { data } = await apiClient.get<GroupResponse[]>("/groups/familiarGroups");
    return Array.isArray(data) ? data : [];
  },
};
