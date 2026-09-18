import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../core/constants/api.constants';

export interface RegisterDeviceRequest {
  installationId: string;
  deviceType: string;
}

export interface DeactivateDeviceRequest {
  installationId: string;
}

export interface DeviceRegistrationResponse {
  id: number;
  installationId: string;
  deviceType: string;
  active: boolean;
  message: string;
}

export interface SendPushRequest {
  title: string;
  body: string;
  clickActionUrl?: string;
}

export interface PushNotificationResponse {
  success: boolean;
  message: string;
  targetUserId: number;
  activeDevicesFound: number;
  successCount: number;
  failureCount: number;
  messageIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly apiUrl = `${API_URLS.NOTIFICATIONS}/devices`;

  constructor(private http: HttpClient) {}

  registerDevice(
    request: RegisterDeviceRequest
  ): Observable<DeviceRegistrationResponse> {
    return this.http.post<DeviceRegistrationResponse>(
      this.apiUrl,
      request
    );
  }

  deactivateDevice(
    request: DeactivateDeviceRequest
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/deactivate`,
      request
    );
  }

  sendTestNotification(
    request: SendPushRequest
  ): Observable<PushNotificationResponse> {
    return this.http.post<PushNotificationResponse>(
      `${API_URLS.NOTIFICATIONS}/test`,
      request
    );
  }
}

