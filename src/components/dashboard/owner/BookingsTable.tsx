"use client";

import { useState } from "react";
import Link from "next/link";
import type { Booking } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils/formatters";
import { useAuthStore } from "@/store/authStore";
import { supabaseService } from "@/lib/services/supabaseService";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface BookingsTableProps {
  bookings: Booking[];
  onRefresh?: () => Promise<void>;
}

export function BookingsTable({ bookings, onRefresh }: BookingsTableProps) {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  const handleConfirmPaid = async (b: Booking) => {
    if (!user || b.paymentStatus === "paid") return;
    setUpdatingCode(b.bookingCode);
    try {
      await supabaseService.updateBooking(
        b.bookingCode,
        {
          paymentStatus: "paid",
          paymentDate: new Date().toISOString(),
          holdExpiresAt: null,
        },
        { id: user.dbId, name: user.name, role: user.role }
      );
      await onRefresh?.();
      toast.success("Booking confirmed as paid.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to confirm booking.");
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleCancelHold = async (b: Booking) => {
    if (!user) return;
    setUpdatingCode(b.bookingCode);
    try {
      await supabaseService.updateBooking(
        b.bookingCode,
        { holdExpiresAt: null },
        { id: user.dbId, name: user.name, role: user.role }
      );
      await onRefresh?.();
      toast.success("Hold released; dates are available again.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to release hold.");
    } finally {
      setUpdatingCode(null);
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border bg-gray-50 p-8 text-center text-gray-500">
        No bookings match your filters.
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-xl border bg-white">
      <div className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none md:hidden" aria-hidden="true" />
      <table className="w-full text-left text-sm min-w-[600px]">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-4 py-3 font-medium">Room</th>
            <th className="px-4 py-3 font-medium">Guest</th>
            <th className="px-4 py-3 font-medium">Dates</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.bookingCode} className="border-b last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/staff/booking/${b.bookingCode}?from=owner`}
                  className="font-medium text-primary hover:underline"
                >
                  {b.bookingCode}
                </Link>
              </td>
              <td className="px-4 py-3">{b.roomNumber}</td>
              <td className="px-4 py-3">{b.guestName}</td>
              <td className="px-4 py-3">
                {format(new Date(b.checkIn), "MMM dd, yyyy")} –{" "}
                {format(new Date(b.checkOut), "MMM dd, yyyy")}
              </td>
              <td className="px-4 py-3">{formatCurrency(b.totalAmount)}</td>
              <td className="px-4 py-3">
                <Badge
                  variant={b.paymentStatus === "paid" ? "confirmed" : "cancelled"}
                >
                  {b.paymentStatus.charAt(0).toUpperCase() + b.paymentStatus.slice(1)}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {b.paymentStatus === "unpaid" && (
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={updatingCode === b.bookingCode}
                      onClick={(e) => {
                        e.preventDefault();
                        handleConfirmPaid(b);
                      }}
                    >
                      Confirm paid
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={updatingCode === b.bookingCode}
                      onClick={(e) => {
                        e.preventDefault();
                        handleCancelHold(b);
                      }}
                    >
                      Release hold
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
