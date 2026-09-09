export interface ScheduleResponse {
  id: number;
  routeId: number;
  busId: number;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  baseFare: number;
  availableSeats: number;
  status: string;
}

export interface CreateScheduleRequest {
  routeId: number;
  busId: number;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  baseFare: number;
}

export interface UpdateScheduleRequest {
  departureTime: string;
  arrivalTime: string;
  baseFare: number;
}

export interface MessageResponse {
  message: string;
}

export interface ScheduleSeatResponse {
  seatId: number;
  seatNumber: string;
  rowNo: number;
  columnNo: number;
  seatType: string;
  deckType: string;
  status: string;
}

export interface HoldSeatRequest {
  seatIds: number[];
}

export interface HoldSeatResponse {
  holdId: string;
  expiresAt: string;
}
