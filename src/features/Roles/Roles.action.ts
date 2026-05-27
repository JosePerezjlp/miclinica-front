import type { Action } from "redux";
import type { ThunkAction } from "redux-thunk";
import toast from "react-hot-toast";
import { rolesService } from "../../api/roles.service";
import type {
  CreateRoleRequest,
  RoleResponse,
  UpdateRoleRequest,
} from "./Roles.types";
import type { RootState } from "../../store/store";

export const GET_ROLES = "GET_ROLES";
export const GET_ROLES_SUCCESS = "GET_ROLES_SUCCESS";
export const GET_ROLES_ERROR = "GET_ROLES_ERROR";
export const SAVE_ROLE = "SAVE_ROLE";
export const SAVE_ROLE_SUCCESS = "SAVE_ROLE_SUCCESS";
export const SAVE_ROLE_ERROR = "SAVE_ROLE_ERROR";

export const onGetRoles = () => ({ type: GET_ROLES as typeof GET_ROLES });
export const onGetRolesSuccess = (roles: RoleResponse[]) => ({
  type: GET_ROLES_SUCCESS as typeof GET_ROLES_SUCCESS,
  payload: roles,
});
export const onGetRolesError = (error: string) => ({
  type: GET_ROLES_ERROR as typeof GET_ROLES_ERROR,
  payload: error,
});

export const onSaveRole = () => ({ type: SAVE_ROLE as typeof SAVE_ROLE });
export const onSaveRoleSuccess = (roles: RoleResponse[]) => ({
  type: SAVE_ROLE_SUCCESS as typeof SAVE_ROLE_SUCCESS,
  payload: roles,
});
export const onSaveRoleError = (error: string) => ({
  type: SAVE_ROLE_ERROR as typeof SAVE_ROLE_ERROR,
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

export const getRolesThunk =
  (): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onGetRoles());

    try {
      const roles = await rolesService.list();
      dispatch(onGetRolesSuccess(roles));
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudieron cargar los roles.",
      );
      dispatch(onGetRolesError(message));
      toast.error(message);
    }
  };

export const createRoleThunk =
  (
    payload: CreateRoleRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveRole());

    try {
      await rolesService.create(payload);
      const roles = await rolesService.list();
      dispatch(onSaveRoleSuccess(roles));
      toast.success("Rol creado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(error, "No se pudo crear el rol.");
      dispatch(onSaveRoleError(message));
      toast.error(message);
      throw error;
    }
  };

export const updateRoleThunk =
  (
    id: number,
    payload: UpdateRoleRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveRole());

    try {
      await rolesService.update(id, payload);
      const roles = await rolesService.list();
      dispatch(onSaveRoleSuccess(roles));
      toast.success("Rol actualizado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(error, "No se pudo actualizar el rol.");
      dispatch(onSaveRoleError(message));
      toast.error(message);
      throw error;
    }
  };

export const deleteRoleThunk =
  (id: number): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveRole());

    try {
      await rolesService.remove(id);
      const roles = await rolesService.list();
      dispatch(onSaveRoleSuccess(roles));
      toast.success("Rol desactivado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(error, "No se pudo desactivar el rol.");
      dispatch(onSaveRoleError(message));
      toast.error(message);
      throw error;
    }
  };
