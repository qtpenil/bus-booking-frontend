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
