import type { ThunkAction } from "redux-thunk";
import type { RootState } from "../../store/store";
import type { Action } from "redux";
import apiClient from "../../api/apiClient";
import toast from "react-hot-toast";

// Action constants
export const REGISTER = "REGISTER";
export const REGISTER_SUCCESS = "REGISTER_SUCCESS";
export const REGISTER_ERROR = "REGISTER_ERROR";

// Action creators
export const onRegister = () => ({ type: REGISTER as typeof REGISTER });
export const onRegisterSuccess = () => ({
  type: REGISTER_SUCCESS as typeof REGISTER_SUCCESS,
});
export const onRegisterError = (error: string) => ({
  type: REGISTER_ERROR as typeof REGISTER_ERROR,
  payload: error,
});

// Thunk
export const onRegisterThunk =
  (
    userData: { nombre: string; username: string; password: string },
    callbacks?: { onSuccess?: () => void; onError?: () => void },
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onRegister());
    try {
      await apiClient.post("/auth/register", userData);
      dispatch(onRegisterSuccess());
      toast.success("Cuenta creada exitosamente");
      callbacks?.onSuccess?.();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al registrarse";
      toast.error(message);
      dispatch(onRegisterError(message));
      callbacks?.onError?.();
    }
  };
