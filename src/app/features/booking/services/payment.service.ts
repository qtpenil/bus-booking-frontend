import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URLS } from '../../../core/constants/api.constants';
import { CreatePaymentRequest, PaymentResponse } from '../models/payment.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = API_URLS.PAYMENTS;

  constructor(private http: HttpClient) {}

  makePayment(request: CreatePaymentRequest): Observable<PaymentResponse> {
    return this.http.post<any>(this.apiUrl, request).pipe(
      map(res => res.data)
    );
  }

  getPayment(id: number): Observable<PaymentResponse> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }
}
