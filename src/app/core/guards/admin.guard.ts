import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { RoleType } from '../enums/role-type.enum';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user.role === RoleType.ADMIN || user.role === RoleType.SUPER_ADMIN) {
        return true;
      }
    } catch (e) {
      console.error('Error parsing admin user data', e);
    }
  }
  
  // Not an admin or not logged in, redirect to admin login
  return router.parseUrl('/admin/login');
};
