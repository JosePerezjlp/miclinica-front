import type { Action } from "redux";
import type { ThunkAction } from "redux-thunk";
import toast from "react-hot-toast";
import { plansService } from "../../api/plans.service";
import type {
  CreatePlanRequest,
  PlanResponse,
  UpdatePlanRequest,
} from "./Plans.types";
import type { RootState } from "../../store/store";

export const GET_PLANS = "GET_PLANS";
export const GET_PLANS_SUCCESS = "GET_PLANS_SUCCESS";
export const GET_PLANS_ERROR = "GET_PLANS_ERROR";
export const SAVE_PLAN = "SAVE_PLAN";
export const SAVE_PLAN_SUCCESS = "SAVE_PLAN_SUCCESS";
export const SAVE_PLAN_ERROR = "SAVE_PLAN_ERROR";

export const onGetPlans = () => ({ type: GET_PLANS as typeof GET_PLANS });
export const onGetPlansSuccess = (plans: PlanResponse[]) => ({
  type: GET_PLANS_SUCCESS as typeof GET_PLANS_SUCCESS,
  payload: plans,
});
export const onGetPlansError = (error: string) => ({
  type: GET_PLANS_ERROR as typeof GET_PLANS_ERROR,
  payload: error,
});

export const onSavePlan = () => ({ type: SAVE_PLAN as typeof SAVE_PLAN });
export const onSavePlanSuccess = (plans: PlanResponse[]) => ({
  type: SAVE_PLAN_SUCCESS as typeof SAVE_PLAN_SUCCESS,
  payload: plans,
});
export const onSavePlanError = (error: string) => ({
  type: SAVE_PLAN_ERROR as typeof SAVE_PLAN_ERROR,
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

export const getPlansThunk =
  (): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onGetPlans());

    try {
      const plans = await plansService.list();
      dispatch(onGetPlansSuccess(plans));
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudieron cargar los planes.",
      );
      dispatch(onGetPlansError(message));
      toast.error(message);
    }
  };

export const createPlanThunk =
  (
    payload: CreatePlanRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSavePlan());

    try {
      await plansService.create(payload);
      const plans = await plansService.list();
      dispatch(onSavePlanSuccess(plans));
      toast.success("Plan creado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(error, "No se pudo crear el plan.");
      dispatch(onSavePlanError(message));
      toast.error(message);
      throw error;
    }
  };

export const updatePlanThunk =
  (
    id: number,
    payload: UpdatePlanRequest,
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSavePlan());

    try {
      await plansService.update(id, payload);
      const plans = await plansService.list();
      dispatch(onSavePlanSuccess(plans));
      toast.success("Plan actualizado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo actualizar el plan.",
      );
      dispatch(onSavePlanError(message));
      toast.error(message);
      throw error;
    }
  };

export const deletePlanThunk =
  (id: number): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onSavePlan());

    try {
      await plansService.remove(id);
      const plans = await plansService.list();
      dispatch(onSavePlanSuccess(plans));
      toast.success("Plan desactivado correctamente.");
    } catch (error) {
      const message = parseErrorMessage(
        error,
        "No se pudo desactivar el plan.",
      );
      dispatch(onSavePlanError(message));
      toast.error(message);
      throw error;
    }
  };
