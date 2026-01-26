"use client";

import Link from "next/link";
import type { Booking } from "@/types";
import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/Button";

interface BookingConfirmationProps {
  booking: Booking;
}

export function BookingConfirmation({ booking }: BookingConfirmationProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-success/30 bg-success/5 p-4">
        <p className="text-sm font-medium text-success">Booking created</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          {booking.bookingCode}
        </p>
      </div>
      <p className="text-sm text-gray-600">
        Your booking has been confirmed successfully.
      </p>
      {/* Payment section commented out */}
      {/* <p className="text-sm text-gray-600">
        Pay <strong>{formatCurrency(booking.totalAmount)}</strong> to the
        account below. Your booking will be confirmed automatically once payment
        is received.
      </p>
      <div className="rounded-lg border bg-gray-50 p-4">
        <p className="text-xs text-gray-500">Bank</p>
        <p className="font-medium">{booking.bankName}</p>
        <p className="mt-2 text-xs text-gray-500">Account number</p>
        <p className="font-mono font-medium">{booking.accountNumber}</p>
        <p className="mt-2 text-xs text-gray-500">Account name</p>
        <p className="font-medium">{booking.accountName}</p>
      </div> */}
      <Link href={`/booking/${booking.bookingCode}`} className="block">
        <Button fullWidth className="w-full">
          View booking details
        </Button>
      </Link>
    </div>
  );
}
