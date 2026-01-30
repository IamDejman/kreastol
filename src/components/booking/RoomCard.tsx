"use client";

import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/formatters";
import type { ROOM_CONFIG } from "@/lib/constants/config";

type Room = (typeof ROOM_CONFIG)["rooms"][number];

interface RoomCardProps {
  room: Room;
  selected: boolean;
  onSelect: () => void;
}

export function RoomCard({ room, selected, onSelect }: RoomCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-touch w-full flex-col overflow-hidden rounded-xl border-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <div className="flex flex-col gap-1 p-4">
        <span className="font-heading text-lg font-semibold text-foreground">
          {room.name}
        </span>
        <span className="text-sm text-gray-600">
          {formatCurrency(room.rate)} / night
        </span>
      </div>
    </button>
  );
}
