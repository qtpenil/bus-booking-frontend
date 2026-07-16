import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { ApiErrorResponse } from '../models/api-error.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (error.status === 401 || error.status === 403) {
        // Clear token and redirect to login
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        router.navigate(['/auth/login']);
      }

      // We can also extract the ApiErrorResponse here to display a generic toast notification
      // const apiError: ApiErrorResponse = error.error;
      // console.error('Backend Error:', apiError.message);

      return throwError(() => error);
    })
  );
};
