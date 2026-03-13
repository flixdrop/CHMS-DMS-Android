// import {
//   HttpInterceptor,
//   HttpHandler,
//   HttpRequest,
//   HttpEvent,
// } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable, take, switchMap } from 'rxjs';
// import { AuthService } from '../auth/auth.service';
// import { FcmService } from '../fcm/fcm.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthInterceptorService implements HttpInterceptor {
//   constructor(
//     private authService: AuthService,
//     private fcmService: FcmService,
//   ) {}

//   intercept(
//     req: HttpRequest<any>,
//     next: HttpHandler,
//   ): Observable<HttpEvent<any>> {
//     const language = localStorage.getItem('language') || 'en';

//     let headers = req.headers
//       .set('Accept-Language', language)
//       .set('Content-Type', 'application/json');

//     const accessToken = this.authService.getAccessToken();
//     if (accessToken) {
//       headers = headers.set('Authorization', `Bearer ${accessToken}`);
//     }

//     // device token (async, but isolated)
//     return this.fcmService.getRegistrationToken().pipe(
//       take(1),
//       switchMap((deviceToken) => {
//         if (deviceToken) {
//           headers = headers.set('devicetoken', deviceToken);
//         }

//         return next.handle(req.clone({ headers }));
//       }),
//     );
//   }
// }

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { take, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { FcmService } from '../fcm/fcm.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const fcmService = inject(FcmService);
  const language = localStorage.getItem('language') || 'en';

  return fcmService.getRegistrationToken().pipe(
    take(1),
    switchMap((deviceToken) => {
      const accessToken = authService.getAccessToken();
      
      const authReq = req.clone({
        setHeaders: {
          'Accept-Language': language,
          'Content-Type': 'application/json',
          // Apollo Server 4 CSRF Prevention
          'apollo-require-preflight': 'true', 
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(deviceToken ? { 'devicetoken': deviceToken } : {}),
        },
      });

      return next(authReq);
    })
  );
};