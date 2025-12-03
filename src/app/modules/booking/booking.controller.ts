import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BookingService } from "./booking.service";

export const BookingController = {
  createBooking: catchAsync(async (req: Request, res: Response) => {
    const booking = await BookingService.createBooking(
      req.user!.userId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Booking request created successfully",
      data: { booking },
    });
  }),

  getBookings: catchAsync(async (req: Request, res: Response) => {
    const { bookings, meta } = await BookingService.getBookings(
      req.user!.userId,
      req.user!.role,
      req.query as Record<string, string>
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bookings retrieved successfully",
      data: { bookings },
      meta,
    });
  }),

  getBookingById: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const booking = await BookingService.getBookingById(
      id,
      req.user!.userId,
      req.user!.role
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Booking retrieved successfully",
      data: { booking },
    });
  }),

  updateBookingStatus: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const booking = await BookingService.updateBookingStatus(
      id,
      req.user!.userId,
      req.user!.role,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Booking status updated successfully",
      data: { booking },
    });
  }),
};

