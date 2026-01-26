"use client";

import Link from "next/link";
import type { Booking } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils/formatters";

interface BookingsTableProps {
  bookings: Booking[];
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border bg-gray-50 p-8 text-center text-gray-500">
        No bookings match your filters.
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-xl border bg-white">
      {/* Scroll indicator for mobile */}
      <div className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none md:hidden" aria-hidden="true" />
      <table className="w-full text-left text-sm min-w-[600px]">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-4 py-3 font-medium">Room</th>
            <th className="px-4 py-3 font-medium">Guest</th>
            <th className="px-4 py-3 font-medium">Dates</th>
            <th className="px-4 py-3 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.bookingCode} className="border-b last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/booking/${b.bookingCode}?from=owner`}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
