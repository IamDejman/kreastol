"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  bookingFormSchema,
  type BookingFormValues,
} from "@/lib/utils/validation";
import type { DateSelection } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { getDatesInRange } from "@/lib/utils/dateUtils";

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
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const isStaff = user && (user.role === "owner" || user.role === "receptionist");
  const { blockRoom, fetchBookings } = useBookingStore((s) => ({
    blockRoom: s.blockRoom,
    fetchBookings: s.fetchBookings,
  }));
  const [blockReason, setBlockReason] = useState("");
  const [isBlockingDates, setIsBlockingDates] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      paymentStatus: "unpaid",
      paymentMethod: "transfer",
    },
  });

  const paymentStatus = watch("paymentStatus");

  // Ensure business rule: if not paid, clear payment method
  if (paymentStatus !== "paid") {
    setValue("paymentMethod", undefined);
  }

  const handleBlockDatesInstead = async () => {
    try {
      setBlockError(null);

      if (!selection) {
        setBlockError("No dates selected to block.");
        return;
      }

      if (!blockReason.trim()) {
        setBlockError("Please provide a reason for blocking these dates.");
        return;
      }

      const dates = getDatesInRange(selection.checkIn, selection.checkOut);
      if (dates.length === 0) {
        setBlockError("There are no nights in the selected range to block.");
        return;
      }

      if (!isStaff) {
        setBlockError("Only staff can block dates.");
        return;
      }

      setIsBlockingDates(true);

      const actor =
        user && user.dbId && user.name && user.role
          ? { id: user.dbId, name: user.name, role: user.role }
          : undefined;

      await blockRoom(selection.roomNumber, dates, blockReason.trim(), actor);
      await fetchBookings();

      toast.success(
        dates.length === 1
          ? "Room has been blocked for 1 night."
          : `Room has been blocked for ${dates.length} nights.`
      );

      setBlockReason("");
    } catch (error: any) {
      setBlockError(error?.message || "Failed to block dates.");
    } finally {
      setIsBlockingDates(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full name"
        error={errors.guestName?.message}
        {...register("guestName")}
      />
      <Input
        label="Phone"
        type="tel"
        error={errors.guestPhone?.message}
        {...register("guestPhone")}
      />
      <Input
        label="Email"
        type="email"
        error={errors.guestEmail?.message}
        {...register("guestEmail")}
      />
      {isStaff && (
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Payment status"
            options={[
              { label: "Unpaid", value: "unpaid" },
              { label: "Paid", value: "paid" },
            ]}
            defaultValue="unpaid"
            {...register("paymentStatus")}
          />
          <Select
            label="Payment method"
            options={[
              { label: "Transfer", value: "transfer" },
              { label: "Card", value: "card" },
            ]}
            defaultValue="transfer"
            disabled={paymentStatus !== "paid"}
            {...register("paymentMethod")}
          />
        </div>
      )}
      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? "Creating…" : "Continue"}
      </Button>

      {isStaff && (
        <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-semibold text-foreground">
            Block Dates Instead
          </p>
          <Input
            label="Reason"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            error={blockError ?? undefined}
          />
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={isBlockingDates}
            onClick={handleBlockDatesInstead}
          >
            {isBlockingDates
              ? "Blocking dates..."
              : "Block Date" /* label is generic; nights are taken from selected range */}
          </Button>
        </div>
      )}
    </form>
  );
}
