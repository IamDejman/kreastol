"use client";

import { format } from "date-fns";
import { parseISO } from "date-fns";
import type { DateSelection } from "@/types";
import { ROOM_CONFIG } from "@/lib/constants/config";
import { getNights } from "@/lib/utils/dateUtils";
import { formatCurrency } from "@/lib/utils/formatters";

interface BookingSummaryProps {
  selection: DateSelection;
}

export function BookingSummary({ selection }: BookingSummaryProps) {
  const room = ROOM_CONFIG.rooms.find((r) => r.number === selection.roomNumber);
  if (!room) return null;

  const nights = getNights(selection.checkIn, selection.checkOut);
  const total = nights * room.rate;

  return (
    <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Room</span>
        <span className="font-medium">{room.name}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Check-in</span>
        <span>{format(parseISO(selection.checkIn), "MMM dd, yyyy")}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Check-out</span>
        <span>{format(parseISO(selection.checkOut), "MMM dd, yyyy")}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Nights</span>
        <span>{nights}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Rate</span>
        <span>{formatCurrency(room.rate)} / night</span>
      </div>
      <div className="border-t pt-3">
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
