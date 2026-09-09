import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateBookingRequest, BookingResponse, BookingListResponse } from '../models/booking.models';
import { API_URLS } from '../../../core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = API_URLS.BOOKINGS;

  constructor(private http: HttpClient) {}

  createBooking(request: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.apiUrl, request);
  }

  getBookingById(id: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.apiUrl}/${id}`);
  }

  getMyBookings(): Observable<BookingListResponse[]> {
    return this.http.get<BookingListResponse[]>(`${this.apiUrl}/my`);
  }

  cancelBooking(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/cancel`, {}, { responseType: 'text' as 'json' });
  }
}

