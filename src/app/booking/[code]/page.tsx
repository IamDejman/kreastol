"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Booking } from "@/types";
import { storageService } from "@/lib/services/storageService";
import { formatCurrency, copyToClipboard } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import { supabaseService } from "@/lib/services/supabaseService";
import { HOTEL_INFO } from "@/lib/constants/config";

function BookingStatusPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUpdatingMethod, setIsUpdatingMethod] = useState(false);
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const isStaff = user && (user.role === "owner" || user.role === "receptionist");
  const fetchBookings = useBookingStore((s) => s.fetchBookings);
  
  const from = searchParams.get("from");
  const focusDate = searchParams.get("focusDate");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadBooking = async () => {
      const b = await storageService.getBookingByCode(code);
      setBooking(b);
      setChecked(true);
      if (!b) router.replace("/");
    };
    loadBooking();
  }, [code, router]);

  // Audit: staff viewed booking details
  useEffect(() => {
    if (!booking || !user || !isStaff) return;
    supabaseService
      .createAuditLog({
        actorId: user.dbId,
        actorName: user.name,
        actorRole: user.role,
        action: "view_booking_details",
        context: booking.bookingCode,
      })
      .catch((error) => {
        console.error("Failed to write audit log (view_booking_details):", error);
      });
  }, [booking, user, isStaff]);

  const handleCopyBookingCode = async () => {
    if (!booking) return;
    const success = await copyToClipboard(booking.bookingCode);
    if (success) {
      setCopied(true);
      toast.success("Booking reference copied!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy booking reference");
    }
  };

  if (!checked || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-600">
          {!checked ? "Loading…" : "Booking not found. Redirecting…"}
        </p>
      </div>
    );
  }

  const paymentPhone = HOTEL_INFO.contact.whatsapp || HOTEL_INFO.contact.phone;

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-lg px-4 py-8">
          <h1 className="font-heading text-2xl font-semibold text-primary">
            Reservation held
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Your dates are held for 30 minutes while you complete payment.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
              <p className="text-lg font-semibold text-primary">
                Reservation held for 30 minutes
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Complete payment and send your receipt to confirm. If we do not confirm within 30 minutes, these dates will be released.
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Stay summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Room</span>
                  <span className="text-sm font-medium">Room {booking.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Check-in</span>
                  <span className="text-sm font-medium">
                    {format(new Date(booking.checkIn), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Check-out</span>
                  <span className="text-sm font-medium">
                    {format(new Date(booking.checkOut), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nights</span>
                  <span className="text-sm font-medium">{booking.nights} night{booking.nights !== 1 ? "s" : ""}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Total amount</span>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Pay to this account</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank</span>
                  <span className="font-medium">{booking.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account name</span>
                  <span className="font-medium">{booking.accountName}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-600">Account number</span>
                  <span className="font-mono font-medium">{booking.accountNumber}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                Please transfer the total amount and send your payment receipt via WhatsApp or SMS to{" "}
                <a href={`tel:${paymentPhone}`} className="font-semibold underline">
                  {paymentPhone}
                </a>
                . Your reservation will be held for 30 minutes while our team confirms your payment.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Button
              fullWidth
              onClick={() => {
                const dateToFocus = booking.checkIn || focusDate;
                const url = dateToFocus
                  ? `/?focusDate=${encodeURIComponent(dateToFocus)}#book`
                  : "/#book";
                router.push(url);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Booking Details
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Booking {booking.bookingCode}
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/5 p-6 text-center">
            <p className="text-lg font-semibold text-success">
              Booking Confirmed
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <p className="text-sm text-gray-600">
                Booking reference: <span className="font-mono font-semibold">{booking.bookingCode}</span>
              </p>
              <button
                onClick={handleCopyBookingCode}
                className="flex min-h-touch min-w-touch items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                aria-label="Copy booking reference"
                title="Copy booking reference"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            {booking.paymentDate && (
              <p className="mt-1 text-xs text-gray-500">
                Confirmed on {format(new Date(booking.paymentDate), "MMM dd, yyyy 'at' h:mm a")}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Booking Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Room</span>
                <span className="text-sm font-medium">Room {booking.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Check-in</span>
                <span className="text-sm font-medium">
                  {format(new Date(booking.checkIn), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Check-out</span>
                <span className="text-sm font-medium">
                  {format(new Date(booking.checkOut), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nights</span>
                <span className="text-sm font-medium">{booking.nights} night{booking.nights !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rate per night</span>
                <span className="text-sm font-medium">{formatCurrency(booking.roomRate)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-sm font-medium text-gray-900">Total Amount</span>
                <span className="text-sm font-semibold text-primary">{formatCurrency(booking.totalAmount)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Status</span>
                <Badge
                  variant={booking.paymentStatus === "paid" ? "confirmed" : "cancelled"}
                >
                  {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Method</span>
                {isStaff ? (
                  <select
                    value={booking.paymentMethod ?? ""}
                    disabled={booking.paymentStatus !== "paid" || isUpdatingMethod}
                    onChange={async (e) => {
                      const newMethod = e.target.value as "card" | "transfer";
                      if (booking.paymentStatus !== "paid") {
                        toast.error("Payment method can only be set when status is Paid");
                        return;
                      }
                      try {
                        setIsUpdatingMethod(true);
                        const actorUser = useAuthStore.getState().user;
                        await supabaseService.updateBooking(
                          booking.bookingCode,
                          { paymentMethod: newMethod },
                          actorUser
                            ? { id: actorUser.dbId, name: actorUser.name, role: actorUser.role }
                            : undefined
                        );
                        await fetchBookings();
                        setBooking({ ...booking, paymentMethod: newMethod });
                        toast.success("Payment method updated");
                      } catch (error: any) {
                        toast.error(error?.message || "Failed to update payment method");
                      } finally {
                        setIsUpdatingMethod(false);
                      }
                    }}
                    className="rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-touch appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat"
                  >
                    <option value="">Select method</option>
                    <option value="transfer">Transfer</option>
                    <option value="card">Card</option>
                  </select>
                ) : booking.paymentMethod ? (
                  <span className="text-sm font-medium capitalize">{booking.paymentMethod}</span>
                ) : (
                  <span className="text-xs text-gray-400">Not set</span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Guest Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name</span>
                <span className="text-sm font-medium">{booking.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm font-medium">{booking.guestEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone</span>
                <span className="text-sm font-medium">{booking.guestPhone}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <Button
            fullWidth
            onClick={() => {
              const dateToFocus = booking.checkIn || focusDate;
              const url = dateToFocus
                ? `/?focusDate=${encodeURIComponent(dateToFocus)}#book`
                : "/#book";
              router.push(url);
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <BookingStatusPageContent />
    </Suspense>
  );
}
