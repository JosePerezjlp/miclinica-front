import type { Action } from "redux";
import type { ThunkAction } from "redux-thunk";
import toast from "react-hot-toast";
import {
  mapAutomaticFormToCreateGroupRequest,
  mapCashFormToCreateGroupRequest,
} from "../../api/affiliateGroups.mappers";
import { groupsService } from "../../api/groups.service";
import type {
  CreateAffiliateGroupModalPayload,
  GroupResponse,
} from "./AffiliateGroups.types";
import type { RootState } from "../../store/store";

export const CREATE_GROUP = "CREATE_GROUP";
export const CREATE_GROUP_SUCCESS = "CREATE_GROUP_SUCCESS";
export const CREATE_GROUP_ERROR = "CREATE_GROUP_ERROR";

export const onCreateGroup = () => ({
  type: CREATE_GROUP as typeof CREATE_GROUP,
});

export const onCreateGroupSuccess = (group: GroupResponse) => ({
  type: CREATE_GROUP_SUCCESS as typeof CREATE_GROUP_SUCCESS,
  payload: group,
});

export const onCreateGroupError = (error: string) => ({
  type: CREATE_GROUP_ERROR as typeof CREATE_GROUP_ERROR,
  payload: error,
});

export const onCreateGroupThunk =
  (
    payload: CreateAffiliateGroupModalPayload,
  ): ThunkAction<Promise<GroupResponse>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onCreateGroup());

    try {
      const request =
        payload.mode === "automatic"
          ? mapAutomaticFormToCreateGroupRequest(payload)
          : mapCashFormToCreateGroupRequest(payload);

      const group = await groupsService.create(request);
      dispatch(onCreateGroupSuccess(group));

      if (payload.mode === "automatic") {
        const charge = group.initialCharge;
        if (charge?.executed) {
          if (charge.success) {
            toast.success(
              `Grupo #${group.id} creado. Cobro inicial aprobado (${payload.gateway}).`,
            );
          } else {
            toast.error(
              `Grupo #${group.id} creado. Cobro inicial rechazado (${charge.result ?? "ERROR"}).`,
            );
          }
        } else {
          toast.success(
            `Grupo #${group.id} creado con ${payload.gateway}. Cobro inicial no ejecutado: ${charge?.skippedReason ?? "sin detalle"}.`,
          );
        }
      } else {
        toast.success(
          `Group #${group.id} created with ${group.affiliates.length} affiliate(s).`,
        );
      }

      return group;
    } catch (error) {
      const message = (
        error as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;

      const parsedMessage = Array.isArray(message)
        ? message.join(", ")
        : (message ?? "Could not create the group.");

      dispatch(onCreateGroupError(parsedMessage));
      toast.error(parsedMessage);
      throw error;
    }
  };
