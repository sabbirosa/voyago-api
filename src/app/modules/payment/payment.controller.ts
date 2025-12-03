import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

export const PaymentController = {
  createPaymentSession: catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const payment = await PaymentService.createPaymentSession(
      bookingId,
      req.user!.userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment session created successfully",
      data: { payment },
    });
  }),

  handleWebhook: catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Missing stripe-signature header",
      });
    }

    await PaymentService.handleWebhook(signature, req.body);

    // Return 200 to acknowledge receipt
    res.status(httpStatus.OK).json({ received: true });
  }),

  getPaymentByBooking: catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const payment = await PaymentService.getPaymentByBookingId(
      bookingId,
      req.user!.userId,
      req.user!.role
    );

    if (!payment) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "Payment not found for this booking",
      });
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment retrieved successfully",
      data: { payment },
    });
  }),
};

