import type { Booking, User } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { supabaseService } from "./supabaseService";

class StorageService {
  async initializeStorage(): Promise<void> {
    // No longer needed - Supabase handles initialization
    // But we can use this to seed default users if needed
    return Promise.resolve();
  }

  async getBookings(): Promise<Booking[]> {
    try {
      return await supabaseService.getBookings();
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }
  }

  async saveBooking(booking: Booking): Promise<void> {
    try {
      await supabaseService.saveBooking(booking);
    } catch (error) {
      console.error("Error saving booking:", error);
      throw error;
    }
  }

  async updateBooking(bookingCode: string, updates: Partial<Booking>): Promise<void> {
    try {
      await supabaseService.updateBooking(bookingCode, updates);
    } catch (error) {
      console.error("Error updating booking:", error);
      throw error;
    }
  }

  async getBookingByCode(bookingCode: string): Promise<Booking | null> {
    try {
      return await supabaseService.getBookingByCode(bookingCode);
    } catch (error) {
      console.error("Error fetching booking:", error);
      return null;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      return await supabaseService.getUsers();
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await supabaseService.getUserByEmail(email);
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  // Current user session stays in localStorage for quick access
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
    // Only clear session data from localStorage
    // Database data should be cleared via Supabase dashboard if needed
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
}

export const storageService = new StorageService();
