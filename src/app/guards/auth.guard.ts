// import { inject, Injectable } from '@angular/core';
// import { Router, RouterStateSnapshot } from '@angular/router';
// import { Network } from '@capacitor/network';
// import { firstValueFrom, map } from 'rxjs';
// import { AuthService } from '../auth/auth.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthGuardService {
//   private readonly router = inject(Router);
//   private readonly authService = inject(AuthService);

//   async isConnected(): Promise<boolean> {
//     try {
//       const status = await Network.getStatus();
//       return status.connected;
//     } catch (error) {
//       console.error('Network status check failed:', error);
//       return false;
//     }
//   }

//   async canActivate(state?: RouterStateSnapshot): Promise<boolean | any> {
//     // 1️⃣ Check network status first
//     const connected = await this.isConnected();
//     if (!connected) {
//       return this.router.createUrlTree(['/retry']);
//     }

//     // 2️⃣ Check authenticated user state from the stream
//     return firstValueFrom(
//       this.authService.authenticatedUser$.pipe(
//         map((user) => {
//           if (user) {
//             return true;
//           }

//           // Fallback redirect with query params preservation if state is provided
//           const queryParams = state?.url ? { redirect: state.url } : {};
//           return this.router.createUrlTree(['/login'], { queryParams });
//         }),
//       ),
//     );
//   }
// }



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

//   // 1️⃣ Network Diagnostics (Capacitor Native Bridge)
//   try {
//     const status = await Network.getStatus();
//     if (!status.connected) {
//       console.warn('[GUARD] Device offline. Redirecting layout focus to connection-retry interface.');
//       return router.createUrlTree(['/retry']);
//     }
//   } catch (error) {
//     console.error('[GUARD] Cross-platform network tracking failure encountered:', error);
//     return router.createUrlTree(['/retry']);
//   }

//   // 2️⃣ Signal-Based Authentication Check (Instant, Zero Stream Overhead)
//   if (authService.isAuthenticated()) {
//     return true;
//   }

//   // 3️⃣ Unauthenticated Fallback: Capture target URL route vector for clean post-auth landing
//   console.warn(`[GUARD] Denied access to "${state.url}". Routing connection back to login layout.`);
//   return router.createUrlTree(['/login'], { 
//     queryParams: { redirect: state.url } 
//   });
// };



import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Network } from '@capacitor/network';
import { AuthService } from '../services/auth/auth.service';

export const authGuard = async (
  next: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // 1️⃣ ALWAYS await storage/native initialization lock first
  await authService.isInitialized;

  // 2️⃣ Signal-Based Authentication Check
  if (!authService.isAuthenticated()) {
    console.warn(`[GUARD] Denied access to "${state.url}". Routing to login.`);
    return router.createUrlTree(['/login'], { 
      queryParams: { redirect: state.url } 
    });
  }

  // 3️⃣ Optional: Check network status only for routes requiring live connection
  try {
    const status = await Network.getStatus();
    if (!status.connected) {
      console.warn('[GUARD] Device offline. Redirecting to connection-retry interface.');
      return router.createUrlTree(['/retry']);
    }
  } catch (error) {
    console.error('[GUARD] Capacitor network tracking failure:', error);
  }

  return true;
};