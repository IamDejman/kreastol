export interface PaymentAccount {
  accountNumber: string;
  bankName: string;
  accountName: string;
  expiresIn: string;
}

export interface PaymentVerification {
  status: "pending" | "successful" | "failed";
  reference?: string;
  amount?: number;
  paidAt?: string;
  message?: string;
  timeRemaining?: number;
}
