import type { Action } from "redux";
import type { ThunkAction } from "redux-thunk";
import toast from "react-hot-toast";
import { promotersService } from "../../api/promoters.service";
import type {
  CreatePromoterRequest,
  PromoterResponse,
  UpdatePromoterRequest,
} from "./Promoters.types";
import type { RootState } from "../../store/store";

export const GET_PROMOTERS = "GET_PROMOTERS";
export const GET_PROMOTERS_SUCCESS = "GET_PROMOTERS_SUCCESS";
export const GET_PROMOTERS_ERROR = "GET_PROMOTERS_ERROR";
export const SAVE_PROMOTER = "SAVE_PROMOTER";
export const SAVE_PROMOTER_SUCCESS = "SAVE_PROMOTER_SUCCESS";
export const SAVE_PROMOTER_ERROR = "SAVE_PROMOTER_ERROR";

export const onGetPromoters = () => ({
  type: GET_PROMOTERS as typeof GET_PROMOTERS,
});
export const onGetPromotersSuccess = (promoters: PromoterResponse[]) => ({
  type: GET_PROMOTERS_SUCCESS as typeof GET_PROMOTERS_SUCCESS,
  payload: promoters,
});
export const onGetPromotersError = (error: string) => ({
  type: GET_PROMOTERS_ERROR as typeof GET_PROMOTERS_ERROR,
  payload: error,
});

export const onSavePromoter = () => ({
  type: SAVE_PROMOTER as typeof SAVE_PROMOTER,
});
export const onSavePromoterSuccess = (promoters: PromoterResponse[]) => ({
  type: SAVE_PROMOTER_SUCCESS as typeof SAVE_PROMOTER_SUCCESS,
  payload: promoters,
});
export const onSavePromoterError = (error: string) => ({
  type: SAVE_PROMOTER_ERROR as typeof SAVE_PROMOTER_ERROR,
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

export const getPromotersThunk =
  (): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onGetPromoters());

    try {
      const promoters = await promotersService.list();
      dispatch(onGetPromotersSuccess(promoters));
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudieron cargar los promotores.",
      );
      dispatch(onGetPromotersError(message));
      toast.error(message);
    }
  };

export const createPromoterThunk =
  (
    payload: CreatePromoterRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSavePromoter());

    try {
      await promotersService.create(payload);
      const promoters = await promotersService.list();
      dispatch(onSavePromoterSuccess(promoters));
      toast.success("Promotor creado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(error, "No se pudo crear el promotor.");
      dispatch(onSavePromoterError(message));
      toast.error(message);
      throw error;
    }
  };

export const updatePromoterThunk =
  (
    id: number,
    payload: UpdatePromoterRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSavePromoter());

    try {
      await promotersService.update(id, payload);
      const promoters = await promotersService.list();
      dispatch(onSavePromoterSuccess(promoters));
      toast.success("Promotor actualizado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo actualizar el promotor.",
      );
      dispatch(onSavePromoterError(message));
      toast.error(message);
      throw error;
    }
  };

export const deletePromoterThunk =
  (id: number): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSavePromoter());

    try {
      await promotersService.remove(id);
      const promoters = await promotersService.list();
      dispatch(onSavePromoterSuccess(promoters));
      toast.success("Promotor desactivado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo desactivar el promotor.",
      );
      dispatch(onSavePromoterError(message));
      toast.error(message);
      throw error;
    }
  };
