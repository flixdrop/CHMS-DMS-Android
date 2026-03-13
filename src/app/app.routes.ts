// import { Routes } from '@angular/router';

// export const routes: Routes = [
//   {
//     path: 'home',
//     loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
//   },
//   {
//     path: '',
//     redirectTo: 'home',
//     pathMatch: 'full',
//   },
// ];

// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuardService } from './features/auth-guard/auth-guard.service';

// Component imports (standalone pages)
import { AnimalListPage } from './pages/animal-list/animal-list.page';
import { DetailPage } from './pages/detail/ditail.page';
import { HeatPage } from './pages/heat/heat.page';
import { HealthPage } from './pages/health/health.page';
import { PregnancyCheckPage } from './pages/pregnancy-check/pregnancy-check.page';
import { RecoveryPage } from './pages/recovery/recovery.page';
import { PregnantPage } from './pages/pregnant/pregnant.page';
import { CalvingPage } from './pages/calving/calving.page';
import { DryoffPage } from './pages/dryoff/dryoff.page';
import { DairyPage } from './pages/dairy/dairy.page';
import { EventPage } from './pages/event/event.page';
import { ProfilePage } from './pages/profile/profile.page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing/tabs/home',
    pathMatch: 'full',
  },

  // Public routes
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'retry',
    loadComponent: () =>
      import('./pages/retry/retry.page').then((m) => m.RetryPage),
  },

  // Protected routes
  {
    path: '',
    canActivate: [AuthGuardService],
    children: [
      {
        path: 'landing',
        loadComponent: () =>
          import('./pages/landing/landing.page').then((m) => m.LandingPage),
        children: [
          {
            path: 'tabs/home',
            loadComponent: () =>
              import('./pages/landing/home/home.page').then((m) => m.HomePage),
          },
          {
            path: '',
            redirectTo: 'tabs/home',
            pathMatch: 'full',
          },
        ],
      },
      { path: 'animal-list', component: AnimalListPage },
      { path: 'animal-list/:animal', component: DetailPage },
      { path: 'event', component: EventPage },
      { path: 'health', component: HealthPage },
      { path: 'recovery', component: RecoveryPage },
      { path: 'heat', component: HeatPage },
      { path: 'pregnancy-check', component: PregnancyCheckPage },
      { path: 'pregnant', component: PregnantPage },
      { path: 'calving', component: CalvingPage },
      { path: 'dryoff', component: DryoffPage },
      { path: 'dairy', component: DairyPage },
      { path: 'profile', component: ProfilePage },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'landing/tabs/home' },
];
