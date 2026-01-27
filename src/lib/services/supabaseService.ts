import type { AuditLog, Booking, User, UserStatus } from "@/types";

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

  async updateBooking(
    bookingCode: string,
    updates: Partial<Booking>,
    actor?: { id: string; name: string; role: User["role"] }
  ): Promise<void> {
    const body = actor ? { updates, actor } : updates;

    const response = await fetch(
      `/api/bookings/${encodeURIComponent(bookingCode)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

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

    // API returns 200 for existing users, 201 for newly created users
    if (!response.ok && response.status !== 200 && response.status !== 201) {
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

  async updateUser(
    id: string,
    updates: Partial<Pick<User, "name" | "password"> & { status: UserStatus }>
  ): Promise<User> {
    const response = await fetch(`/api/users/id/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update user");
    }

    const data = await response.json();
    return data.user as User;
  },

  async createAuditLog(entry: {
    actorId: string;
    actorName: string;
    actorRole: User["role"];
    action: string;
    context?: string;
  }): Promise<AuditLog> {
    try {
      const response = await fetch("/api/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        let message = "Failed to create audit log";

        try {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const error = await response.json();
            message = error.error || message;
          } else {
            const text = await response.text();
            message = text || message;
          }
        } catch {
          // Swallow secondary parse errors – we'll use the default message
        }

        throw new Error(message);
      }

      const data = await response.json();
      return data.log as AuditLog;
    } catch (error: any) {
      // Normalize low-level fetch/network errors into a clearer message
      if (error?.name === "TypeError" && /fetch failed/i.test(error.message)) {
        throw new Error("Network error calling /api/audit-logs. Is the dev server still running?");
      }
      throw error;
    }
  },

  async getAuditLogs(params?: {
    role?: User["role"];
    actorId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    query?: string;
  }): Promise<{ logs: AuditLog[]; total: number; page: number; pageSize: number }> {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set("role", params.role);
    if (params?.actorId) searchParams.set("actorId", params.actorId);
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.query) searchParams.set("q", params.query);

    const query = searchParams.toString();
    const response = await fetch(`/api/audit-logs${query ? `?${query}` : ""}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch audit logs");
    }

    const data = await response.json();
    return {
      logs: (data.logs || []) as AuditLog[],
      total: data.total ?? 0,
      page: data.page ?? params?.page ?? 1,
      pageSize: data.pageSize ?? params?.pageSize ?? 20,
    };
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
      // API returns { blockedRooms, blockedRoomDetails }; keep only dates map here
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

  async blockRoom(
    roomNumber: number,
    dates: string[],
    reason: string,
    actor?: { id: string; name: string; role: User["role"] }
  ): Promise<void> {
    const response = await fetch("/api/blocked-rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        actor
          ? {
              roomNumber,
              dates,
              reason,
              actor,
            }
          : { roomNumber, dates, reason }
      ),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to block room");
    }
  },

  async unblockRoom(
    roomNumber: number,
    dates: string[],
    actor?: { id: string; name: string; role: User["role"] }
  ): Promise<void> {
    const response = await fetch("/api/blocked-rooms", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        actor
          ? {
              roomNumber,
              dates,
              actor,
            }
          : { roomNumber, dates }
      ),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to unblock room");
    }
  },
};
