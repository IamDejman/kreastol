"use client";

import { useEffect } from "react";
import { useBookingStore } from "@/store/bookingStore";
import { POLLING_INTERVALS } from "@/lib/constants/config";
import { useVisibilityChange } from "./useVisibilityChange";

export function useCalendarSync() {
  const syncCalendar = useBookingStore((s) => s.syncCalendar);
  const isVisible = useVisibilityChange();

  useEffect(() => {
    if (!isVisible) return;
    syncCalendar();
    const interval = setInterval(syncCalendar, POLLING_INTERVALS.calendarSync);
    return () => clearInterval(interval);
  }, [isVisible, syncCalendar]);
}
