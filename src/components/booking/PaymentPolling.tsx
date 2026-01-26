"use client";

import { useState } from "react";
import type { Booking } from "@/types";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { PaymentStatus } from "./PaymentStatus";

interface PaymentPollingProps {
  booking: Booking;
}

export function PaymentPolling({ booking }: PaymentPollingProps) {
  const [hasStartedPolling, setHasStartedPolling] = useState(false);
  const { paymentStatus, manualRefresh } = usePaymentPolling(
    booking.bookingCode,
    hasStartedPolling
  );

  const handleStartPolling = () => {
    setHasStartedPolling(true);
  };

  return (
    <PaymentStatus
      booking={booking}
      payment={paymentStatus}
      onRefresh={manualRefresh}
      hasStartedPolling={hasStartedPolling}
      onStartPolling={handleStartPolling}
    />
  );
}
