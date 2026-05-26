import type { ThunkAction } from "redux-thunk";
import type { RootState } from "../../store/store";
import type { Action } from "redux";
import apiClient from "../../api/apiClient";
import toast from "react-hot-toast";
import {AuthService} from "../../api/auth.service";

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
    try {
      const data = await AuthService.login(credentials.username, credentials.password);
      localStorage.setItem("token", data.accessToken);
      dispatch(onLoginSuccess(data.accessToken));
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
