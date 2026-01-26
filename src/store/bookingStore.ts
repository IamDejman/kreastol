import { create } from "zustand";
import type { Booking, DateSelection, BookingFormData } from "@/types";
import { bookingService } from "@/lib/services/bookingService";
import { storageService } from "@/lib/services/storageService";

interface BookingStore {
  bookings: Booking[];
  bookedDates: Record<number, string[]>;
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
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: [],
  bookedDates: {},
  selectedDates: null,
  isLoading: false,

  fetchBookings: async () => {
    set({ isLoading: true });
    try {
      const bookings = await storageService.getBookings();
      const bookedDates = await bookingService.getBookedDates();
      set({ bookings, bookedDates, isLoading: false });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      set({ isLoading: false });
    }
  },

  createBooking: async (selection, formData) => {
    set({ isLoading: true });
    try {
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
      set({ bookedDates });
    } catch (error) {
      console.error("Error syncing calendar:", error);
    }
  },

  clearSelection: () => set({ selectedDates: null }),
}));
