import type { Booking, BookingFormData, DateSelection } from "@/types";
import { storageService } from "./storageService";
import { ROOM_CONFIG } from "@/lib/constants/config";
import { getNights, getDatesInRange } from "@/lib/utils/dateUtils";
import {
  generateBookingCode,
  getMockBankDetails,
} from "@/lib/utils/generators";

export async function getBookedDates(): Promise<Record<number, string[]>> {
  const bookings = await storageService.getBookings();
  const result: Record<number, string[]> = {};

  for (let r = 1; r <= ROOM_CONFIG.totalRooms; r++) {
    result[r] = [];
  }

  for (const b of bookings) {
    // For booked dates, we need to include all nights from check-in to check-out (exclusive of checkout)
    // getDatesInRange already does this correctly (excludes checkout date)
    const dates = getDatesInRange(b.checkIn, b.checkOut);
    for (const d of dates) {
      if (!result[b.roomNumber].includes(d)) {
        result[b.roomNumber].push(d);
      }
    }
  }

  for (const r of Object.keys(result)) {
    result[Number(r)].sort();
  }
  return result;
}

async function isRoomAvailable(
  roomNumber: number,
  checkIn: string,
  checkOut: string
): Promise<boolean> {
  // Fetch fresh booked dates from database to avoid stale data
  const booked = await getBookedDates();
  
  // Get all dates that would be occupied by this booking
  // This includes all nights from check-in to check-out (exclusive of checkout)
  // For example: checkIn=26th, checkOut=28th → blocks 26th and 27th (2 nights)
  const range = getDatesInRange(checkIn, checkOut);
  
  // Also check blocked rooms
  const { supabaseService } = await import("./supabaseService");
  const blockedRooms = await supabaseService.getBlockedRooms();
  const blockedDates = blockedRooms[roomNumber] || [];
  
  // Check if any date in the range is already booked OR blocked
  const hasConflict = range.some((d) => 
    booked[roomNumber]?.includes(d) || blockedDates.includes(d)
  );
  
  return !hasConflict;
}

export async function createBooking(
  selection: DateSelection,
  formData: BookingFormData
): Promise<Booking> {
  const { roomNumber, checkIn, checkOut } = selection;
  
  // Always check availability with fresh data from database
  const available = await isRoomAvailable(roomNumber, checkIn, checkOut);
  if (!available) {
    // Get booked dates to provide a better error message
    const booked = await getBookedDates();
    const range = getDatesInRange(checkIn, checkOut);
    const conflictingDates = range.filter((d) => booked[roomNumber]?.includes(d));
    throw new Error(
      `Selected dates are no longer available. Conflicting dates: ${conflictingDates.join(", ")}`
    );
  }

  const room = ROOM_CONFIG.rooms.find((r) => r.number === roomNumber);
  if (!room) throw new Error("Invalid room.");

  const nights = getNights(checkIn, checkOut);
  const totalAmount = nights * room.rate;
  const bank = getMockBankDetails();
  const now = new Date().toISOString();

  const booking: Booking = {
    bookingCode: generateBookingCode(),
    roomNumber: roomNumber as 1 | 2 | 3 | 4,
    roomRate: room.rate,
    checkIn,
    checkOut,
    nights,
    totalAmount,
    guestName: formData.guestName,
    guestPhone: formData.guestPhone,
    guestEmail: formData.guestEmail,
    // Payment account details - kept for type compatibility but not displayed
    accountNumber: bank.accountNumber,
    bankName: bank.bankName,
    accountName: bank.accountName,
    paymentStatus: "unpaid",
    paymentReference: `MOCK-${Date.now()}`,
    paymentDate: now,
    createdAt: now,
    updatedAt: now,
  };

  await storageService.saveBooking(booking);
  return booking;
}

export async function getBookingsByRoom(roomNumber: number): Promise<Booking[]> {
  const bookings = await storageService.getBookings();
  return bookings.filter((b) => b.roomNumber === roomNumber);
}

export const bookingService = {
  getBookedDates,
  createBooking,
  getBookingsByRoom,
};
