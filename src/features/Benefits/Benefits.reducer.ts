import {
  GET_BENEFITS,
  GET_BENEFITS_ERROR,
  GET_BENEFITS_SUCCESS,
  SAVE_BENEFIT,
  SAVE_BENEFIT_ERROR,
  SAVE_BENEFIT_SUCCESS,
} from "./Benefits.action";
import type { Benefit } from "./Benefits.types";

interface BenefitsState {
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  data: Benefit[];
}

const initialState: BenefitsState = {
  loading: false,
  saveLoading: false,
  error: null,
  data: [],
};

type BenefitsAction = {
  type: string;
  payload?: string | Benefit[];
};

export const benefitsReducer = (
  state: BenefitsState = initialState,
  action: BenefitsAction,
): BenefitsState => {
  switch (action.type) {
    case GET_BENEFITS:
      return { ...state, loading: true, error: null };
    case GET_BENEFITS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        data: (action.payload as Benefit[]) ?? [],
      };
    case GET_BENEFITS_ERROR:
      return {
        ...state,
        loading: false,
        error: (action.payload as string) ?? null,
      };
    case SAVE_BENEFIT:
      return { ...state, saveLoading: true, error: null };
    case SAVE_BENEFIT_SUCCESS:
      return {
        ...state,
        saveLoading: false,
        error: null,
        data: (action.payload as Benefit[]) ?? state.data,
      };
    case SAVE_BENEFIT_ERROR:
      return {
        ...state,
        saveLoading: false,
        error: (action.payload as string) ?? null,
      };
    default:
      return state;
  }
};
