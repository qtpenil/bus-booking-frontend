import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ScheduleResponse, CreateScheduleRequest, UpdateScheduleRequest, MessageResponse } from '../models/schedule.models';
import { API_URLS } from '../../../core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  private apiUrl = API_URLS.SCHEDULES;

  constructor(private http: HttpClient) { }

  getAllSchedules(): Observable<ScheduleResponse[]> {
    return this.http.get<ScheduleResponse[]>(this.apiUrl);
  }

  getScheduleById(id: number): Observable<ScheduleResponse> {
    return this.http.get<ScheduleResponse>(`${this.apiUrl}/${id}`);
  }

  createSchedule(request: CreateScheduleRequest): Observable<ScheduleResponse> {
    return this.http.post<ScheduleResponse>(this.apiUrl, request);
  }

  updateSchedule(id: number, request: UpdateScheduleRequest): Observable<ScheduleResponse> {
    return this.http.put<ScheduleResponse>(`${this.apiUrl}/${id}`, request);
  }

  cancelSchedule(id: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/${id}/cancel`, {});
  }
}
