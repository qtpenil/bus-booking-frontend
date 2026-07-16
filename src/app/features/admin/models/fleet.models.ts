export enum BusStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE'
}

export enum SeatType {
  SEATER = 'SEATER',
  SLEEPER = 'SLEEPER',
  WINDOW = 'WINDOW'
}

export enum DeckType {
  LOWER = 'LOWER',
  UPPER = 'UPPER'
}

export interface BusTypeRequest {
  name: string;
  description?: string;
}

export interface BusTypeResponse {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeatLayoutTemplateRequest {
  templateName: string;
  templateCode: string;
  totalSeats: number;
  isActive: boolean;
  description?: string;
  busTypeId: number;
}

export interface SeatLayoutTemplateResponse {
  id: number;
  templateName: string;
  templateCode: string;
  totalSeats: number;
  isActive: boolean;
  description?: string;
  busTypeId: number;
  busTypeName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusRequest {
  busNumber: string;
  busName: string;
  operatorName: string;
  totalSeats: number;
  registrationNumber: string;
  status: BusStatus;
  busTypeId: number;
  seatLayoutTemplateId: number;
}

export interface BusResponse {
  id: number;
  busNumber: string;
  busName: string;
  operatorName: string;
  totalSeats: number;
  registrationNumber: string;
  status: BusStatus;
  busTypeId: number;
  busTypeName: string;
  seatLayoutTemplateId: number;
  seatLayoutTemplateName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeatTemplateRequest {
  seatNumber: string;
  rowNo: number;
  columnNo: number;
  seatType: SeatType;
  deckType: DeckType;
  seatLayoutTemplateId: number;
}

export interface SeatTemplateResponse {
  id: number;
  seatNumber: string;
  rowNo: number;
  columnNo: number;
  seatType: SeatType;
  deckType: DeckType;
  seatLayoutTemplateId: number;
}
