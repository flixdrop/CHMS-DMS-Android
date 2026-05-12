import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Network } from '@capacitor/network';
import { firstValueFrom, map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  async isConnected(): Promise<boolean> {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch (error) {
      console.error('Network status check failed:', error);
      return false;
    }
  }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    // 1️⃣ Check network first
    if (!(await this.isConnected())) {
      return this.router.createUrlTree(['/retry']);
    }

    // 2️⃣ Check auth (complete immediately)
    return firstValueFrom(
      this.authService.authenticatedUser$.pipe(
        map((user) =>
          user
            ? true
            : this.router.createUrlTree(['/login'], {
                queryParams: { redirect: state.url },
              }),
        ),
      ),
    );
  }
}
