import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Login não precisa receber Authorization
  if (!token || req.url.includes('/api/auth/login')) {
    return next(req);
  }

  const request = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(request);
};