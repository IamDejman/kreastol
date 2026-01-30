"use client";

import { useState } from "react";
import Link from "next/link";
import type { Booking } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/formatters";
import { useAuthStore } from "@/store/authStore";
import { supabaseService } from "@/lib/services/supabaseService";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface BookingCardProps {
  booking: Booking;
  onRefresh?: () => Promise<void>;
}

export function BookingCard({ booking, onRefresh }: BookingCardProps) {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const [updating, setUpdating] = useState(false);

  const handleConfirmPaid = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || booking.paymentStatus === "paid") return;
    setUpdating(true);
    try {
      await supabaseService.updateBooking(
        booking.bookingCode,
        {
          paymentStatus: "paid",
          paymentDate: new Date().toISOString(),
          holdExpiresAt: null,
        },
        { id: user.dbId, name: user.name, role: user.role }
      );
      await onRefresh?.();
      toast.success("Booking confirmed as paid.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm.");
    } finally {
      setUpdating(false);
    }
  };

  const handleReleaseHold = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    try {
      await supabaseService.updateBooking(
        booking.bookingCode,
        { holdExpiresAt: null },
        { id: user.dbId, name: user.name, role: user.role }
      );
      await onRefresh?.();
      toast.success("Hold released.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to release hold.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card block transition-shadow hover:shadow-lg">
      <Link href={`/booking/${booking.bookingCode}?from=receptionist`} className="block">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-foreground">{booking.bookingCode}</p>
            <p className="text-sm text-gray-600">
              Room {booking.roomNumber} · {booking.guestName}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {format(new Date(booking.checkIn), "MMM dd, yyyy")} –{" "}
              {format(new Date(booking.checkOut), "MMM dd, yyyy")}
            </p>
          </div>
          <Badge
            variant={booking.paymentStatus === "paid" ? "confirmed" : "cancelled"}
          >
            {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
          </Badge>
        </div>
        <p className="mt-2 text-sm font-medium text-primary">
          {formatCurrency(booking.totalAmount)}
        </p>
      </Link>
      {booking.paymentStatus === "unpaid" && onRefresh && (
        <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.preventDefault()}>
          <Button size="sm" variant="secondary" disabled={updating} onClick={handleConfirmPaid}>
            Confirm paid
          </Button>
          <Button size="sm" variant="secondary" disabled={updating} onClick={handleReleaseHold}>
            Release hold
          </Button>
        </div>
      )}
    </div>
  );
}
