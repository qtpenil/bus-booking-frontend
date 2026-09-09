import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../../core/constants/api.constants';
import { 
  BusTypeRequest, BusTypeResponse, 
  SeatLayoutTemplateRequest, SeatLayoutTemplateResponse,
  BusRequest, BusResponse,
  SeatTemplateRequest, SeatTemplateResponse 
} from '../models/fleet.models';

@Injectable({
  providedIn: 'root'
})
export class FleetService {

  constructor(private http: HttpClient) {}

  // --- Bus Types ---
  getAllBusTypes(): Observable<BusTypeResponse[]> {
    return this.http.get<BusTypeResponse[]>(`${API_URLS.FLEET}/bus-types`);
  }

  createBusType(request: BusTypeRequest): Observable<BusTypeResponse> {
    return this.http.post<BusTypeResponse>(`${API_URLS.FLEET}/bus-types`, request);
  }

  deleteBusType(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URLS.FLEET}/bus-types/${id}`);
  }

  // --- Seat Layout Templates ---
  getAllSeatTemplates(): Observable<SeatLayoutTemplateResponse[]> {
    return this.http.get<SeatLayoutTemplateResponse[]>(`${API_URLS.FLEET}/seat-layout-templates`);
  }

  createSeatTemplate(request: SeatLayoutTemplateRequest): Observable<SeatLayoutTemplateResponse> {
    return this.http.post<SeatLayoutTemplateResponse>(`${API_URLS.FLEET}/seat-layout-templates`, request);
  }

  deleteSeatTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URLS.FLEET}/seat-layout-templates/${id}`);
  }

  // --- Buses ---
  getAllBuses(): Observable<BusResponse[]> {
    return this.http.get<BusResponse[]>(`${API_URLS.FLEET}/buses`);
  }

  getBusById(id: number): Observable<BusResponse> {
    return this.http.get<BusResponse>(`${API_URLS.FLEET}/buses/${id}`);
  }

  createBus(request: BusRequest): Observable<BusResponse> {
    return this.http.post<BusResponse>(`${API_URLS.FLEET}/buses`, request);
  }

  deleteBus(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URLS.FLEET}/buses/${id}`);
  }

  // --- Seat Mapping (Individual Seats) ---
  getSeatsByTemplateId(templateId: number): Observable<SeatTemplateResponse[]> {
    return this.http.get<SeatTemplateResponse[]>(`${API_URLS.FLEET}/seat-templates/template/${templateId}`);
  }

  createSeat(request: SeatTemplateRequest): Observable<SeatTemplateResponse> {
    return this.http.post<SeatTemplateResponse>(`${API_URLS.FLEET}/seat-templates`, request);
  }

  deleteSeat(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URLS.FLEET}/seat-templates/${id}`);
  }

}
