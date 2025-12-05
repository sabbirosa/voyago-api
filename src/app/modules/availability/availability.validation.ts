import { z } from "zod";

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/; // HH:mm format

export const createAvailabilitySlotSchema = z.object({
  body: z.object({
    date: z.string().datetime().optional(),
    dayOfWeek: z
      .number()
      .int()
      .min(0)
      .max(6)
      .optional(),
    startTime: z.string().regex(timeRegex, "Start time must be in HH:mm format"),
    endTime: z.string().regex(timeRegex, "End time must be in HH:mm format"),
    isRecurring: z.boolean().optional().default(false),
  }).refine(
    (data) => {
      // If recurring, dayOfWeek is required
      if (data.isRecurring && data.dayOfWeek === undefined) {
        return false;
      }
      // If not recurring, date is required
      if (!data.isRecurring && !data.date) {
        return false;
      }
      return true;
    },
    {
      message: "Recurring slots require dayOfWeek, non-recurring slots require date",
    }
  ).refine(
    (data) => {
      // Validate that endTime is after startTime
      const [startHour, startMin] = data.startTime.split(":").map(Number);
      const [endHour, endMin] = data.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return endMinutes > startMinutes;
    },
    {
      message: "End time must be after start time",
    }
  ),
});

export const updateAvailabilitySlotSchema = z.object({
  body: z.object({
    date: z.string().datetime().optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional(),
    isRecurring: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Slot ID is required"),
  }),
});

export const deleteAvailabilitySlotSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Slot ID is required"),
  }),
});

export const getAvailabilitySlotsSchema = z.object({
  query: z.object({
    guideId: z.string().optional(),
    date: z.string().datetime().optional(),
    dayOfWeek: z.string().optional(),
    isActive: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const checkAvailabilitySchema = z.object({
  query: z.object({
    guideId: z.string().min(1, "Guide ID is required"),
    date: z.string().datetime("Invalid date format"),
  }),
});

