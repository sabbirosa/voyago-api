export interface ICreateAvailabilitySlotPayload {
  date?: string; // ISO date string, optional for recurring slots
  dayOfWeek?: number; // 0-6 (Sunday-Saturday), required if recurring
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isRecurring?: boolean;
}

export interface IUpdateAvailabilitySlotPayload {
  date?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  isActive?: boolean;
}

export interface IAvailabilitySlotResponse {
  id: string;
  guideId: string;
  date: Date | null;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

