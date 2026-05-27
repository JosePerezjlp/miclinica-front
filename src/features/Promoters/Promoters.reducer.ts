import {
  GET_PROMOTERS,
  GET_PROMOTERS_ERROR,
  GET_PROMOTERS_SUCCESS,
  SAVE_PROMOTER,
  SAVE_PROMOTER_ERROR,
  SAVE_PROMOTER_SUCCESS,
} from "./Promoters.action";
import type { PromoterResponse } from "./Promoters.types";

interface PromotersState {
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  data: PromoterResponse[];
}

const initialState: PromotersState = {
  loading: false,
  saveLoading: false,
  error: null,
  data: [],
};

type PromotersAction = {
  type: string;
  payload?: string | PromoterResponse[];
};

export const promotersReducer = (
  state: PromotersState = initialState,
  action: PromotersAction,
): PromotersState => {
  switch (action.type) {
    case GET_PROMOTERS:
      return { ...state, loading: true, error: null };
    case GET_PROMOTERS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        data: (action.payload as PromoterResponse[]) ?? [],
      };
    case GET_PROMOTERS_ERROR:
      return {
        ...state,
        loading: false,
        error: (action.payload as string) ?? null,
      };
    case SAVE_PROMOTER:
      return { ...state, saveLoading: true, error: null };
    case SAVE_PROMOTER_SUCCESS:
      return {
        ...state,
        saveLoading: false,
        error: null,
        data: (action.payload as PromoterResponse[]) ?? state.data,
      };
    case SAVE_PROMOTER_ERROR:
      return {
        ...state,
        saveLoading: false,
        error: (action.payload as string) ?? null,
      };
    default:
      return state;
  }
};
