import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import type { Booking } from "@/types";

// Database types
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
    paymentStatus: dbBooking.payment_status as "paid" | "credit" | "unpaid",
    paymentReference: dbBooking.payment_reference,
    paymentDate: dbBooking.payment_date,
    createdAt: dbBooking.created_at,
    updatedAt: dbBooking.updated_at,
  };
}

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

// GET /api/bookings - Get all bookings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      if (error.message?.includes("relation") || error.code === "42P01") {
        return NextResponse.json({ bookings: [] }, { status: 200 });
      }
      return NextResponse.json(
        { error: `Failed to fetch bookings: ${error.message}` },
        { status: 500 }
      );
    }

    const bookings = (data || []).map(dbBookingToBooking);
    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error("Error in GET /api/bookings:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const booking: Booking = await request.json();
    const dbBooking = bookingToDbBooking(booking);
    
    const { error } = await supabase.from("bookings").insert(dbBooking);

    if (error) {
      console.error("Error saving booking:", error);
      return NextResponse.json(
        { error: `Failed to save booking: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/bookings:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
