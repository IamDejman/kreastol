import type { PaymentVerification } from "@/types";
import { storageService } from "./storageService";
import { PAYMENT_CONFIG } from "@/lib/constants/config";

const createdTimestamps: Record<string, number> = {};

async function getCreatedAt(bookingCode: string): Promise<number> {
  if (!createdTimestamps[bookingCode]) {
    const b = await storageService.getBookingByCode(bookingCode);
    createdTimestamps[bookingCode] = b
      ? new Date(b.createdAt).getTime()
      : Date.now();
  }
  return createdTimestamps[bookingCode];
}

export async function verifyPayment(bookingCode: string): Promise<PaymentVerification> {
  const booking = await storageService.getBookingByCode(bookingCode);
  if (!booking) {
    return { status: "failed", message: "Booking not found." };
  }

  if (booking.paymentStatus === "confirmed") {
    return {
      status: "successful",
      reference: booking.paymentReference ?? undefined,
      amount: booking.totalAmount,
      paidAt: booking.paymentDate ?? undefined,
    };
  }

  if (booking.paymentStatus === "cancelled") {
    return { status: "failed", message: "Booking was cancelled." };
  }

  const elapsed = Date.now() - (await getCreatedAt(bookingCode));
  const delay = PAYMENT_CONFIG.autoConfirmDelay;
  const remaining = Math.max(0, Math.ceil((delay - elapsed) / 1000));

  if (elapsed >= delay) {
    await storageService.updateBooking(bookingCode, {
      paymentStatus: "confirmed",
      paymentReference: `MOCK-${Date.now()}`,
      paymentDate: new Date().toISOString(),
    });
    return {
      status: "successful",
      reference: `MOCK-${Date.now()}`,
      amount: booking.totalAmount,
      paidAt: new Date().toISOString(),
    };
  }

  return {
    status: "pending",
    timeRemaining: remaining,
    amount: booking.totalAmount,
  };
}

export async function getPaymentAccount(bookingCode: string): Promise<{
  accountNumber: string;
  bankName: string;
  accountName: string;
  expiresIn: string;
} | null> {
  const booking = await storageService.getBookingByCode(bookingCode);
  if (!booking) return null;
  const elapsed = Date.now() - (await getCreatedAt(bookingCode));
  const remaining = Math.max(0, PAYMENT_CONFIG.autoConfirmDelay - elapsed);
  return {
    accountNumber: booking.accountNumber,
    bankName: booking.bankName,
    accountName: booking.accountName,
    expiresIn: `${Math.ceil(remaining / 1000)}s`,
  };
}

export const paymentService = { verifyPayment, getPaymentAccount };
