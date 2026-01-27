"use client";

import { RoomBlockingManager } from "@/components/landing/RoomBlockingManager";

export default function OwnerRoomsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Room Management
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Block or unblock rooms for maintenance, repairs, or other reasons.
        </p>
      </div>
      <RoomBlockingManager />
    </div>
  );
}
