import {
  GET_PLANS,
  GET_PLANS_ERROR,
  GET_PLANS_SUCCESS,
  SAVE_PLAN,
  SAVE_PLAN_ERROR,
  SAVE_PLAN_SUCCESS,
} from "./Plans.action";
import type { PlanResponse } from "./Plans.types";

interface PlansState {
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  data: PlanResponse[];
}

const initialState: PlansState = {
  loading: false,
  saveLoading: false,
  error: null,
  data: [],
};

type PlansAction = {
  type: string;
  payload?: string | PlanResponse[];
};

export const plansReducer = (
  state: PlansState = initialState,
  action: PlansAction,
): PlansState => {
  switch (action.type) {
    case GET_PLANS:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case GET_PLANS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        data: (action.payload as PlanResponse[]) ?? [],
      };
    case GET_PLANS_ERROR:
      return {
        ...state,
        loading: false,
        error: (action.payload as string) ?? null,
      };
    case SAVE_PLAN:
      return {
        ...state,
        saveLoading: true,
        error: null,
      };
    case SAVE_PLAN_SUCCESS:
      return {
        ...state,
        saveLoading: false,
        error: null,
        data: (action.payload as PlanResponse[]) ?? state.data,
      };
    case SAVE_PLAN_ERROR:
      return {
        ...state,
        saveLoading: false,
        error: (action.payload as string) ?? null,
      };
    default:
      return state;
  }
};
