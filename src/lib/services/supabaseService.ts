import { supabase } from "@/lib/supabase/client";
import type { Booking, User } from "@/types";

// Database types (matching Supabase schema)
interface DbUser {
  id: string; // UUID in DB, but we'll convert to number for compatibility
  name: string;
  email: string;
  password: string;
  role: "owner" | "receptionist";
  created_at: string;
  updated_at: string;
}

interface DbBooking {
  id: string;
  booking_code: string;
  room_number: number;
  room_rate: number;
  check_in: string;
  check_out: string;
  nights: number;
  total_amount: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  special_requests: string | null;
  account_number: string;
  bank_name: string;
  account_name: string;
  payment_status: string;
  payment_reference: string | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

// Convert DB user to app User type
function dbUserToUser(dbUser: DbUser): User {
  // Convert UUID to numeric ID (using hash of UUID for consistency)
  // For simplicity, we'll use a hash function or just use the first part
  // In a real app, you might want to add a numeric_id column
  const numericId = parseInt(dbUser.id.replace(/-/g, "").substring(0, 8), 16) % 1000000;
  return {
    id: numericId,
    name: dbUser.name,
    email: dbUser.email,
    password: dbUser.password,
    role: dbUser.role,
  };
}

// Convert app User to DB user type
function userToDbUser(user: User): Omit<DbUser, "id" | "created_at" | "updated_at"> {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
  };
}

// Convert DB booking to app Booking type
function dbBookingToBooking(dbBooking: DbBooking): Booking {
  return {
    bookingCode: dbBooking.booking_code,
    roomNumber: dbBooking.room_number as 1 | 2 | 3 | 4,
    roomRate: Number(dbBooking.room_rate),
    checkIn: dbBooking.check_in,
    checkOut: dbBooking.check_out,
    nights: dbBooking.nights,
    totalAmount: Number(dbBooking.total_amount),
    guestName: dbBooking.guest_name,
    guestPhone: dbBooking.guest_phone,
    guestEmail: dbBooking.guest_email,
    specialRequests: dbBooking.special_requests || undefined,
    accountNumber: dbBooking.account_number,
    bankName: dbBooking.bank_name,
    accountName: dbBooking.account_name,
    paymentStatus: dbBooking.payment_status as "confirmed",
    paymentReference: dbBooking.payment_reference,
    paymentDate: dbBooking.payment_date,
    createdAt: dbBooking.created_at,
    updatedAt: dbBooking.updated_at,
  };
}

// Convert app Booking to DB booking type
function bookingToDbBooking(booking: Booking): Omit<DbBooking, "id" | "created_at" | "updated_at"> {
  return {
    booking_code: booking.bookingCode,
    room_number: booking.roomNumber,
    room_rate: booking.roomRate,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    nights: booking.nights,
    total_amount: booking.totalAmount,
    guest_name: booking.guestName,
    guest_phone: booking.guestPhone,
    guest_email: booking.guestEmail,
    special_requests: booking.specialRequests || null,
    account_number: booking.accountNumber,
    bank_name: booking.bankName,
    account_name: booking.accountName,
    payment_status: booking.paymentStatus,
    payment_reference: booking.paymentReference,
    payment_date: booking.paymentDate,
  };
}

export const supabaseService = {
  // Bookings
  async getBookings(): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookings:", error);
        // If it's a network error or table doesn't exist, return empty array
        if (error.message?.includes("Failed to fetch") || error.message?.includes("relation") || error.code === "42P01") {
          console.warn("Bookings table may not exist yet or network error. Returning empty array.");
          return [];
        }
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      return (data || []).map(dbBookingToBooking);
    } catch (error: any) {
      // Handle network errors gracefully
      if (error?.message?.includes("Failed to fetch") || error?.message?.includes("ERR_NAME_NOT_RESOLVED")) {
        console.warn("Network error fetching bookings. Check your Supabase connection and ensure the project is active.");
        return [];
      }
      throw error;
    }
  },

  async saveBooking(booking: Booking): Promise<void> {
    const dbBooking = bookingToDbBooking(booking);
    const { error } = await supabase.from("bookings").insert(dbBooking);

    if (error) {
      console.error("Error saving booking:", error);
      throw new Error(`Failed to save booking: ${error.message}`);
    }
  },

  async updateBooking(bookingCode: string, updates: Partial<Booking>): Promise<void> {
    const updateData: Partial<DbBooking> = {};

    if (updates.roomNumber !== undefined) updateData.room_number = updates.roomNumber;
    if (updates.roomRate !== undefined) updateData.room_rate = updates.roomRate;
    if (updates.checkIn !== undefined) updateData.check_in = updates.checkIn;
    if (updates.checkOut !== undefined) updateData.check_out = updates.checkOut;
    if (updates.nights !== undefined) updateData.nights = updates.nights;
    if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount;
    if (updates.guestName !== undefined) updateData.guest_name = updates.guestName;
    if (updates.guestPhone !== undefined) updateData.guest_phone = updates.guestPhone;
    if (updates.guestEmail !== undefined) updateData.guest_email = updates.guestEmail;
    if (updates.specialRequests !== undefined)
      updateData.special_requests = updates.specialRequests || null;
    if (updates.accountNumber !== undefined) updateData.account_number = updates.accountNumber;
    if (updates.bankName !== undefined) updateData.bank_name = updates.bankName;
    if (updates.accountName !== undefined) updateData.account_name = updates.accountName;
    if (updates.paymentStatus !== undefined) updateData.payment_status = updates.paymentStatus;
    if (updates.paymentReference !== undefined)
      updateData.payment_reference = updates.paymentReference;
    if (updates.paymentDate !== undefined) updateData.payment_date = updates.paymentDate;

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("booking_code", bookingCode);

    if (error) {
      console.error("Error updating booking:", error);
      throw new Error(`Failed to update booking: ${error.message}`);
    }
  },

  async getBookingByCode(bookingCode: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_code", bookingCode)
      .maybeSingle();

    if (error) {
      console.error("Error fetching booking:", error);
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }

    return data ? dbBookingToBooking(data as DbBooking) : null;
  },

  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      console.error("Error fetching users:", error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return (data || []).map(dbUserToUser);
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user:", error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data ? dbUserToUser(data as DbUser) : null;
  },

  async createUser(user: Omit<User, "id">): Promise<User> {
    const dbUser = userToDbUser({ ...user, id: 0 }); // id will be generated by DB
    const { data, error } = await supabase.from("users").insert(dbUser).select().single();

    if (error) {
      console.error("Error creating user:", error);
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return dbUserToUser(data as DbUser);
  },

  async userExists(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error checking user existence:", error);
      return false;
    }

    return !!data;
  },
};
