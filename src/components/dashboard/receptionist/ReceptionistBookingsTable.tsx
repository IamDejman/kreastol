"use client";

import Link from "next/link";
import type { Booking } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/formatters";

interface ReceptionistBookingsTableProps {
  bookings: Booking[];
}

export function ReceptionistBookingsTable({ bookings }: ReceptionistBookingsTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border bg-gray-50 p-8 text-center text-gray-500">
        No bookings match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-4 py-3 font-medium">Room</th>
            <th className="px-4 py-3 font-medium">Guest</th>
            <th className="px-4 py-3 font-medium">Dates</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.bookingCode} className="border-b last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/booking/${b.bookingCode}?from=receptionist`}
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
                  variant={
                    b.paymentStatus === "confirmed"
                      ? "confirmed"
                      : b.paymentStatus === "cancelled"
                        ? "cancelled"
                        : "pending"
                  }
                >
                  {b.paymentStatus.charAt(0).toUpperCase() + b.paymentStatus.slice(1)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
