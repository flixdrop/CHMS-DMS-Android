// import { Injectable, inject, signal, computed } from '@angular/core';
// import { BehaviorSubject, Observable, throwError, from, of, firstValueFrom } from 'rxjs';
// import { Router } from '@angular/router';
// import { Apollo } from 'apollo-angular';
// import { tap, catchError, switchMap, filter, take, map } from 'rxjs/operators';
// import { toObservable } from '@angular/core/rxjs-interop';
// import { Preferences } from '@capacitor/preferences'; // 🔐 Native-safe persistence layer

// import { FcmService } from '../fcm/fcm.service';
// import { SIGN_IN, REGISTER_FCM_TOKEN, REFRESH_ACCESS_TOKEN, FORGOT_PASSWORD, RESET_PASSWORD, CREATE_USER, UPDATE_USER, SIGN_OUT } from '../../graphql/queries/auth.queries';

// export interface AuthenticatedUser {
//   id: string;
//   name: string;
//   username: string;
//   email: string;
//   contact: string;
//   logo: string;
//   path: string;
//   accountTier: number;
//   accessLevel: string;
//   token: string;
//   refreshToken: string;
//   tokenExpiryTimestamp: number;
// }

// const STORAGE_KEY = 'chms-dms.mobile.user';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthService {
//   private readonly apollo = inject(Apollo);
//   private readonly router = inject(Router);
//   private readonly fcmService = inject(FcmService);

//   // 1️⃣ Reactive State Engine
//   private readonly _user = signal<AuthenticatedUser | null>(null);

//   // Public read-only Signals
//   public readonly currentUser = this._user.asReadonly();
//   public readonly isAuthenticated = computed(() => this._user() !== null);
  
//   // High-performance computed accessors for Interceptors and Services
//   public readonly accessToken = computed(() => this._user()?.token ?? null);

//   // Interoperability Bridge for guards/interceptors remaining on streams
//   public readonly authenticatedUser$ = toObservable(this._user);
//   public readonly isLoggedIn$ = this.authenticatedUser$.pipe(map(user => !!user));

//   // Concurrency controls for atomic background token refreshment
//   private isRefreshingToken = false;
//   private readonly refreshSubject = new BehaviorSubject<string | null>(null);

//   // 🔒 Synchronization Lock: Allows the router guard to await native session restoration on refresh
//   private initPromiseResolve!: (value: boolean) => void;
//   public readonly isInitialized = new Promise<boolean>((resolve) => {
//     this.initPromiseResolve = resolve;
//   });

//   constructor() {
//     this.initializeNativeSession();
//   }

//   /**
//    * Safe initialization using native storage subsystems via Capacitor
//    */
//   private async initializeNativeSession() {
//     try {
//       const { value } = await Preferences.get({ key: STORAGE_KEY });
      
//       if (!value) {
//         // No session found, mark initialization as complete immediately
//         this.initPromiseResolve(true);
//         return;
//       }

//       const user: AuthenticatedUser = JSON.parse(value);

//       // Session verification
//       if (Date.now() > user.tokenExpiryTimestamp && !user.refreshToken) {
//         console.warn('[AUTH] Completely expired session footprint detected. Triggering structural purge.');
//         await this.performClientSideLogout();
//         this.initPromiseResolve(true);
//         return;
//       }

//       this._user.set(user);
//     } catch (err) {
//       console.error('[AUTH] Failed parsing cross-platform hardware profile context:', err);
//     } finally {
//       // Ensure the lock releases so routing guards can accurately evaluate current state
//       this.initPromiseResolve(true);
//     }
//   }

//   signIn(identifier: string, password: string): Observable<any> {
//     console.log(`[AUTH] Spawning authentication thread for: ${identifier}`);
//     return this.apollo.mutate<any>({
//       mutation: SIGN_IN,
//       variables: { identifier, password },
//       fetchPolicy: 'no-cache',
//     }).pipe(
//       switchMap(result => {
//         const loginData = result?.data?.signIn;
//         if (!loginData) throw new Error(result?.error?.[0]?.message || 'Authentication Engine Error');

//         const durationInSeconds = loginData.tokenExpiration || 3600;
//         const expiryTime = Date.now() + (durationInSeconds * 1000);

//         const authenticatedUserData: AuthenticatedUser = {
//           id: loginData.id,
//           name: loginData.name,
//           username: loginData.username,
//           email: loginData.email,
//           contact: loginData.contact,
//           logo: loginData.logo,
//           path: loginData.path,
//           accountTier: loginData.accountTier,
//           accessLevel: loginData.accessLevel,
//           token: loginData.token,
//           refreshToken: loginData.refreshToken,
//           tokenExpiryTimestamp: expiryTime
//         };

//         this._user.set(authenticatedUserData);
        
//         // Wrap the asynchronous native store promise into our observable pipeline seamlessly
//         return from(Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(authenticatedUserData) }));
//       }),
//       tap(() => {
//         this.registerFcmTokenAfterLogin().catch(err =>
//           console.warn('⚠️ [AUTH] FCM background link deferred:', err)
//         );
//       }),
//       catchError((err) => {
//         console.error('[AUTH] Runtime authorization validation failed:', err.message);
//         return throwError(() => err);
//       })
//     );
//   }

//   private async registerFcmTokenAfterLogin(): Promise<void> {
//     try {
//       const deviceToken = await this.fcmService.getTokenAsync();
//       if (!deviceToken) return;

//       const result = await firstValueFrom(
//         this.apollo.mutate<any>({
//           mutation: REGISTER_FCM_TOKEN,
//           variables: { deviceToken },
//           fetchPolicy: 'no-cache'
//         })
//       );

//       if (result?.data?.registerFcmToken?.success) {
//         console.log('✅ [AUTH] Hardware Notification Pipeline attached to session context');
//       }
//     } catch (error) {
//       console.warn('⚠️ [AUTH] Push notification syncing deferred:', error);
//     }
//   }

//   renewTokenSession(): Observable<string> {
//     const currentSession = this._user();
//     if (!currentSession?.refreshToken) {
//       return throwError(() => new Error('Active refresh anchors unavailable within current execution scope'));
//     }

//     if (this.isRefreshingToken) {
//       return this.refreshSubject.pipe(
//         filter((token): token is string => token !== null),
//         take(1)
//       );
//     }

//     this.isRefreshingToken = true;
//     this.refreshSubject.next(null);

//     return this.apollo.mutate<any>({
//       mutation: REFRESH_ACCESS_TOKEN,
//       variables: { refreshToken: currentSession.refreshToken },
//       fetchPolicy: 'no-cache'
//     }).pipe(
//       switchMap((res) => {
//         const refreshData = res?.data?.refreshAccessToken;
//         const freshToken = refreshData?.token;
//         if (!freshToken) throw new Error('Malformed mutation response payload structure');

//         const durationInSeconds = refreshData?.tokenExpiration || 3600;
//         const newExpiry = Date.now() + (durationInSeconds * 1000);

//         const updatedSession: AuthenticatedUser = {
//           ...currentSession,
//           token: freshToken,
//           tokenExpiryTimestamp: newExpiry
//         };

//         this._user.set(updatedSession);
        
//         return from(Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(updatedSession) })).pipe(
//           map(() => freshToken)
//         );
//       }),
//       tap((freshToken) => {
//         this.isRefreshingToken = false;
//         this.refreshSubject.next(freshToken);
//       }),
//       catchError((refreshErr) => {
//         this.isRefreshingToken = false;
//         this.refreshSubject.next(null);
//         return from(this.performClientSideLogout()).pipe(
//           switchMap(() => throwError(() => refreshErr))
//         );
//       })
//     );
//   }

//   forgotPassword(identifier: string): Observable<any> {
//     return this.apollo.mutate<any>({
//       mutation: FORGOT_PASSWORD,
//       variables: { identifier },
//       fetchPolicy: 'no-cache'
//     }).pipe(map(res => res?.data?.forgotPassword));
//   }

//   resetPassword(token: string, newPassword: string): Observable<any> {
//     return this.apollo.mutate<any>({
//       mutation: RESET_PASSWORD,
//       variables: { token, newPassword },
//       fetchPolicy: 'no-cache'
//     }).pipe(map(res => res?.data?.resetPassword));
//   }

//   createUser(formInput: any): Observable<any> {
//     const mappedAccessLevel = ['ADMIN', 'SYSTEM_ADMIN'].includes(formInput.accessLevel) ? 'SYSTEM_ADMIN' : formInput.accessLevel === 'ACCOUNT_HOLDER' ? 'ACCOUNT_HOLDER' : 'STAFF';

//     return this.apollo.mutate({
//       mutation: CREATE_USER,
//       variables: {
//         input: {
//           name: formInput.name,
//           username: formInput.username,
//           password: formInput.password,
//           accessLevel: mappedAccessLevel,
//           accountTier: formInput.accountTier != null ? parseInt(formInput.accountTier, 10) : null,
//           parent: formInput.parent || null,
//           email: formInput.email?.trim() || null,
//           contact: formInput.contact?.trim() || null,
//           businessProfile: { logo: formInput.logo || "" }
//         }
//       },
//       fetchPolicy: 'no-cache'
//     });
//   }

//   updateUser(id: string, userData: any): Observable<any> {
//     const mappedAccessLevel = ['ADMIN', 'SYSTEM_ADMIN'].includes(userData.accessLevel) ? 'SYSTEM_ADMIN' : userData.accessLevel === 'ACCOUNT_HOLDER' ? 'ACCOUNT_HOLDER' : 'STAFF';

//     const inputPayload: any = {
//       name: userData.name,
//       username: userData.username,
//       accessLevel: mappedAccessLevel,
//       email: userData.email || null,
//       contact: userData.contact || null,
//       businessProfile: { logo: userData.logo || "" }
//     };

//     if (userData.accountTier != null && userData.accountTier !== '') inputPayload.accountTier = Number(userData.accountTier);
//     if (userData.parent) inputPayload.parent = userData.parent;
//     if (userData.password) inputPayload.password = userData.password;

//     return this.apollo.mutate({
//       mutation: UPDATE_USER,
//       variables: { id, input: inputPayload },
//       fetchPolicy: 'no-cache'
//     });
//   }

//   async logout(deviceToken: string | null) {
//     const user = this._user();
//     if (user && deviceToken) {
//       try {
//         await firstValueFrom(this.apollo.mutate({
//           mutation: SIGN_OUT,
//           variables: { userId: user.id, deviceToken },
//           fetchPolicy: 'no-cache'
//         }));
//       } catch (err) {
//         console.error('[AUTH] Server session clean processing skipped:', err);
//       }
//     }
//     await this.performClientSideLogout();
//   }

//   public async performClientSideLogout() {
//     this._user.set(null);
//     await Preferences.clear(); // Wipes native app container storage vector cleanly
//     await this.router.navigateByUrl('/login', { replaceUrl: true });
//   }
// }


import { Injectable, inject, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, throwError, from, of, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { tap, catchError, switchMap, filter, take, map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { Preferences } from '@capacitor/preferences'; // 🔐 Native-safe persistence layer

import { FcmService } from '../fcm/fcm.service';
import { SIGN_IN, REGISTER_FCM_TOKEN, REFRESH_ACCESS_TOKEN, FORGOT_PASSWORD, RESET_PASSWORD, CREATE_USER, UPDATE_USER, SIGN_OUT } from '../../graphql/queries/auth.queries';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
} from "@capacitor/push-notifications";

export interface AuthenticatedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  contact: string;
  logo: string;
  path: string;
  accountTier: number;
  accessLevel: string;
  token: string;
  refreshToken: string;
  tokenExpiryTimestamp: number;
}

const STORAGE_KEY = 'chms-dms.mobile.user';

const PRESERVED_STORAGE_KEYS = [
  'chms_onboarding_completed',
  'CapacitorStorage.chms_onboarding_completed',
  'chms-dms.fcm.mobile.registrationtoken',
  'chms-dms.mobile.keep_me_logged_in',
  'chms-dms.web.selected_options'
];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apollo = inject(Apollo);
  private readonly router = inject(Router);
  private readonly fcmService = inject(FcmService);

  // 1️⃣ Reactive State Engine
  private readonly _user = signal<AuthenticatedUser | null>(null);

  // Public read-only Signals
  public readonly currentUser = this._user.asReadonly();
  public readonly isAuthenticated = computed(() => this._user() !== null);
  
  // High-performance computed accessors for Interceptors and Services
  public readonly accessToken = computed(() => this._user()?.token ?? null);

  // Interoperability Bridge for guards/interceptors remaining on streams
  public readonly authenticatedUser$ = toObservable(this._user);
  public readonly isLoggedIn$ = this.authenticatedUser$.pipe(map(user => !!user));

  // Concurrency controls for atomic background token refreshment
  private isRefreshingToken = false;
  private readonly refreshSubject = new BehaviorSubject<string | null>(null);

  // 🔒 Synchronization Lock: Allows the router guard to await native session restoration on refresh
  private initPromiseResolve!: (value: boolean) => void;
  public readonly isInitialized = new Promise<boolean>((resolve) => {
    this.initPromiseResolve = resolve;
  });

  constructor() {
    this.initializeNativeSession();
  }

  /**
   * Safe initialization using native storage subsystems via Capacitor
   */
  // private async initializeNativeSession() {
  //   try {
  //     const { value } = await Preferences.get({ key: STORAGE_KEY });
      
  //     if (!value) {
  //       // No session found, mark initialization as complete immediately
  //       this.initPromiseResolve(true);
  //       return;
  //     }

  //     const user: AuthenticatedUser = JSON.parse(value);

  //     this._user.set(user);

  //     // ✅ Re-register FCM token seamlessly on session restoration for authorized user
  //     this.registerFcmTokenAfterLogin().catch(err =>
  //       console.warn('⚠️ [AUTH] Background FCM restoration deferred:', err)
  //     );

  //   } catch (err) {
  //     console.error('[AUTH] Failed parsing cross-platform hardware profile context:', err);
  //   } finally {
  //     // Ensure the lock releases so routing guards can accurately evaluate current state
  //     this.initPromiseResolve(true);
  //   }
  // }

//   private async initializeNativeSession() {
//   try {
//     const { value } = await Preferences.get({ key: STORAGE_KEY });
    
//     if (!value) {
//       this.initPromiseResolve(true);
//       return;
//     }

//     const user: AuthenticatedUser = JSON.parse(value);
//     this._user.set(user);

//     // 🛑 REMOVED: this.registerFcmTokenAfterLogin()
//     // ✅ REPLACED: Only sync silently if permissions were already granted
//     await this.silentFcmTokenSync();

//   } catch (err) {
//     console.error('[AUTH] Failed parsing cross-platform hardware profile context:', err);
//   } finally {
//     this.initPromiseResolve(true);
//   }
// }

//    signIn(identifier: string, password: string): Observable<any> {
//   console.log(`[AUTH] Spawning authentication thread for: ${identifier}`);

//   // 1. Fetch active FCM or persistent device token first
//   return from(this.fcmService.getTokenAsync()).pipe(
//     switchMap((deviceToken) => {
//       // 2. Pass deviceToken directly in the initial mutation payload
//       return this.apollo.mutate<any>({
//         mutation: SIGN_IN,
//         variables: { 
//           identifier, 
//           password, 
//           deviceToken: deviceToken || null 
//         },
//         fetchPolicy: 'no-cache',
//       });
//     }),
//     switchMap((result) => {
//       const loginData = result?.data?.signIn;
//       if (!loginData) {
//         throw new Error(result?.error?.[0]?.message || 'Authentication Engine Error');
//       }

//       const durationInSeconds = loginData.tokenExpiration || 3600;
//       const expiryTime = Date.now() + (durationInSeconds * 1000);

//       const authenticatedUserData: AuthenticatedUser = {
//         id: loginData.id,
//         name: loginData.name,
//         username: loginData.username,
//         email: loginData.email,
//         contact: loginData.contact,
//         logo: loginData.logo,
//         path: loginData.path,
//         accountTier: loginData.accountTier,
//         accessLevel: loginData.accessLevel,
//         token: loginData.token,
//         refreshToken: loginData.refreshToken,
//         tokenExpiryTimestamp: expiryTime
//       };

//       this._user.set(authenticatedUserData);

//       return from(
//         Preferences.set({
//           key: STORAGE_KEY,
//           value: JSON.stringify(authenticatedUserData)
//         })
//       ).pipe(map(() => loginData));
//     }),
//     // tap(() => {
//     //   // 3. Keep background register call as a fallback (it will now upsert the SAME session)
//     //   setTimeout(() => {
//     //     this.registerFcmTokenAfterLogin().catch((err) =>
//     //       console.warn('⚠️ [AUTH] FCM background link deferred:', err)
//     //     );
//     //   }, 300);
//     // }),
//     catchError((err) => {
//       console.error('[AUTH] Runtime authorization validation failed:', err.message);
//       return throwError(() => err);
//     })
//   );
// }



// signIn(identifier: string, password: string): Observable<any> {
//   console.log(`[AUTH] Spawning authentication thread for: ${identifier}`);

//   // Fetch token ONLY if permission was previously granted / cached (no UI prompt)
//   const existingToken = this.fcmService.getCurrentToken() || null;

//   return this.apollo.mutate<any>({
//     mutation: SIGN_IN,
//     variables: { 
//       identifier, 
//       password, 
//       deviceToken: existingToken 
//     },
//     fetchPolicy: 'no-cache',
//   }).pipe(
//     switchMap((result) => {
//       const loginData = result?.data?.signIn;
//       if (!loginData) {
//         throw new Error(result?.error?.[0]?.message || 'Authentication Engine Error');
//       }

//       const durationInSeconds = loginData.tokenExpiration || 3600;
//       const expiryTime = Date.now() + (durationInSeconds * 1000);

//       const authenticatedUserData: AuthenticatedUser = {
//         id: loginData.id,
//         name: loginData.name,
//         username: loginData.username,
//         email: loginData.email,
//         contact: loginData.contact,
//         logo: loginData.logo,
//         path: loginData.path,
//         accountTier: loginData.accountTier,
//         accessLevel: loginData.accessLevel,
//         token: loginData.token,
//         refreshToken: loginData.refreshToken,
//         tokenExpiryTimestamp: expiryTime
//       };

//       this._user.set(authenticatedUserData);

//       return from(
//         Preferences.set({
//           key: STORAGE_KEY,
//           value: JSON.stringify(authenticatedUserData)
//         })
//       ).pipe(map(() => loginData));
//     }),
//     catchError((err) => {
//       console.error('[AUTH] Runtime authorization validation failed:', err.message);
//       return throwError(() => err);
//     })
//   );
// }

//   async registerFcmTokenAfterLogin(): Promise<void> {
//     try {
//       const deviceToken = await this.fcmService.getTokenAsync();
//       if (!deviceToken) return;

//       const result = await firstValueFrom(
//         this.apollo.mutate<any>({
//           mutation: REGISTER_FCM_TOKEN,
//           variables: { deviceToken },
//           fetchPolicy: 'no-cache'
//         })
//       );

//       if (result?.data?.registerFcmToken?.success) {
//         console.log('✅ [AUTH] Hardware Notification Pipeline attached to session context');
//       }
//     } catch (error) {
//       console.warn('⚠️ [AUTH] Push notification syncing deferred:', error);
//     }
//   }


  /**
 * 🟢 Registers/Updates the FCM token on the backend
 */
public async updateDeviceToken(deviceToken: string): Promise<boolean> {
  if (!this._user()) return false;

  try {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: REGISTER_FCM_TOKEN,
        variables: { deviceToken },
        fetchPolicy: 'no-cache'
      })
    );

    const success = !!result?.data?.registerFcmToken?.success;
    if (success) {
      console.log('✅ [AUTH] FCM token updated on backend.');
    }
    return success;
  } catch (error) {
    console.error('❌ [AUTH] Failed updating device token on backend:', error);
    return false;
  }
}

// /**
//  * 🔴 Unregisters/Removes the FCM token on the backend when notifications are disabled
//  */
public async removeDeviceToken(deviceToken: string): Promise<boolean> {
  const user = this._user();
  if (!user || !deviceToken) return false;

  try {
    await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: SIGN_OUT, // Reusing SIGN_OUT or your token deletion mutation
        variables: { userId: user.id, deviceToken },
        fetchPolicy: 'no-cache'
      })
    );
    console.log('🚫 [AUTH] Device token removed from backend.');
    return true;
  } catch (error) {
    console.warn('⚠️ [AUTH] Failed removing device token from backend:', error);
    return false;
  }
}

//      /**
//    * Checks if push notification permissions are already active on the native device.
//    * If granted, it fetches/refreshes the FCM token and syncs it with the server without popping up any UI prompts.
//    */
  async silentFcmTokenSync(): Promise<void> {
    // FCM / Push notifications only work on native devices (iOS / Android)
    if (!Capacitor.isNativePlatform()) {
      console.log('[AUTH] Web platform detected. Skipping silent FCM sync.');
      return;
    }
  
    try {
      const permStatus = await PushNotifications.checkPermissions();
  
      if (permStatus.receive === 'granted') {
        console.log('🔔 [AUTH] Push permission already granted. Syncing FCM token silently...');
        await this.registerFcmTokenAfterLogin();
      } else {
        console.log('ℹ️ [AUTH] Push permission not granted yet. Skipping FCM sync.');
      }
    } catch (error) {
      console.warn('⚠️ [AUTH] Silent FCM token sync check failed:', error);
    }
  }

//   // renewTokenSession(): Observable<string> {
//   //   const currentSession = this._user();
//   //   if (!currentSession?.refreshToken) {
//   //     return throwError(() => new Error('Active refresh anchors unavailable within current execution scope'));
//   //   }

//   //   if (this.isRefreshingToken) {
//   //     return this.refreshSubject.pipe(
//   //       filter((token): token is string => token !== null),
//   //       take(1)
//   //     );
//   //   }

//   //   this.isRefreshingToken = true;
//   //   this.refreshSubject.next(null);

//   //   return this.apollo.mutate<any>({
//   //     mutation: REFRESH_ACCESS_TOKEN,
//   //     variables: { refreshToken: currentSession.refreshToken },
//   //     fetchPolicy: 'no-cache'
//   //   }).pipe(
//   //     switchMap((res) => {
//   //       const refreshData = res?.data?.refreshAccessToken;
//   //       const freshToken = refreshData?.token;
//   //       if (!freshToken) throw new Error('Malformed mutation response payload structure');

//   //       const durationInSeconds = refreshData?.tokenExpiration || 3600;
//   //       const newExpiry = Date.now() + (durationInSeconds * 1000);

//   //       const updatedSession: AuthenticatedUser = {
//   //         ...currentSession,
//   //         token: freshToken,
//   //         tokenExpiryTimestamp: newExpiry
//   //       };

//   //       this._user.set(updatedSession);
        
//   //       return from(Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(updatedSession) })).pipe(
//   //         map(() => freshToken)
//   //       );
//   //     }),
//   //     tap((freshToken) => {
//   //       this.isRefreshingToken = false;
//   //       this.refreshSubject.next(freshToken);
//   //     }),
//   //     catchError((refreshErr) => {
//   //       this.isRefreshingToken = false;
//   //       this.refreshSubject.next(null);
//   //       return from(this.performClientSideLogout()).pipe(
//   //         switchMap(() => throwError(() => refreshErr))
//   //       );
//   //     })
//   //   );
//   // }

//     renewTokenSession(): Observable<string> {
//   const currentSession = this._user();
//   if (!currentSession?.refreshToken) {
//     return throwError(() => new Error('Active refresh anchors unavailable within current execution scope'));
//   }

//   if (this.isRefreshingToken) {
//     return this.refreshSubject.pipe(
//       filter((token): token is string => token !== null),
//       take(1)
//     );
//   }

//   this.isRefreshingToken = true;
//   this.refreshSubject.next(null);

//   return this.apollo.mutate<any>({
//     mutation: REFRESH_ACCESS_TOKEN,
//     variables: { refreshToken: currentSession.refreshToken },
//     fetchPolicy: 'no-cache'
//   }).pipe(
//     switchMap((res) => {
//       // Catch GraphQL errors returned with HTTP 200 status code
//       if (res.error) {
//         const errorMsg = res.error[0].message || 'GraphQL Error';
//         throw new Error(errorMsg);
//       }

//       const refreshData = res?.data?.refreshAccessToken;
//       const freshToken = refreshData?.token;
//       if (!freshToken) throw new Error('Malformed mutation response payload structure');

//       const durationInSeconds = refreshData?.tokenExpiration || 3600;
//       const newExpiry = Date.now() + (durationInSeconds * 1000);

//       const updatedSession: AuthenticatedUser = {
//         ...currentSession,
//         token: freshToken,
//         refreshToken: refreshData?.refreshToken || currentSession.refreshToken,
//         tokenExpiryTimestamp: newExpiry
//       };

//       this._user.set(updatedSession);
      
//       return from(Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(updatedSession) })).pipe(
//         map(() => freshToken)
//       );
//     }),
//     tap((freshToken) => {
//       this.isRefreshingToken = false;
//       this.refreshSubject.next(freshToken);
//     }),
//     catchError((refreshErr) => {
//       this.isRefreshingToken = false;
//       this.refreshSubject.next(null);
      
//       const errMessage = (refreshErr?.message || refreshErr?.error || '').toString().toLowerCase();
      
//       // 🔒 STRICT CHECK: Only purge session if the REFRESH TOKEN ITSELF is explicitly revoked/invalid
//       const isExplicitRefreshTokenFailure = 
//         errMessage.includes('refresh token expired') || 
//         errMessage.includes('invalid refresh token') ||
//         errMessage.includes('token_revoked') ||
//         errMessage.includes('unauthenticated');

//       if (isExplicitRefreshTokenFailure) {
//         console.error('[AUTH] Refresh token explicitly rejected by backend. Terminating session.');
//         return from(this.performClientSideLogout()).pipe(
//           switchMap(() => throwError(() => refreshErr))
//         );
//       }

//       // Keep storage intact for offline mode or network errors
//       return throwError(() => refreshErr);
//     })
//   );
// }

//   forgotPassword(identifier: string): Observable<any> {
//     return this.apollo.mutate<any>({
//       mutation: FORGOT_PASSWORD,
//       variables: { identifier },
//       fetchPolicy: 'no-cache'
//     }).pipe(map(res => res?.data?.forgotPassword));
//   }

//   resetPassword(token: string, newPassword: string): Observable<any> {
//     return this.apollo.mutate<any>({
//       mutation: RESET_PASSWORD,
//       variables: { token, newPassword },
//       fetchPolicy: 'no-cache'
//     }).pipe(map(res => res?.data?.resetPassword));
//   }

//   createUser(formInput: any): Observable<any> {
//     const mappedAccessLevel = ['ADMIN', 'SYSTEM_ADMIN'].includes(formInput.accessLevel) ? 'SYSTEM_ADMIN' : formInput.accessLevel === 'ACCOUNT_HOLDER' ? 'ACCOUNT_HOLDER' : 'STAFF';

//     return this.apollo.mutate({
//       mutation: CREATE_USER,
//       variables: {
//         input: {
//           name: formInput.name,
//           username: formInput.username,
//           password: formInput.password,
//           accessLevel: mappedAccessLevel,
//           accountTier: formInput.accountTier != null ? parseInt(formInput.accountTier, 10) : null,
//           parent: formInput.parent || null,
//           email: formInput.email?.trim() || null,
//           contact: formInput.contact?.trim() || null,
//           businessProfile: { logo: formInput.logo || "" }
//         }
//       },
//       fetchPolicy: 'no-cache'
//     });
//   }

//   updateUser(id: string, userData: any): Observable<any> {
//     const mappedAccessLevel = ['ADMIN', 'SYSTEM_ADMIN'].includes(userData.accessLevel) ? 'SYSTEM_ADMIN' : userData.accessLevel === 'ACCOUNT_HOLDER' ? 'ACCOUNT_HOLDER' : 'STAFF';

//     const inputPayload: any = {
//       name: userData.name,
//       username: userData.username,
//       accessLevel: mappedAccessLevel,
//       email: userData.email || null,
//       contact: userData.contact || null,
//       businessProfile: { logo: userData.logo || "" }
//     };

//     if (userData.accountTier != null && userData.accountTier !== '') inputPayload.accountTier = Number(userData.accountTier);
//     if (userData.parent) inputPayload.parent = userData.parent;
//     if (userData.password) inputPayload.password = userData.password;

//     return this.apollo.mutate({
//       mutation: UPDATE_USER,
//       variables: { id, input: inputPayload },
//       fetchPolicy: 'no-cache'
//     });
//   }

//  async logout(deviceToken?: string | null): Promise<void> {
//   const user = this._user();
//   // Get token or fallback gracefully
//   const tokenToUnregister = deviceToken || this.fcmService.getCurrentToken() || null;

//   if (user) {
//     try {
//       // 1. Tell backend to delete session
//       await firstValueFrom(this.apollo.mutate({
//         mutation: SIGN_OUT,
//         variables: { 
//           userId: user.id, 
//           deviceToken: tokenToUnregister // Can be string or null
//         },
//         fetchPolicy: 'no-cache'
//       }));
//     } catch (err) {
//       console.error('[AUTH] Server session cleanup processing skipped:', err);
//     }
//   }

//   // 2. Unregister FCM token from the actual device hardware
//   try {
//     await this.fcmService.deleteToken(); // Calls FirebaseMessaging.deleteToken()
//   } catch (err) {
//     console.warn('[AUTH] FCM token hardware unregistration skipped:', err);
//   }

//   // 3. Clear local storage and state
//   await this.performClientSideLogout();
// }

  // public async performClientSideLogout(): Promise<void> {
  //   this._user.set(null);
  //   await Preferences.remove({ key: STORAGE_KEY });
    

  //   try {
  //     await this.apollo.client.clearStore();
  //   } catch (e) {
  //     console.warn('[AUTH] Could not clear Apollo cache:', e);
  //   }

  //   await this.router.navigateByUrl('/login', { replaceUrl: true });
  // }


//   public async performClientSideLogout(): Promise<void> {
//   // 1. Reset reactive user state
//   this._user.set(null);


//   // 2. Clear Capacitor Preferences (preserving onboarding key)
//   try {
//     const { keys } = await Preferences.keys();

//     await Promise.all(keys.map((key) => Preferences.remove({ key })));
//   } catch (e) {
//     console.warn('[AUTH] Error clearing Capacitor Preferences:', e);
//   }

//   // 3. Clear Web Storage (localStorage & sessionStorage)
//   try {
//     // Preserve local value if present

//     localStorage.clear();
//     sessionStorage.clear();

//   } catch (e) {
//     console.warn('[AUTH] Error clearing Web Storage:', e);
//   }

//   // 4. Wipe Apollo Client Cache entirely
//   try {
//     await this.apollo.client.clearStore();
//   } catch (e) {
//     console.warn('[AUTH] Could not clear Apollo cache:', e);
//   }

//   // 5. Navigate back to login screen
//   await this.router.navigateByUrl('/login', { replaceUrl: true });
// }










  /**
   * Safe initialization using native storage subsystems via Capacitor
   */
  private async initializeNativeSession(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });

      if (!value) {
        return;
      }

      const user: AuthenticatedUser = JSON.parse(value);

      // 1. Purge only if session has NO refresh anchor at all
      if (!user?.refreshToken) {
        console.warn('[AUTH] Missing refresh token footprint. Purging session.');
        await this.performClientSideLogout();
        return;
      }

      // 2. Hydrate state immediately
      this._user.set(user);

      // 3. Proactively refresh expired token on app boot
      if (Date.now() >= user.tokenExpiryTimestamp) {
        console.log('[AUTH] Access token expired overnight/offline. Triggering silent refresh...');
        try {
          await firstValueFrom(this.renewTokenSession());
          console.log('✅ [AUTH] Cold-boot session refresh succeeded.');
        } catch (refreshErr) {
          console.warn('⚠️ [AUTH] Cold-boot session refresh deferred (Server offline or invalid token):', refreshErr);
        }
      }
    } catch (err) {
      console.error('[AUTH] Failed parsing cross-platform hardware profile context:', err);
      await Preferences.remove({ key: STORAGE_KEY });
    } finally {
      // Ensure lock resolves so routing guards can accurately evaluate state
      this.initPromiseResolve(true);
    }
  }

  signIn(identifier: string, password: string): Observable<any> {
    console.log(`[AUTH] Spawning authentication thread for: ${identifier}`);

    return from(
      Promise.all([
        this.fcmService.getTokenAsync(),
        this.getDeviceInfoPayload()
      ])
    ).pipe(
      switchMap(([deviceToken, deviceInfo]) => {
        return this.apollo.mutate<any>({
          mutation: SIGN_IN,
          variables: {
            identifier,
            password,
            deviceToken: deviceToken || null,
            deviceInfo // 🟢 Included hardware telemetry
          },
          fetchPolicy: 'no-cache',
        });
      }),
      switchMap((result) => {
        const loginData = result?.data?.signIn;
        if (!loginData) {
          throw new Error(result?.error?.[0]?.message || 'Authentication Engine Error');
        }

        const durationInSeconds = loginData.tokenExpiration || 3600;
        const expiryTime = Date.now() + (durationInSeconds * 1000);

        const authenticatedUserData: AuthenticatedUser = {
          id: loginData.id,
          name: loginData.name,
          username: loginData.username,
          email: loginData.email,
          contact: loginData.contact,
          logo: loginData.logo,
          path: loginData.path,
          accountTier: loginData.accountTier,
          accessLevel: loginData.accessLevel,
          token: loginData.token,
          refreshToken: loginData.refreshToken,
          tokenExpiryTimestamp: expiryTime
        };

        this._user.set(authenticatedUserData);

        return from(
          Preferences.set({
            key: STORAGE_KEY,
            value: JSON.stringify(authenticatedUserData)
          })
        ).pipe(map(() => loginData));
      }),
      tap(() => {
        setTimeout(() => {
          this.registerFcmTokenAfterLogin().catch((err) =>
            console.warn('⚠️ [AUTH] FCM background link deferred:', err)
          );
        }, 300);
      }),
      catchError((err) => {
        console.error('[AUTH] Runtime authorization validation failed:', err.message);
        return throwError(() => err);
      })
    );
  }

  async registerFcmTokenAfterLogin(): Promise<void> {
    try {
      const [deviceToken, deviceInfo] = await Promise.all([
        this.fcmService.getTokenAsync(),
        this.getDeviceInfoPayload()
      ]);

      if (!deviceToken) return;

      const result = await firstValueFrom(
        this.apollo.mutate<any>({
          mutation: REGISTER_FCM_TOKEN,
          variables: { deviceToken, deviceInfo },
          fetchPolicy: 'no-cache'
        })
      );

      if (result?.data?.registerFcmToken?.success) {
        console.log('✅ [AUTH] Hardware Notification Pipeline attached to session context');
      }
    } catch (error) {
      console.warn('⚠️ [AUTH] Push notification syncing deferred:', error);
    }
  }

    private async getDeviceInfoPayload() {
  try {
    const [info, appInfo] = await Promise.all([
      Device.getInfo(),
      App.getInfo().catch(() => ({ version: '1.0.0' }))
    ]);

    return {
      os: info.operatingSystem || 'unknown',
      model: info.model || 'browser',
      appVersion: appInfo.version || '1.0.0',
      platform: info.platform || 'web'
    };
  } catch {
    return {
      os: 'web',
      model: 'browser',
      appVersion: '1.0.0',
      platform: 'web'
    };
  }
}

  renewTokenSession(): Observable<string> {
    const currentSession = this._user();
    if (!currentSession?.refreshToken) {
      return throwError(() => new Error('Active refresh anchors unavailable within current execution scope'));
    }

    if (this.isRefreshingToken) {
      return this.refreshSubject.pipe(
        filter((token): token is string => token !== null),
        take(1)
      );
    }

    this.isRefreshingToken = true;
    this.refreshSubject.next(null);

    return from(this.getDeviceInfoPayload()).pipe(
      switchMap((deviceInfo) => {
        return this.apollo.mutate<any>({
          mutation: REFRESH_ACCESS_TOKEN,
          variables: { 
            refreshToken: currentSession.refreshToken,
            deviceInfo // 🟢 Pass telemetry during refresh
          },
          fetchPolicy: 'no-cache'
        });
      }),
      switchMap((res) => {
        if (res.error) {
          const errorMsg = res.error[0].message || 'GraphQL Error';
          throw new Error(errorMsg);
        }

        const refreshData = res?.data?.refreshAccessToken;
        const freshToken = refreshData?.token;
        if (!freshToken) throw new Error('Malformed mutation response payload structure');

        const durationInSeconds = refreshData?.tokenExpiration || 3600;
        const newExpiry = Date.now() + (durationInSeconds * 1000);

        const updatedSession: AuthenticatedUser = {
          ...currentSession,
          token: freshToken,
          refreshToken: refreshData?.refreshToken || currentSession.refreshToken,
          tokenExpiryTimestamp: newExpiry
        };

        this._user.set(updatedSession);

        return from(Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(updatedSession) })).pipe(
          map(() => freshToken)
        );
      }),
      tap((freshToken) => {
        this.isRefreshingToken = false;
        this.refreshSubject.next(freshToken);
      }),
      catchError((refreshErr) => {
        this.isRefreshingToken = false;
        this.refreshSubject.next(null);

        const errMessage = (refreshErr?.message || refreshErr?.error || '').toString().toLowerCase();

        const isExplicitRefreshTokenFailure =
          errMessage.includes('refresh token expired') ||
          errMessage.includes('invalid refresh token') ||
          errMessage.includes('token_revoked') ||
          errMessage.includes('unauthenticated');

        if (isExplicitRefreshTokenFailure) {
          console.error('[AUTH] Refresh token explicitly rejected by backend. Terminating session.');
          return from(this.performClientSideLogout()).pipe(
            switchMap(() => throwError(() => refreshErr))
          );
        }

        return throwError(() => refreshErr);
      })
    );
  }

  forgotPassword(identifier: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: FORGOT_PASSWORD,
      variables: { identifier },
      fetchPolicy: 'no-cache'
    }).pipe(map(res => res?.data?.forgotPassword));
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: RESET_PASSWORD,
      variables: { token, newPassword },
      fetchPolicy: 'no-cache'
    }).pipe(map(res => res?.data?.resetPassword));
  }

  createUser(formInput: any): Observable<any> {
    const mappedAccessLevel = ['ADMIN', 'SYSTEM_ADMIN'].includes(formInput.accessLevel)
      ? 'SYSTEM_ADMIN'
      : formInput.accessLevel === 'ACCOUNT_HOLDER'
        ? 'ACCOUNT_HOLDER'
        : 'STAFF';

    return this.apollo.mutate({
      mutation: CREATE_USER,
      variables: {
        input: {
          name: formInput.name,
          username: formInput.username,
          password: formInput.password,
          accessLevel: mappedAccessLevel,
          accountTier: formInput.accountTier != null ? parseInt(formInput.accountTier, 10) : null,
          parent: formInput.parent || null,
          email: formInput.email?.trim() || null,
          contact: formInput.contact?.trim() || null,
          businessProfile: { logo: formInput.logo || '' }
        }
      },
      fetchPolicy: 'no-cache'
    });
  }

  updateUser(id: string, userData: any): Observable<any> {
    const mappedAccessLevel = ['ADMIN', 'SYSTEM_ADMIN'].includes(userData.accessLevel)
      ? 'SYSTEM_ADMIN'
      : userData.accessLevel === 'ACCOUNT_HOLDER'
        ? 'ACCOUNT_HOLDER'
        : 'STAFF';

    const inputPayload: any = {
      name: userData.name,
      username: userData.username,
      accessLevel: mappedAccessLevel,
      email: userData.email || null,
      contact: userData.contact || null,
      businessProfile: { logo: userData.logo || '' }
    };

    if (userData.accountTier != null && userData.accountTier !== '') inputPayload.accountTier = Number(userData.accountTier);
    if (userData.parent) inputPayload.parent = userData.parent;
    if (userData.password) inputPayload.password = userData.password;

    return this.apollo.mutate({
      mutation: UPDATE_USER,
      variables: { id, input: inputPayload },
      fetchPolicy: 'no-cache'
    });
  }

  async logout(deviceToken?: string | null): Promise<void> {
    const user = this._user();
    const tokenToUnregister = deviceToken || this.fcmService.getCurrentToken() || null;

    if (user) {
      try {
        await firstValueFrom(this.apollo.mutate({
          mutation: SIGN_OUT,
          variables: {
            userId: user.id,
            deviceToken: tokenToUnregister
          },
          fetchPolicy: 'no-cache'
        }));
      } catch (err) {
        console.error('[AUTH] Server session cleanup processing skipped:', err);
      }
    }

    try {
      await this.fcmService.deleteToken();
    } catch (err) {
      console.warn('[AUTH] FCM token hardware unregistration skipped:', err);
    }

    await this.performClientSideLogout();
  }

  public async performClientSideLogout(): Promise<void> {
    // 1. Reset reactive user state
    this._user.set(null);

    // 2. Clear user session key from Capacitor Preferences
    try {
      await Preferences.remove({ key: STORAGE_KEY });
    } catch (e) {
      console.warn('[AUTH] Error removing session key from Preferences:', e);
    }

    // 3. Clear Web Storage
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[AUTH] Error clearing Web Storage:', e);
    }

    // 4. Wipe Apollo Client Cache entirely
    try {
      await this.apollo.client.clearStore();
    } catch (e) {
      console.warn('[AUTH] Could not clear Apollo cache:', e);
    }

    // 5. Navigate back to login screen
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }







  
}