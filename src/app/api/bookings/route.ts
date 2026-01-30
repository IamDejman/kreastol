import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import type { Booking, PaymentStatus, UserRole } from "@/types";

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
  payment_method: string | null;
  payment_reference: string | null;
  payment_date: string | null;
  hold_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

function normalizePaymentStatus(raw: string): PaymentStatus {
  return raw === "paid" ? "paid" : "unpaid";
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
    paymentStatus: normalizePaymentStatus(dbBooking.payment_status),
    paymentMethod: (dbBooking.payment_method as Booking["paymentMethod"]) ?? undefined,
    paymentReference: dbBooking.payment_reference,
    paymentDate: dbBooking.payment_date,
    holdExpiresAt: dbBooking.hold_expires_at ?? null,
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
    payment_method: booking.paymentMethod ?? null,
    payment_reference: booking.paymentReference,
    payment_date: booking.paymentDate,
    hold_expires_at: booking.holdExpiresAt ?? null,
  };
}

async function logAuditAction(params: {
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
  action: string;
  context?: string;
}) {
  const { actorId, actorName, actorRole, action, context } = params;
  if (!actorId || !actorName || !actorRole) return;

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    actor_name: actorName,
    actor_role: actorRole,
    action,
    context: context ?? null,
  });

  if (error) {
    console.error("Failed to write audit log (bookings):", error);
  }
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
    const body = await request.json();
    const booking: Booking = body.booking ?? body;
    const actor = body.actor as
      | { id: string; name: string; role: UserRole }
      | undefined;
    const dbBooking = bookingToDbBooking(booking);
    
    const { error } = await supabase.from("bookings").insert(dbBooking);

    if (error) {
      console.error("Error saving booking:", error);
      return NextResponse.json(
        { error: `Failed to save booking: ${error.message}` },
        { status: 500 }
      );
    }

    if (actor) {
      await logAuditAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "create_booking",
        context: `${booking.bookingCode} - ${booking.guestName}`,
      });
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
