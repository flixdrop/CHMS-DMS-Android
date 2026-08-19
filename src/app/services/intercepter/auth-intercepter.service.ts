
// import {
//   HttpErrorResponse,
//   HttpEvent,
//   HttpInterceptorFn,
//   HttpResponse,
// } from '@angular/common/http';
// import { inject } from '@angular/core';
// import {
//   take,
//   catchError,
//   switchMap,
//   throwError,
//   Observable,
//   map,
//   shareReplay,
//   finalize,
// } from 'rxjs';
// import { AuthService } from '../auth/auth.service';
// import { FcmService } from '../fcm/fcm.service';

// // Active refresh stream tracking for concurrent requests
// let dynamicRefreshObservable$: Observable<string> | null = null;

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

//   const isBypassOperation =
//     graphQlOperationName === 'RefreshAccessToken' ||
//     graphQlOperationName === 'SignIn' ||
//     (typeof graphQlQuery === 'string' &&
//       (graphQlQuery.includes('refreshAccessToken') || graphQlQuery.includes('signIn')));

//   // BYPASS logic for static assets & explicit token renewal queries
//   if (
//     req.url.includes('./assets/i18n/') ||
//     req.url.includes('/auth/refresh') ||
//     isBypassOperation
//   ) {
//     if (
//       graphQlOperationName === 'RefreshAccessToken' ||
//       (typeof graphQlQuery === 'string' && graphQlQuery.includes('refreshAccessToken'))
//     ) {
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

//     // Pass devicetoken header if present during SignIn
//     const deviceToken = fcmService.getCurrentToken();
//     if (
//       (graphQlOperationName === 'SignIn' ||
//         (typeof graphQlQuery === 'string' && graphQlQuery.includes('signIn'))) &&
//       deviceToken
//     ) {
//       return next(
//         req.clone({
//           setHeaders: {
//             devicetoken: deviceToken,
//             'Accept-Language': language,
//             'apollo-require-preflight': 'true',
//           },
//         })
//       );
//     }

//     return next(req);
//   }

//   // Deduplicated token refresh trigger
//   const triggerTokenRefresh = (): Observable<HttpEvent<unknown>> => {
//     if (!dynamicRefreshObservable$) {
//       dynamicRefreshObservable$ = authService.renewTokenSession().pipe(
//         take(1),
//         shareReplay(1),
//         finalize(() => {
//           dynamicRefreshObservable$ = null;
//         }),
//         catchError((err) => {
//           authService.performClientSideLogout();
//           return throwError(() => err);
//         })
//       );
//     }

//     return dynamicRefreshObservable$.pipe(
//       take(1),
//       switchMap((refreshedAccessToken) => {
//         // Clone original request with the fresh Access Token
//         const retriedReq = req.clone({
//           setHeaders: {
//             ...baseHeaders,
//             Authorization: `Bearer ${refreshedAccessToken}`,
//           },
//         });
//         return next(retriedReq);
//       })
//     );
//   };

//   // 2. SYNCHRONOUS FCM TOKEN, MULTI-TENANT & HEADER PREPARATION
//   const deviceToken = fcmService.getCurrentToken() || '';

//   const baseHeaders: Record<string, string> = {
//     'Accept-Language': language,
//     'apollo-require-preflight': 'true',
//     devicetoken: deviceToken,
//   };

//   // 🟢 Pass Multi-Tenant owner path if present in user session
//   if (userSession?.path) {
//     baseHeaders['x-owner-path'] = userSession.path;
//   }

//   if (!req.headers.has('Content-Type') && !(req.body instanceof FormData)) {
//     baseHeaders['Content-Type'] = 'application/json';
//   }

//   // 3. CLIENT EXPIRATION CHECK: Proactive window block (2-second threshold)
//   const proactiveThresholdMs = 2000;
//   if (
//     userSession &&
//     Date.now() > userSession.tokenExpiryTimestamp - proactiveThresholdMs
//   ) {
//     return triggerTokenRefresh();
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
//               err.extensions?.code === 'EXPIRED_TOKEN' ||
//               err.extensions?.tokenExpired === true
//           );

//           const hasUnauthorizedError = body['errors'].some(
//             (err: any) =>
//               err.message?.toLowerCase().includes('unauthorized') ||
//               err.extensions?.code === 'UNAUTHENTICATED'
//           );

//           // 🟢 FIX: Route BOTH TOKEN_EXPIRED and UNAUTHENTICATED to token refresh!
//           if (isTokenExpiredError || hasUnauthorizedError) {
//             throw new HttpErrorResponse({
//               status: 401,
//               error: 'TOKEN_EXPIRED_GRAPHQL',
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
//           // Triggers silent refresh using refresh_token; if refresh fails, 
//           // triggerTokenRefresh()'s catchError will call performClientSideLogout()!
//           return triggerTokenRefresh();
//         }
//       }
//       return throwError(() => error);
//     })
//   );
// };





// import {
//   HttpErrorResponse,
//   HttpEvent,
//   HttpInterceptorFn,
//   HttpResponse,
// } from '@angular/common/http';
// import { inject } from '@angular/core';
// import {
//   take,
//   catchError,
//   switchMap,
//   throwError,
//   Observable,
//   map,
//   shareReplay,
//   finalize,
// } from 'rxjs';
// import { AuthService } from '../auth/auth.service';
// import { FcmService } from '../fcm/fcm.service';

// let dynamicRefreshObservable$: Observable<string> | null = null;

// export const authInterceptor: HttpInterceptorFn = (
//   req,
//   next
// ): Observable<HttpEvent<unknown>> => {
//   const authService = inject(AuthService);
//   const fcmService = inject(FcmService);

//   const userSession = authService.currentUser();
//   const language = 'en';

//   const httpBody = req.body as Record<string, any> | null;
//   const graphQlQuery = httpBody?.['query'] || '';
//   const graphQlOperationName = httpBody?.['operationName'] || '';

//   const isRefreshOperation =
//     graphQlOperationName === 'RefreshAccessToken' ||
//     (typeof graphQlQuery === 'string' && graphQlQuery.includes('refreshAccessToken'));

//   const isBypassOperation =
//     isRefreshOperation ||
//     graphQlOperationName === 'SignIn' ||
//     (typeof graphQlQuery === 'string' && graphQlQuery.includes('signIn'));

//   // 1. BYPASS LOGIC
//   if (
//     req.url.includes('./assets/i18n/') ||
//     req.url.includes('/auth/refresh') ||
//     isBypassOperation
//   ) {
//     if (isRefreshOperation) {
//       const refreshToken = userSession?.refreshToken;
//       if (refreshToken) {
//         req = req.clone({
//           setHeaders: {
//             Authorization: `Bearer ${refreshToken}`,
//             'Accept-Language': language,
//             'apollo-require-preflight': 'true',
//           },
//         });
//       }
//     }

//     const deviceToken = fcmService.getCurrentToken();
//     if (
//       (graphQlOperationName === 'SignIn' ||
//         (typeof graphQlQuery === 'string' && graphQlQuery.includes('signIn'))) &&
//       deviceToken
//     ) {
//       req = req.clone({
//         setHeaders: {
//           devicetoken: deviceToken,
//           'Accept-Language': language,
//           'apollo-require-preflight': 'true',
//         },
//       });
//     }

//     // Process bypassed requests, but guard against refresh token failures
//     return next(req).pipe(
//       map((event: HttpEvent<unknown>) => {
//         if (event instanceof HttpResponse && event.body) {
//           const body = event.body as Record<string, any>;
//           if (body['errors'] && Array.isArray(body['errors'])) {
//             const isRefreshExpired = body['errors'].some(
//               (err: any) =>
//                 err.message === 'REFRESH_TOKEN_EXPIRED' ||
//                 err.message === 'SESSION_EXPIRED_OR_REVOKED' ||
//                 err.extensions?.code === 'UNAUTHENTICATED'
//             );

//             // TERMINAL FAILURE: If RefreshAccessToken fails, terminate session immediately
//             if (isRefreshOperation && isRefreshExpired) {
//               authService.performClientSideLogout();
//               throw new HttpErrorResponse({
//                 status: 401,
//                 error: 'REFRESH_TOKEN_EXPIRED',
//               });
//             }
//           }
//         }
//         return event;
//       })
//     );
//   }

//   // 2. DEDUPLICATED TOKEN REFRESH TRIGGER
//   const triggerTokenRefresh = (): Observable<HttpEvent<unknown>> => {
//     if (!dynamicRefreshObservable$) {
//       dynamicRefreshObservable$ = authService.renewTokenSession().pipe(
//         take(1),
//         shareReplay(1),
//         finalize(() => {
//           dynamicRefreshObservable$ = null;
//         }),
//         catchError((err) => {
//           authService.performClientSideLogout();
//           return throwError(() => err);
//         })
//       );
//     }

//     return dynamicRefreshObservable$.pipe(
//       take(1),
//       switchMap((refreshedAccessToken) => {
//         const retriedReq = req.clone({
//           setHeaders: {
//             ...baseHeaders,
//             Authorization: `Bearer ${refreshedAccessToken}`,
//           },
//         });
//         return next(retriedReq);
//       })
//     );
//   };

//   // 3. HEADER PREPARATION
//   const deviceToken = fcmService.getCurrentToken() || '';
//   const baseHeaders: Record<string, string> = {
//     'Accept-Language': language,
//     'apollo-require-preflight': 'true',
//     devicetoken: deviceToken,
//   };

//   if (userSession?.path) {
//     baseHeaders['x-owner-path'] = userSession.path;
//   }

//   if (!req.headers.has('Content-Type') && !(req.body instanceof FormData)) {
//     baseHeaders['Content-Type'] = 'application/json';
//   }

//   // 4. CLIENT EXPIRATION PROACTIVE CHECK
//   const proactiveThresholdMs = 2000;
//   if (
//     userSession &&
//     Date.now() > userSession.tokenExpiryTimestamp - proactiveThresholdMs
//   ) {
//     return triggerTokenRefresh();
//   }

//   if (userSession?.token) {
//     baseHeaders['Authorization'] = `Bearer ${userSession.token}`;
//   }

//   // 5. EXECUTE REQUEST & CATCH GRAPHQL ERRORS
//   return next(req.clone({ setHeaders: baseHeaders })).pipe(
//     map((event: HttpEvent<unknown>) => {
//       if (event instanceof HttpResponse && event.body) {
//         const body = event.body as Record<string, any>;
//         if (body['errors'] && Array.isArray(body['errors'])) {
//           const isRefreshTokenExpired = body['errors'].some(
//             (err: any) => err.message === 'REFRESH_TOKEN_EXPIRED'
//           );

//           // Hard logout if refresh token is dead
//           if (isRefreshTokenExpired) {
//             authService.performClientSideLogout();
//             throw new HttpErrorResponse({
//               status: 401,
//               error: 'REFRESH_TOKEN_EXPIRED',
//             });
//           }

//           const isTokenExpiredError = body['errors'].some(
//             (err: any) =>
//               err.extensions?.code === 'TOKEN_EXPIRED' ||
//               err.extensions?.code === 'EXPIRED_TOKEN' ||
//               err.extensions?.tokenExpired === true
//           );

//           const hasUnauthorizedError = body['errors'].some(
//             (err: any) =>
//               err.message?.toLowerCase().includes('unauthorized') ||
//               err.extensions?.code === 'UNAUTHENTICATED'
//           );

//           if (isTokenExpiredError || hasUnauthorizedError) {
//             throw new HttpErrorResponse({
//               status: 401,
//               error: 'TOKEN_EXPIRED_GRAPHQL',
//             });
//           }
//         }
//       }
//       return event;
//     }),
//     catchError((error: unknown) => {
//       if (error instanceof HttpErrorResponse) {
//         if (error.error === 'REFRESH_TOKEN_EXPIRED') {
//           return throwError(() => error);
//         }
//         if (
//           error.status === 401 ||
//           error.error === 'TOKEN_EXPIRED_GRAPHQL'
//         ) {
//           return triggerTokenRefresh();
//         }
//       }
//       return throwError(() => error);
//     })
//   );
// };



// import {
//   HttpErrorResponse,
//   HttpEvent,
//   HttpHandlerFn,
//   HttpInterceptorFn,
//   HttpRequest,
//   HttpResponse,
// } from '@angular/common/http';
// import { inject } from '@angular/core';
// import {
//   take,
//   catchError,
//   switchMap,
//   throwError,
//   Observable,
//   map,
//   shareReplay,
//   finalize,
// } from 'rxjs';
// import { AuthService } from '../auth/auth.service';
// import { FcmService } from '../fcm/fcm.service';

// let dynamicRefreshObservable$: Observable<string> | null = null;

// export const authInterceptor: HttpInterceptorFn = (
//   req: HttpRequest<unknown>,
//   next: HttpHandlerFn
// ): Observable<HttpEvent<unknown>> => {
//   const authService = inject(AuthService);
//   const fcmService = inject(FcmService);

//   const userSession = authService.currentUser();
//   const language = 'en';

//   const httpBody = req.body as Record<string, any> | null;
//   const graphQlQuery = httpBody?.['query'] || '';
//   const graphQlOperationName = httpBody?.['operationName'] || '';

//   const isRefreshOperation =
//     graphQlOperationName === 'RefreshAccessToken' ||
//     (typeof graphQlQuery === 'string' && graphQlQuery.includes('refreshAccessToken'));

//   const isBypassOperation =
//     isRefreshOperation ||
//     graphQlOperationName === 'SignIn' ||
//     (typeof graphQlQuery === 'string' && graphQlQuery.includes('signIn'));

//   // 1. BYPASS LOGIC (SignIn, RefreshAccessToken, i18n)
//   if (
//     req.url.includes('./assets/i18n/') ||
//     req.url.includes('/auth/refresh') ||
//     isBypassOperation
//   ) {
//     if (isRefreshOperation) {
//       const refreshToken = userSession?.refreshToken;
//       if (refreshToken) {
//         req = req.clone({
//           setHeaders: {
//             Authorization: `Bearer ${refreshToken}`,
//             'Accept-Language': language,
//             'apollo-require-preflight': 'true',
//           },
//         });
//       }
//     }

//     const deviceToken = fcmService.getCurrentToken();
//     if (
//       (graphQlOperationName === 'SignIn' ||
//         (typeof graphQlQuery === 'string' && graphQlQuery.includes('signIn'))) &&
//       deviceToken
//     ) {
//       req = req.clone({
//         setHeaders: {
//           devicetoken: deviceToken,
//           'Accept-Language': language,
//           'apollo-require-preflight': 'true',
//         },
//       });
//     }

//     return next(req).pipe(
//       map((event: HttpEvent<unknown>) => {
//         if (event instanceof HttpResponse && event.body) {
//           const body = event.body as Record<string, any>;
//           if (Array.isArray(body['errors'])) {
//             const isRefreshExpired = body['errors'].some(
//               (err: any) =>
//                 err.message === 'REFRESH_TOKEN_EXPIRED' ||
//                 err.message === 'SESSION_EXPIRED_OR_REVOKED' ||
//                 err.extensions?.code === 'UNAUTHENTICATED'
//             );

//             if (isRefreshOperation && isRefreshExpired) {
//               authService.performClientSideLogout();
//               throw new HttpErrorResponse({
//                 status: 401,
//                 error: 'REFRESH_TOKEN_EXPIRED',
//               });
//             }
//           }
//         }
//         return event;
//       })
//     );
//   }

//   // 2. HEADER PREPARATION
//   const deviceToken = fcmService.getCurrentToken() || '';
//   const baseHeaders: Record<string, string> = {
//     'Accept-Language': language,
//     'apollo-require-preflight': 'true',
//     devicetoken: deviceToken,
//   };

//   if (userSession?.path) {
//     baseHeaders['x-owner-path'] = userSession.path;
//   }

//   if (!req.headers.has('Content-Type') && !(req.body instanceof FormData)) {
//     baseHeaders['Content-Type'] = 'application/json';
//   }

//   // 3. DEDUPLICATED TOKEN REFRESH TRIGGER
//   const triggerTokenRefresh = (targetReq: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
//     if (!dynamicRefreshObservable$) {
//       dynamicRefreshObservable$ = authService.renewTokenSession().pipe(
//         take(1),
//         shareReplay(1),
//         finalize(() => {
//           dynamicRefreshObservable$ = null;
//         }),
//         catchError((err) => {
//           authService.performClientSideLogout();
//           return throwError(() => err);
//         })
//       );
//     }

//     return dynamicRefreshObservable$.pipe(
//       take(1),
//       switchMap((refreshedAccessToken) => {
//         const retriedReq = targetReq.clone({
//           setHeaders: {
//             Authorization: `Bearer ${refreshedAccessToken}`,
//           },
//         });
//         // Pass retried request back through error handling pipeline
//         return executeAndHandleErrors(retriedReq, true);
//       })
//     );
//   };

//   // 4. PIPELINE EXECUTION & GRAPHQL ERROR HANDLING
//   const executeAndHandleErrors = (
//     requestToExecute: HttpRequest<unknown>,
//     isRetry = false
//   ): Observable<HttpEvent<unknown>> => {
//     return next(requestToExecute).pipe(
//       map((event: HttpEvent<unknown>) => {
//         if (event instanceof HttpResponse && event.body) {
//           const body = event.body as Record<string, any>;
//           if (Array.isArray(body['errors'])) {
//             const isRefreshTokenExpired = body['errors'].some(
//               (err: any) => err.message === 'REFRESH_TOKEN_EXPIRED'
//             );

//             if (isRefreshTokenExpired) {
//               authService.performClientSideLogout();
//               throw new HttpErrorResponse({
//                 status: 401,
//                 error: 'REFRESH_TOKEN_EXPIRED',
//               });
//             }

//             const isTokenExpiredError = body['errors'].some(
//               (err: any) =>
//                 err.extensions?.code === 'TOKEN_EXPIRED' ||
//                 err.extensions?.code === 'EXPIRED_TOKEN' ||
//                 err.extensions?.tokenExpired === true
//             );

//             const hasUnauthorizedError = body['errors'].some(
//               (err: any) =>
//                 err.message?.toLowerCase().includes('unauthorized') ||
//                 err.extensions?.code === 'UNAUTHENTICATED'
//             );

//             if (isTokenExpiredError || hasUnauthorizedError) {
//               throw new HttpErrorResponse({
//                 status: 401,
//                 error: 'TOKEN_EXPIRED_GRAPHQL',
//               });
//             }
//           }
//         }
//         return event;
//       }),
//       catchError((error: unknown) => {
//         if (error instanceof HttpErrorResponse) {
//           if (error.error === 'REFRESH_TOKEN_EXPIRED') {
//             return throwError(() => error);
//           }
//           // Only attempt refresh once per request sequence
//           if (!isRetry && (error.status === 401 || error.error === 'TOKEN_EXPIRED_GRAPHQL')) {
//             return triggerTokenRefresh(requestToExecute);
//           }
//         }
//         return throwError(() => error);
//       })
//     );
//   };

//   // 5. PROACTIVE CLIENT EXPIRATION CHECK
//   const proactiveThresholdMs = 2000;
//   if (
//     userSession &&
//     Date.now() > userSession.tokenExpiryTimestamp - proactiveThresholdMs
//   ) {
//     return triggerTokenRefresh(req.clone({ setHeaders: baseHeaders }));
//   }

//   if (userSession?.token) {
//     baseHeaders['Authorization'] = `Bearer ${userSession.token}`;
//   }

//   return executeAndHandleErrors(req.clone({ setHeaders: baseHeaders }));
// };







// import {
//   HttpErrorResponse,
//   HttpEvent,
//   HttpHandlerFn,
//   HttpInterceptorFn,
//   HttpRequest,
//   HttpResponse,
// } from '@angular/common/http';
// import { inject } from '@angular/core';
// import {
//   take,
//   catchError,
//   switchMap,
//   throwError,
//   Observable,
//   map,
//   shareReplay,
//   finalize,
// } from 'rxjs';
// import { AuthService } from '../auth/auth.service';
// import { FcmService } from '../fcm/fcm.service';

// // Maintained outside the interceptor to deduplicate concurrent refresh calls
// let dynamicRefreshObservable$: Observable<string> | null = null;

// export const authInterceptor: HttpInterceptorFn = (
//   req: HttpRequest<unknown>,
//   next: HttpHandlerFn
// ): Observable<HttpEvent<unknown>> => {
//   const authService = inject(AuthService);
//   const fcmService = inject(FcmService);

//   const userSession = authService.currentUser(); // Assuming this is a Signal or synchronous getter
//   const language = 'en'; // Can be dynamically fetched later
//   const deviceToken = fcmService.getCurrentToken() || '';

//   // 1. SAFELY PARSE GRAPHQL BODY
//   // Apollo stringifies the body before it reaches the interceptor
//   let operationName = '';
//   if (req.body && typeof req.body === 'string') {
//     try {
//       const parsed = JSON.parse(req.body);
//       operationName = parsed.operationName || '';
//     } catch { /* Ignore parse errors for non-JSON bodies */ }
//   } else if (req.body && typeof req.body === 'object') {
//     operationName = (req.body as any).operationName || '';
//   }

//   const isRefreshOperation = operationName === 'RefreshAccessToken';
//   const isSignInOperation = operationName === 'SignIn';
//   const isStaticAsset = req.url.includes('./assets/i18n/');

//   // 2. BASE HEADERS SETUP
//   let headers = req.headers
//     .set('Accept-Language', language)
//     .set('apollo-require-preflight', 'true');

//   if (deviceToken) {
//     headers = headers.set('devicetoken', deviceToken);
//   }
  
//   if (userSession?.path) {
//     headers = headers.set('x-owner-path', userSession.path);
//   }

//   if (!headers.has('Content-Type') && !(req.body instanceof FormData)) {
//     headers = headers.set('Content-Type', 'application/json');
//   }

//   // 3. GRAPHQL ERROR TRANSLATOR
//   // Scans 200 OK responses for GraphQL-level authentication errors
//   const checkGraphQlErrors = (event: HttpEvent<unknown>) => {
//     if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
//       const body = event.body as Record<string, any>;
//       if (Array.isArray(body['errors'])) {
        
//         // Check for fatal refresh/session expiration
//         const isSessionDead = body['errors'].some(
//           (err: any) =>
//             err.message === 'REFRESH_TOKEN_EXPIRED' ||
//             err.message === 'SESSION_EXPIRED_OR_REVOKED'
//         );

//         if (isSessionDead) {
//           authService.performClientSideLogout();
//           throw new HttpErrorResponse({ status: 401, error: 'REFRESH_TOKEN_EXPIRED' });
//         }

//         // Check for standard access token expiration
//         const isTokenExpired = body['errors'].some(
//           (err: any) =>
//             err.extensions?.code === 'TOKEN_EXPIRED' ||
//             err.extensions?.code === 'EXPIRED_TOKEN' ||
//             err.extensions?.code === 'UNAUTHENTICATED' ||
//             err.message?.toLowerCase().includes('unauthenticated')
//         );

//         if (isTokenExpired && !isRefreshOperation && !isSignInOperation) {
//           throw new HttpErrorResponse({ status: 401, error: 'TOKEN_EXPIRED_GRAPHQL' });
//         }
//       }
//     }
//     return event;
//   };

//   // 4. PIPELINE EXECUTION WITH RETRY LOGIC
//   const executeRequest = (request: HttpRequest<unknown>, isRetry = false): Observable<HttpEvent<unknown>> => {
//     return next(request).pipe(
//       map(checkGraphQlErrors),
//       catchError((error: unknown) => {
//         if (error instanceof HttpErrorResponse) {
//           // If the refresh token itself is expired, abort immediately
//           if (error.error === 'REFRESH_TOKEN_EXPIRED') {
//             return throwError(() => error);
//           }

//           // If token expired, and we haven't retried yet, trigger refresh
//           if (!isRetry && (error.status === 401 || error.error === 'TOKEN_EXPIRED_GRAPHQL')) {
//             return triggerTokenRefresh(request);
//           }
//         }
//         return throwError(() => error);
//       })
//     );
//   };

//   // 5. TOKEN REFRESH HANDLER (Deduplicated)
//   const triggerTokenRefresh = (targetReq: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
//     if (!dynamicRefreshObservable$) {
//       dynamicRefreshObservable$ = authService.renewTokenSession().pipe(
//         take(1),
//         shareReplay(1),
//         finalize(() => {
//           dynamicRefreshObservable$ = null; // Clear cache so future expires trigger a new refresh
//         }),
//         catchError((err) => {
//           authService.performClientSideLogout();
//           return throwError(() => err);
//         })
//       );
//     }

//     return dynamicRefreshObservable$.pipe(
//       take(1),
//       switchMap((newAccessToken) => {
//         // Clone request with new token and run it through the execution pipeline again (as a retry)
//         const retriedReq = targetReq.clone({
//           headers: targetReq.headers.set('Authorization', `Bearer ${newAccessToken}`),
//         });
//         return executeRequest(retriedReq, true);
//       })
//     );
//   };

//   // 6. ROUTER LOGIC
  
//   // A. Bypass standard auth for static assets or sign-in
//   if (isStaticAsset || isSignInOperation) {
//     return executeRequest(req.clone({ headers }));
//   }

//   // B. Refresh operation must use the Refresh Token
//   if (isRefreshOperation) {
//     const refreshToken = userSession?.refreshToken;
//     if (refreshToken) {
//       headers = headers.set('Authorization', `Bearer ${refreshToken}`);
//     }
//     return executeRequest(req.clone({ headers }));
//   }

//   // C. Standard Operations: Proactive Expiration Check
//   const proactiveThresholdMs = 2000;
//   if (userSession?.tokenExpiryTimestamp && Date.now() > (userSession.tokenExpiryTimestamp - proactiveThresholdMs)) {
//     return triggerTokenRefresh(req.clone({ headers }));
//   }

//   // D. Standard Operations: Attach Access Token and Execute
//   if (userSession?.token) {
//     headers = headers.set('Authorization', `Bearer ${userSession.token}`);
//   }

//   return executeRequest(req.clone({ headers }));
// };





import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
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

// Maintained outside the interceptor to deduplicate concurrent refresh calls
let dynamicRefreshObservable$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const fcmService = inject(FcmService);

  const userSession = authService.currentUser();
  const language = 'en'; 
  const deviceToken = fcmService.getCurrentToken() || '';

  // 1. SAFELY PARSE GRAPHQL BODY
  let operationName = '';
  if (req.body && typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      operationName = parsed.operationName || '';
    } catch { /* Ignore parse errors */ }
  } else if (req.body && typeof req.body === 'object') {
    operationName = (req.body as any).operationName || '';
  }

  const isRefreshOperation = operationName === 'RefreshAccessToken';
  const isSignInOperation = operationName === 'SignIn';
  const isStaticAsset = req.url.includes('./assets/i18n/');

  // 2. BASE HEADERS SETUP
  let headers = req.headers
    .set('Accept-Language', language)
    .set('apollo-require-preflight', 'true');

  if (deviceToken) {
    headers = headers.set('devicetoken', deviceToken);
  }
  
  if (userSession?.path) {
    headers = headers.set('x-owner-path', userSession.path);
  }

  if (!headers.has('Content-Type') && !(req.body instanceof FormData)) {
    headers = headers.set('Content-Type', 'application/json');
  }

  // 3. GRAPHQL ERROR TRANSLATOR
  const checkGraphQlErrors = (event: HttpEvent<unknown>) => {
    if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
      const body = event.body as Record<string, any>;
      if (Array.isArray(body['errors'])) {
        
        const isSessionDead = body['errors'].some(
          (err: any) =>
            err.message === 'REFRESH_TOKEN_EXPIRED' ||
            err.message === 'SESSION_EXPIRED_OR_REVOKED'
        );

        if (isSessionDead) {
          authService.performClientSideLogout();
          throw new HttpErrorResponse({ status: 401, error: 'REFRESH_TOKEN_EXPIRED' });
        }

        const isTokenExpired = body['errors'].some(
          (err: any) =>
            err.extensions?.code === 'TOKEN_EXPIRED' ||
            err.extensions?.code === 'EXPIRED_TOKEN' ||
            err.extensions?.code === 'UNAUTHENTICATED' ||
            err.message?.toLowerCase().includes('unauthenticated')
        );

        if (isTokenExpired && !isRefreshOperation && !isSignInOperation) {
          throw new HttpErrorResponse({ status: 401, error: 'TOKEN_EXPIRED_GRAPHQL' });
        }
      }
    }
    return event;
  };

  // 4. PIPELINE EXECUTION WITH NETWORK SAFEGUARDS
  const executeRequest = (request: HttpRequest<unknown>, isRetry = false): Observable<HttpEvent<unknown>> => {
    return next(request).pipe(
      map(checkGraphQlErrors),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          
          // 🟢 NETWORK/CORS PROTECTOR: Pass it on, do not log out
          if (error.status === 0 || error.status >= 500) {
            console.warn(`[Network/CORS Error] Request failed with status ${error.status}. Session preserved.`);
            return throwError(() => error);
          }

          if (error.error === 'REFRESH_TOKEN_EXPIRED') {
            return throwError(() => error);
          }

          if (!isRetry && (error.status === 401 || error.error === 'TOKEN_EXPIRED_GRAPHQL')) {
            return triggerTokenRefresh(request);
          }
        }
        return throwError(() => error);
      })
    );
  };

  // 5. TOKEN REFRESH HANDLER (Network Safe)
  const triggerTokenRefresh = (targetReq: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
    if (!dynamicRefreshObservable$) {
      dynamicRefreshObservable$ = authService.renewTokenSession().pipe(
        take(1),
        shareReplay(1),
        finalize(() => {
          dynamicRefreshObservable$ = null;
        }),
        catchError((err) => {
          if (err instanceof HttpErrorResponse && (err.status === 0 || err.status >= 500)) {
            console.warn('[Refresh Network Error] Could not reach server to refresh token. Preserving session.');
          } else {
            authService.performClientSideLogout();
          }
          return throwError(() => err);
        })
      );
    }

    return dynamicRefreshObservable$.pipe(
      take(1),
      switchMap((newAccessToken) => {
        const retriedReq = targetReq.clone({
          headers: targetReq.headers.set('Authorization', `Bearer ${newAccessToken}`),
        });
        return executeRequest(retriedReq, true);
      })
    );
  };

  // 6. ROUTER LOGIC
  
  if (isStaticAsset || isSignInOperation) {
    return executeRequest(req.clone({ headers }));
  }

  if (isRefreshOperation) {
    // 🟢 THE FIX: We DO NOT attach any Authorization header here!
    // The refresh token is sent securely in the GraphQL mutation payload variables.
    // This prevents the backend middleware from rejecting the refresh token as an invalid access token.
    return executeRequest(req.clone({ headers }));
  }

  const proactiveThresholdMs = 2000;
  if (userSession?.tokenExpiryTimestamp && Date.now() > (userSession.tokenExpiryTimestamp - proactiveThresholdMs)) {
    return triggerTokenRefresh(req.clone({ headers }));
  }

  if (userSession?.token) {
    headers = headers.set('Authorization', `Bearer ${userSession.token}`);
  }

  return executeRequest(req.clone({ headers }));
};