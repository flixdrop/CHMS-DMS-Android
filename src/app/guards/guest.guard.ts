import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Wait for Capacitor Preferences session to load
  await authService.isInitialized;

  // 2. If logged in, redirect away from /login to /home
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/home']);
  }

  // 3. Allow guest users to access /login
  return true;
};