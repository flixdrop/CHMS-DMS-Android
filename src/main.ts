// import { bootstrapApplication } from '@angular/platform-browser';
// import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
// import {
//   provideRouter,
//   withPreloading,
//   PreloadAllModules,
//   RouteReuseStrategy,
//   withComponentInputBinding,
// } from '@angular/router';
// import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
// import { provideApollo } from 'apollo-angular';
// import { importProvidersFrom, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// // Application Imports
// import { AppComponent } from './app/app.component';
// import { routes } from './app/app.routes';
// import { apolloOptionsFactory } from './app/graphql/config/graphql.config';
// import { authInterceptor } from './app/services/intercepter/auth-intercepter.service';

// // Translation Imports
// import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// // Icon Setup
// import { addIcons } from 'ionicons';
// import * as allIcons from 'ionicons/icons';

// addIcons(allIcons);

// export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
//   return new TranslateHttpLoader(http, './assets/i18n/', '.json');
// }

// bootstrapApplication(AppComponent, {
//   providers: [
//     // 1. Zoneless performance
//     provideZonelessChangeDetection(),

//     provideAnimationsAsync(),

//     provideIonicAngular({
//       backButtonText: '',
//       swipeBackEnabled: true,
//     }),
//     { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

//     // 2. HttpClient with Interceptors (XHR based for Apollo compatibility)
//     provideHttpClient(
//       withInterceptors([authInterceptor])
//     ),

//     // 3. Apollo GraphQL
//     provideApollo(apolloOptionsFactory),

//     // 4. Router
//     provideRouter(
//       routes,
//       withPreloading(PreloadAllModules),
//       withComponentInputBinding()
//     ),

//     // 5. i18n Translations
//     importProvidersFrom(
//       TranslateModule.forRoot({
//         defaultLanguage: 'en',
//         loader: {
//           provide: TranslateLoader,
//           useFactory: HttpLoaderFactory,
//           deps: [HttpClient],
//         },
//       })
//     ),

//     { provide: LOCALE_ID, useValue: 'en-US' },
//   ],
// }).catch((err) => console.error('Bootstrap Error:', err));



import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
  RouteReuseStrategy,
  withComponentInputBinding,
} from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { provideApollo } from 'apollo-angular';
import { importProvidersFrom, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Application Imports
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apolloOptionsFactory } from './app/graphql/config/graphql.config';
import { authInterceptor } from './app/services/intercepter/auth-intercepter.service';

// Translation Imports
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// // Icon Setup
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

addIcons(allIcons);


export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  providers: [
    // 1. Zoneless Performance
    provideZonelessChangeDetection(),

    provideAnimationsAsync(),

    // 2. Ionic Setup
    provideIonicAngular({
      backButtonText: '',
      swipeBackEnabled: true,
    }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // 3. HttpClient with Interceptors
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    // 4. Apollo GraphQL
    provideApollo(apolloOptionsFactory),

    // 5. Router
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding()
    ),

    // 6. Functional i18n Translation Provider
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
}).catch((err) => console.error('Bootstrap Error:', err));