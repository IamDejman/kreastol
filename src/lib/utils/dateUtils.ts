import {
  format,
  addDays,
  subDays,
  differenceInDays,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  isAfter,
  parseISO,
  isSameDay,
} from "date-fns";

export function formatDate(date: Date | string, fmt = "yyyy-MM-dd"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDisplayDate(date: Date | string): string {
  return formatDate(date, "MMM dd, yyyy");
}

export function getNights(checkIn: string, checkOut: string): number {
  return differenceInDays(parseISO(checkOut), parseISO(checkIn));
}

export function getDatesInRange(checkIn: string, checkOut: string): string[] {
  const start = parseISO(checkIn);
  // Exclude checkout date - only block dates from check-in up to (but not including) checkout
  const end = subDays(parseISO(checkOut), 1);
  const days = eachDayOfInterval({ start, end });
  return days.map((d) => format(d, "yyyy-MM-dd"));
}

export function isDateInRange(
  date: string,
  checkIn: string,
  checkOut: string
): boolean {
  const d = parseISO(date);
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  return isWithinInterval(d, { start, end });
}

export function addDaysToDate(dateStr: string, days: number): string {
  return format(addDays(parseISO(dateStr), days), "yyyy-MM-dd");
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end });
}

export function isPast(dateStr: string): boolean {
  return isBefore(parseISO(dateStr), new Date());
}

export { isSameDay };
