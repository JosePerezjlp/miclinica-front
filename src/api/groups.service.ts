import apiClient from "./apiClient";
import type {
  CreateGroupRequest,
  FamiliarGroupsFilters,
  FamiliarGroupsPaginatedResponse,
  GroupResponse,
} from "../features/AffiliateGroups/AffiliateGroups.types";

export const groupsService = {
  async create(payload: CreateGroupRequest) {
    const { data } = await apiClient.post<GroupResponse>("/groups", payload);
    return data;
  },
};

export const familiarGroupGet = {
  async getGroups(filters: FamiliarGroupsFilters = {}) {
    const { data } = await apiClient.get<FamiliarGroupsPaginatedResponse>(
      "/groups/familiarGroups",
      {
        params: {
          page: filters.page ?? 1,
          pageSize: filters.pageSize ?? 10,
          dni: filters.dni?.trim() || undefined,
          paymentType:
            filters.paymentType && filters.paymentType !== "all"
              ? filters.paymentType
              : undefined,
        },
      },
    );

    return {
      items: Array.isArray(data?.items) ? data.items : [],
      meta: data?.meta ?? {
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 10,
        total: 0,
        totalPages: 1,
      },
    };
  },
};
