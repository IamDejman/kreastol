"use client";

import { useState } from "react";
import type { Booking } from "@/types";
import type { PaymentVerification } from "@/types";
import { formatCurrency, copyToClipboard } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface PaymentStatusProps {
  booking: Booking;
  payment: PaymentVerification;
  onRefresh?: () => void;
  hasStartedPolling?: boolean;
  onStartPolling?: () => void;
}

export function PaymentStatus({
  booking,
  payment,
  onRefresh,
  hasStartedPolling = false,
  onStartPolling,
}: PaymentStatusProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopyBookingCode = async () => {
    const success = await copyToClipboard(booking.bookingCode);
    if (success) {
      setCopied(true);
      toast.success("Booking reference copied!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy booking reference");
    }
  };

  if (payment.status === "successful") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-success/30 bg-success/5 p-6 text-center">
          <p className="text-lg font-semibold text-success">
            Payment confirmed
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <p className="text-sm text-gray-600">
              Your booking <span className="font-mono font-semibold">{booking.bookingCode}</span> is confirmed.
            </p>
            <button
              onClick={handleCopyBookingCode}
              className="flex min-h-touch min-w-touch items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
              aria-label="Copy booking reference"
              title="Copy booking reference"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          {payment.paidAt && (
            <p className="mt-1 text-xs text-gray-500">
              Paid at {new Date(payment.paidAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (payment.status === "failed") {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-6">
        <p className="font-medium text-danger">Payment failed</p>
        <p className="mt-2 text-sm text-gray-600">{payment.message}</p>
      </div>
    );
  }

  // Show account details first if polling hasn't started
  if (!hasStartedPolling) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-gray-50 p-6">
          <p className="font-medium">Pay {formatCurrency(booking.totalAmount)} to confirm your booking.</p>
        </div>
        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Bank</p>
          <p className="font-medium">{booking.bankName}</p>
          <p className="mt-2 text-xs text-gray-500">Account number</p>
          <p className="font-mono font-medium">{booking.accountNumber}</p>
          <p className="mt-2 text-xs text-gray-500">Account name</p>
          <p className="font-medium">{booking.accountName}</p>
        </div>
        {onStartPolling && (
          <Button onClick={onStartPolling} fullWidth>
            I have made transfer
          </Button>
        )}
      </div>
    );
  }

  // Show waiting state after polling has started
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-gray-50 p-6">
        <div className="flex items-center gap-3">
          <Spinner size="md" />
          <div>
            <p className="font-medium">Waiting for payment</p>
            <p className="text-sm text-gray-600">
              Pay {formatCurrency(booking.totalAmount)} to confirm your booking.
            </p>
          </div>
        </div>
        {payment.timeRemaining !== undefined && payment.timeRemaining > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            Auto-confirm in ~{payment.timeRemaining}s (demo)
          </p>
        )}
      </div>
      <div className="rounded-lg border bg-gray-50 p-4">
        <p className="text-xs text-gray-500">Bank</p>
        <p className="font-medium">{booking.bankName}</p>
        <p className="mt-2 text-xs text-gray-500">Account number</p>
        <p className="font-mono font-medium">{booking.accountNumber}</p>
        <p className="mt-2 text-xs text-gray-500">Account name</p>
        <p className="font-medium">{booking.accountName}</p>
      </div>
      {onRefresh && (
        <Button variant="secondary" onClick={onRefresh} fullWidth>
          Refresh status
        </Button>
      )}
    </div>
  );
}
