import type { Action } from "redux";
import type { ThunkAction } from "redux-thunk";
import toast from "react-hot-toast";
import { citiesService } from "../../api/cities.service";
import type {
  CityResponse,
  CreateCityRequest,
  UpdateCityRequest,
} from "./Cities.types";
import type { RootState } from "../../store/store";

export const GET_CITIES = "GET_CITIES";
export const GET_CITIES_SUCCESS = "GET_CITIES_SUCCESS";
export const GET_CITIES_ERROR = "GET_CITIES_ERROR";
export const SAVE_CITY = "SAVE_CITY";
export const SAVE_CITY_SUCCESS = "SAVE_CITY_SUCCESS";
export const SAVE_CITY_ERROR = "SAVE_CITY_ERROR";

export const onGetCities = () => ({
  type: GET_CITIES as typeof GET_CITIES,
});
export const onGetCitiesSuccess = (cities: CityResponse[]) => ({
  type: GET_CITIES_SUCCESS as typeof GET_CITIES_SUCCESS,
  payload: cities,
});
export const onGetCitiesError = (error: string) => ({
  type: GET_CITIES_ERROR as typeof GET_CITIES_ERROR,
  payload: error,
});

export const onSaveCity = () => ({
  type: SAVE_CITY as typeof SAVE_CITY,
});
export const onSaveCitySuccess = (cities: CityResponse[]) => ({
  type: SAVE_CITY_SUCCESS as typeof SAVE_CITY_SUCCESS,
  payload: cities,
});
export const onSaveCityError = (error: string) => ({
  type: SAVE_CITY_ERROR as typeof SAVE_CITY_ERROR,
  payload: error,
});

function parseErrorMessage(error: unknown, fallback: string): string {
  const responseMessage = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(", ");
  }

  return responseMessage ?? (error instanceof Error ? error.message : fallback);
}

export const getCitiesThunk =
  (): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onGetCities());

    try {
      const cities = await citiesService.list();
      dispatch(onGetCitiesSuccess(cities));
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudieron cargar las ciudades.",
      );
      dispatch(onGetCitiesError(message));
      toast.error(message);
    }
  };

export const createCityThunk =
  (
    payload: CreateCityRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveCity());

    try {
      await citiesService.create(payload);
      const cities = await citiesService.list();
      dispatch(onSaveCitySuccess(cities));
      toast.success("Ciudad creada correctamente.");
    } catch (error) {
      const message = parseErrorMessage(error, "No se pudo crear la ciudad.");
      dispatch(onSaveCityError(message));
      toast.error(message);
      throw error;
    }
  };

export const updateCityThunk =
  (
    id: number,
    payload: UpdateCityRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveCity());

    try {
      await citiesService.update(id, payload);
      const cities = await citiesService.list();
      dispatch(onSaveCitySuccess(cities));
      toast.success("Ciudad actualizada correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo actualizar la ciudad.",
      );
      dispatch(onSaveCityError(message));
      toast.error(message);
      throw error;
    }
  };

export const deleteCityThunk =
  (id: number): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveCity());

    try {
      await citiesService.remove(id);
      const cities = await citiesService.list();
      dispatch(onSaveCitySuccess(cities));
      toast.success("Ciudad desactivada correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo desactivar la ciudad.",
      );
      dispatch(onSaveCityError(message));
      toast.error(message);
      throw error;
    }
  };
