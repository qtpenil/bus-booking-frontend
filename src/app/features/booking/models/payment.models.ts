export interface CreatePaymentRequest {
  bookingId: number;
  paymentMethod: string;
}

export interface PaymentResponse {
  paymentId: number;
  bookingId: number;
  transactionId: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  paymentDate: string;
}
