export interface PassengerRequest {
  seatId: number;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
}

export interface CreateBookingRequest {
  scheduleId: number;
  contactEmail: string;
  contactPhone: string;
  passengers: PassengerRequest[];
}

export interface BookingResponse {
  bookingId: number;
  userId: number;
  bookingReference: string;
  scheduleId: number;
  totalAmount: number;
  status: string;
  seats: string[];
}
