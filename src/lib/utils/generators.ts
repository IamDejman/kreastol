import { format } from "date-fns";
import { PAYMENT_CONFIG } from "@/lib/constants/config";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomString(length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  }
  return s;
}

export function generateBookingCode(): string {
  const datePart = format(new Date(), "yyyyMMdd");
  const suffix = randomString(4);
  return `BK-${datePart}-${suffix}`;
}

export function generateAccountNumber(): string {
  return "0" + randomString(9);
}

export function getMockBankDetails(): {
  bankName: string;
  accountName: string;
  accountNumber: string;
} {
  return {
    bankName: PAYMENT_CONFIG.mockBankDetails.bankName,
    accountName: PAYMENT_CONFIG.mockBankDetails.accountName,
    accountNumber: PAYMENT_CONFIG.mockBankDetails.accountNumber,
  };
}
