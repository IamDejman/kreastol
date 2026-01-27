"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  bookingFormSchema,
  type BookingFormValues,
} from "@/lib/utils/validation";
import type { DateSelection } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { getDatesInRange } from "@/lib/utils/dateUtils";
import { Lock } from "lucide-react";

interface BookingFormProps {
  selection: DateSelection;
  onSubmit: (data: BookingFormValues) => void;
  isLoading?: boolean;
}

export function BookingForm({
  selection,
  onSubmit,
  isLoading = false,
}: BookingFormProps) {
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const isStaff = user && (user.role === "owner" || user.role === "receptionist");
  const blockRoom = useBookingStore((s) => s.blockRoom);
  const fetchBookings = useBookingStore((s) => s.fetchBookings);
  const bookedDates = useBookingStore((s) => s.bookedDates);
  const [blockReason, setBlockReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guestName: "",
      guestPhone: "",
      guestEmail: "",
    },
  });

  const handleBlockDates = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const dates = getDatesInRange(selection.checkIn, selection.checkOut);
    
    // Check if any dates are in the past
    const pastDates = dates.filter((d) => d < today);
    if (pastDates.length > 0) {
      toast.error(`Cannot block past dates. Past dates in selection: ${pastDates.join(", ")}`);
      return;
    }
    
    // Check if any dates are already booked
    const roomBookedDates = bookedDates[selection.roomNumber] || [];
    const conflictingDates = dates.filter((d) => roomBookedDates.includes(d));
    
    if (conflictingDates.length > 0) {
      toast.error(`Cannot block dates that are already booked. Conflicting dates: ${conflictingDates.join(", ")}`);
      return;
    }
    
    setIsBlocking(true);
    try {
      await blockRoom(selection.roomNumber, dates, blockReason || undefined);
      await fetchBookings();
      toast.success(`Room ${selection.roomNumber} blocked from ${format(new Date(selection.checkIn), "MMM dd")} to ${format(new Date(selection.checkOut), "MMM dd, yyyy")}`);
      // Redirect back to home
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to block dates");
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full name"
        placeholder="John Doe"
        error={errors.guestName?.message}
        {...register("guestName")}
      />
      <Input
        label="Phone"
        type="tel"
        placeholder="+234 800 000 0000"
        error={errors.guestPhone?.message}
        {...register("guestPhone")}
      />
      <Input
        label="Email"
        type="email"
        placeholder="john@example.com"
        error={errors.guestEmail?.message}
        {...register("guestEmail")}
      />
      <Button type="submit" fullWidth disabled={isLoading || isBlocking}>
        {isLoading ? "Creating…" : "Continue"}
      </Button>

      {isStaff && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Lock className="h-4 w-4" />
            <span>Staff Option: Block Dates Instead</span>
          </div>
          <Input
            label="Reason (Optional)"
            type="text"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="e.g., Under repairs, Maintenance"
            className="min-h-touch"
          />
          <Button
            type="button"
            onClick={handleBlockDates}
            disabled={isBlocking}
            variant="secondary"
            fullWidth
          >
            {isBlocking ? "Blocking..." : "Block Dates Instead"}
          </Button>
        </div>
      )}
    </form>
  );
}
