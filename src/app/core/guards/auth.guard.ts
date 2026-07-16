import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { STORAGE_KEYS } from '../constants/storage.constants';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  
  if (token) {
    // Basic check for token existence. Real app would check expiration (decode token)
    return true;
  }
  
  // Not logged in, redirect to login page with the return url
  return router.parseUrl('/auth/login');
};
