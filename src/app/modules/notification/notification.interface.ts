export enum NotificationType {
  BOOKING_REQUESTED = "BOOKING_REQUESTED",
  BOOKING_ACCEPTED = "BOOKING_ACCEPTED",
  BOOKING_DECLINED = "BOOKING_DECLINED",
  BOOKING_CANCELLED = "BOOKING_CANCELLED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  TOUR_REMINDER = "TOUR_REMINDER",
  REVIEW_RECEIVED = "REVIEW_RECEIVED",
  LISTING_APPROVED = "LISTING_APPROVED",
  LISTING_REJECTED = "LISTING_REJECTED",
  ACCOUNT_BANNED = "ACCOUNT_BANNED",
  ACCOUNT_UNBANNED = "ACCOUNT_UNBANNED",
}

export interface INotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  dataJson: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  dataJson?: Record<string, any>;
}


