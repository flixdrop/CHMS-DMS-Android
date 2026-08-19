
import '@apollo/client/core';

declare module '@apollo/client/core' {
  export namespace ApolloClient {
    export namespace DeclareDefaultOptions {
      export interface WatchQuery {
        errorPolicy: 'all';
      }
      export interface Query {
        errorPolicy: 'all';
      }
      export interface Mutate {
        errorPolicy: 'all';
      }
    }
  }
}