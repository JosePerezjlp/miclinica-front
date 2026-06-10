import {
  GET_CITIES,
  GET_CITIES_ERROR,
  GET_CITIES_SUCCESS,
  SAVE_CITY,
  SAVE_CITY_ERROR,
  SAVE_CITY_SUCCESS,
} from "./Cities.action";
import type { CityResponse } from "./Cities.types";

interface CitiesState {
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  data: CityResponse[];
}

const initialState: CitiesState = {
  loading: false,
  saveLoading: false,
  error: null,
  data: [],
};

type CitiesAction = {
  type: string;
  payload?: string | CityResponse[];
};

export const citiesReducer = (
  state: CitiesState = initialState,
  action: CitiesAction,
): CitiesState => {
  switch (action.type) {
    case GET_CITIES:
      return { ...state, loading: true, error: null };
    case GET_CITIES_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        data: (action.payload as CityResponse[]) ?? [],
      };
    case GET_CITIES_ERROR:
      return {
        ...state,
        loading: false,
        error: (action.payload as string) ?? null,
      };
    case SAVE_CITY:
      return { ...state, saveLoading: true, error: null };
    case SAVE_CITY_SUCCESS:
      return {
        ...state,
        saveLoading: false,
        error: null,
        data: (action.payload as CityResponse[]) ?? state.data,
      };
    case SAVE_CITY_ERROR:
      return {
        ...state,
        saveLoading: false,
        error: (action.payload as string) ?? null,
      };
    default:
      return state;
  }
};
