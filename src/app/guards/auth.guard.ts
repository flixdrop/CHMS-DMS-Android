// import { inject } from '@angular/core';
// import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
// import { Network } from '@capacitor/network';
// import { AuthService } from '../services/auth/auth.service';

// export const authGuard = async (
//   next: ActivatedRouteSnapshot, 
//   state: RouterStateSnapshot
// ): Promise<boolean | UrlTree> => {
//   const router = inject(Router);
//   const authService = inject(AuthService);

//   // 1️⃣ ALWAYS await storage/native initialization lock first
//   await authService.isInitialized;

//   // 2️⃣ Signal-Based Authentication Check
//   if (!authService.isAuthenticated()) {
//     console.warn(`[GUARD] Denied access to "${state.url}". Routing to login.`);
//     return router.createUrlTree(['/login'], { 
//       queryParams: { redirect: state.url } 
//     });
//   }

//   // 3️⃣ Optional: Check network status only for routes requiring live connection
//   try {
//     const status = await Network.getStatus();
//     if (!status.connected) {
//       console.warn('[GUARD] Device offline. Redirecting to connection-retry interface.');
//       return router.createUrlTree(['/retry']);
//     }
//   } catch (error) {
//     console.error('[GUARD] Capacitor network tracking failure:', error);
//   }

//   return true;
// };


// import { inject } from '@angular/core';
// import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
// import { AuthService } from '../services/auth/auth.service';

// export const authGuard = async (
//   next: ActivatedRouteSnapshot, 
//   state: RouterStateSnapshot
// ): Promise<boolean | UrlTree> => {
//   const router = inject(Router);
//   const authService = inject(AuthService);

//   // 1️⃣ ALWAYS await native storage initialization lock first
//   await authService.isInitialized;

//   // 2️⃣ Signal-Based Authentication Check
//   if (!authService.isAuthenticated()) {
//     console.warn(`[GUARD] Denied access to "${state.url}". Routing to login.`);
//     return router.createUrlTree(['/login'], { 
//       queryParams: { redirect: state.url } 
//     });
//   }

//   return true;
// };


import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard = async (
  next: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // 1️⃣ ALWAYS await native storage initialization lock first
  await authService.isInitialized;

  // 2️⃣ Attempt to validate or recover the session before denying access
  const isSessionValid = await authService.ensureValidSession();

  if (!isSessionValid) {
    console.warn(`[GUARD] Denied access to "${state.url}". Routing to login.`);
    return router.createUrlTree(['/login'], { 
      queryParams: { redirect: state.url } 
    });
  }

  return true;
};