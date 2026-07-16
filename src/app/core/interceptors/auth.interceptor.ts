import { HttpInterceptorFn } from '@angular/common/http';
import { STORAGE_KEYS } from '../constants/storage.constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  
  if (token) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }
  
  return next(req);
};
