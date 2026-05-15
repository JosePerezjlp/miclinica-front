import { REGISTER, REGISTER_SUCCESS, REGISTER_ERROR } from "./Register.action";

interface RegisterState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: RegisterState = {
  loading: false,
  success: false,
  error: null,
};

type RegisterAction = {
  type: string;
  payload?: string;
};

export const registerReducer = (
  state: RegisterState = initialState,
  action: RegisterAction,
): RegisterState => {
  switch (action.type) {
    case REGISTER:
      return { ...state, loading: true, error: null, success: false };
    case REGISTER_SUCCESS:
      return { ...state, loading: false, success: true };
    case REGISTER_ERROR:
      return { ...state, loading: false, error: action.payload ?? null };
    default:
      return state;
  }
};
