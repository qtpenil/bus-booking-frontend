import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CityResponse } from '../models/city.models';
import { API_URLS } from '../../../core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class CityService {

  constructor(private http: HttpClient) { }

  getAllCities(): Observable<CityResponse[]> {
    return this.http.get<CityResponse[]>(API_URLS.CITIES);
  }
}
