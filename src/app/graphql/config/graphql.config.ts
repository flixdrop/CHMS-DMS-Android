
// src/app/config/graphql.config.ts
import { inject } from '@angular/core';
import { ApolloClient, InMemoryCache } from '@apollo/client/core'; // 1. Import ApolloClient directly
import { HttpLink } from 'apollo-angular/http';
import { environment } from 'src/environments/environment';

// 2. Use ApolloClient.Options (no generic <any> needed)
export function apolloOptionsFactory(): ApolloClient.Options {
  const httpLink = inject(HttpLink);

  return {
    link: httpLink.create({
      uri: environment.server.url,
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' }
    }
  };
}