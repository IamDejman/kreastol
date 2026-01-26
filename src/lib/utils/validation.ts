import { z } from "zod";

export const bookingFormSchema = z.object({
  guestName: z.string().min(2, "Name must be at least 2 characters"),
  guestPhone: z.string().min(10, "Enter a valid phone number"),
  guestEmail: z.string().email("Enter a valid email"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const checkBookingSchema = z.object({
  bookingCode: z
    .string()
    .min(1, "Booking code is required")
    .regex(
      /^BK-\d{8}-[A-Z0-9]{4}$/i,
      "Invalid booking code format (e.g. BK-20250126-ABCD)"
    ),
  surname: z
    .string()
    .min(2, "Surname must be at least 2 characters"),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type CheckBookingValues = z.infer<typeof checkBookingSchema>;
