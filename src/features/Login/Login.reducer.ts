import { LOGIN, LOGIN_SUCCESS, LOGIN_ERROR } from "./Login.action";

interface LoginState {
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: LoginState = {
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
};

type LoginAction = {
  type: string;
  payload?: string;
};

export const loginReducer = (
  state: LoginState = initialState,
  action: LoginAction,
): LoginState => {
  switch (action.type) {
    case LOGIN:
      return { ...state, loading: true, error: null };
    case LOGIN_SUCCESS:
      return { ...state, loading: false, token: action.payload ?? null };
    case LOGIN_ERROR:
      return { ...state, loading: false, error: action.payload ?? null };
    default:
      return state;
  }
};
