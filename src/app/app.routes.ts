// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { ProfilePage } from './pages/profile/profile.page';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { onboardingGuard } from './guards/onboarding.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing/tabs/home',
    pathMatch: 'full',
  },

  {
    path: 'login',
    canActivate: [guestGuard], // 👈 Redirects to '/home' if already logged in
    loadComponent: () =>
      import('./pages/features/auth/login/login.page').then((m) => m.LoginPage),
  },
  // {
  //   path: 'onboarding',
  //   loadComponent: () => import('./pages/onboarding/onboarding.page').then(m => m.OnboardingPage),
  //   canActivate: [onboardingGuard], // Ensures it only runs once per install
  // },
  {
    path: 'retry',
    loadComponent: () =>
      import('./pages/retry/retry.page').then((m) => m.RetryPage),
  },

  {
    path: '',
    canActivate: [authGuard],
    children: [

      {
        path: 'onboarding',
        canActivate: [onboardingGuard], // Ensures it only runs once per user/install
        loadComponent: () =>
          import('./pages/onboarding/onboarding.page').then(
            (m) => m.OnboardingPage,
          ),
      },
      {
        path: 'landing',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/landing/landing.page').then((m) => m.LandingPage),
        children: [
          {
            path: 'tabs/home',
            canActivate: [authGuard],

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

      { path: 'profile', canActivate: [authGuard], component: ProfilePage },

      {
        path: 'animals',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/animals/animals.page').then(
            (m) => m.AnimalsPage,
          ),
      },

      {
        path: 'animals-insights',
        loadComponent: () =>
          import('./pages/features/animals/animal-insights/animal-insights.page').then(
            (m) => m.AnimalInsightsPage,
          ),
      },

      {
        path: 'reproductions',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/chms/reproduction/reproduction.page').then(
            (m) => m.ReproductionPage,
          ),
      },
      {
        path: 'healths',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/chms/health/health.page').then(
            (m) => m.HealthPage,
          ),
      },
      {
        path: 'recoveries',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/chms/recovery/recovery.page').then(
            (m) => m.RecoveryPage,
          ),
      },
      {
        path: 'heats',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/chms/heat/heat.page').then(
            (m) => m.HeatPage,
          ),
      },
      {
        path: 'inseminations',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/chms/insemination/insemination.page').then(
            (m) => m.InseminationPage,
          ),
      },
      {
        path: 'pregnancies',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/chms/pregnancy/pregnancy.page').then(
            (m) => m.PregnancyPage,
          ),
      },
      {
        path: 'calvings',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/chms/calving/calving.page').then(
            (m) => m.CalvingPage,
          ),
      },
      {
        path: 'dryoffs',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/chms/dryoff/dryoff.page').then(
            (m) => m.DryoffPage,
          ),
      },

      {
        path: 'devices',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/devices/devices.page').then(
            (m) => m.DevicesPage,
          ),
      },

      {
        path: 'lactations',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/dms/lactation/lactation.page').then(
            (m) => m.LactationPage,
          ),
      },
      {
        path: 'dairy',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/dms/dairy/dairy.page').then(
            (m) => m.DairyPage,
          ),
      },

      {
        path: 'events',
        canActivate: [authGuard],

        loadComponent: () =>
          import('./pages/features/events/events.page').then(
            (m) => m.EventsPage,
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'landing/tabs/home' },
];
