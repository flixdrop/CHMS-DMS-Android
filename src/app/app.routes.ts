// import { Routes } from '@angular/router';
// import { authGuard } from './guards/auth.guard';
// import { guestGuard } from './guards/guest.guard';
// import { onboardingGuard } from './guards/onboarding.guard';

// export const routes: Routes = [
//   // Root Redirect
//   {
//     path: '',
//     redirectTo: 'landing/tabs/home',
//     pathMatch: 'full',
//   },

//   // Public / Unauthenticated Routes
//   {
//     path: 'login',
//     canActivate: [guestGuard],
//     loadComponent: () =>
//       import('./pages/features/auth/login/login.page').then((m) => m.LoginPage),
//   },
//   {
//     path: 'retry',
//     loadComponent: () =>
//       import('./pages/retry/retry.page').then((m) => m.RetryPage),
//   },

//   // Protected Routes (Protected by authGuard for parent & all children)
//   {
//     path: '',
//     canActivate: [authGuard],
//     canActivateChild: [authGuard],
//     children: [
//       {
//         path: 'onboarding',
//         canActivate: [onboardingGuard],
//         loadComponent: () =>
//           import('./pages/onboarding/onboarding.page').then(
//             (m) => m.OnboardingPage,
//           ),
//       },
//       {
//         path: 'landing',
//         loadComponent: () =>
//           import('./pages/landing/landing.page').then((m) => m.LandingPage),
//         children: [
//           {
//             path: 'tabs/home',
//             loadComponent: () =>
//               import('./pages/landing/home/home.page').then(
//                 (m) => m.HomePage,
//               ),
//           },
//           {
//             path: '',
//             redirectTo: 'tabs/home',
//             pathMatch: 'full',
//           },
//         ],
//       },
//       {
//         path: 'profile',
//         loadComponent: () =>
//           import('./pages/profile/profile.page').then((m) => m.ProfilePage),
//       },
//       {
//         path: 'notification',
//         loadComponent: () =>
//           import('./pages/notification/notification.page').then(
//             (m) => m.NotificationPage,
//           ),
//       },
//       {
//         path: 'animals',
//         loadComponent: () =>
//           import('./pages/features/animals/animals.page').then(
//             (m) => m.AnimalsPage,
//           ),
//       },
//       {
//         path: 'animals-insights',
//         loadComponent: () =>
//           import('./pages/features/animals/animal-insights/animal-insights.page').then(
//             (m) => m.AnimalInsightsPage,
//           ),
//       },
//       {
//         path: 'reproductions',
//         loadComponent: () =>
//           import('./pages/features/chms/reproduction/reproduction.page').then(
//             (m) => m.ReproductionPage,
//           ),
//       },
//       {
//         path: 'healths',
//         loadComponent: () =>
//           import('./pages/features/chms/health/health.page').then(
//             (m) => m.HealthPage,
//           ),
//       },
//       {
//         path: 'recoveries',
//         loadComponent: () =>
//           import('./pages/features/chms/recovery/recovery.page').then(
//             (m) => m.RecoveryPage,
//           ),
//       },
//       {
//         path: 'heats',
//         loadComponent: () =>
//           import('./pages/features/chms/heat/heat.page').then(
//             (m) => m.HeatPage,
//           ),
//       },
//       {
//         path: 'inseminations',
//         loadComponent: () =>
//           import('./pages/features/chms/insemination/insemination.page').then(
//             (m) => m.InseminationPage,
//           ),
//       },
//       {
//         path: 'pregnancies',
//         loadComponent: () =>
//           import('./pages/features/chms/pregnancy/pregnancy.page').then(
//             (m) => m.PregnancyPage,
//           ),
//       },
//       {
//         path: 'calvings',
//         loadComponent: () =>
//           import('./pages/features/chms/calving/calving.page').then(
//             (m) => m.CalvingPage,
//           ),
//       },
//       {
//         path: 'dryoffs',
//         loadComponent: () =>
//           import('./pages/features/chms/dryoff/dryoff.page').then(
//             (m) => m.DryoffPage,
//           ),
//       },
//       {
//         path: 'devices',
//         loadComponent: () =>
//           import('./pages/features/devices/devices.page').then(
//             (m) => m.DevicesPage,
//           ),
//       },
//       {
//         path: 'lactations',
//         loadComponent: () =>
//           import('./pages/features/dms/lactation/lactation.page').then(
//             (m) => m.LactationPage,
//           ),
//       },
//       {
//         path: 'dairy',
//         loadComponent: () =>
//           import('./pages/features/dms/dairy/dairy.page').then(
//             (m) => m.DairyPage,
//           ),
//       },
//       {
//         path: 'events',
//         loadComponent: () =>
//           import('./pages/features/events/events.page').then(
//             (m) => m.EventsPage,
//           ),
//       },
//     ],
//   },

//   // Fallback Catch-All
//   {
//     path: '**',
//     redirectTo: 'landing/tabs/home',
//   },
// ];



import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { onboardingGuard } from './guards/onboarding.guard';

export const routes: Routes = [
  // Root Redirect
  {
    path: '',
    redirectTo: 'landing/tabs/home',
    pathMatch: 'full',
  },

  // Public / Unauthenticated Routes
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'retry',
    loadComponent: () =>
      import('./pages/retry/retry.page').then((m) => m.RetryPage),
  },

  // Protected Branch
  {
    path: '',
    canMatch: [authGuard],
    children: [
      {
        path: 'onboarding',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./pages/onboarding/onboarding.page').then(
            (m) => m.OnboardingPage,
          ),
      },
      {
        path: 'landing',
        loadComponent: () =>
          import('./pages/landing/landing.page').then((m) => m.LandingPage),
        children: [
          {
            path: 'tabs/home',
            loadComponent: () =>
              import('./pages/landing/home/home.page').then(
                (m) => m.HomePage,
              ),
          },
          {
            path: '',
            redirectTo: 'tabs/home',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'notification',
        loadComponent: () =>
          import('./pages/notification/notification.page').then(
            (m) => m.NotificationPage,
          ),
      },
      {
        path: 'animals',
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
        loadComponent: () =>
          import('./pages/features/chms/reproduction/reproduction.page').then(
            (m) => m.ReproductionPage,
          ),
      },
      {
        path: 'healths',
        loadComponent: () =>
          import('./pages/features/chms/health/health.page').then(
            (m) => m.HealthPage,
          ),
      },
      {
        path: 'recoveries',
        loadComponent: () =>
          import('./pages/features/chms/recovery/recovery.page').then(
            (m) => m.RecoveryPage,
          ),
      },
      {
        path: 'heats',
        loadComponent: () =>
          import('./pages/features/chms/heat/heat.page').then(
            (m) => m.HeatPage,
          ),
      },
      {
        path: 'inseminations',
        loadComponent: () =>
          import('./pages/features/chms/insemination/insemination.page').then(
            (m) => m.InseminationPage,
          ),
      },
      {
        path: 'pregnancies',
        loadComponent: () =>
          import('./pages/features/chms/pregnancy/pregnancy.page').then(
            (m) => m.PregnancyPage,
          ),
      },
      {
        path: 'calvings',
        loadComponent: () =>
          import('./pages/features/chms/calving/calving.page').then(
            (m) => m.CalvingPage,
          ),
      },
      {
        path: 'dryoffs',
        loadComponent: () =>
          import('./pages/features/chms/dryoff/dryoff.page').then(
            (m) => m.DryoffPage,
          ),
      },
      {
        path: 'devices',
        loadComponent: () =>
          import('./pages/features/devices/devices.page').then(
            (m) => m.DevicesPage,
          ),
      },
      {
        path: 'lactations',
        loadComponent: () =>
          import('./pages/features/dms/lactation/lactation.page').then(
            (m) => m.LactationPage,
          ),
      },
      {
        path: 'dairy',
        loadComponent: () =>
          import('./pages/features/dms/dairy/dairy.page').then(
            (m) => m.DairyPage,
          ),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./pages/features/events/events.page').then(
            (m) => m.EventsPage,
          ),
      },
    ],
  },

  // Fallback Catch-All
  {
    path: '**',
    redirectTo: 'landing/tabs/home',
  },
];