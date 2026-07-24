// // import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from "@angular/common/http";
// // import { inject } from "@angular/core";
// // import { take, catchError, of, switchMap, from, throwError, Observable, map } from "rxjs";
// // import { AuthService } from "../auth/auth.service";
// // import { FcmService } from "../fcm/fcm.service";

// // // Singleton tracking pointer for concurrent token mutations
// // let dynamicRefreshPromise: Promise<string | null> | null = null;

// // export const authInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
// //   const authService = inject(AuthService);
// //   const fcmService = inject(FcmService);
// //   const language = localStorage.getItem('chms-dms.web.language') || 'en';

// //   // 1. EXTRACT PAYLOAD DETAILS UPFRONT (Prevents circular token-renewal intercept loops)
// //   const httpBody = req.body as Record<string, any> | null;
// //   const graphQlQuery = httpBody?.['query'] || '';
// //   const graphQlOperationName = httpBody?.['operationName'] || '';

// //   // Determine if this exact network stream is the authorization renewal request
// //   const isRenewMutation =
// //     graphQlOperationName === 'RefreshAccessToken' ||
// //     (typeof graphQlQuery === 'string' && graphQlQuery.includes('refreshAccessToken'));

// //   if (
// //     req.url.includes('./assets/i18n/') ||
// //     req.url.includes('/auth/refresh') ||
// //     isRenewMutation
// //   ) {
// //     console.log(`[BYPASS] 🛡️ Request ignored by standard validation loops. Target: ${req.url.substring(0, 50)}...`);

// //     if (isRenewMutation) {
// //       const savedUserStr = localStorage.getItem('chms-dms.mobile.user');
// //       const user = savedUserStr ? JSON.parse(savedUserStr) : null;
// //       const refreshToken = user?.refreshToken;

// //       if (refreshToken) {
// //         console.warn('🔑 [REFRESH ROUTE] Attaching Refresh Token credentials directly to RefreshAccessToken request.');
// //         return next(req.clone({
// //           setHeaders: {
// //             'Authorization': `Bearer ${refreshToken}`,
// //             'Accept-Language': language,
// //             'apollo-require-preflight': 'true'
// //           }
// //         }));
// //       } else {
// //         console.error('❌ [REFRESH ROUTE] No refresh token found in user session!');
// //       }
// //     }

// //     return next(req);
// //   }

// //   // Helper utility to trigger token renewal inside the stream chain securely
// //   const triggerTokenRefresh = (baseHeaders: Record<string, string>): Observable<HttpEvent<unknown>> => {
// //     if (!dynamicRefreshPromise) {
// //       console.log('🚀 [LOCK CREATED] Triggering backend renewTokenSession mutation pipeline...');
// //       dynamicRefreshPromise = new Promise((resolve, reject) => {
// //         authService.renewTokenSession().pipe(take(1)).subscribe({
// //           next: (newToken) => {
// //             console.log('✅ [LOCK RESOLVED] Token session successfully refreshed.');
// //             dynamicRefreshPromise = null; // Clear lock instantly
// //             resolve(newToken);
// //           },
// //           error: (err) => {
// //             console.error('❌ [LOCK REJECTED] Backend rejected refresh mutation:', err);
// //             dynamicRefreshPromise = null; // Clear lock instantly
// //             reject(err);
// //           }
// //         });
// //       });
// //     } else {
// //       console.log('👥 [LOCK QUEUE] Concurrent operation detected. Request queued up behind active refresh execution.');
// //     }

// //     return from(dynamicRefreshPromise).pipe(
// //       switchMap((refreshedAccessToken) => {
// //         console.log('🔄 [RETRY] Resubmitting original query payload using newly generated Access Token.');
// //         baseHeaders['Authorization'] = `Bearer ${refreshedAccessToken}`;
// //         return next(req.clone({ setHeaders: baseHeaders }));
// //       }),
// //       catchError((err) => {
// //         console.error('🚨 [CRITICAL] Session validation chain failed. Evicting client context states.');
// //         authService.performClientSideLogout();
// //         return throwError(() => err);
// //       })
// //     );
// //   };

// //   // 3. CORE ROUTING PIPELINE: Safe execution for application operational streams
// //   return fcmService.getRegistrationToken().pipe(
// //     take(1),
// //     catchError(() => of(null)),
// //     switchMap((deviceToken) => {
// //       const userSession = authService.currentUserValue;

// //       const baseHeaders: Record<string, string> = {
// //         'Accept-Language': language,
// //         'apollo-require-preflight': 'true',
// //         'devicetoken': deviceToken || '',
// //       };

// //       if (!req.headers.has('Content-Type') && !(req.body instanceof FormData)) {
// //         baseHeaders['Content-Type'] = 'application/json';
// //       }

// //       // 4. CLIENT EXPIRATION CHECK: Proactive window block (Reduced to 15s to avoid immediate testing boot loops)
// //       // const proactiveThresholdMs = 15000;
// //       const proactiveThresholdMs = 2000;
// //       if (userSession && (Date.now() > (userSession.tokenExpiryTimestamp - proactiveThresholdMs))) {
// //         const secondsOverdue = Math.floor((Date.now() - userSession.tokenExpiryTimestamp) / 1000);
// //         console.warn(`⚠️ [INTERCEPTOR] Proactive threshold reached! Overdue by: ${secondsOverdue} seconds.`);
// //         return triggerTokenRefresh(baseHeaders);
// //       }

// //       // 5. ATTACH ACTIVE CREDENTIALS
// //       if (userSession?.token) {
// //         const remainingLife = Math.floor((userSession.tokenExpiryTimestamp - Date.now()) / 1000);
// //         console.log(`✨ [SECURE REQUEST] Using active Access Token. Lifespan remaining: ${remainingLife} seconds.`);
// //         baseHeaders['Authorization'] = `Bearer ${userSession.token}`;
// //       } else {
// //         console.log('🌐 [ANONYMOUS REQUEST] Executing public layout call without Authorization header credentials.');
// //       }

// //       // Create an internal execution execution handler closure function to manage processing transparently
// //       const executeRequest = (): Observable<HttpEvent<unknown>> => {
// //         return next(req.clone({ setHeaders: baseHeaders })).pipe(
// //           map((event: HttpEvent<unknown>) => {
// //             // Parse GraphQL inner exceptions nested inside HTTP 200 responses
// //             if (event instanceof HttpResponse && event.body) {
// //               const body = event.body as Record<string, any>;
// //               if (body['errors'] && Array.isArray(body['errors'])) {

// //                 // 🔍 Look for our specific server-side extension code
// //                 const isTokenExpiredError = body['errors'].some(
// //                   (err: any) => err.extensions?.code === 'TOKEN_EXPIRED' || err.extensions?.tokenExpired === true
// //                 );

// //                 if (isTokenExpiredError) {
// //                   console.warn('🔄 [GRAPHQL DETECTED] Server returned TOKEN_EXPIRED structure payload.');
// //                   // Throwing a custom error forces it into our structured catchError retry logic smoothly
// //                   throw new HttpErrorResponse({ status: 401, error: 'TOKEN_EXPIRED_GRAPHQL' });
// //                 }

// //                 const hasUnauthorizedError = body['errors'].some(
// //                   (err: any) => err.message?.toLowerCase().includes('unauthorized') || err.extensions?.code === 'UNAUTHENTICATED'
// //                 );

// //                 if (hasUnauthorizedError) {
// //                   console.warn('⛔ [GRAPHQL UNAUTHORIZED] Server rejected token completely. Force evicting session.');
// //                   authService.performClientSideLogout();
// //                   throw new HttpErrorResponse({ status: 403, error: 'UNAUTHENTICATED_GRAPHQL' });
// //                 }
// //               }
// //             }
// //             return event;
// //           })
// //         );
// //       };

// //       // Execute request with functional structural retry capabilities on explicit thrown actions
// //       return executeRequest().pipe(
// //         catchError((error: unknown) => {
// //           if (error instanceof HttpErrorResponse) {
// //             // Catch our mapped GraphQL Token Expired or direct HTTP status code transformations
// //             if (error.status === 401 || error.error === 'TOKEN_EXPIRED_GRAPHQL') {
// //               console.warn('🔄 [RECOVERY CHAIN] Intercepted authentication failure. Triggering token renewal execution loop...');
// //               return triggerTokenRefresh(baseHeaders);
// //             }
            
// //             if (error.status === 403) {
// //               console.warn('⛔ [INTERCEPTOR 403] Caught layout restriction profile error.');
// //             }
// //           }
// //           return throwError(() => error);
// //         })
// //       );
// //     })
// //   );
// // };



// // import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from "@angular/common/http";
// // import { inject } from "@angular/core";
// // import { take, catchError, of, switchMap, from, throwError, Observable, map } from "rxjs";
// // import { AuthService } from "../auth/auth.service";
// // import { FcmService } from "../fcm/fcm.service";

// // // Singleton tracking pointer for concurrent token mutations
// // let dynamicRefreshPromise: Promise<string | null> | null = null;

// // export const authInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
// //   const authService = inject(AuthService);
// //   const fcmService = inject(FcmService);
  
// //   // Modern Reactive Approach: Read directly from your application's current state layer
// //   const userSession = authService.currentUser();
// //   const language = 'en'; // Can be pulled from a Language Signal or Preference store cleanly

// //   // 1. EXTRACT PAYLOAD DETAILS UPFRONT (Prevents circular token-renewal intercept loops)
// //   const httpBody = req.body as Record<string, any> | null;
// //   const graphQlQuery = httpBody?.['query'] || '';
// //   const graphQlOperationName = httpBody?.['operationName'] || '';

// //   // Determine if this exact network stream is the authorization renewal request
// //   const isRenewMutation =
// //     graphQlOperationName === 'RefreshAccessToken' ||
// //     (typeof graphQlQuery === 'string' && graphQlQuery.includes('refreshAccessToken'));

// //   if (
// //     req.url.includes('./assets/i18n/') ||
// //     req.url.includes('/auth/refresh') ||
// //     isRenewMutation
// //   ) {
// //     console.log(`[BYPASS] 🛡️ Request ignored by standard validation loops. Target: ${req.url.substring(0, 50)}...`);

// //     if (isRenewMutation) {
// //       const refreshToken = userSession?.refreshToken;

// //       if (refreshToken) {
// //         console.warn('🔑 [REFRESH ROUTE] Attaching Refresh Token credentials directly to RefreshAccessToken request.');
// //         return next(req.clone({
// //           setHeaders: {
// //             'Authorization': `Bearer ${refreshToken}`,
// //             'Accept-Language': language,
// //             'apollo-require-preflight': 'true'
// //           }
// //         }));
// //       } else {
// //         console.error('❌ [REFRESH ROUTE] No refresh token found in user session!');
// //       }
// //     }

// //     return next(req);
// //   }

// //   // Helper utility to trigger token renewal inside the stream chain securely
// //   const triggerTokenRefresh = (baseHeaders: Record<string, string>): Observable<HttpEvent<unknown>> => {
// //     if (!dynamicRefreshPromise) {
// //       console.log('🚀 [LOCK CREATED] Triggering backend renewTokenSession mutation pipeline...');
// //       dynamicRefreshPromise = new Promise((resolve, reject) => {
// //         authService.renewTokenSession().pipe(take(1)).subscribe({
// //           next: (newToken) => {
// //             console.log('✅ [LOCK RESOLVED] Token session successfully refreshed.');
// //             dynamicRefreshPromise = null; // Clear lock instantly
// //             resolve(newToken);
// //           },
// //           error: (err) => {
// //             console.error('❌ [LOCK REJECTED] Backend rejected refresh mutation:', err);
// //             dynamicRefreshPromise = null; // Clear lock instantly
// //             reject(err);
// //           }
// //         });
// //       });
// //     } else {
// //       console.log('👥 [LOCK QUEUE] Concurrent operation detected. Request queued up behind active refresh execution.');
// //     }

// //     return from(dynamicRefreshPromise).pipe(
// //       switchMap((refreshedAccessToken) => {
// //         console.log('🔄 [RETRY] Resubmitting original query payload using newly generated Access Token.');
// //         baseHeaders['Authorization'] = `Bearer ${refreshedAccessToken}`;
// //         return next(req.clone({ setHeaders: baseHeaders }));
// //       }),
// //       catchError((err) => {
// //         console.error('🚨 [CRITICAL] Session validation chain failed. Evicting client context states.');
// //         authService.performClientSideLogout();
// //         return throwError(() => err);
// //       })
// //     );
// //   };

// //   // 3. CORE ROUTING PIPELINE: Safe execution for application operational streams
// //   return fcmService.getRegistrationToken().pipe(
// //     take(1),
// //     catchError(() => of(null)),
// //     switchMap((deviceToken) => {
// //       const baseHeaders: Record<string, string> = {
// //         'Accept-Language': language,
// //         'apollo-require-preflight': 'true',
// //         'devicetoken': deviceToken || '',
// //       };

// //       if (!req.headers.has('Content-Type') && !(req.body instanceof FormData)) {
// //         baseHeaders['Content-Type'] = 'application/json';
// //       }

// //       // 4. CLIENT EXPIRATION CHECK: Proactive window block
// //       const proactiveThresholdMs = 2000;
// //       if (userSession && (Date.now() > (userSession.tokenExpiryTimestamp - proactiveThresholdMs))) {
// //         const secondsOverdue = Math.floor((Date.now() - userSession.tokenExpiryTimestamp) / 1000);
// //         console.warn(`⚠️ [INTERCEPTOR] Proactive threshold reached! Overdue by: ${secondsOverdue} seconds.`);
// //         return triggerTokenRefresh(baseHeaders);
// //       }

// //       // 5. ATTACH ACTIVE CREDENTIALS
// //       if (userSession?.token) {
// //         const remainingLife = Math.floor((userSession.tokenExpiryTimestamp - Date.now()) / 1000);
// //         console.log(`✨ [SECURE REQUEST] Using active Access Token. Lifespan remaining: ${remainingLife} seconds.`);
// //         baseHeaders['Authorization'] = `Bearer ${userSession.token}`;
// //       } else {
// //         console.log('🌐 [ANONYMOUS REQUEST] Executing public layout call without Authorization header credentials.');
// //       }

// //       // Create an internal execution handler closure function to manage processing transparently
// //       const executeRequest = (): Observable<HttpEvent<unknown>> => {
// //         return next(req.clone({ setHeaders: baseHeaders })).pipe(
// //           map((event: HttpEvent<unknown>) => {
// //             // Parse GraphQL inner exceptions nested inside HTTP 200 responses
// //             if (event instanceof HttpResponse && event.body) {
// //               const body = event.body as Record<string, any>;
// //               if (body['errors'] && Array.isArray(body['errors'])) {

// //                 // 🔍 Look for our specific server-side extension code
// //                 const isTokenExpiredError = body['errors'].some(
// //                   (err: any) => err.extensions?.code === 'TOKEN_EXPIRED' || err.extensions?.tokenExpired === true
// //                 );

// //                 if (isTokenExpiredError) {
// //                   console.warn('🔄 [GRAPHQL DETECTED] Server returned TOKEN_EXPIRED structure payload.');
// //                   // Throwing a custom error forces it into our structured catchError retry logic smoothly
// //                   throw new HttpErrorResponse({ status: 401, error: 'TOKEN_EXPIRED_GRAPHQL' });
// //                 }

// //                 const hasUnauthorizedError = body['errors'].some(
// //                   (err: any) => err.message?.toLowerCase().includes('unauthorized') || err.extensions?.code === 'UNAUTHENTICATED'
// //                 );

// //                 if (hasUnauthorizedError) {
// //                   console.warn('⛔ [GRAPHQL UNAUTHORIZED] Server rejected token completely. Force evicting session.');
// //                   authService.performClientSideLogout();
// //                   throw new HttpErrorResponse({ status: 403, error: 'UNAUTHENTICATED_GRAPHQL' });
// //                 }
// //               }
// //             }
// //             return event;
// //           })
// //         );
// //       };

// //       // Execute request with functional structural retry capabilities on explicit thrown actions
// //       return executeRequest().pipe(
// //         catchError((error: unknown) => {
// //           if (error instanceof HttpErrorResponse) {
// //             // Strong Typing fixes the TS2339 compiler error perfectly:
// //             const authError = error as HttpErrorResponse;
// //             if (authError.status === 401 || authError.error === 'TOKEN_EXPIRED_GRAPHQL') {
// //               console.warn('🔄 [RECOVERY CHAIN] Intercepted authentication failure. Triggering token renewal execution loop...');
// //               return triggerTokenRefresh(baseHeaders);
// //             }
            
// //             if (authError.status === 403) {
// //               console.warn('⛔ [INTERCEPTOR 403] Caught layout restriction profile error.');
// //             }
// //           }
// //           return throwError(() => error);
// //         })
// //       );
// //     })
// //   );
// // };




// // import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from "@angular/common/http";
// // import { inject } from "@angular/core";
// // import { take, catchError, of, switchMap, from, throwError, Observable, map } from "rxjs";
// // import { AuthService } from "../auth/auth.service";
// // import { FcmService } from "../fcm/fcm.service";

// // // Singleton tracking pointer for concurrent token mutations
// // let dynamicRefreshPromise: Promise<string | null> | null = null;

// // export const authInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
// //   const authService = inject(AuthService);
// //   const fcmService = inject(FcmService);
  
// //   // Modern Reactive Approach: Read directly from your application's current state layer
// //   const userSession = authService.currentUser();
// //   const language = 'en'; // Can be pulled from a Language Signal or Preference store cleanly

// //   // 1. EXTRACT PAYLOAD DETAILS UPFRONT (Prevents circular token-renewal intercept loops)
// //   const httpBody = req.body as Record<string, any> | null;
// //   const graphQlQuery = httpBody?.['query'] || '';
// //   const graphQlOperationName = httpBody?.['operationName'] || '';

// //   // Determine if this exact network stream is the authorization renewal request
// //   const isRenewMutation =
// //     graphQlOperationName === 'RefreshAccessToken' ||
// //     (typeof graphQlQuery === 'string' && graphQlQuery.includes('refreshAccessToken'));

// //   if (
// //     req.url.includes('./assets/i18n/') ||
// //     req.url.includes('/auth/refresh') ||
// //     isRenewMutation
// //   ) {
// //     console.log(`[BYPASS] 🛡️ Request ignored by standard validation loops. Target: ${req.url.substring(0, 50)}...`);

// //     if (isRenewMutation) {
// //       const refreshToken = userSession?.refreshToken;

// //       if (refreshToken) {
// //         console.warn('🔑 [REFRESH ROUTE] Attaching Refresh Token credentials directly to RefreshAccessToken request.');
// //         return next(req.clone({
// //           setHeaders: {
// //             'Authorization': `Bearer ${refreshToken}`,
// //             'Accept-Language': language,
// //             'apollo-require-preflight': 'true'
// //           }
// //         }));
// //       } else {
// //         console.error('❌ [REFRESH ROUTE] No refresh token found in user session!');
// //       }
// //     }

// //     return next(req);
// //   }

// //   // Helper utility to trigger token renewal inside the stream chain securely
// //   const triggerTokenRefresh = (baseHeaders: Record<string, string>): Observable<HttpEvent<unknown>> => {
// //     if (!dynamicRefreshPromise) {
// //       console.log('🚀 [LOCK CREATED] Triggering backend renewTokenSession mutation pipeline...');
// //       dynamicRefreshPromise = new Promise((resolve, reject) => {
// //         authService.renewTokenSession().pipe(take(1)).subscribe({
// //           next: (newToken) => {
// //             console.log('✅ [LOCK RESOLVED] Token session successfully refreshed.');
// //             dynamicRefreshPromise = null; // Clear lock instantly
// //             resolve(newToken);
// //           },
// //           error: (err) => {
// //             console.error('❌ [LOCK REJECTED] Backend rejected refresh mutation:', err);
// //             dynamicRefreshPromise = null; // Clear lock instantly
// //             reject(err);
// //           }
// //         });
// //       });
// //     } else {
// //       console.log('👥 [LOCK QUEUE] Concurrent operation detected. Request queued up behind active refresh execution.');
// //     }

// //     return from(dynamicRefreshPromise).pipe(
// //       switchMap((refreshedAccessToken) => {
// //         console.log('🔄 [RETRY] Resubmitting original query payload using newly generated Access Token.');
// //         baseHeaders['Authorization'] = `Bearer ${refreshedAccessToken}`;
// //         return next(req.clone({ setHeaders: baseHeaders }));
// //       }),
// //       catchError((err) => {
// //         console.error('🚨 [CRITICAL] Session validation chain failed. Evicting client context states.');
// //         authService.performClientSideLogout();
// //         return throwError(() => err);
// //       })
// //     );
// //   };

// //   // 3. CORE ROUTING PIPELINE: Safe execution for application operational streams
// //   return fcmService.getRegistrationToken().pipe(
// //     take(1),
// //     catchError(() => of(null)),
// //     switchMap((deviceToken) => {
// //       const baseHeaders: Record<string, string> = {
// //         'Accept-Language': language,
// //         'apollo-require-preflight': 'true',
// //         'devicetoken': deviceToken || '',
// //       };

// //       if (!req.headers.has('Content-Type') && !(req.body instanceof FormData)) {
// //         baseHeaders['Content-Type'] = 'application/json';
// //       }

// //       // 4. CLIENT EXPIRATION CHECK: Proactive window block
// //       const proactiveThresholdMs = 2000;
// //       if (userSession && (Date.now() > (userSession.tokenExpiryTimestamp - proactiveThresholdMs))) {
// //         const secondsOverdue = Math.floor((Date.now() - userSession.tokenExpiryTimestamp) / 1000);
// //         console.warn(`⚠️ [INTERCEPTOR] Proactive threshold reached! Overdue by: ${secondsOverdue} seconds.`);
// //         return triggerTokenRefresh(baseHeaders);
// //       }

// //       // 5. ATTACH ACTIVE CREDENTIALS
// //       if (userSession?.token) {
// //         const remainingLife = Math.floor((userSession.tokenExpiryTimestamp - Date.now()) / 1000);
// //         console.log(`✨ [SECURE REQUEST] Using active Access Token. Lifespan remaining: ${remainingLife} seconds.`);
// //         baseHeaders['Authorization'] = `Bearer ${userSession.token}`;
// //       } else {
// //         console.log('🌐 [ANONYMOUS REQUEST] Executing public layout call without Authorization header credentials.');
// //       }

// //       // Create an internal execution handler closure function to manage processing transparently
// //       const executeRequest = (): Observable<HttpEvent<unknown>> => {
// //         return next(req.clone({ setHeaders: baseHeaders })).pipe(
// //           map((event: HttpEvent<unknown>) => {
// //             // Parse GraphQL inner exceptions nested inside HTTP 200 responses
// //             if (event instanceof HttpResponse && event.body) {
// //               const body = event.body as Record<string, any>;
// //               if (body['errors'] && Array.isArray(body['errors'])) {

// //                 // 🔍 Look for our specific server-side extension code
// //                 const isTokenExpiredError = body['errors'].some(
// //                   (err: any) => err.extensions?.code === 'TOKEN_EXPIRED' || err.extensions?.tokenExpired === true
// //                 );

// //                 if (isTokenExpiredError) {
// //                   console.warn('🔄 [GRAPHQL DETECTED] Server returned TOKEN_EXPIRED structure payload.');
// //                   // Throwing a custom error forces it into our structured catchError retry logic smoothly
// //                   throw new HttpErrorResponse({ status: 401, error: 'TOKEN_EXPIRED_GRAPHQL' });
// //                 }

// //                 const hasUnauthorizedError = body['errors'].some(
// //                   (err: any) => err.message?.toLowerCase().includes('unauthorized') || err.extensions?.code === 'UNAUTHENTICATED'
// //                 );

// //                 if (hasUnauthorizedError) {
// //                   console.warn('⛔ [GRAPHQL UNAUTHORIZED] Server rejected token completely. Force evicting session.');
// //                   authService.performClientSideLogout();
// //                   throw new HttpErrorResponse({ status: 403, error: 'UNAUTHENTICATED_GRAPHQL' });
// //                 }
// //               }
// //             }
// //             return event;
// //           })
// //         );
// //       };

// //       // Execute request with functional structural retry capabilities on explicit thrown actions
// //       return executeRequest().pipe(
// //         catchError((error: unknown) => {
// //           if (error instanceof HttpErrorResponse) {
// //             // Strong Typing fixes the TS2339 compiler error perfectly:
// //             const authError = error as HttpErrorResponse;
// //             if (authError.status === 401 || authError.error === 'TOKEN_EXPIRED_GRAPHQL') {
// //               console.warn('🔄 [RECOVERY CHAIN] Intercepted authentication failure. Triggering token renewal execution loop...');
// //               return triggerTokenRefresh(baseHeaders);
// //             }
            
// //             if (authError.status === 403) {
// //               console.warn('⛔ [INTERCEPTOR 403] Caught layout restriction profile error.');
// //             }
// //           }
// //           return throwError(() => error);
// //         })
// //       );
// //     })
// //   );
// // };




// // import {
// //   HttpErrorResponse,
// //   HttpEvent,
// //   HttpHeaders,
// //   HttpInterceptorFn,
// //   HttpResponse,
// // } from '@angular/common/http';
// // import { inject } from '@angular/core';
// // import {
// //   take,
// //   catchError,
// //   of,
// //   switchMap,
// //   from,
// //   throwError,
// //   Observable,
// //   map,
// //   shareReplay,
// // } from 'rxjs';
// // import { AuthService } from '../auth/auth.service';
// // import { FcmService } from '../fcm/fcm.service';

// // // Active refresh stream tracking for concurrent requests
// // let dynamicRefreshObservable$: Observable<string | null> | null = null;

// // export const authInterceptor: HttpInterceptorFn = (
// //   req,
// //   next
// // ): Observable<HttpEvent<unknown>> => {
// //   const authService = inject(AuthService);
// //   const fcmService = inject(FcmService);

// //   const userSession = authService.currentUser();
// //   const language = 'en'; // Tip: Inject your Translate/I18n Service here if dynamic

// //   // 1. EXTRACT PAYLOAD DETAILS UPFRONT (Prevents circular token-renewal intercept loops)
// //   const httpBody = req.body as Record<string, any> | null;
// //   const graphQlQuery = httpBody?.['query'] || '';
// //   const graphQlOperationName = httpBody?.['operationName'] || '';

// //   const isRenewMutation =
// //     graphQlOperationName === 'RefreshAccessToken' ||
// //     (typeof graphQlQuery === 'string' &&
// //       graphQlQuery.includes('refreshAccessToken'));

// //   // BYPASS logic for static assets & explicit token renewal queries
// //   if (
// //     req.url.includes('./assets/i18n/') ||
// //     req.url.includes('/auth/refresh') ||
// //     isRenewMutation
// //   ) {
// //     if (isRenewMutation) {
// //       const refreshToken = userSession?.refreshToken;

// //       if (refreshToken) {
// //         return next(
// //           req.clone({
// //             setHeaders: {
// //               Authorization: `Bearer ${refreshToken}`,
// //               'Accept-Language': language,
// //               'apollo-require-preflight': 'true',
// //             },
// //           })
// //         );
// //       }
// //     }
// //     return next(req);
// //   }

// //   // Deduplicated token refresh trigger
// //   const triggerTokenRefresh = (
// //     currentHeaders: Record<string, string>
// //   ): Observable<HttpEvent<unknown>> => {
// //     if (!dynamicRefreshObservable$) {
// //       dynamicRefreshObservable$ = authService.renewTokenSession().pipe(
// //         take(1),
// //         shareReplay(1),
// //         catchError((err) => {
// //           dynamicRefreshObservable$ = null;
// //           authService.performClientSideLogout();
// //           return throwError(() => err);
// //         })
// //       );
// //     }

// //     return dynamicRefreshObservable$.pipe(
// //       take(1),
// //       switchMap((refreshedAccessToken) => {
// //         // Clear global reference upon success
// //         dynamicRefreshObservable$ = null;

// //         const updatedHeaders = {
// //           ...currentHeaders,
// //           Authorization: `Bearer ${refreshedAccessToken}`,
// //         };

// //         return next(req.clone({ setHeaders: updatedHeaders }));
// //       })
// //     );
// //   };

// //   // Safe execution pipeline using cached or immediate device token values
// //   return fcmService.getRegistrationToken().pipe(
// //     take(1),
// //     catchError(() => of(null)),
// //     switchMap((deviceToken) => {
// //       const baseHeaders: Record<string, string> = {
// //         'Accept-Language': language,
// //         'apollo-require-preflight': 'true',
// //         devicetoken: deviceToken || '',
// //       };

// //       if (!req.headers.has('Content-Type') && !(req.body instanceof FormData)) {
// //         baseHeaders['Content-Type'] = 'application/json';
// //       }

// //       // 2. CLIENT EXPIRATION CHECK: Proactive window block (2-second threshold)
// //       const proactiveThresholdMs = 2000;
// //       if (
// //         userSession &&
// //         Date.now() > userSession.tokenExpiryTimestamp - proactiveThresholdMs
// //       ) {
// //         return triggerTokenRefresh(baseHeaders);
// //       }

// //       // 3. ATTACH ACTIVE CREDENTIALS
// //       if (userSession?.token) {
// //         baseHeaders['Authorization'] = `Bearer ${userSession.token}`;
// //       }

// //       // 4. EXECUTE REQUEST & PARSE GRAPHQL INNER ERRORS
// //       return next(req.clone({ setHeaders: baseHeaders })).pipe(
// //         map((event: HttpEvent<unknown>) => {
// //           if (event instanceof HttpResponse && event.body) {
// //             const body = event.body as Record<string, any>;
// //             if (body['errors'] && Array.isArray(body['errors'])) {
// //               const isTokenExpiredError = body['errors'].some(
// //                 (err: any) =>
// //                   err.extensions?.code === 'TOKEN_EXPIRED' ||
// //                   err.extensions?.tokenExpired === true
// //               );

// //               if (isTokenExpiredError) {
// //                 throw new HttpErrorResponse({
// //                   status: 401,
// //                   error: 'TOKEN_EXPIRED_GRAPHQL',
// //                 });
// //               }

// //               const hasUnauthorizedError = body['errors'].some(
// //                 (err: any) =>
// //                   err.message?.toLowerCase().includes('unauthorized') ||
// //                   err.extensions?.code === 'UNAUTHENTICATED'
// //               );

// //               if (hasUnauthorizedError) {
// //                 authService.performClientSideLogout();
// //                 throw new HttpErrorResponse({
// //                   status: 403,
// //                   error: 'UNAUTHENTICATED_GRAPHQL',
// //                 });
// //               }
// //             }
// //           }
// //           return event;
// //         }),
// //         catchError((error: unknown) => {
// //           if (error instanceof HttpErrorResponse) {
// //             if (
// //               error.status === 401 ||
// //               error.error === 'TOKEN_EXPIRED_GRAPHQL'
// //             ) {
// //               return triggerTokenRefresh(baseHeaders);
// //             }
// //           }
// //           return throwError(() => error);
// //         })
// //       );
// //     })
// //   );
// // };




// import {
//   HttpErrorResponse,
//   HttpEvent,
//   HttpHeaders,
//   HttpInterceptorFn,
//   HttpResponse,
// } from '@angular/common/http';
// import { inject } from '@angular/core';
// import {
//   take,
//   catchError,
//   of,
//   switchMap,
//   from,
//   throwError,
//   Observable,
//   map,
//   shareReplay,
// } from 'rxjs';
// import { AuthService } from '../auth/auth.service';
// import { FcmService } from '../fcm/fcm.service';

// // Active refresh stream tracking for concurrent requests
// let dynamicRefreshObservable$: Observable<string | null> | null = null;

// export const authInterceptor: HttpInterceptorFn = (
//   req,
//   next
// ): Observable<HttpEvent<unknown>> => {
//   const authService = inject(AuthService);
//   const fcmService = inject(FcmService);

//   const userSession = authService.currentUser();
//   const language = 'en';

//   // 1. EXTRACT PAYLOAD DETAILS UPFRONT
//   const httpBody = req.body as Record<string, any> | null;
//   const graphQlQuery = httpBody?.['query'] || '';
//   const graphQlOperationName = httpBody?.['operationName'] || '';

//   const isRenewMutation =
//     graphQlOperationName === 'RefreshAccessToken' ||
//     (typeof graphQlQuery === 'string' &&
//       graphQlQuery.includes('refreshAccessToken'));

//   // BYPASS logic for static assets & explicit token renewal queries
//   if (
//     req.url.includes('./assets/i18n/') ||
//     req.url.includes('/auth/refresh') ||
//     isRenewMutation
//   ) {
//     if (isRenewMutation) {
//       const refreshToken = userSession?.refreshToken;

//       if (refreshToken) {
//         return next(
//           req.clone({
//             setHeaders: {
//               Authorization: `Bearer ${refreshToken}`,
//               'Accept-Language': language,
//               'apollo-require-preflight': 'true',
//             },
//           })
//         );
//       }
//     }
//     return next(req);
//   }

//   // Deduplicated token refresh trigger
//   const triggerTokenRefresh = (
//     currentHeaders: Record<string, string>
//   ): Observable<HttpEvent<unknown>> => {
//     if (!dynamicRefreshObservable$) {
//       dynamicRefreshObservable$ = authService.renewTokenSession().pipe(
//         take(1),
//         shareReplay(1),
//         catchError((err) => {
//           dynamicRefreshObservable$ = null;
//           authService.performClientSideLogout();
//           return throwError(() => err);
//         })
//       );
//     }

//     return dynamicRefreshObservable$.pipe(
//       take(1),
//       switchMap((refreshedAccessToken) => {
//         dynamicRefreshObservable$ = null;

//         const updatedHeaders = {
//           ...currentHeaders,
//           Authorization: `Bearer ${refreshedAccessToken}`,
//         };

//         return next(req.clone({ setHeaders: updatedHeaders }));
//       })
//     );
//   };

//   // ⚡ 2. SYNCHRONOUS TOKEN ACCESS (Fixes the request hang)
//   const deviceToken = fcmService.getCurrentToken() || '';

//   const baseHeaders: Record<string, string> = {
//     'Accept-Language': language,
//     'apollo-require-preflight': 'true',
//     devicetoken: deviceToken,
//   };

//   if (!req.headers.has('Content-Type') && !(req.body instanceof FormData)) {
//     baseHeaders['Content-Type'] = 'application/json';
//   }

//   // 3. CLIENT EXPIRATION CHECK: Proactive window block (2-second threshold)
//   const proactiveThresholdMs = 2000;
//   if (
//     userSession &&
//     Date.now() > userSession.tokenExpiryTimestamp - proactiveThresholdMs
//   ) {
//     return triggerTokenRefresh(baseHeaders);
//   }

//   // 4. ATTACH ACTIVE CREDENTIALS
//   if (userSession?.token) {
//     baseHeaders['Authorization'] = `Bearer ${userSession.token}`;
//   }

//   // 5. EXECUTE REQUEST & PARSE GRAPHQL INNER ERRORS
//   return next(req.clone({ setHeaders: baseHeaders })).pipe(
//     map((event: HttpEvent<unknown>) => {
//       if (event instanceof HttpResponse && event.body) {
//         const body = event.body as Record<string, any>;
//         if (body['errors'] && Array.isArray(body['errors'])) {
//           const isTokenExpiredError = body['errors'].some(
//             (err: any) =>
//               err.extensions?.code === 'TOKEN_EXPIRED' ||
//               err.extensions?.tokenExpired === true
//           );

//           if (isTokenExpiredError) {
//             throw new HttpErrorResponse({
//               status: 401,
//               error: 'TOKEN_EXPIRED_GRAPHQL',
//             });
//           }

//           const hasUnauthorizedError = body['errors'].some(
//             (err: any) =>
//               err.message?.toLowerCase().includes('unauthorized') ||
//               err.extensions?.code === 'UNAUTHENTICATED'
//           );

//           if (hasUnauthorizedError) {
//             authService.performClientSideLogout();
//             throw new HttpErrorResponse({
//               status: 403,
//               error: 'UNAUTHENTICATED_GRAPHQL',
//             });
//           }
//         }
//       }
//       return event;
//     }),
//     catchError((error: unknown) => {
//       if (error instanceof HttpErrorResponse) {
//         if (
//           error.status === 401 ||
//           error.error === 'TOKEN_EXPIRED_GRAPHQL'
//         ) {
//           return triggerTokenRefresh(baseHeaders);
//         }
//       }
//       return throwError(() => error);
//     })
//   );
// };




import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  take,
  catchError,
  switchMap,
  throwError,
  Observable,
  map,
  shareReplay,
  finalize,
} from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { FcmService } from '../fcm/fcm.service';

// Active refresh stream tracking for concurrent requests
let dynamicRefreshObservable$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (
  req,
  next
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const fcmService = inject(FcmService);

  const userSession = authService.currentUser();
  const language = 'en';

  // 1. EXTRACT PAYLOAD DETAILS UPFRONT
  const httpBody = req.body as Record<string, any> | null;
  const graphQlQuery = httpBody?.['query'] || '';
  const graphQlOperationName = httpBody?.['operationName'] || '';

  const isBypassOperation =
    graphQlOperationName === 'RefreshAccessToken' ||
    graphQlOperationName === 'SignIn' ||
    (typeof graphQlQuery === 'string' &&
      (graphQlQuery.includes('refreshAccessToken') || graphQlQuery.includes('signIn')));

  // BYPASS logic for static assets & explicit token renewal queries
  if (
    req.url.includes('./assets/i18n/') ||
    req.url.includes('/auth/refresh') ||
    isBypassOperation
  ) {
    if (graphQlOperationName === 'RefreshAccessToken' || graphQlQuery.includes('refreshAccessToken')) {
      const refreshToken = userSession?.refreshToken;

      if (refreshToken) {
        return next(
          req.clone({
            setHeaders: {
              Authorization: `Bearer ${refreshToken}`,
              'Accept-Language': language,
              'apollo-require-preflight': 'true',
            },
          })
        );
      }
    }
    return next(req);
  }

  // Deduplicated token refresh trigger
  const triggerTokenRefresh = (): Observable<HttpEvent<unknown>> => {
    if (!dynamicRefreshObservable$) {
      dynamicRefreshObservable$ = authService.renewTokenSession().pipe(
        take(1),
        shareReplay(1),
        finalize(() => {
          dynamicRefreshObservable$ = null;
        }),
        catchError((err) => {
          authService.performClientSideLogout();
          return throwError(() => err);
        })
      );
    }

    return dynamicRefreshObservable$.pipe(
      take(1),
      switchMap((refreshedAccessToken) => {
        // Clone original request with the fresh Access Token
        const retriedReq = req.clone({
          setHeaders: {
            ...baseHeaders,
            Authorization: `Bearer ${refreshedAccessToken}`,
          },
        });
        return next(retriedReq);
      })
    );
  };

  // 2. SYNCHRONOUS FCM TOKEN & HEADER PREPARATION
  const deviceToken = fcmService.getCurrentToken() || '';

  const baseHeaders: Record<string, string> = {
    'Accept-Language': language,
    'apollo-require-preflight': 'true',
    devicetoken: deviceToken,
  };

  if (!req.headers.has('Content-Type') && !(req.body instanceof FormData)) {
    baseHeaders['Content-Type'] = 'application/json';
  }

  // 3. CLIENT EXPIRATION CHECK: Proactive window block (2-second threshold)
  const proactiveThresholdMs = 2000;
  if (
    userSession &&
    Date.now() > userSession.tokenExpiryTimestamp - proactiveThresholdMs
  ) {
    return triggerTokenRefresh();
  }

  // 4. ATTACH ACTIVE CREDENTIALS
  if (userSession?.token) {
    baseHeaders['Authorization'] = `Bearer ${userSession.token}`;
  }

  // 5. EXECUTE REQUEST & PARSE GRAPHQL INNER ERRORS
  return next(req.clone({ setHeaders: baseHeaders })).pipe(
    map((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse && event.body) {
        const body = event.body as Record<string, any>;
        if (body['errors'] && Array.isArray(body['errors'])) {
          const isTokenExpiredError = body['errors'].some(
            (err: any) =>
              err.extensions?.code === 'TOKEN_EXPIRED' ||
              err.extensions?.tokenExpired === true
          );

          if (isTokenExpiredError) {
            throw new HttpErrorResponse({
              status: 401,
              error: 'TOKEN_EXPIRED_GRAPHQL',
            });
          }

          const hasUnauthorizedError = body['errors'].some(
            (err: any) =>
              err.message?.toLowerCase().includes('unauthorized') ||
              err.extensions?.code === 'UNAUTHENTICATED'
          );

          if (hasUnauthorizedError) {
            authService.performClientSideLogout();
            throw new HttpErrorResponse({
              status: 403,
              error: 'UNAUTHENTICATED_GRAPHQL',
            });
          }
        }
      }
      return event;
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (
          error.status === 401 ||
          error.error === 'TOKEN_EXPIRED_GRAPHQL'
        ) {
          return triggerTokenRefresh();
        }
      }
      return throwError(() => error);
    })
  );
};