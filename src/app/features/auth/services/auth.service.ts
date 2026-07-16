import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_URLS } from '../../../core/constants/api.constants';
import { STORAGE_KEYS } from '../../../core/constants/storage.constants';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/auth.models';
import { Router } from '@angular/router';

import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

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
    localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.router.navigate(['/auth/login']);
  }

  private handleAuthentication(response: AuthResponse): void {
    localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, response.accessToken);
    
    try {
      const payload = jwtDecode(response.accessToken);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to decode JWT', e);
    }
  }
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  }
}
