import Stripe from "stripe";
import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { config } from "../../config/env";
import { AppError } from "../../errorHelpers/AppError";
import { BookingService } from "../booking/booking.service";
import {
  IPaymentResponse,
  PaymentStatus,
} from "./payment.interface";

// Initialize Stripe
const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

export const PaymentService = {
  async createPaymentSession(
    bookingId: string,
    touristId: string
  ): Promise<IPaymentResponse> {
    if (!stripe) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Stripe is not configured"
      );
    }
    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: true,
        tourist: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // Authorization check
    if (booking.touristId !== touristId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only create payment for your own bookings"
      );
    }

    // Validate booking status
    if (booking.status !== "ACCEPTED") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Booking must be accepted before payment"
      );
    }

    // Check if payment already exists and succeeded
    if (booking.payment && booking.payment.status === "SUCCEEDED") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment already completed for this booking"
      );
    }

    // Validate booking date is in the future
    const now = new Date();
    if (booking.date <= now) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot pay for past bookings"
      );
    }

    // Create or update payment record
    let payment = booking.payment;
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          bookingId,
          amount: booking.totalPrice,
          currency: "USD",
          status: "PENDING",
        },
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: booking.listing.title,
              description: `Tour booking for ${booking.date.toLocaleDateString()} - ${booking.groupSize} person(s)`,
            },
            unit_amount: Math.round(booking.totalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${config.frontendUrl}/dashboard/tourist/bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/dashboard/tourist/bookings?payment=cancelled`,
      client_reference_id: bookingId,
      metadata: {
        bookingId,
        touristId: booking.touristId,
        guideId: booking.guideId,
        listingId: booking.listingId,
      },
      customer_email: booking.tourist.email,
    });

    // Update payment record with Stripe session ID
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeCheckoutSessionId: session.id,
      },
    });

    return {
      ...this.mapPaymentToResponse(updatedPayment),
      checkoutUrl: session.url || undefined,
    };
  },

  async handleWebhook(
    signature: string,
    body: string | Buffer
  ): Promise<void> {
    if (!stripe) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Stripe is not configured"
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        config.stripe.webhookSecret
      );
    } catch (err) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Webhook signature verification failed: ${err}`
      );
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case "charge.refunded":
      case "payment_intent.refunded": {
        const charge = event.data.object as Stripe.Charge | Stripe.PaymentIntent;
        await this.handleRefund(charge);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handlePaymentFailed(session);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  },

  async handleCheckoutCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    const bookingId = session.client_reference_id || session.metadata?.bookingId;

    if (!bookingId) {
      console.error("No booking ID found in Stripe session");
      return;
    }

    // Check if already processed (idempotency)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId,
        stripePaymentId: session.payment_intent as string,
      },
    });

    if (existingPayment && existingPayment.status === "SUCCEEDED") {
      console.log(`Payment already processed for booking ${bookingId}`);
      return;
    }

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        bookingId,
        stripeCheckoutSessionId: session.id,
      },
      data: {
        status: "SUCCEEDED",
        stripePaymentIntentId: session.payment_intent as string,
        stripeCustomerId: session.customer as string,
        stripePaymentId: session.payment_intent as string,
        paidAt: new Date(),
      },
    });

    // Get booking details for notification
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    // Update booking status to PAID
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "PAID" },
    });

    // Send notifications
    if (booking) {
      // Notify tourist
      await NotificationService.createNotification({
        userId: booking.touristId,
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Payment Successful!",
        message: `Your payment for "${booking.listing.title}" has been confirmed. Your tour is booked!`,
        dataJson: { bookingId, listingId: booking.listingId },
      }).catch((error) => {
        console.error("[Payment] Failed to send notification:", error);
      });

      // Notify guide
      await NotificationService.createNotification({
        userId: booking.guideId,
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Payment Received",
        message: `Payment has been received for booking "${booking.listing.title}".`,
        dataJson: { bookingId, listingId: booking.listingId },
      }).catch((error) => {
        console.error("[Payment] Failed to send notification:", error);
      });
    }
  },

  async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const bookingId = paymentIntent.metadata?.bookingId;

    if (!bookingId) {
      console.error("No booking ID found in PaymentIntent metadata");
      return;
    }

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        bookingId,
        stripePaymentIntentId: paymentIntent.id,
      },
      data: {
        status: "SUCCEEDED",
        stripePaymentId: paymentIntent.id,
        stripeCustomerId: paymentIntent.customer as string,
        paidAt: new Date(),
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "PAID" },
    });
  },

  async handleRefund(
    charge: Stripe.Charge | Stripe.PaymentIntent
  ): Promise<void> {
    const paymentId =
      "payment_intent" in charge
        ? charge.payment_intent
        : charge.payment_intent || charge.id;

    if (!paymentId) {
      console.error("No payment ID found in refund event");
      return;
    }

    // Find payment by Stripe payment ID
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { stripePaymentId: paymentId as string },
          { stripePaymentIntentId: paymentId as string },
        ],
      },
    });

    if (!payment) {
      console.error(`Payment not found for refund: ${paymentId}`);
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: "CANCELLED" },
    });
  },

  async handlePaymentFailed(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    const bookingId = session.client_reference_id || session.metadata?.bookingId;

    if (!bookingId) {
      return;
    }

    // Get booking for notification
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    // Update payment status to FAILED
    await prisma.payment.updateMany({
      where: {
        bookingId,
        stripeCheckoutSessionId: session.id,
      },
      data: {
        status: "FAILED",
      },
    });

    // Booking stays as ACCEPTED (tourist can retry)
    // Send notification to tourist
    if (booking) {
      await NotificationService.createNotification({
        userId: booking.touristId,
        type: NotificationType.PAYMENT_FAILED,
        title: "Payment Failed",
        message: `Your payment for "${booking.listing.title}" failed. Please try again.`,
        dataJson: { bookingId, listingId: booking.listingId },
      }).catch((error) => {
        console.error("[Payment] Failed to send notification:", error);
      });
    }
  },

  async getPaymentByBookingId(
    bookingId: string,
    userId: string,
    userRole: string
  ): Promise<IPaymentResponse | null> {
    // Get booking to verify authorization
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // Authorization check
    if (userRole !== "ADMIN") {
      if (
        userRole === "TOURIST" &&
        booking.touristId !== userId
      ) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You can only view payment for your own bookings"
        );
      }
      if (userRole === "GUIDE" && booking.guideId !== userId) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You can only view payment for bookings on your listings"
        );
      }
    }

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      return null;
    }

    return this.mapPaymentToResponse(payment);
  },

  // Helper method to map Prisma payment to response format
  mapPaymentToResponse(payment: any): IPaymentResponse {
    return {
      id: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status as PaymentStatus,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeCustomerId: payment.stripeCustomerId,
      stripePaymentId: payment.stripePaymentId,
      paidAt: payment.paidAt,
      refundedAt: payment.refundedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  },
};

