import { create } from "zustand";
import type { Booking, DateSelection, BookingFormData } from "@/types";
import { bookingService } from "@/lib/services/bookingService";
import { storageService } from "@/lib/services/storageService";

interface BookingStore {
  bookings: Booking[];
  bookedDates: Record<number, string[]>;
  blockedRooms: Record<number, string[]>; // roomNumber -> array of blocked dates
  selectedDates: DateSelection | null;
  isLoading: boolean;
  fetchBookings: () => Promise<void>;
  createBooking: (
    selection: DateSelection,
    formData: BookingFormData
  ) => Promise<Booking>;
  selectDates: (selection: DateSelection | null) => void;
  syncCalendar: () => Promise<void>;
  clearSelection: () => void;
  blockRoom: (roomNumber: number, dates: string[], reason?: string) => Promise<void>;
  unblockRoom: (roomNumber: number, dates: string[]) => Promise<void>;
  isRoomBlocked: (roomNumber: number, date: string) => boolean;
}

// Note: Blocked rooms are now loaded via fetchBookings() which is called on mount

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: [],
  bookedDates: {},
  blockedRooms: {},
  selectedDates: null,
  isLoading: false,

  fetchBookings: async () => {
    set({ isLoading: true });
    try {
      const bookings = await storageService.getBookings();
      const bookedDates = await bookingService.getBookedDates();
      // Also fetch blocked rooms from database
      const { supabaseService } = await import("@/lib/services/supabaseService");
      const blockedRooms = await supabaseService.getBlockedRooms();
      set({ bookings, bookedDates, blockedRooms, isLoading: false });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      set({ isLoading: false });
    }
  },

  createBooking: async (selection, formData) => {
    set({ isLoading: true });
    try {
      // Refresh bookings first to ensure we have the latest data
      await get().fetchBookings();
      
      // Check if any dates in the selection are blocked
      const { roomNumber, checkIn, checkOut } = selection;
      const blocked = get().blockedRooms[roomNumber] || [];
      const { getDatesInRange } = await import("@/lib/utils/dateUtils");
      const range = getDatesInRange(checkIn, checkOut);
      const hasBlockedDates = range.some((d) => blocked.includes(d));
      
      if (hasBlockedDates) {
        set({ isLoading: false });
        throw new Error("Selected dates include blocked dates. Room is unavailable.");
      }
      
      // The bookingService.createBooking will also validate availability
      // by calling isRoomAvailable which fetches fresh data from the database
      const booking = await bookingService.createBooking(selection, formData);
      await get().fetchBookings();
      set({ isLoading: false });
      return booking;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  selectDates: (selection) => set({ selectedDates: selection }),

  syncCalendar: async () => {
    try {
      const bookedDates = await bookingService.getBookedDates();
      // Also sync blocked rooms from database
      const { supabaseService } = await import("@/lib/services/supabaseService");
      const blockedRooms = await supabaseService.getBlockedRooms();
      set({ bookedDates, blockedRooms });
    } catch (error) {
      console.error("Error syncing calendar:", error);
    }
  },

  clearSelection: () => set({ selectedDates: null }),

  blockRoom: async (roomNumber, dates, reason) => {
    try {
      const { supabaseService } = await import("@/lib/services/supabaseService");
      await supabaseService.blockRoom(roomNumber, dates, reason);
      // Refresh blocked rooms from database
      const blockedRooms = await supabaseService.getBlockedRooms();
      set({ blockedRooms });
    } catch (error) {
      console.error("Error blocking room:", error);
      throw error;
    }
  },

  unblockRoom: async (roomNumber, dates) => {
    try {
      const { supabaseService } = await import("@/lib/services/supabaseService");
      await supabaseService.unblockRoom(roomNumber, dates);
      // Refresh blocked rooms from database
      const blockedRooms = await supabaseService.getBlockedRooms();
      set({ blockedRooms });
    } catch (error) {
      console.error("Error unblocking room:", error);
      throw error;
    }
  },

  isRoomBlocked: (roomNumber, date) => {
    const blocked = get().blockedRooms[roomNumber] || [];
    return blocked.includes(date);
  },
}));
