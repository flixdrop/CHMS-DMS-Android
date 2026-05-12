import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  firstValueFrom,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Router } from '@angular/router';
import { FcmService } from '../fcm/fcm.service';
import { Apollo } from 'apollo-angular';
import {
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  SIGN_IN,
  SIGN_OUT,
} from 'src/app/graphql/auth.queries';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user = new BehaviorSubject<any>(null);
  authenticatedUser$ = this._user.asObservable();
  private tokenExpirationTimer: any;

  constructor(
    private apollo: Apollo,
    private router: Router,
    private fcmService: FcmService,
  ) {}

  setUser(user: any) {
    this._user.next(user);
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_token', JSON.stringify(user.token));
  }

  clearUser() {
    this._user.next(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('token');
  }

  getAccessToken(): string | null {
    const user = this._user.value;
    return user?.token || null;
  }

  autoLogin() {
    const savedUser = localStorage.getItem('auth_user');
    if (!savedUser) return;

    this._user.next(JSON.parse(savedUser));
  }

  signIn(identifier: string, password: string) {
    return this.apollo
      .mutate<any>({
        mutation: SIGN_IN,
        variables: { identifier, password },
        fetchPolicy: 'no-cache',
      })
      .pipe(
        tap((result) => {
          const loginData = result?.data?.signIn;
          if (loginData) {
            const user = {
              id: loginData.id,
              username: loginData.username,
              email: loginData.email,
              role: loginData.role,
              token: loginData.token,
              tokenExpiration: +loginData.tokenExpiration,
            };
            this.setUser(user);
          } else {
            console.error('Invalid login response:', result);
            throw new Error('Invalid login credentials');
          }
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return of(null);
        }),
      );
  }

  async onForgotPassword(identifier: string) {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: FORGOT_PASSWORD,
        variables: { identifier },
        fetchPolicy: 'no-cache',
      }),
    );
    return result.data?.forgotPassword;
  }

  async onResetPassword(token: string, newPassword: string) {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: RESET_PASSWORD,
        variables: { token, newPassword },
        fetchPolicy: 'no-cache',
      }),
    );
    return result.data?.resetPassword;
  }

  closeSession(userId: string, deviceToken: string) {
    return this.apollo.mutate<any>({
      mutation: SIGN_OUT,
      variables: { userId, deviceToken },
      fetchPolicy: 'no-cache',
    });
  }
  autoLogout(expirationDuration: number) {
    console.log(
      '%cTimer:' + expirationDuration,
      'color: gold; font-weight: bold;',
    );

    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  async logout() {
    this.authenticatedUser$
      .pipe(
        take(1),
        switchMap((user) => {
          if (user) {
            return this.fcmService.getRegistrationToken().pipe(
              take(1),
              switchMap((token) => {
                if (token) {
                  return this.closeSession(user['id'], token);
                } else {
                  return of(null);
                }
              }),
            );
          } else {
            return of(null);
          }
        }),
      )
      .subscribe({
        next: () => this.performClientSideLogout(),
        error: (err) => {
          console.error('Logout API failed:', err);
          this.performClientSideLogout();
        },
      });
  }

  private performClientSideLogout() {
    this._user.next(null);

    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }

    localStorage.clear();
    this.router.navigateByUrl('/login');
    window.location.reload();
  }
}
