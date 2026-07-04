const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ROLES_KEY = "userRoles";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function setUserRoles(roles: Array<{ name: string; modules: Array<{ name: string; permissions: Array<{ name: string }> }> }>) {
  localStorage.setItem(USER_ROLES_KEY, JSON.stringify(roles));
}

export function getUserRoles(): Array<{ name: string; modules: Array<{ name: string; permissions: Array<{ name: string }> }> }> {
  try {
    return JSON.parse(localStorage.getItem(USER_ROLES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLES_KEY);
}
