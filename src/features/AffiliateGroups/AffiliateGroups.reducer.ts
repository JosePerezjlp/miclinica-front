import {
  CREATE_GROUP,
  CREATE_GROUP_ERROR,
  CREATE_GROUP_SUCCESS,
  GET_GROUPS,
  GET_GROUPS_ERROR,
  GET_GROUPS_SUCCESS,
} from "./AffiliateGroups.action";
import type {
  FamiliarGroupsPaginatedResponse,
  GroupResponse,
} from "./AffiliateGroups.types";

interface AffiliateGroupsState {
  createGroupLoading: boolean;
  createGroupError: string | null;
  lastCreatedGroup: GroupResponse | null;
  loading: boolean;
  data: GroupResponse[];
  meta: FamiliarGroupsPaginatedResponse["meta"];
}

const initialState: AffiliateGroupsState = {
  createGroupLoading: false,
  createGroupError: null,
  lastCreatedGroup: null,
  loading: false,
  data: [],
  meta: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  },
};

type AffiliateGroupsAction = {
  type: string;
  payload?: string | GroupResponse | FamiliarGroupsPaginatedResponse;
};

export const affiliateGroupsReducer = (
  state: AffiliateGroupsState = initialState,
  action: AffiliateGroupsAction,
): AffiliateGroupsState => {
  switch (action.type) {
    case CREATE_GROUP:
      return {
        ...state,
        createGroupLoading: true,
        createGroupError: null,
      };
    case CREATE_GROUP_SUCCESS:
      return {
        ...state,
        createGroupLoading: false,
        createGroupError: null,
        lastCreatedGroup: (action.payload as GroupResponse) ?? null,
      };
    case CREATE_GROUP_ERROR:
      return {
        ...state,
        createGroupLoading: false,
        createGroupError: (action.payload as string) ?? null,
      };
    case GET_GROUPS:
      return {
        ...state,
        loading: true,
        createGroupError: null,
      };
    case GET_GROUPS_SUCCESS: {
      const payload = action.payload as FamiliarGroupsPaginatedResponse;
      return {
        ...state,
        loading: false,
        data: payload?.items ?? [],
        meta: payload?.meta ?? state.meta,
      };
    }
    case GET_GROUPS_ERROR:
      return {
        ...state,
        loading: false,
        createGroupError: (action.payload as string) ?? null,
        data: [],
      };
    default:
      return state;
  }
};
