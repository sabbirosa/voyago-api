export interface ICreateMessagePayload {
  bookingId: string;
  body: string;
}

export interface IMessageResponse {
  id: string;
  bookingId: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fromUser?: {
    id: string;
    name: string;
    profile?: {
      avatarUrl: string | null;
    };
  };
  toUser?: {
    id: string;
    name: string;
    profile?: {
      avatarUrl: string | null;
    };
  };
}

