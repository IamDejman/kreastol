export type PaymentStatus = "paid" | "unpaid";

export type PaymentMethod = "card" | "transfer";

export interface Booking {
  bookingCode: string;
  roomNumber: 1 | 2 | 3 | 4;
  roomRate: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  specialRequests?: string;
  accountNumber: string;
  bankName: string;
  accountName: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentReference: string | null;
  paymentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFormData {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  specialRequests?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

export interface DateSelection {
  roomNumber: number;
  checkIn: string;
  checkOut: string;
}
