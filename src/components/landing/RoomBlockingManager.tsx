"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, eachDayOfInterval, addDays } from "date-fns";
import { useBookingStore } from "@/store/bookingStore";
import { useAuthStore } from "@/store/authStore";
import { ROOM_CONFIG } from "@/lib/constants/config";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { X, Lock, Unlock } from "lucide-react";

export function RoomBlockingManager() {
  const user = useAuthStore((s) => s.user);
  const blockedRooms = useBookingStore((s) => s.blockedRooms);
  const bookedDates = useBookingStore((s) => s.bookedDates);
  const blockRoom = useBookingStore((s) => s.blockRoom);
  const unblockRoom = useBookingStore((s) => s.unblockRoom);
  const fetchBookings = useBookingStore((s) => s.fetchBookings);
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<number>(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Only show for authenticated staff (owner or receptionist)
  if (!user || (user.role !== "owner" && user.role !== "receptionist")) {
    return null;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const blockedDates = blockedRooms[selectedRoom] || [];

  const handleBlock = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for blocking this room");
      return;
    }

    if (startDate > endDate) {
      setError("End date must be on or after start date");
      return;
    }

    if (startDate < today) {
      setError("Cannot block dates in the past");
      return;
    }

    // Check if any dates in the range are already booked
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const range = eachDayOfInterval({ start, end });
    const dates = range.map((d) => format(d, "yyyy-MM-dd"));
    const roomBookedDates = bookedDates[selectedRoom] || [];
    const conflictingDates = dates.filter((d) => roomBookedDates.includes(d));
    
    if (conflictingDates.length > 0) {
      setError(
        `Cannot block dates that are already booked. Conflicting dates: ${conflictingDates.join(", ")}`
      );
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const actor = user
        ? { id: user.dbId, name: user.name, role: user.role }
        : undefined;
      await blockRoom(selectedRoom, dates, reason.trim(), actor);
      await fetchBookings(); // Refresh to update calendar
      setStartDate("");
      setEndDate("");
      setReason("");
      // After successfully blocking dates, close the manager and
      // navigate to the main calendar, focused on the blocked week
      setIsOpen(false);
      if (startDate) {
        const params = new URLSearchParams({
          focusDate: startDate,
        });
        router.push(`/?${params.toString()}`);
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to block room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (date: string) => {
    setIsLoading(true);
    try {
      const actor = user
        ? { id: user.dbId, name: user.name, role: user.role }
        : undefined;
      await unblockRoom(selectedRoom, [date], actor);
      await fetchBookings(); // Refresh to update calendar
    } catch (err: any) {
      setError(err.message || "Failed to unblock room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblockRange = async (dates: string[]) => {
    setIsLoading(true);
    try {
      const actor = user
        ? { id: user.dbId, name: user.name, role: user.role }
        : undefined;
      await unblockRoom(selectedRoom, dates, actor);
      await fetchBookings(); // Refresh to update calendar
    } catch (err: any) {
      setError(err.message || "Failed to unblock dates");
    } finally {
      setIsLoading(false);
    }
  };

  // Group consecutive blocked dates
  const groupedBlockedDates = (() => {
    if (blockedDates.length === 0) return [];
    
    const sorted = [...blockedDates].sort();
    const groups: string[][] = [];
    let currentGroup: string[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = parseISO(sorted[i - 1]);
      const curr = parseISO(sorted[i]);
      const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentGroup.push(sorted[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = [sorted[i]];
      }
    }
    groups.push(currentGroup);
    return groups;
  })();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-4 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-touch min-w-touch"
      >
        <Lock className="h-4 w-4" />
        Manage Room Blocks
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setError("");
          setStartDate("");
          setEndDate("");
          setReason("");
        }}
        title="Room Blocking Management"
      >
        <div className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Room Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Select Room
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-touch"
            >
              {ROOM_CONFIG.rooms.map((room) => (
                <option key={room.number} value={room.number}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {/* Block New Dates */}
          <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-foreground">Block New Dates</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  className="min-h-touch"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  className="min-h-touch"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Reason
              </label>
              <Input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Under maintenance, Repairs"
                className="min-h-touch"
              />
            </div>

            <Button
              onClick={handleBlock}
              disabled={isLoading || !startDate || !endDate}
              fullWidth
            >
              {isLoading ? "Blocking..." : "Block Dates"}
            </Button>
          </div>

          {/* Currently Blocked Dates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Currently Blocked Dates ({blockedDates.length})
            </h3>
            
            {blockedDates.length === 0 ? (
              <p className="text-sm text-gray-500">No dates blocked for this room.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groupedBlockedDates.map((group, idx) => {
                  const start = parseISO(group[0]);
                  const end = parseISO(group[group.length - 1]);
                  const isRange = group.length > 1;
                  
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {isRange
                            ? `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`
                            : format(start, "MMM dd, yyyy")}
                        </p>
                        {isRange && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {group.length} day{group.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnblockRange(group)}
                        disabled={isLoading}
                        className="flex min-h-touch min-w-touch items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
