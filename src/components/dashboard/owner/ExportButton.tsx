"use client";

import { Download } from "lucide-react";
import type { Booking } from "@/types";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

interface ExportButtonProps {
  bookings: Booking[];
  label?: string;
}

export function ExportButton({
  bookings,
  label = "Export CSV",
}: ExportButtonProps) {
  const handleExport = () => {
    const headers = [
      "Booking Code",
      "Room",
      "Guest",
      "Check-in",
      "Check-out",
      "Nights",
      "Amount",
      "Status",
    ];
    const rows = bookings.map((b) =>
      [
        b.bookingCode,
        b.roomNumber,
        b.guestName,
        b.checkIn,
        b.checkOut,
        b.nights,
        b.totalAmount,
        b.paymentStatus,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="secondary" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
