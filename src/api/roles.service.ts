import { apiClient } from "./apiClient";
import type {
  CreateRoleRequest,
  RoleResponse,
  UpdateRoleRequest,
} from "../features/Roles/Roles.types";

export const rolesService = {
  async list() {
    const { data } = await apiClient.get<RoleResponse[]>("/rbac/roles");
    return data;
  },

  async create(payload: CreateRoleRequest) {
    const { data } = await apiClient.post<RoleResponse>("/rbac/roles", payload);
    return data;
  },

  async update(id: number, payload: UpdateRoleRequest) {
    const { data } = await apiClient.patch<RoleResponse>(
      `/rbac/roles/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: number) {
    const { data } = await apiClient.delete<RoleResponse>(`/rbac/roles/${id}`);
    return data;
  },
};
