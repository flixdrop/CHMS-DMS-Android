// import { HttpLink } from 'apollo-angular/http';
// import { ApolloLink, InMemoryCache } from '@apollo/client/core';
// import { environment } from 'src/environments/environment';

// export function apolloOptionsFactory(httpLink: HttpLink) {

//   // Use the .create() method to generate a real ApolloLink
//   const link = httpLink.create({
//     uri: `${environment.server.url}`,
//   });

//   const authLink = new ApolloLink((operation, forward) => {
//     const token = localStorage.getItem('auth_token');

//     operation.setContext(({ headers = {} }) => ({
//       headers: {
//         ...headers,
//         ...(token ? { Authorization: `Bearer ${JSON.parse(token)}` } : {}),
//       },
//     }));

//     return forward(operation);
//   });

//   return {
//     cache: new InMemoryCache(),
//     link: link, // The interceptor handles the Auth headers globally!
//   };
// }


// src/app/config/graphql.config.ts
import { inject } from '@angular/core';
import { ApolloClientOptions, InMemoryCache } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { environment } from 'src/environments/environment';

export function apolloOptionsFactory(): ApolloClientOptions {
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