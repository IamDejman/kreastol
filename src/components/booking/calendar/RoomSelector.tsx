"use client";

import { ROOM_CONFIG } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";

interface RoomSelectorProps {
  selectedRoom: number;
  onSelect: (room: number) => void;
  className?: string;
}

export function RoomSelector({
  selectedRoom,
  onSelect,
  className,
}: RoomSelectorProps) {
  return (
    <div
      className={cn("flex gap-2 overflow-x-auto scrollbar-hide p-4", className)}
    >
      {ROOM_CONFIG.rooms.map((room) => (
        <button
          key={room.number}
          type="button"
          onClick={() => onSelect(room.number)}
          className={cn(
            "flex-shrink-0 rounded-lg px-6 py-3 text-left font-medium transition-all min-h-touch",
            selectedRoom === room.number
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
          style={{ minWidth: "120px" }}
        >
          <div className="text-sm">{room.name}</div>
          <div className="mt-1 text-xs opacity-90">
            ₦{room.rate.toLocaleString()}/night
          </div>
        </button>
      ))}
    </div>
  );
}
