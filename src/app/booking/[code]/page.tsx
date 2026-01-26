"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Booking } from "@/types";
import { storageService } from "@/lib/services/storageService";
import { BackButton } from "@/components/layout/BackButton";
import { formatCurrency, copyToClipboard } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";

function BookingStatusPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  
  const from = searchParams.get("from");
  const backHref = 
    from === "receptionist" ? "/receptionist" :
    from === "owner" ? "/owner/bookings" :
    "/";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const b = storageService.getBookingByCode(code);
    setBooking(b);
    setChecked(true);
    if (!b) router.replace("/");
  }, [code, router]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        <BackButton href={backHref} className="mb-6" />
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Booking Details
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Booking {booking.bookingCode}
        </p>
        
        <div className="mt-6 space-y-4">
          {/* Booking Confirmation */}
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

          {/* Booking Information */}
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
                <span className="text-sm font-medium">{booking.nights} night{booking.nights !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rate per night</span>
                <span className="text-sm font-medium">{formatCurrency(booking.roomRate)}</span>
              </div>
              
              <div className="border-t pt-3 flex justify-between">
                <span className="text-sm font-medium text-gray-900">Total Amount</span>
                <span className="text-sm font-semibold text-primary">{formatCurrency(booking.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Guest Information */}
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

          {/* Payment Information */}
          {booking.paymentReference && (
            <div className="rounded-lg border bg-white p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Payment Information</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Reference</span>
                  <span className="text-sm font-mono font-medium">{booking.paymentReference}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant="confirmed">Confirmed</Badge>
                </div>
              </div>
            </div>
          )}
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
