
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, throwError, from, of, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { tap, catchError, switchMap, map, shareReplay, finalize } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import { FcmService } from '../fcm/fcm.service';
import {
  SIGN_IN,
  REGISTER_FCM_TOKEN,
  REFRESH_ACCESS_TOKEN,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  CREATE_USER,
  UPDATE_USER,
  SIGN_OUT,
} from '../../graphql/queries/auth.queries';

export interface AuthenticatedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  contact: string;
  logo: string;
  path: string;
  parent?: string;
  accountTier: number;
  accessLevel: string;
  token: string;
  refreshToken: string;
  tokenExpiryTimestamp: number;
}

const STORAGE_KEY = 'chms-dms.mobile.user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apollo = inject(Apollo);
  private readonly router = inject(Router);
  private readonly fcmService = inject(FcmService);

  // 1. STATE MANAGEMENT
  private readonly _user = signal<AuthenticatedUser | null>(null);
  public readonly currentUser = this._user.asReadonly();
  public readonly isAuthenticated = computed(() => this._user() !== null);
  public readonly accessToken = computed(() => this._user()?.token ?? null);
  public readonly authenticatedUser$ = toObservable(this._user);
  public readonly isLoggedIn$ = this.authenticatedUser$.pipe(map((user) => !!user));

  // 2. IN-FLIGHT REFRESH CACHE
  private activeRefresh$: Observable<string> | null = null;
  private isLoggingOut = false;

  private initPromiseResolve!: (value: boolean) => void;
  public readonly isInitialized = new Promise<boolean>((resolve) => {
    this.initPromiseResolve = resolve;
  });

  constructor() {
    this.initializeNativeSession();
  }

  // 🟢 EXPOSED PUBLICLY SO login.page.ts CAN AWAIT IT DIRECTLY
  public async persistUserSession(userData: AuthenticatedUser): Promise<void> {
    this._user.set(userData);
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(userData),
    });
  }

  private extractGraphQLError(result: any, fallbackMessage: string): string | null {
    if (result?.error?.message) return result.error.message;
    if (Array.isArray(result?.errors) && result.errors.length > 0) {
      return result.errors[0]?.message || fallbackMessage;
    }
    return null;
  }

  // 3. REFACTORED TOKEN REFRESH
  renewTokenSession(): Observable<string> {
    const currentSession = this._user();
    if (!currentSession?.refreshToken) {
      return throwError(() => new Error('Active refresh anchors unavailable within current scope'));
    }

    if (this.activeRefresh$) {
      return this.activeRefresh$;
    }

    this.activeRefresh$ = from(this.getDeviceInfoPayload()).pipe(
      switchMap((deviceInfo) => {
        const deviceToken = this.fcmService.getCurrentToken() || null;
        return this.apollo.mutate<any>({
          mutation: REFRESH_ACCESS_TOKEN,
          variables: {
            refreshToken: currentSession.refreshToken,
            deviceToken,
            deviceInfo,
          },
          fetchPolicy: 'no-cache',
        });
      }),
      switchMap((res) => {
        const err = this.extractGraphQLError(res, 'GraphQL Refresh Error');
        if (err) throw new Error(err);

        const refreshData = res?.data?.refreshAccessToken;
        const freshToken = refreshData?.token;
        if (!freshToken) throw new Error('Malformed mutation response payload');

        const durationInSeconds = refreshData?.tokenExpiration || 3600;
        const newExpiry = Date.now() + durationInSeconds * 1000;

        const updatedSession: AuthenticatedUser = {
          ...currentSession,
          path: refreshData?.path || currentSession.path,
          parent: refreshData?.parent || currentSession.parent,
          token: freshToken,
          refreshToken: refreshData?.refreshToken || currentSession.refreshToken,
          tokenExpiryTimestamp: newExpiry,
        };

        return from(this.persistUserSession(updatedSession)).pipe(
          map(() => freshToken)
        );
      }),
      catchError((refreshErr) => {
        const errMessage = (refreshErr?.message || refreshErr?.error || '').toString().toLowerCase();

        const isExplicitRefreshTokenFailure =
          errMessage.includes('refresh token expired') ||
          errMessage.includes('invalid refresh token') ||
          errMessage.includes('token_revoked') ||
          errMessage.includes('unauthenticated') ||
          errMessage.includes('session_expired_or_revoked');

        if (isExplicitRefreshTokenFailure) {
          console.error('[AUTH] Refresh token rejected by backend. Terminating session.');
          return from(this.performClientSideLogout()).pipe(
            switchMap(() => throwError(() => refreshErr))
          );
        }

        return throwError(() => refreshErr);
      }),
      shareReplay(1),
      finalize(() => {
        this.activeRefresh$ = null;
      })
    );

    return this.activeRefresh$;
  }

  async updateDeviceToken(deviceToken: string): Promise<boolean> {
    if (!this._user()) return false;
    try {
      const deviceInfo = await this.getDeviceInfoPayload();
      const result = await firstValueFrom(
        this.apollo.mutate<any>({
          mutation: REGISTER_FCM_TOKEN,
          variables: { deviceToken, deviceInfo },
          fetchPolicy: 'no-cache',
        })
      );
      return !!result?.data?.registerDeviceToken?.success;
    } catch (error) {
      console.error('❌ [AUTH] Failed updating device token on backend:', error);
      return false;
    }
  }

  async removeDeviceToken(deviceToken: string): Promise<boolean> {
    if (!this._user() || !deviceToken) return false;
    try {
      await firstValueFrom(
        this.apollo.mutate<any>({
          mutation: SIGN_OUT,
          variables: { deviceToken },
          fetchPolicy: 'no-cache',
        })
      );
      return true;
    } catch (error) {
      console.warn('⚠️ [AUTH] Failed removing device token:', error);
      return false;
    }
  }

  // 4. BOOT INITIALIZATION
  private async initializeNativeSession(): Promise<void> {
    try {

      // 1. Read using the EXACT matching key
    const { value: keepStr } = await Preferences.get({ key: 'chms-dms.mobile.keep_me_logged_in' });
    const keepMeLoggedIn = keepStr === 'true';

    console.log(`[AUTH BOOT] Keep Logged In setting: "${keepStr}" (Resolved: ${keepMeLoggedIn})`);

    // 2. If opted out, wipe credentials immediately
    if (!keepMeLoggedIn) {
      console.log('[AUTH] Opted out of persistence. Clearing credentials on cold boot.');
      this._user.set(null); // Ensure Angular Signal is cleared
      await Preferences.remove({ key: STORAGE_KEY });
      return;
    }

      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (!value) return;

      const user: AuthenticatedUser = JSON.parse(value);
      if (!user?.refreshToken) {
        console.warn('[AUTH] Missing refresh token footprint. Purging session.');
        await this.performClientSideLogout();
        return;
      }

      this._user.set(user);
      this.silentdeviceTokenSync();

      const proactiveThresholdMs = 10000;
      if (Date.now() >= user.tokenExpiryTimestamp - proactiveThresholdMs) {
        console.log('[AUTH] Token near expiry on boot. Triggering silent refresh...');
        try {
          await firstValueFrom(this.renewTokenSession()).catch(e => console.warn('⚠️ [AUTH] Cold-boot refresh deferred:', e));
        } catch (err) { /* Ignored */ }
      }
    } catch (err) {
      console.error('[AUTH] Error reading session storage:', err);
      await Preferences.remove({ key: STORAGE_KEY });
    } finally {
      this.initPromiseResolve(true);
    }
  }

  // 🟢 FIX: Rewritten to pure async/await for predictable Zoneless execution
  async signIn(identifier: string, password: string): Promise<any> {
    try {
      const deviceInfo = await this.getDeviceInfoPayload();
      const { value: onboardingStr } = await Preferences.get({ key: 'chms_onboarding_completed' });
      const isOnboardingCompleted = onboardingStr === 'true';

      let deviceToken = '';
      if (isOnboardingCompleted) {
        // Attempt to get token, fallback to empty string if denied/failed so login proceeds
        deviceToken = await this.fcmService.getTokenAsync().catch(() => '');
      }

      const result = await firstValueFrom(
        this.apollo.mutate<any>({
          mutation: SIGN_IN,
          variables: {
            identifier,
            password,
            deviceToken: deviceToken || null,
            deviceInfo,
          },
          fetchPolicy: 'no-cache',
        })
      );

      const err = this.extractGraphQLError(result, 'Authentication Engine Error');
      if (err) throw new Error(err);

      const loginData = result?.data?.signIn;
      if (!loginData) throw new Error('Authentication response empty');

      const durationInSeconds = loginData.tokenExpiration || 3600;
      const expiryTime = Date.now() + durationInSeconds * 1000;

      const authenticatedUserData: AuthenticatedUser = {
        id: loginData.id,
        name: loginData.name,
        username: loginData.username,
        email: loginData.email,
        contact: loginData.contact,
        logo: loginData.logo,
        path: loginData.path,
        parent: loginData.parent || undefined,
        accountTier: loginData.accountTier,
        accessLevel: loginData.accessLevel,
        token: loginData.token,
        refreshToken: loginData.refreshToken,
        tokenExpiryTimestamp: expiryTime,
      };

      // Ensure storage is fully locked in before returning success
      await this.persistUserSession(authenticatedUserData);

      if (isOnboardingCompleted) {
        this.silentdeviceTokenSync(); 
      }

      return loginData;
    } catch (error) {
      throw error;
    }
  }

  async silentdeviceTokenSync(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'granted') {
        await this.registerDeviceTokenAfterLogin();
      }
    } catch (error) {
      console.warn('⚠️ [AUTH] Silent FCM token sync check failed:', error);
    }
  }

  async registerDeviceTokenAfterLogin(): Promise<void> {
    if (!this._user()) return;
    try {
      const deviceToken = await this.fcmService.getTokenAsync();
      const deviceInfo = await this.getDeviceInfoPayload();

      if (!deviceToken) return;

      await firstValueFrom(
        this.apollo.mutate<any>({
          mutation: REGISTER_FCM_TOKEN,
          variables: { deviceToken, deviceInfo },
          fetchPolicy: 'no-cache',
        })
      );
    } catch (error) {
      console.warn('⚠️ [AUTH] Push notification syncing deferred:', error);
    }
  }

  private async getDeviceInfoPayload() {
    try {
      const info = await Device.getInfo().catch(() => ({ platform: 'web', model: 'browser', osVersion: 'unknown' }));
      const appInfo = await App.getInfo().catch(() => ({ version: '1.0.0' }));

      let platform: 'android' | 'ios' | 'web' | 'unknown' = 'unknown';
      if (info.platform === 'android' || info.platform === 'ios' || info.platform === 'web') {
        platform = info.platform;
      }

      return {
        model: info.model || 'browser',
        platform,
        osVersion: info.osVersion || 'unknown',
        appVersion: appInfo.version || '1.0.0',
      };
    } catch {
      return { model: 'browser', platform: 'web' as const, osVersion: 'unknown', appVersion: '1.0.0' };
    }
  }

  public async ensureValidSession(): Promise<boolean> {
  // Wait for cold-boot storage read to finish
  await this.isInitialized;

  const user = this._user();

  // 1. If no user in memory, session is definitively dead.
  if (!user) return false;

  // 2. If token is still valid (with a 10s buffer), let them in instantly.
  if (Date.now() < user.tokenExpiryTimestamp - 10000) {
    return true;
  }

  // 3. Token is expired. We MUST wait for a successful refresh to continue.
  try {
    console.log('[AUTH] Token expired. Awaiting guard-level refresh...');
    await firstValueFrom(this.renewTokenSession());
    return true;
  } catch (error) {
    console.error('[AUTH] Guard refresh failed:', error);
    // Return false to block the route, but DO NOT call this.logout() here.
    // If the failure was just a bad network connection, wiping the storage is fatal!
    return false;
  }
}




  async logout(deviceToken?: string | null): Promise<void> {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    const activeUser = this._user();
    const tokenToRevoke = deviceToken || this.fcmService.getCurrentToken();

    try {
      if (activeUser && tokenToRevoke) {
        await firstValueFrom(
          this.apollo.mutate({
            mutation: SIGN_OUT,
            variables: { deviceToken: tokenToRevoke },
            fetchPolicy: 'no-cache',
          })
        );
      }
    } catch (err) {
      console.warn('⚠️ [AUTH] Server-side logout request failed or timed out:', err);
    } finally {
      await this.fcmService.deleteToken();
      await this.performClientSideLogout();
      this.isLoggingOut = false;
    }
  }

  async performClientSideLogout(): Promise<void> {
    try {
      await Preferences.remove({ key: STORAGE_KEY });
      await Preferences.remove({ key: 'chms-dms.mobile.keep_me_logged_in' });
      localStorage.removeItem('chms-dms.mobile.keep_me_logged_in');

      try {
        this.apollo.client.stop(); 
        await this.apollo.client.clearStore();
      } catch (cacheErr) {
        console.warn('⚠️ [AUTH] Suppressed Apollo cache clearance warning.');
      }

      this._user.set(null);
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (e) {
      console.error('[AUTH] Failed to perform client side logout:', e);
    }
  }

  forgotPassword(identifier: string): Observable<any> {
    return this.apollo
      .mutate<any>({
        mutation: FORGOT_PASSWORD,
        variables: { identifier },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((res) => res?.data?.forgotPassword));
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apollo
      .mutate<any>({
        mutation: RESET_PASSWORD,
        variables: { token, newPassword },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((res) => res?.data?.resetPassword));
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
          businessProfile: { logo: formInput.logo || '' },
        },
      },
      fetchPolicy: 'no-cache',
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
      businessProfile: { logo: userData.logo || '' },
    };

    if (userData.accountTier != null && userData.accountTier !== '')
      inputPayload.accountTier = Number(userData.accountTier);
    if (userData.parent) inputPayload.parent = userData.parent;
    if (userData.password) inputPayload.password = userData.password;

    return this.apollo.mutate({
      mutation: UPDATE_USER,
      variables: { id, input: inputPayload },
      fetchPolicy: 'no-cache',
    });
  }
}