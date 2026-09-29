import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../../core/constants/api.constants';
import {
  FareConfigurationRequest,
  FareConfigurationResponse,
  FareCalculationRequest,
  FareCalculationResponse
} from '../models/fare-configuration.model';

@Injectable({
  providedIn: 'root'
})
export class FareConfigurationService {
  private http = inject(HttpClient);

  getAllFareConfigurations(filter?: {
    routeId?: number;
    busTypeId?: number;
    status?: string;
  }): Observable<FareConfigurationResponse[]> {
    let params = new HttpParams();
    if (filter?.routeId) {
      params = params.set('routeId', filter.routeId.toString());
    }
    if (filter?.busTypeId) {
      params = params.set('busTypeId', filter.busTypeId.toString());
    }
    if (filter?.status && filter.status !== 'ALL') {
      params = params.set('status', filter.status);
    }
    return this.http.get<FareConfigurationResponse[]>(API_URLS.FARE_CONFIGURATIONS, { params });
  }

  getFareConfigurationById(id: number): Observable<FareConfigurationResponse> {
    return this.http.get<FareConfigurationResponse>(`${API_URLS.FARE_CONFIGURATIONS}/${id}`);
  }

  createFareConfiguration(request: FareConfigurationRequest): Observable<FareConfigurationResponse> {
    return this.http.post<FareConfigurationResponse>(API_URLS.FARE_CONFIGURATIONS, request);
  }

  updateFareConfiguration(id: number, request: FareConfigurationRequest): Observable<FareConfigurationResponse> {
    return this.http.put<FareConfigurationResponse>(`${API_URLS.FARE_CONFIGURATIONS}/${id}`, request);
  }

  deleteFareConfiguration(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URLS.FARE_CONFIGURATIONS}/${id}`);
  }

  calculateFare(request: FareCalculationRequest): Observable<FareCalculationResponse> {
    let params = new HttpParams()
      .set('routeId', request.routeId.toString())
      .set('busTypeId', request.busTypeId.toString())
      .set('sourceCityId', request.sourceCityId.toString())
      .set('destinationCityId', request.destinationCityId.toString());

    if (request.travelDate) {
      params = params.set('travelDate', request.travelDate);
    }

    return this.http.get<FareCalculationResponse>(`${API_URLS.FARE_CONFIGURATIONS}/calculate`, { params });
  }
}
