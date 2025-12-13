export type SubscriptionItem = {
  subscriptionId: string;
  channelId: string;
  channelTitle: string;
};

export type SubscriptionsExportV1 = {
  version: 1;
  exportedAt: string; // ISO datetime
  items: Array<{
    channelId: string;
    channelTitle?: string;
    subscriptionId?: string;
  }>;
};

