import axios from "axios";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "./tokenStorage";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

type RetryableRequestConfig = {
  _retry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthTokens();
    redirectToLogin();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
        refreshToken,
      })
      .then(({ data }) => {
        setAuthTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      })
      .catch(() => {
        clearAuthTokens();
        redirectToLogin();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Attach token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as typeof error.config &
      RetryableRequestConfig;

    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

    return apiClient(originalRequest);
  },
);

export default apiClient;
