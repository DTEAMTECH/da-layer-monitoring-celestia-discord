export type User = {
  username: string;
  id: string;
  globalName: string;
};

export type Subscription = {
  userId: string;
  nodeBridgeId: string;
  subscribedAt: string;
};
