import type { Booking } from "./booking.types";

export type CellStatus = "available" | "booked" | "selecting" | "selected" | "blocked";

export interface CalendarCell {
  date: string;
  roomNumber: number;
  status: CellStatus;
  booking?: Booking;
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: number;
}

export type CalendarView = "grid" | "list" | "week";
