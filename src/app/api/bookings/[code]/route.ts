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
    createdAt: dbBooking.created_at,
    updatedAt: dbBooking.updated_at,
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
    console.error("Failed to write audit log (bookings/[code]):", error);
  }
}

// GET /api/bookings/[code] - Get booking by code
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_code", params.code)
      .maybeSingle();

    if (error) {
      console.error("Error fetching booking:", error);
      return NextResponse.json(
        { error: `Failed to fetch booking: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ booking: null }, { status: 200 });
    }

    const booking = dbBookingToBooking(data as DbBooking);
    return NextResponse.json({ booking });
  } catch (error: any) {
    console.error("Error in GET /api/bookings/[code]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings/[code] - Update booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const rawBody = await request.json();
    const updates: Partial<Booking> = rawBody.updates ?? rawBody;
    const actor = rawBody.actor as
      | { id: string; name: string; role: UserRole }
      | undefined;
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
    if (updates.paymentMethod !== undefined)
      updateData.payment_method = updates.paymentMethod ?? null;
    if (updates.paymentReference !== undefined)
      updateData.payment_reference = updates.paymentReference;
    if (updates.paymentDate !== undefined) updateData.payment_date = updates.paymentDate;

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("booking_code", params.code);

    if (error) {
      console.error("Error updating booking:", error);
      return NextResponse.json(
        { error: `Failed to update booking: ${error.message}` },
        { status: 500 }
      );
    }

    if (actor) {
      await logAuditAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "update_booking",
        context: params.code,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in PATCH /api/bookings/[code]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
