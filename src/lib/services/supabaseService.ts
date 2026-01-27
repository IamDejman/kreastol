import type { Booking, User } from "@/types";

// API-based service - calls Next.js API routes instead of direct Supabase
export const supabaseService = {
  // Bookings
  async getBookings(): Promise<Booking[]> {
    try {
      const response = await fetch("/api/bookings");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch bookings");
      }
      const data = await response.json();
      return data.bookings || [];
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      if (error?.message?.includes("Failed to fetch") || error?.message?.includes("ERR_NAME_NOT_RESOLVED")) {
        console.warn("Network error fetching bookings. Check your API connection.");
        return [];
      }
      throw error;
    }
  },

  async saveBooking(booking: Booking): Promise<void> {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(booking),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save booking");
    }
  },

  async updateBooking(bookingCode: string, updates: Partial<Booking>): Promise<void> {
    const response = await fetch(`/api/bookings/${encodeURIComponent(bookingCode)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update booking");
    }
  },

  async getBookingByCode(bookingCode: string): Promise<Booking | null> {
    const response = await fetch(`/api/bookings/${encodeURIComponent(bookingCode)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch booking");
    }

    const data = await response.json();
    return data.booking || null;
  },

  // Users
  async getUsers(): Promise<User[]> {
    const response = await fetch("/api/users");

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch users");
    }

    const data = await response.json();
    return data.users || [];
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const response = await fetch(`/api/users/${encodeURIComponent(email)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch user");
    }

    const data = await response.json();
    return data.user || null;
  },

  async createUser(user: Omit<User, "id">): Promise<User> {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create user");
    }

    const data = await response.json();
    return data.user;
  },

  async userExists(email: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/users/check?email=${encodeURIComponent(email)}`);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  },

  // Blocked Rooms
  async getBlockedRooms(): Promise<Record<number, string[]>> {
    try {
      const response = await fetch("/api/blocked-rooms");
      
      if (!response.ok) {
        const error = await response.json();
        if (error.error?.includes("relation") || error.error?.includes("42P01")) {
          console.warn("Blocked rooms table may not exist yet. Returning empty object.");
          return {};
        }
        throw new Error(error.error || "Failed to fetch blocked rooms");
      }

      const data = await response.json();
      return data.blockedRooms || {};
    } catch (error: any) {
      console.error("Error fetching blocked rooms:", error);
      if (error?.message?.includes("Failed to fetch") || error?.message?.includes("ERR_NAME_NOT_RESOLVED")) {
        console.warn("Network error fetching blocked rooms. Check your API connection.");
        return {};
      }
      throw error;
    }
  },

  async blockRoom(roomNumber: number, dates: string[], reason?: string): Promise<void> {
    const response = await fetch("/api/blocked-rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomNumber, dates, reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to block room");
    }
  },

  async unblockRoom(roomNumber: number, dates: string[]): Promise<void> {
    const response = await fetch("/api/blocked-rooms", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomNumber, dates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to unblock room");
    }
  },
};
