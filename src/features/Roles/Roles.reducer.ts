import {
  GET_ROLES,
  GET_ROLES_ERROR,
  GET_ROLES_SUCCESS,
  SAVE_ROLE,
  SAVE_ROLE_ERROR,
  SAVE_ROLE_SUCCESS,
} from "./Roles.action";
import type { RoleResponse } from "./Roles.types";

interface RolesState {
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  data: RoleResponse[];
}

const initialState: RolesState = {
  loading: false,
  saveLoading: false,
  error: null,
  data: [],
};

type RolesAction = {
  type: string;
  payload?: string | RoleResponse[];
};

export const rolesReducer = (
  state: RolesState = initialState,
  action: RolesAction,
): RolesState => {
  switch (action.type) {
    case GET_ROLES:
      return { ...state, loading: true, error: null };
    case GET_ROLES_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        data: (action.payload as RoleResponse[]) ?? [],
      };
    case GET_ROLES_ERROR:
      return {
        ...state,
        loading: false,
        error: (action.payload as string) ?? null,
      };
    case SAVE_ROLE:
      return { ...state, saveLoading: true, error: null };
    case SAVE_ROLE_SUCCESS:
      return {
        ...state,
        saveLoading: false,
        error: null,
        data: (action.payload as RoleResponse[]) ?? state.data,
      };
    case SAVE_ROLE_ERROR:
      return {
        ...state,
        saveLoading: false,
        error: (action.payload as string) ?? null,
      };
    default:
      return state;
  }
};
