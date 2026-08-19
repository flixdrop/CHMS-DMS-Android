

// src/app/graphql/config/graphql.config.ts
import { inject } from '@angular/core';
import { ApolloClientOptions, InMemoryCache, ApolloLink } from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { HttpLink } from 'apollo-angular/http';
import { HttpHeaders } from '@angular/common/http'; // 🟢 ADD THIS IMPORT
import { environment } from 'src/environments/environment';

export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        getAnimals: {
          merge(_, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

export function apolloOptionsFactory(): ApolloClientOptions {
  const httpLink = inject(HttpLink);

  const errorLink = onError((errorResponse: any) => {
    const { graphQLErrors, networkError } = errorResponse;

    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        if (err.extensions?.['code'] === 'UNAUTHENTICATED') {
          console.warn('[Apollo Auth] Access token expired or unauthorized');
        } else {
          console.warn('[Apollo GraphQL Error]:', err.message, err.extensions);
        }
      }
    }

    if (networkError) {
      console.error('[Apollo Network Error]:', networkError);
    }
  });

  // 🟢 FIX: Inject bypass headers to stop Microsoft from blocking API requests
  const http = httpLink.create({
    uri: environment.server.url,
    headers: new HttpHeaders({
      'ngrok-skip-browser-warning': 'true',
      'x-tunnel-skip-anti-phishing-page': 'true',
      'bypass-tunnel-reminder': 'true'
    })
  });

  const link = ApolloLink.from([
    errorLink,
    http as unknown as ApolloLink,
  ]);

  return {
    link,
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  };
}