import type { Action } from "redux";
import type { ThunkAction } from "redux-thunk";
import toast from "react-hot-toast";
import { benefitsService } from "../../api/benefits.service";
import type {
  Benefit,
  CreateBenefitRequest,
  UpdateBenefitRequest,
} from "./Benefits.types";
import type { RootState } from "../../store/store";

export const GET_BENEFITS = "GET_BENEFITS";
export const GET_BENEFITS_SUCCESS = "GET_BENEFITS_SUCCESS";
export const GET_BENEFITS_ERROR = "GET_BENEFITS_ERROR";
export const SAVE_BENEFIT = "SAVE_BENEFIT";
export const SAVE_BENEFIT_SUCCESS = "SAVE_BENEFIT_SUCCESS";
export const SAVE_BENEFIT_ERROR = "SAVE_BENEFIT_ERROR";

export const onGetBenefits = () => ({
  type: GET_BENEFITS as typeof GET_BENEFITS,
});
export const onGetBenefitsSuccess = (benefits: Benefit[]) => ({
  type: GET_BENEFITS_SUCCESS as typeof GET_BENEFITS_SUCCESS,
  payload: benefits,
});
export const onGetBenefitsError = (error: string) => ({
  type: GET_BENEFITS_ERROR as typeof GET_BENEFITS_ERROR,
  payload: error,
});

export const onSaveBenefit = () => ({
  type: SAVE_BENEFIT as typeof SAVE_BENEFIT,
});
export const onSaveBenefitSuccess = (benefits: Benefit[]) => ({
  type: SAVE_BENEFIT_SUCCESS as typeof SAVE_BENEFIT_SUCCESS,
  payload: benefits,
});
export const onSaveBenefitError = (error: string) => ({
  type: SAVE_BENEFIT_ERROR as typeof SAVE_BENEFIT_ERROR,
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

export const getBenefitsThunk =
  (): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onGetBenefits());

    try {
      const benefits = await benefitsService.list();
      dispatch(onGetBenefitsSuccess(benefits));
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudieron cargar los beneficios.",
      );
      dispatch(onGetBenefitsError(message));
      toast.error(message);
    }
  };

export const createBenefitThunk =
  (
    payload: CreateBenefitRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveBenefit());

    try {
      await benefitsService.create(payload);
      const benefits = await benefitsService.list();
      dispatch(onSaveBenefitSuccess(benefits));
      toast.success("Beneficio creado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(error, "No se pudo crear el beneficio.");
      dispatch(onSaveBenefitError(message));
      toast.error(message);
      throw error;
    }
  };

export const updateBenefitThunk =
  (
    id: number,
    payload: UpdateBenefitRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveBenefit());

    try {
      await benefitsService.update(id, payload);
      const benefits = await benefitsService.list();
      dispatch(onSaveBenefitSuccess(benefits));
      toast.success("Beneficio actualizado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo actualizar el beneficio.",
      );
      dispatch(onSaveBenefitError(message));
      toast.error(message);
      throw error;
    }
  };

export const deleteBenefitThunk =
  (id: number): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSaveBenefit());

    try {
      await benefitsService.remove(id);
      const benefits = await benefitsService.list();
      dispatch(onSaveBenefitSuccess(benefits));
      toast.success("Beneficio desactivado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo desactivar el beneficio.",
      );
      dispatch(onSaveBenefitError(message));
      toast.error(message);
      throw error;
    }
  };
