import {
  GET_ACCESS_MODULES,
  GET_ACCESS_MODULES_ERROR,
  GET_ACCESS_MODULES_SUCCESS,
  SAVE_ACCESS_MODULES,
  SAVE_ACCESS_MODULES_ERROR,
  SAVE_ACCESS_MODULES_SUCCESS,
} from "./Modules.action";
import type { AccessModuleResponse, PermissionResponse } from "./Modules.types";

interface AccessModulesState {
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  modules: AccessModuleResponse[];
  permissions: PermissionResponse[];
}

const initialState: AccessModulesState = {
  loading: false,
  saveLoading: false,
  error: null,
  modules: [],
  permissions: [],
};

type Payload = {
  modules: AccessModuleResponse[];
  permissions: PermissionResponse[];
};

type AccessModulesAction = {
  type: string;
  payload?: string | Payload;
};

export const accessModulesReducer = (
  state: AccessModulesState = initialState,
  action: AccessModulesAction,
): AccessModulesState => {
  switch (action.type) {
    case GET_ACCESS_MODULES:
      return { ...state, loading: true, error: null };
    case GET_ACCESS_MODULES_SUCCESS: {
      const payload = (action.payload as Payload) ?? initialState;
      return {
        ...state,
        loading: false,
        error: null,
        modules: payload.modules,
        permissions: payload.permissions,
      };
    }
    case GET_ACCESS_MODULES_ERROR:
      return {
        ...state,
        loading: false,
        error: (action.payload as string) ?? null,
      };
    case SAVE_ACCESS_MODULES:
      return { ...state, saveLoading: true, error: null };
    case SAVE_ACCESS_MODULES_SUCCESS: {
      const payload = (action.payload as Payload) ?? {
        modules: state.modules,
        permissions: state.permissions,
      };
      return {
        ...state,
        saveLoading: false,
        error: null,
        modules: payload.modules,
        permissions: payload.permissions,
      };
    }
    case SAVE_ACCESS_MODULES_ERROR:
      return {
        ...state,
        saveLoading: false,
        error: (action.payload as string) ?? null,
      };
    default:
      return state;
  }
};
