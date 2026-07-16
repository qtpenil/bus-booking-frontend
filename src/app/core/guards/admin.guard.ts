import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { RoleType } from '../enums/role-type.enum';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Real app would decode JWT using jwt-decode library
  // For now, we assume user data is stored in CURRENT_USER
  const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user.role === RoleType.ADMIN || user.role === RoleType.SUPER_ADMIN) {
        return true;
      }
    } catch (e) {
      console.error('Error parsing user data', e);
    }
  }
  
  // Not an admin, redirect to home
  return router.parseUrl('/home');
};
