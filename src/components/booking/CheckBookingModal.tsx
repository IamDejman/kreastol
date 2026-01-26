"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkBookingSchema,
  type CheckBookingValues,
} from "@/lib/utils/validation";
import { storageService } from "@/lib/services/storageService";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface CheckBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckBookingModal({ isOpen, onClose }: CheckBookingModalProps) {
  const router = useRouter();
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
      return;
    }
    
    // Check if surname matches (case-insensitive, check last name)
    const guestNameParts = b.guestName.toLowerCase().split(/\s+/);
    const lastWord = guestNameParts[guestNameParts.length - 1];
    
    if (lastWord !== surname && !b.guestName.toLowerCase().includes(surname)) {
      setError("surname", { message: "Surname does not match this booking." });
      return;
    }
    
    onClose();
    router.push(`/booking/${b.bookingCode}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Check booking status">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 md:p-6">
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

        {errors.bookingCode?.message && (
          <p className="text-sm text-danger">{errors.bookingCode.message}</p>
        )}
        {errors.surname?.message && (
          <p className="text-sm text-danger">{errors.surname.message}</p>
        )}
      </form>
    </Modal>
  );
}
