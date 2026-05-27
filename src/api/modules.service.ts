import { apiClient } from "./apiClient";
import type {
  AccessModuleResponse,
  CreateModuleRequest,
  CreatePermissionRequest,
  PermissionResponse,
  UpdateModuleRequest,
  UpdatePermissionRequest,
} from "../features/Modules/Modules.types";

export const modulesService = {
  async listModules() {
    const { data } =
      await apiClient.get<AccessModuleResponse[]>("/rbac/modules");
    return data;
  },

  async createModule(payload: CreateModuleRequest) {
    const { data } = await apiClient.post<AccessModuleResponse>(
      "/rbac/modules",
      payload,
    );
    return data;
  },

  async updateModule(id: number, payload: UpdateModuleRequest) {
    const { data } = await apiClient.patch<AccessModuleResponse>(
      `/rbac/modules/${id}`,
      payload,
    );
    return data;
  },

  async removeModule(id: number) {
    const { data } = await apiClient.delete<AccessModuleResponse>(
      `/rbac/modules/${id}`,
    );
    return data;
  },

  async listPermissions() {
    const { data } =
      await apiClient.get<PermissionResponse[]>("/rbac/permissions");
    return data;
  },

  async createPermission(payload: CreatePermissionRequest) {
    const { data } = await apiClient.post<PermissionResponse>(
      "/rbac/permissions",
      payload,
    );
    return data;
  },

  async updatePermission(id: number, payload: UpdatePermissionRequest) {
    const { data } = await apiClient.patch<PermissionResponse>(
      `/rbac/permissions/${id}`,
      payload,
    );
    return data;
  },

  async removePermission(id: number) {
    const { data } = await apiClient.delete<PermissionResponse>(
      `/rbac/permissions/${id}`,
    );
    return data;
  },
};
