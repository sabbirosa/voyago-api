import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  IAvailabilitySlotResponse,
  ICreateAvailabilitySlotPayload,
  IUpdateAvailabilitySlotPayload,
} from "./availability.interface";

export const AvailabilityService = {
  async createAvailabilitySlot(
    guideId: string,
    payload: ICreateAvailabilitySlotPayload
  ): Promise<IAvailabilitySlotResponse> {
    // Verify user is a guide
    const user = await prisma.user.findUnique({
      where: { id: guideId },
    });

    if (!user || user.role !== "GUIDE") {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Only guides can create availability slots"
      );
    }

    // Parse date if provided
    const date = payload.date ? new Date(payload.date) : null;

    // Create availability slot
    const slot = await prisma.availabilitySlot.create({
      data: {
        guideId,
        date: date as Date,
        dayOfWeek: payload.dayOfWeek ?? null,
        startTime: payload.startTime,
        endTime: payload.endTime,
        isRecurring: payload.isRecurring || false,
        isActive: true,
      },
    });

    return this.mapSlotToResponse(slot);
  },

  async getAvailabilitySlots(
    query: Record<string, string>,
    guideId?: string
  ): Promise<{
    slots: IAvailabilitySlotResponse[];
    meta: { page: number; limit: number; totalPage: number; total: number };
  }> {
    const baseFilter: any = {};

    // If guideId is provided (from authenticated user), filter by it
    // Otherwise use guideId from query if present
    if (guideId) {
      baseFilter.guideId = guideId;
    } else if (query.guideId) {
      baseFilter.guideId = query.guideId;
    }

    if (query.date) {
      baseFilter.date = new Date(query.date);
    }

    if (query.dayOfWeek) {
      baseFilter.dayOfWeek = parseInt(query.dayOfWeek);
    }

    if (query.isActive !== undefined) {
      baseFilter.isActive = query.isActive === "true";
    }

    // Remove isActive and guideId from query to prevent QueryBuilder from processing them as strings
    const filteredQuery = { ...query };
    delete filteredQuery.isActive;
    if (guideId) {
      delete filteredQuery.guideId; // Use the guideId parameter instead
    }

    // Use QueryBuilder for consistent query handling
    const queryBuilder = new QueryBuilder(prisma.availabilitySlot, filteredQuery)
      .filter(baseFilter)
      .sort({ createdAt: "desc" })
      .paginate();

    const [slots, meta] = await Promise.all([
      queryBuilder.build(),
      queryBuilder.getMeta(),
    ]);

    return {
      slots: slots.map((slot) => this.mapSlotToResponse(slot)),
      meta,
    };
  },

  async updateAvailabilitySlot(
    slotId: string,
    guideId: string,
    payload: IUpdateAvailabilitySlotPayload
  ): Promise<IAvailabilitySlotResponse> {
    // Get slot and verify ownership
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new AppError(httpStatus.NOT_FOUND, "Availability slot not found");
    }

    if (slot.guideId !== guideId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only update your own availability slots"
      );
    }

    // Update slot
    const updated = await prisma.availabilitySlot.update({
      where: { id: slotId },
      data: {
        date: payload.date ? new Date(payload.date) : slot.date,
        dayOfWeek: payload.dayOfWeek !== undefined ? payload.dayOfWeek : slot.dayOfWeek,
        startTime: payload.startTime || slot.startTime,
        endTime: payload.endTime || slot.endTime,
        isRecurring: payload.isRecurring !== undefined ? payload.isRecurring : slot.isRecurring,
        isActive: payload.isActive !== undefined ? payload.isActive : slot.isActive,
      },
    });

    return this.mapSlotToResponse(updated);
  },

  async deleteAvailabilitySlot(
    slotId: string,
    guideId: string
  ): Promise<void> {
    // Get slot and verify ownership
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new AppError(httpStatus.NOT_FOUND, "Availability slot not found");
    }

    if (slot.guideId !== guideId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only delete your own availability slots"
      );
    }

    await prisma.availabilitySlot.delete({
      where: { id: slotId },
    });
  },

  async checkAvailability(
    guideId: string,
    date: Date
  ): Promise<{ available: boolean; slots: IAvailabilitySlotResponse[] }> {
    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();

    // Check for specific date slots
    const dateSlots = await prisma.availabilitySlot.findMany({
      where: {
        guideId,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
        isActive: true,
      },
    });

    // Check for recurring slots (day of week)
    const recurringSlots = await prisma.availabilitySlot.findMany({
      where: {
        guideId,
        dayOfWeek,
        isRecurring: true,
        isActive: true,
      },
    });

    const allSlots = [...dateSlots, ...recurringSlots];

    return {
      available: allSlots.length > 0,
      slots: allSlots.map((slot) => this.mapSlotToResponse(slot)),
    };
  },

  // Helper method to map Prisma slot to response format
  mapSlotToResponse(slot: any): IAvailabilitySlotResponse {
    return {
      id: slot.id,
      guideId: slot.guideId,
      date: slot.date,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isRecurring: slot.isRecurring,
      isActive: slot.isActive,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  },
};

