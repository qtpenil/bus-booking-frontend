import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { API_URLS } from '../../../core/constants/api.constants';
import { STORAGE_KEYS } from '../../../core/constants/storage.constants';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/auth.models';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { NotificationService } from '../../../services/notification.service';

export interface UserPayload {
  sub?: string;
  email?: string;
  role?: string;
  userId?: number;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  private currentUserSubject = new BehaviorSubject<UserPayload | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private getStoredUser(): UserPayload | null {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token) return null;
    try {
      const payload: UserPayload = jwtDecode(token);
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        return null;
      }
      return payload;
    } catch (e) {
      return null;
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URLS.AUTH}/login`, request).pipe(
      tap(response => this.handleAuthentication(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URLS.AUTH}/register`, request).pipe(
      tap(response => this.handleAuthentication(response))
    );
  }

  logout(): void {
    const installationId = localStorage.getItem(STORAGE_KEYS.FCM_INSTALLATION_ID);
    if (installationId) {
      this.notificationService.deactivateDevice({ installationId }).pipe(
        catchError(err => {
          console.warn('Failed to deactivate notification device during logout:', err);
          return of(null);
        }),
        finalize(() => this.performLocalLogout())
      ).subscribe();
    } else {
      this.performLocalLogout();
    }
  }

  private performLocalLogout(): void {
    localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.currentUserSubject.next(null);
    this.router.navigate(['/home']);
  }

  private handleAuthentication(response: AuthResponse): void {
    localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, response.accessToken);
    
    try {
      const payload: UserPayload = jwtDecode(response.accessToken);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(payload));
      this.currentUserSubject.next(payload);
    } catch (e) {
      console.error('Failed to decode JWT', e);
      this.currentUserSubject.next(null);
    }
  }
  
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): UserPayload | null {
    return this.currentUserSubject.value;
  }
}

