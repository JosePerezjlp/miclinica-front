import type { Action } from "redux";
import type { ThunkAction } from "redux-thunk";
import toast from "react-hot-toast";
import { modulesService } from "../../api/modules.service";
import type {
  AccessModuleResponse,
  CreateModuleRequest,
  CreatePermissionRequest,
  PermissionResponse,
  UpdateModuleRequest,
  UpdatePermissionRequest,
} from "./Modules.types";
import type { RootState } from "../../store/store";

export const GET_ACCESS_MODULES = "GET_ACCESS_MODULES";
export const GET_ACCESS_MODULES_SUCCESS = "GET_ACCESS_MODULES_SUCCESS";
export const GET_ACCESS_MODULES_ERROR = "GET_ACCESS_MODULES_ERROR";
export const SAVE_ACCESS_MODULES = "SAVE_ACCESS_MODULES";
export const SAVE_ACCESS_MODULES_SUCCESS = "SAVE_ACCESS_MODULES_SUCCESS";
export const SAVE_ACCESS_MODULES_ERROR = "SAVE_ACCESS_MODULES_ERROR";

type AccessPayload = {
  modules: AccessModuleResponse[];
  permissions: PermissionResponse[];
};

export const onGetAccessModules = () => ({
  type: GET_ACCESS_MODULES as typeof GET_ACCESS_MODULES,
});
export const onGetAccessModulesSuccess = (payload: AccessPayload) => ({
  type: GET_ACCESS_MODULES_SUCCESS as typeof GET_ACCESS_MODULES_SUCCESS,
  payload,
});
export const onGetAccessModulesError = (error: string) => ({
  type: GET_ACCESS_MODULES_ERROR as typeof GET_ACCESS_MODULES_ERROR,
  payload: error,
});

export const onSaveAccessModules = () => ({
  type: SAVE_ACCESS_MODULES as typeof SAVE_ACCESS_MODULES,
});
export const onSaveAccessModulesSuccess = (payload: AccessPayload) => ({
  type: SAVE_ACCESS_MODULES_SUCCESS as typeof SAVE_ACCESS_MODULES_SUCCESS,
  payload,
});
export const onSaveAccessModulesError = (error: string) => ({
  type: SAVE_ACCESS_MODULES_ERROR as typeof SAVE_ACCESS_MODULES_ERROR,
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

async function loadAllAccessData() {
  const [modules, permissions] = await Promise.all([
    modulesService.listModules(),
    modulesService.listPermissions(),
  ]);

  return { modules, permissions };
}

export const getModulesThunk =
  (): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onGetAccessModules());

    try {
      const payload = await loadAllAccessData();
      dispatch(onGetAccessModulesSuccess(payload));
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudieron cargar los módulos.",
      );
      dispatch(onGetAccessModulesError(message));
      toast.error(message);
    }
  };

export const createModuleThunk =
  (
    payload: CreateModuleRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveAccessModules());

    try {
      await modulesService.createModule(payload);
      const nextPayload = await loadAllAccessData();
      dispatch(onSaveAccessModulesSuccess(nextPayload));
      toast.success("Módulo creado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(error, "No se pudo crear el módulo.");
      dispatch(onSaveAccessModulesError(message));
      toast.error(message);
      throw error;
    }
  };

export const updateModuleThunk =
  (
    id: number,
    payload: UpdateModuleRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveAccessModules());

    try {
      await modulesService.updateModule(id, payload);
      const nextPayload = await loadAllAccessData();
      dispatch(onSaveAccessModulesSuccess(nextPayload));
      toast.success("Módulo actualizado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo actualizar el módulo.",
      );
      dispatch(onSaveAccessModulesError(message));
      toast.error(message);
      throw error;
    }
  };

export const deleteModuleThunk =
  (id: number): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveAccessModules());

    try {
      await modulesService.removeModule(id);
      const nextPayload = await loadAllAccessData();
      dispatch(onSaveAccessModulesSuccess(nextPayload));
      toast.success("Módulo desactivado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo desactivar el módulo.",
      );
      dispatch(onSaveAccessModulesError(message));
      toast.error(message);
      throw error;
    }
  };

export const createPermissionThunk =
  (
    payload: CreatePermissionRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveAccessModules());

    try {
      await modulesService.createPermission(payload);
      const nextPayload = await loadAllAccessData();
      dispatch(onSaveAccessModulesSuccess(nextPayload));
      toast.success("Permiso creado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(error, "No se pudo crear el permiso.");
      dispatch(onSaveAccessModulesError(message));
      toast.error(message);
      throw error;
    }
  };

export const updatePermissionThunk =
  (
    id: number,
    payload: UpdatePermissionRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveAccessModules());

    try {
      await modulesService.updatePermission(id, payload);
      const nextPayload = await loadAllAccessData();
      dispatch(onSaveAccessModulesSuccess(nextPayload));
      toast.success("Permiso actualizado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo actualizar el permiso.",
      );
      dispatch(onSaveAccessModulesError(message));
      toast.error(message);
      throw error;
    }
  };

export const deletePermissionThunk =
  (id: number): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveAccessModules());

    try {
      await modulesService.removePermission(id);
      const nextPayload = await loadAllAccessData();
      dispatch(onSaveAccessModulesSuccess(nextPayload));
      toast.success("Permiso desactivado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo desactivar el permiso.",
      );
      dispatch(onSaveAccessModulesError(message));
      toast.error(message);
      throw error;
    }
  };
