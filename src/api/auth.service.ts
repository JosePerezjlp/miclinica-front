import apiClient from "./apiClient";

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    uid: string;
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
  };
  roles: Array<{
    id: number;
    name: string;
    modules: Array<{
      id: number;
      name: string;
      permissions: Array<{
        id: number;
        name: string;
      }>;
    }>;
  }>;
}

export const AuthService = {
  async login(username: string, password: string) {
    const { data } = await apiClient.post<AuthSessionResponse>("/auth/login", {
      username,
      password,
    });
    return data;
  },

  async refresh(refreshToken: string) {
    const { data } = await apiClient.post<AuthSessionResponse>(
      "/auth/refresh",
      {
        refreshToken,
      },
    );
    return data;
  },

  async logout(refreshToken: string) {
    const { data } = await apiClient.post<{ message: string }>("/auth/logout", {
      refreshToken,
    });
    return data;
  },
};
