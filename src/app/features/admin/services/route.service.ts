import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../../core/constants/api.constants';
import { CityRequest, CityResponse, RouteRequest, RouteResponse } from '../models/route.models';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private http = inject(HttpClient);

  // --- Cities ---
  
  createCity(request: CityRequest): Observable<CityResponse> {
    return this.http.post<CityResponse>(API_URLS.CITIES, request);
  }

  getAllCities(): Observable<CityResponse[]> {
    return this.http.get<CityResponse[]>(API_URLS.CITIES);
  }

  getCityById(id: number): Observable<CityResponse> {
    return this.http.get<CityResponse>(`${API_URLS.CITIES}/${id}`);
  }

  // --- Routes ---

  createRoute(request: RouteRequest): Observable<RouteResponse> {
    return this.http.post<RouteResponse>(API_URLS.ROUTES, request);
  }

  getAllRoutes(): Observable<RouteResponse[]> {
    return this.http.get<RouteResponse[]>(API_URLS.ROUTES);
  }

  getRouteById(id: number): Observable<RouteResponse> {
    return this.http.get<RouteResponse>(`${API_URLS.ROUTES}/${id}`);
  }

  searchRoutes(sourceCityId: number, destinationCityId: number): Observable<RouteResponse[]> {
    return this.http.get<RouteResponse[]>(`${API_URLS.ROUTES}/search`, {
      params: { sourceCityId, destinationCityId }
    });
  }

  // --- Route Stops ---

  addStopToRoute(routeId: number, request: any): Observable<any> {
    return this.http.post<any>(`${API_URLS.ROUTES}/${routeId}/stops`, request);
  }

  getStopsForRoute(routeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_URLS.ROUTES}/${routeId}/stops`);
  }
}
