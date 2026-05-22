import apiClient from "./apiClient";
import type {
  MobbexGroupSubscriberResponse,
  MobbexSubscriptionSummary,
} from "../features/AffiliateGroups/AffiliateGroups.types";

interface MobbexSubscriptionsApiResponse {
  result: boolean;
  items: MobbexSubscriptionSummary[];
}

export const mobbexService = {
  async searchSubscriptions(search = "") {
    const { data } = await apiClient.get<MobbexSubscriptionsApiResponse>(
      "/mobbex/subscriptions",
      {
        params: { search },
      },
    );

    return data.items ?? [];
  },

  async createGroupSubscriber(
    groupId: number,
    subscriptionId: string,
    payload: Record<string, unknown>,
  ) {
    const { data } = await apiClient.post<MobbexGroupSubscriberResponse>(
      `/mobbex/groups/${groupId}/subscriptions/${subscriptionId}/subscribers`,
      payload,
    );

    return data;
  },
};
