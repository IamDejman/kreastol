"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkBookingSchema,
  type CheckBookingValues,
} from "@/lib/utils/validation";
import { storageService } from "@/lib/services/storageService";
import { BackButton } from "@/components/layout/BackButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

export default function MyBookingsPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<ReturnType<typeof storageService.getBookingByCode> | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CheckBookingValues>({
    resolver: zodResolver(checkBookingSchema),
    defaultValues: { bookingCode: "", surname: "" },
  });

  const onSubmit = (data: CheckBookingValues) => {
    const code = data.bookingCode.trim();
    const surname = data.surname.trim().toLowerCase();
    const b = storageService.getBookingByCode(code);
    
    if (!b) {
      setError("bookingCode", { message: "No booking found for this code." });
      setBooking(null);
      return;
    }
    
    // Check if surname matches (case-insensitive, check last name)
    const guestNameParts = b.guestName.toLowerCase().split(/\s+/);
    const lastWord = guestNameParts[guestNameParts.length - 1];
    
    if (lastWord !== surname && !b.guestName.toLowerCase().includes(surname)) {
      setError("surname", { message: "Surname does not match this booking." });
      setBooking(null);
      return;
    }
    
    setBooking(b);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        <BackButton href="/" className="mb-6" />
        <h1 className="font-heading text-2xl font-semibold text-primary">
          My Bookings
        </h1>
        <p className="mt-2 text-gray-600">
          Enter your booking reference and surname to view your booking status.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <Input
            label="Booking reference"
            error={errors.bookingCode?.message}
            {...register("bookingCode")}
          />
          <Input
            label="Surname"
            error={errors.surname?.message}
            {...register("surname")}
          />
          <Button type="submit" fullWidth>
            Look up
          </Button>

          {booking && (
            <div className="mt-6 rounded-lg border bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{booking.bookingCode}</span>
                <Badge variant="confirmed">
                  Confirmed
                </Badge>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Room {booking.roomNumber} · {booking.guestName}
              </p>
              <p className="text-sm text-gray-600">
                {format(new Date(booking.checkIn), "MMM dd, yyyy")} –{" "}
                {format(new Date(booking.checkOut), "MMM dd, yyyy")}
              </p>
              <Button
                onClick={() => router.push(`/booking/${booking.bookingCode}`)}
                fullWidth
                className="mt-4"
              >
                View booking details
              </Button>
            </div>
          )}

          {errors.bookingCode?.message && (
            <p className="text-sm text-danger">{errors.bookingCode.message}</p>
          )}
          {errors.surname?.message && (
            <p className="text-sm text-danger">{errors.surname.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
