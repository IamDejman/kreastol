"use client";

import { useState, useEffect, useCallback } from "react";
import type { PaymentVerification } from "@/types";
import { paymentService } from "@/lib/services/paymentService";
import { POLLING_INTERVALS } from "@/lib/constants/config";
import { useVisibilityChange } from "./useVisibilityChange";

export function usePaymentPolling(bookingCode: string, shouldPoll: boolean = false) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentVerification>({
    status: "pending",
  });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const isVisible = useVisibilityChange();

  const checkPayment = useCallback(() => {
    const result = paymentService.verifyPayment(bookingCode);
    setPaymentStatus(result);
    setLastChecked(new Date());
  }, [bookingCode]);

  useEffect(() => {
    if (!shouldPoll || paymentStatus.status === "successful" || !isVisible) return;
    checkPayment();
    const interval = setInterval(checkPayment, POLLING_INTERVALS.paymentStatus);
    return () => clearInterval(interval);
  }, [bookingCode, paymentStatus.status, isVisible, checkPayment, shouldPoll]);

  return { paymentStatus, lastChecked, manualRefresh: checkPayment };
}
