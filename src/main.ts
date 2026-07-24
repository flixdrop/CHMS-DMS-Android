// import { provideHttpClient } from '@angular/common/http';
// import { bootstrapApplication } from '@angular/platform-browser';
// import {
//   RouteReuseStrategy,
//   provideRouter,
//   withPreloading,
//   PreloadAllModules,
// } from '@angular/router';
// import { APOLLO_OPTIONS, provideApollo } from 'apollo-angular';
// import { AppComponent } from './app/app.component';
// import { routes } from './app/app.routes';

// bootstrapApplication(AppComponent, {
//   providers: [
//     { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
//     provideIonicAngular(),
//     provideRouter(routes, withPreloading(PreloadAllModules)),
//     provideHttpClient(),
//     ApolloModule,
//     { provide: APOLLO_OPTIONS, useFactory: provideApollo },
//   ],
// });



// import { bootstrapApplication } from '@angular/platform-browser';
// import { provideHttpClient } from '@angular/common/http';
// import { provideRouter, withPreloading, PreloadAllModules, RouteReuseStrategy } from '@angular/router';
// import { IonicRouteStrategy } from '@ionic/angular';
// import { APOLLO_OPTIONS } from 'apollo-angular';

// import { AppComponent } from './app/app.component';
// import { routes } from './app/app.routes';
// import { provideApollo } from './app/config/graphql.config';

// bootstrapApplication(AppComponent, {
//   providers: [
//     { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
//     provideRouter(routes, withPreloading(PreloadAllModules)),
//     provideHttpClient(),
//     { provide: APOLLO_OPTIONS, useFactory: provideApollo },
//   ],
// }).catch(console.error);



// import { bootstrapApplication } from '@angular/platform-browser';
// import { provideHttpClient } from '@angular/common/http';
// import {
//   provideRouter,
//   withPreloading,
//   PreloadAllModules,
//   RouteReuseStrategy,
// } from '@angular/router';
// import { IonicRouteStrategy } from '@ionic/angular';
// import { provideApollo } from 'apollo-angular';

// import { AppComponent } from './app/app.component';
// import { routes } from './app/app.routes';
// import { apolloOptionsFactory } from './app/config/graphql.config';

// bootstrapApplication(AppComponent, {
//   providers: [
//     { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
//     provideRouter(routes, withPreloading(PreloadAllModules)),
//     provideHttpClient(),

//     // ✅ THIS registers Apollo correctly
//     provideApollo(apolloOptionsFactory),
//   ],
// }).catch(console.error);


// import { bootstrapApplication } from '@angular/platform-browser';
// import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
// import {
//   provideRouter,
//   withPreloading,
//   PreloadAllModules,
//   RouteReuseStrategy,
// } from '@angular/router';
// import { IonicRouteStrategy } from '@ionic/angular';
// import { provideApollo } from 'apollo-angular';

// import {
//   TranslateLoader,
//   TranslateModule,
// } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// import { AppComponent } from './app/app.component';
// import { routes } from './app/app.routes';
// import { apolloOptionsFactory } from './app/config/graphql.config';
// import { importProvidersFrom, inject } from '@angular/core';
// import { provideIonicAngular } from '@ionic/angular/standalone';
// import { LocationStrategy, HashLocationStrategy } from '@angular/common';
// import * as allIcons from 'ionicons/icons';
// import { addIcons } from 'ionicons';
// import { AuthInterceptorService } from './app/features/intercepter/auth-intercepter.service';
// import { HttpLink } from 'apollo-angular/http'; // ⚠️ Ensure this is from 'apollo-angular/http'

// addIcons(allIcons);

// export function HttpLoaderFactory(http: HttpClient) {
//   return new TranslateHttpLoader(http);
// }

// bootstrapApplication(AppComponent, {
//   providers: [
//     provideIonicAngular(),
//     { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
//     { provide: LocationStrategy, useClass: HashLocationStrategy },
//     provideRouter(routes, withPreloading(PreloadAllModules)),

//     // ✅ HttpClient with Interceptor Support
//     provideHttpClient(
//       withInterceptorsFromDi()
//     ),
//     {
//       provide: HTTP_INTERCEPTORS,
//       useClass: AuthInterceptorService,
//       multi: true
//     },

//     // ✅ Corrected Apollo Provider
//     provideApollo(() => {
//       const httpLink = inject(HttpLink); // Injecting it directly inside the factory
//       return apolloOptionsFactory(httpLink);
//     }),


//     // ✅ ngx-translate providers
//      importProvidersFrom(
//       TranslateModule.forRoot({
//         loader: {
//           provide: TranslateLoader,
//           useFactory: HttpLoaderFactory,
//           deps: [HttpClient],
//         },
//       })
//     ),

//   ],
// }).catch(console.error);



// import { bootstrapApplication } from '@angular/platform-browser';
// import { provideHttpClient, withInterceptors, withFetch, HttpClient } from '@angular/common/http';
// import { provideRouter, withPreloading, PreloadAllModules, RouteReuseStrategy } from '@angular/router';
// import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
// import { provideApollo } from 'apollo-angular';
// import { importProvidersFrom } from '@angular/core';

// import { AppComponent } from './app/app.component';
// import { routes } from './app/app.routes';
// import { apolloOptionsFactory } from './app/config/graphql.config';
// import { authInterceptor } from './app/features/intercepter/auth-intercepter.service';
// import { LocationStrategy, HashLocationStrategy } from '@angular/common';

// import { provideAnimations } from '@angular/platform-browser/animations';

// import {
//   TranslateLoader,
//   TranslateModule,
// } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// import { addIcons } from 'ionicons';
// import * as allIcons from 'ionicons/icons';

// addIcons(allIcons);

// export function HttpLoaderFactory(http: HttpClient) {
//   return new TranslateHttpLoader(http);
// }

// bootstrapApplication(AppComponent, {
//   providers: [
//     // 1. Ionic Core Providers
//     provideIonicAngular(), 
//     { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
//     // { provide: LocationStrategy, useClass: HashLocationStrategy },

//     // 2. Optimized HTTP Stack
//     provideHttpClient(
//       // withFetch(), // Better performance in 2026 browsers
//       withInterceptors([authInterceptor]) // Functional interceptors only
//     ),

//     // 3. Apollo Integration
//     provideApollo(apolloOptionsFactory),

//     // 4. Router and Localization
//     provideRouter(routes, withPreloading(PreloadAllModules)),
//     importProvidersFrom(
//       TranslateModule.forRoot({ /* ... your existing config ... */ })
//     ),

//     // ✅ ngx-translate providers
//      importProvidersFrom(
//       TranslateModule.forRoot({
//         loader: {
//           provide: TranslateLoader,
//           useFactory: HttpLoaderFactory,
//           deps: [HttpClient],
//         },
//       })
//     ),

// // ... inside providers
// provideAnimations(),

//   ],
// }).catch(err => console.error(err));




import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideRouter, withPreloading, PreloadAllModules, RouteReuseStrategy, withComponentInputBinding } from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { provideApollo } from 'apollo-angular';
// import { importProvidersFrom, LOCALE_ID, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { importProvidersFrom, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Application Imports
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apolloOptionsFactory } from './app/graphql/config/graphql.config';
import { authInterceptor } from './app/services/intercepter/auth-intercepter.service';

// Translation Imports
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

// // Icon Setup - IMPORT ONLY WHAT YOU USE
// import { addIcons } from 'ionicons';
// import { add, create, trash, person, mail, cloudOfflineOutline } from 'ionicons/icons'; 

// // Initialize Ionic Icons (ONLY the ones listed above)
// addIcons({ add, create, trash, person, mail, cloudOfflineOutline });


// Icon Setup
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

addIcons(allIcons);

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  providers: [
    // 1. ZONELESS: The latest, most performant way to run Angular
    provideZonelessChangeDetection(),

    provideAnimationsAsync(),

    provideIonicAngular({
      backButtonText: '',
      swipeBackEnabled: true,
    }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]),
    ),

    provideApollo(apolloOptionsFactory),

    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding()
    ),

    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),

    { provide: LOCALE_ID, useValue: 'en-US' },
  ],
}).catch(err => console.error('Bootstrap Error:', err));