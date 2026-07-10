import type { Action } from "redux";
import type { ThunkAction } from "redux-thunk";
import toast from "react-hot-toast";
import {
  buildAutomaticFallbackEmail,
  mapAutomaticFormToCreateGroupRequest,
  mapCashFormToCreateGroupRequest,
} from "../../api/affiliateGroups.mappers";
import { groupsService } from "../../api/groups.service";
import { mobbexService } from "../../api/mobbex.service";
import type {
  CreateGroupSubmitResult,
  CreateAffiliateGroupModalPayload,
  FamiliarGroupsFilters,
  FamiliarGroupsPaginatedResponse,
  GroupResponse,
} from "./AffiliateGroups.types";
import type { RootState } from "../../store/store";
import { familiarGroupGet } from "../../api/groups.service";

function toDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function buildSubscriptionStartDate() {
  const now = new Date();

  return {
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

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
  ): ThunkAction<
    Promise<CreateGroupSubmitResult>,
    RootState,
    unknown,
    Action
  > =>
  async (dispatch) => {
    dispatch(onCreateGroup());

    try {
      const request =
        payload.mode === "automatic"
          ? mapAutomaticFormToCreateGroupRequest(payload)
          : mapCashFormToCreateGroupRequest(payload);

      const group = await groupsService.create(request);
      dispatch(onCreateGroupSuccess(group));

      if (payload.mode === "automatic" && payload.gateway === "MOBBEX") {
        if (!payload.mobbexSubscriptionId) {
          throw new Error("Seleccioná un plan de Mobbex antes de continuar.");
        }

        const subscriber = await mobbexService.createGroupSubscriber(
          group.id,
          payload.mobbexSubscriptionId,
          {
            customer: {
              email: buildAutomaticFallbackEmail({
                firstName: payload.firstName,
                lastName: payload.lastName,
                documentNumber: payload.dni,
              }),
              name: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim(),
              identification: toDigits(payload.dni),
            },
            startDate: buildSubscriptionStartDate(),
            webhook: payload.mobbexWebhook || undefined,
          },
        );

        if (!subscriber.result || !subscriber.sourceUrl) {
          throw new Error(
            subscriber.error ||
              subscriber.code ||
              "Mobbex no devolvió una URL para completar la suscripción.",
          );
        }

        toast.success(
          `Grupo #${group.id} creado. Link de Mobbex generado para enviar al cliente.`,
        );

        return {
          group,
          mobbexSourceUrl: subscriber.sourceUrl,
        };
      }

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
        if (Number(payload.planAmount ?? 0) > 0) {
          toast.success(
            `Grupo #${group.id} creado con ${group.affiliates.length} afiliado(s) y pago efectivo registrado.`,
          );
        } else {
          toast.success(
            `Grupo #${group.id} creado con ${group.affiliates.length} afiliado(s). No se registró pago efectivo porque el plan no tiene monto válido.`,
          );
        }
      }

      return { group };
    } catch (error) {
      const responseMessage = (
        error as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;

      const fallbackMessage =
        error instanceof Error ? error.message : "Could not create the group.";

      const parsedMessage = Array.isArray(responseMessage)
        ? responseMessage.join(", ")
        : (responseMessage ?? fallbackMessage);

      dispatch(onCreateGroupError(parsedMessage));
      toast.error(parsedMessage);
      throw new Error(parsedMessage);
    }
  };

// Action constants
export const GET_GROUPS = "GET_GROUPS";
export const GET_GROUPS_SUCCESS = "GET_GROUPS_SUCCESS";
export const GET_GROUPS_ERROR = "GET_GROUPS_ERROR";

// Action creators
export const onGetGroups = () => ({ type: GET_GROUPS as typeof GET_GROUPS });
export const onGetGroupsSuccess = (
  groups: FamiliarGroupsPaginatedResponse,
) => ({
  type: GET_GROUPS_SUCCESS as typeof GET_GROUPS_SUCCESS,
  payload: groups,
});
export const onGetGroupsError = (error: string) => ({
  type: GET_GROUPS_ERROR as typeof GET_GROUPS_ERROR,
  payload: error,
});

// Thunk
export const getGroupsThunk =
  (
    filters: FamiliarGroupsFilters = {},
  ): ThunkAction<Promise<void>, RootState, unknown, Action> =>
  async (dispatch) => {
    dispatch(onGetGroups());
    try {
      const groups = await familiarGroupGet.getGroups(filters);
      dispatch(onGetGroupsSuccess(groups));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al iniciar sesión";
      toast.error(message);
      dispatch(onGetGroupsError(message));
    }
  };
