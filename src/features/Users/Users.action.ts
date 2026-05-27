import type { Action } from "redux";
import type { ThunkAction } from "redux-thunk";
import toast from "react-hot-toast";
import { usersService } from "../../api/users.service";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "./Users.types";
import type { RootState } from "../../store/store";

export const GET_USERS = "GET_USERS";
export const GET_USERS_SUCCESS = "GET_USERS_SUCCESS";
export const GET_USERS_ERROR = "GET_USERS_ERROR";
export const SAVE_USER = "SAVE_USER";
export const SAVE_USER_SUCCESS = "SAVE_USER_SUCCESS";
export const SAVE_USER_ERROR = "SAVE_USER_ERROR";

export const onGetUsers = () => ({ type: GET_USERS as typeof GET_USERS });
export const onGetUsersSuccess = (users: UserResponse[]) => ({
  type: GET_USERS_SUCCESS as typeof GET_USERS_SUCCESS,
  payload: users,
});
export const onGetUsersError = (error: string) => ({
  type: GET_USERS_ERROR as typeof GET_USERS_ERROR,
  payload: error,
});

export const onSaveUser = () => ({ type: SAVE_USER as typeof SAVE_USER });
export const onSaveUserSuccess = (users: UserResponse[]) => ({
  type: SAVE_USER_SUCCESS as typeof SAVE_USER_SUCCESS,
  payload: users,
});
export const onSaveUserError = (error: string) => ({
  type: SAVE_USER_ERROR as typeof SAVE_USER_ERROR,
  payload: error,
});

function parseErrorMessage(error: unknown, fallback: string) {
  const responseMessage = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(", ");
  }

  return responseMessage ?? (error instanceof Error ? error.message : fallback);
}

export const getUsersThunk =
  (): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onGetUsers());

    try {
      const users = await usersService.list();
      dispatch(onGetUsersSuccess(users));
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudieron cargar los usuarios.",
      );
      dispatch(onGetUsersError(message));
      toast.error(message);
    }
  };

export const createUserThunk =
  (
    payload: CreateUserRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveUser());

    try {
      await usersService.create(payload);
      const users = await usersService.list();
      dispatch(onSaveUserSuccess(users));
      toast.success("Usuario creado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(error, "No se pudo crear el usuario.");
      dispatch(onSaveUserError(message));
      toast.error(message);
      throw error;
    }
  };

export const updateUserThunk =
  (
    uid: string,
    payload: UpdateUserRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveUser());

    try {
      await usersService.update(uid, payload);
      const users = await usersService.list();
      dispatch(onSaveUserSuccess(users));
      toast.success("Usuario actualizado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo actualizar el usuario.",
      );
      dispatch(onSaveUserError(message));
      toast.error(message);
      throw error;
    }
  };

export const deleteUserThunk =
  (uid: string): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveUser());

    try {
      await usersService.remove(uid);
      const users = await usersService.list();
      dispatch(onSaveUserSuccess(users));
      toast.success("Usuario desactivado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo desactivar el usuario.",
      );
      dispatch(onSaveUserError(message));
      toast.error(message);
      throw error;
    }
  };
