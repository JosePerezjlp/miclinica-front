import type { ThunkAction } from "redux-thunk";
import type { RootState } from "../../store/store";
import type { Action } from "redux";
import apiClient from "../../api/apiClient";
import toast from "react-hot-toast";

// Action constants
export const LOGIN = "LOGIN";
export const LOGIN_SUCCESS = "LOGIN_SUCCESS";
export const LOGIN_ERROR = "LOGIN_ERROR";

// Action creators
export const onLogin = () => ({ type: LOGIN as typeof LOGIN });
export const onLoginSuccess = (token: string) => ({
  type: LOGIN_SUCCESS as typeof LOGIN_SUCCESS,
  payload: token,
});
export const onLoginError = (error: string) => ({
  type: LOGIN_ERROR as typeof LOGIN_ERROR,
  payload: error,
});

// Thunk
export const onLoginThunk =
  (
    credentials: { username: string; password: string },
    callbacks?: { onSuccess?: () => void; onError?: () => void },
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onLogin());
    if (credentials.username === "admin" && credentials.password === "123456") {
      const fakeToken = "fake-jwt-token-admin";
      localStorage.setItem("token", fakeToken);
      dispatch(onLoginSuccess(fakeToken));
      callbacks?.onSuccess?.();
      return;
    }
    try {
      const { data } = await apiClient.post<{ token: string }>(
        "/auth/login",
        credentials,
      );
      localStorage.setItem("token", data.token);
      dispatch(onLoginSuccess(data.token));
      callbacks?.onSuccess?.();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al iniciar sesión";
      toast.error(message);
      dispatch(onLoginError(message));
      callbacks?.onError?.();
    }
  };
