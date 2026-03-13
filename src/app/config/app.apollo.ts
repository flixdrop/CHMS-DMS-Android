import { inject } from '@angular/core';
import { ApolloClientOptions, InMemoryCache } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { environment } from 'src/environments/environment';

export function apolloOptionsFactory(): ApolloClientOptions {
  const httpLink = inject(HttpLink);

  return {
    link: httpLink.create({ 
      uri: environment.server.url 
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  };
}