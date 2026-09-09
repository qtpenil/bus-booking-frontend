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

export interface PassengerResponse {
  seatNumber: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
}

export interface BookingResponse {
  bookingId: number;
  userId: number;
  bookingReference: string;
  scheduleId: number;
  totalAmount: number;
  status: string;
  seats: string[];
  contactEmail?: string;
  contactPhone?: string;
  journeyDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  bookingDate?: string;
  passengers?: PassengerResponse[];
}

export interface BookingListResponse {
  bookingId: number;
  bookingReference?: string;
  scheduleId: number;
  status: string;
  totalAmount: number;
  contactEmail?: string;
  contactPhone?: string;
  journeyDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  bookingDate?: string;
  seats?: string[];
  passengers?: PassengerResponse[];
}

