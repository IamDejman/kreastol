import { create } from "zustand";
import type { Booking, DateSelection, BookingFormData } from "@/types";
import { bookingService } from "@/lib/services/bookingService";
import { storageService } from "@/lib/services/storageService";

interface BookingStore {
  bookings: Booking[];
  bookedDates: Record<number, string[]>;
  selectedDates: DateSelection | null;
  isLoading: boolean;
  fetchBookings: () => void;
  createBooking: (
    selection: DateSelection,
    formData: BookingFormData
  ) => Booking;
  selectDates: (selection: DateSelection | null) => void;
  syncCalendar: () => void;
  clearSelection: () => void;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: [],
  bookedDates: {},
  selectedDates: null,
  isLoading: false,

  fetchBookings: () => {
    const bookings = storageService.getBookings();
    const bookedDates = bookingService.getBookedDates();
    set({ bookings, bookedDates });
  },

  createBooking: (selection, formData) => {
    const booking = bookingService.createBooking(selection, formData);
    get().fetchBookings();
    return booking;
  },

  selectDates: (selection) => set({ selectedDates: selection }),

  syncCalendar: () => {
    const bookedDates = bookingService.getBookedDates();
    set({ bookedDates });
  },

  clearSelection: () => set({ selectedDates: null }),
}));
