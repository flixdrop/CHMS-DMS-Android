// src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideApollo } from 'apollo-angular';
import { authInterceptor } from 'src/app/services/intercepter/auth-intercepter.service';
import { initApolloCachePersistence } from './cache-persist';
import { cache, apolloOptionsFactory } from './graphql.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => initApolloCachePersistence(cache),
      multi: true,
    },
    provideApollo(apolloOptionsFactory),
  ],
};