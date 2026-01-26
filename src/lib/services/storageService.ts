import type { Booking, User } from "@/types";
import { STORAGE_KEYS, DEFAULT_USERS } from "@/lib/constants/config";

class StorageService {
  initializeStorage(): void {
    if (typeof window === "undefined") return;

    if (!localStorage.getItem(STORAGE_KEYS.users)) {
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.bookings)) {
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify([]));
    }
  }

  getBookings(): Booking[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.bookings);
    return data ? JSON.parse(data) : [];
  }

  saveBooking(booking: Booking): void {
    if (typeof window === "undefined") return;
    const bookings = this.getBookings();
    bookings.push(booking);
    localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
  }

  updateBooking(bookingCode: string, updates: Partial<Booking>): void {
    if (typeof window === "undefined") return;
    const bookings = this.getBookings();
    const index = bookings.findIndex((b) => b.bookingCode === bookingCode);
    if (index !== -1) {
      bookings[index] = {
        ...bookings[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
    }
  }

  getBookingByCode(bookingCode: string): Booking | null {
    const bookings = this.getBookings();
    return bookings.find((b) => b.bookingCode === bookingCode) || null;
  }

  getUsers(): User[] {
    if (typeof window === "undefined") return DEFAULT_USERS;
    const data = localStorage.getItem(STORAGE_KEYS.users);
    return data ? JSON.parse(data) : DEFAULT_USERS;
  }

  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find((u) => u.email === email) || null;
  }

  setCurrentUser(user: User): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(STORAGE_KEYS.currentUser);
    return data ? JSON.parse(data) : null;
  }

  clearCurrentUser(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }

  clearAllData(): void {
    if (typeof window === "undefined") return;
    localStorage.clear();
    this.initializeStorage();
  }
}

export const storageService = new StorageService();
