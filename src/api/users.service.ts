import { apiClient } from "./apiClient";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "../features/Users/Users.types";

export const usersService = {
  async list() {
    const { data } = await apiClient.get<UserResponse[]>("/rbac/users");
    return data;
  },

  async create(payload: CreateUserRequest) {
    const { data } = await apiClient.post<UserResponse>("/rbac/users", payload);
    return data;
  },

  async update(uid: string, payload: UpdateUserRequest) {
    const { data } = await apiClient.patch<UserResponse>(
      `/rbac/users/${uid}`,
      payload,
    );
    return data;
  },

  async remove(uid: string) {
    const { data } = await apiClient.delete<UserResponse>(`/rbac/users/${uid}`);
    return data;
  },
};
