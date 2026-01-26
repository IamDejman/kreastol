"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  bookingFormSchema,
  type BookingFormValues,
} from "@/lib/utils/validation";
import type { DateSelection } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? "Creating…" : "Continue"}
      </Button>
    </form>
  );
}
