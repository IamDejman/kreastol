"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ROOM_CONFIG } from "@/lib/constants/config";
import { DateRangeFilter } from "@/components/dashboard/shared/DateRangeFilter";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

interface BookingsFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
  roomFilter: string;
  startDate: string;
  endDate: string;
  onApply: (filters: { roomFilter: string; startDate: string; endDate: string }) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function BookingsFilterDropdown({
  isOpen,
  onClose,
  buttonRef,
  roomFilter,
  startDate,
  endDate,
  onApply,
  onClear,
  hasActiveFilters,
}: BookingsFilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [tempRoomFilter, setTempRoomFilter] = useState(roomFilter);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  // Reset temporary values when dropdown opens or when actual filters change
  useEffect(() => {
    if (isOpen) {
      setTempRoomFilter(roomFilter);
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
  }, [isOpen, roomFilter, startDate, endDate]);

  const handleApply = () => {
    onApply({
      roomFilter: tempRoomFilter,
      startDate: tempStartDate,
      endDate: tempEndDate,
    });
    onClose();
  };

  const handleClear = () => {
    setTempRoomFilter("all");
    setTempStartDate("");
    setTempEndDate("");
    onClear();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, buttonRef]);

  useEffect(() => {
    if (!isOpen || !buttonRef.current || !dropdownRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current || !dropdownRef.current) return;
      
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      const dropdownWidth = 288; // w-72 = 288px
      const spacing = 8;
      
      // Position dropdown below the button
      let top = buttonRect.bottom + spacing;
      let right = window.innerWidth - buttonRect.right;
      
      // Adjust if dropdown would go off bottom of screen
      const dropdownHeight = dropdown.offsetHeight || 400;
      if (top + dropdownHeight > window.innerHeight) {
        top = buttonRect.top - dropdownHeight - spacing;
      }
      
      // Adjust if dropdown would go off right edge
      if (right + dropdownWidth > window.innerWidth) {
        right = window.innerWidth - dropdownWidth - 16;
      }
      
      // Ensure it doesn't go off left edge
      if (right < 16) {
        right = 16;
      }
      
      dropdown.style.top = `${top}px`;
      dropdown.style.right = `${right}px`;
      dropdown.style.left = "auto";
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, buttonRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 w-72 rounded-lg border border-gray-200 bg-white shadow-xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-3 py-1.5">
              <h3 className="text-xs font-semibold text-foreground">
                Filter
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-foreground min-w-touch min-h-touch flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2.5 p-2.5">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Room
                </label>
                <select
                  value={tempRoomFilter}
                  onChange={(e) => setTempRoomFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-touch appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
                >
                  <option value="all">All rooms</option>
                  {ROOM_CONFIG.rooms.map((room) => (
                    <option key={room.number} value={room.number.toString()}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Date Range
                </label>
                <DateRangeFilter
                  startDate={tempStartDate}
                  endDate={tempEndDate}
                  onStartDateChange={setTempStartDate}
                  onEndDateChange={setTempEndDate}
                />
              </div>
              
              <div className="flex gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApply}
                  className="flex-1"
                >
                  Apply
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
