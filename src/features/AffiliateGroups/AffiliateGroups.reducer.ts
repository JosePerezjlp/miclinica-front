import {
  CREATE_GROUP,
  CREATE_GROUP_ERROR,
  CREATE_GROUP_SUCCESS,
} from "./AffiliateGroups.action";
import type { GroupResponse } from "./AffiliateGroups.types";

interface AffiliateGroupsState {
  createGroupLoading: boolean;
  createGroupError: string | null;
  lastCreatedGroup: GroupResponse | null;
}

const initialState: AffiliateGroupsState = {
  createGroupLoading: false,
  createGroupError: null,
  lastCreatedGroup: null,
};

type AffiliateGroupsAction = {
  type: string;
  payload?: string | GroupResponse;
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
    default:
      return state;
  }
};
