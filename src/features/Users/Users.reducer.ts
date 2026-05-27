import {
  GET_USERS,
  GET_USERS_ERROR,
  GET_USERS_SUCCESS,
  SAVE_USER,
  SAVE_USER_ERROR,
  SAVE_USER_SUCCESS,
} from "./Users.action";
import type { UserResponse } from "./Users.types";

interface UsersState {
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  data: UserResponse[];
}

const initialState: UsersState = {
  loading: false,
  saveLoading: false,
  error: null,
  data: [],
};

type UsersAction = {
  type: string;
  payload?: string | UserResponse[];
};

export const usersReducer = (
  state: UsersState = initialState,
  action: UsersAction,
): UsersState => {
  switch (action.type) {
    case GET_USERS:
      return { ...state, loading: true, error: null };
    case GET_USERS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        data: (action.payload as UserResponse[]) ?? [],
      };
    case GET_USERS_ERROR:
      return {
        ...state,
        loading: false,
        error: (action.payload as string) ?? null,
      };
    case SAVE_USER:
      return { ...state, saveLoading: true, error: null };
    case SAVE_USER_SUCCESS:
      return {
        ...state,
        saveLoading: false,
        error: null,
        data: (action.payload as UserResponse[]) ?? state.data,
      };
    case SAVE_USER_ERROR:
      return {
        ...state,
        saveLoading: false,
        error: (action.payload as string) ?? null,
      };
    default:
      return state;
  }
};
