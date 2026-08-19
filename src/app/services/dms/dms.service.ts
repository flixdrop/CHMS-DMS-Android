// import { Injectable } from '@angular/core';
// import { Apollo, gql } from 'apollo-angular';
// import { map, Observable, catchError, throwError, filter } from 'rxjs';
// import { GET_MILKING_LOGS } from 'src/app/graphql/queries/dairy.queries';

// @Injectable({
//     providedIn: 'root',
// })
// export class DairyManagementService {

//     constructor(private apollo: Apollo) { }

//     private watchApolloQuery<T>(
//         query: any,
//         variables: any,
//         dataKey: string,
//     ): Observable<T> {
//         return this.apollo
//             .watchQuery<any>({
//                 query,
//                 variables,
//                 fetchPolicy: 'network-only',
//             })
//             .valueChanges.pipe(
//                 filter((result) => !!result.data && !!result.data[dataKey]),
//                 map((result) => result.data[dataKey]),
//                 catchError((error) => {
//                     console.error(`Error fetching ${dataKey}:`, error);
//                     return throwError(() => error);
//                 }),
//             );
//     }

//     getMilkingLogs(inputs: any): Observable<any> {
//         return this.watchApolloQuery(GET_MILKING_LOGS, inputs, 'getMilkingLogs');
//     }

//     public submitMilkEntry(input: {
//         animalId: string;
//         occurredAt: string;
//         morningVolume: number | null;
//         noonVolume: number | null;
//         eveningVolume: number | null;
//         note: string;
//     }): Observable<any> {
//         return this.apollo.mutate({
//             mutation: gql`
//         mutation CreateMilkEntry($input: CreateMilkEntryInput!) {
//           createMilkEntry(input: $input) {
//             success
//             message
//             milking {
//               id
//               totalMilk
//               morningMilk
//               afternoonMilk
//               eveningMilk
//             }
//           }
//         }
//       `,
//             variables: { input }
//         }).pipe(map((res: any) => res.data.createMilkEntry));
//     }

//     public updateMilkEntry(input: {
//         milkEntryId: string;
//         occurredAt: string;
//         morningVolume: number | null;
//         noonVolume: number | null;
//         eveningVolume: number | null;
//         note: string;
//     }): Observable<any> {
//         return this.apollo.mutate({
//             mutation: gql`
//         mutation UpdateMilkEntry($input: UpdateMilkEntryInput!) {
//           updateMilkEntry(input: $input) {
//             success
//             message
//           }
//         }
//       `,
//             variables: { input }
//         }).pipe(map((res: any) => res.data.updateMilkEntry));
//     }

//     public createDryoff(input: any): Observable<any> {
//         return this.apollo.mutate({
//             mutation: gql`
//         mutation CreateDryoff($input: CreateDryoffInput!) {
//           createDryoff(input: $input) { success message }
//         }
//       `,
//             variables: { input }
//         }).pipe(map((res: any) => res.data.createDryoff));
//     }

//     public updateDryoff(input: any): Observable<any> {
//         return this.apollo.mutate({
//             mutation: gql`
//         mutation UpdateDryoff($input: UpdateDryoffInput!) {
//           updateDryoff(input: $input) { success message }
//         }
//       `,
//             variables: { input }
//         }).pipe(map((res: any) => res.data.updateDryoff));
//     }

// }


import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable, catchError, throwError, filter } from 'rxjs';
import { GET_MILKING_LOGS } from 'src/app/graphql/queries/dairy.queries';

@Injectable({
  providedIn: 'root',
})
export class DairyManagementService {
  private readonly apollo = inject(Apollo);

  /**
   * Universal execution wrapper for watched query streams (Production logs)
   */
  private watchApolloQuery<T>(
    query: any,
    variables: any,
    dataKey: string,
  ): Observable<T> {
    return this.apollo
      .watchQuery<any>({
        query,
        variables,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        filter((result) => !!result.data && result.data[dataKey] !== undefined),
        map((result) => result.data[dataKey] as T),
        catchError((error) => {
          console.error(`[API Error] Active dairy yield stream tracking failed for ${dataKey}:`, error);
          return throwError(() => error);
        })
      );
  }

//   private fetchApolloQuery<T>(
//   query: any,
//   variables: any,
//   dataKey: string,
// ): Observable<T> {
//   return this.apollo
//     .query<any>({
//       query,
//       variables,
//       fetchPolicy: 'network-only', // 👈 Guarantees a fresh HTTP network request every time
//     })
//     .pipe(
//       filter((result) => !!result.data && result.data[dataKey] !== undefined),
//       map((result) => result.data[dataKey] as T),
//       catchError((error) => {
//         console.error(`[API Error] Active dairy yield query failed for ${dataKey}:`, error);
//         return throwError(() => error);
//       })
//     );
// }

private fetchApolloQuery<T>(
  query: any,
  variables: any,
  dataKey: string,
): Observable<T> {
  return this.apollo
    .query<any>({
      query,
      variables,
      fetchPolicy: 'network-only',
    })
    .pipe(
      filter((result) => !!result.data && result.data[dataKey] !== undefined),
      map((result) => result.data[dataKey] as T),
      catchError((error) => {
        // 🟢 Suppress noisy abort errors triggered during forced client logouts/teardowns
        const errorMsg = error?.message || '';
        if (!errorMsg.includes('stopped while query was in flight')) {
          console.error(`[API Error] Active dairy yield query failed for ${dataKey}:`, error);
        }
        return throwError(() => error);
      })
    );
}

getMilkingLogs(inputs: any): Observable<any> {
  return this.fetchApolloQuery<any>(GET_MILKING_LOGS, inputs, 'getMilkingLogs');
}

  /* -------------------------------------------------------------------------- */
  /* Read Ops                                                   */
  /* -------------------------------------------------------------------------- */

  // getMilkingLogs(inputs: any): Observable<any> {
  //   return this.watchApolloQuery<any>(GET_MILKING_LOGS, inputs, 'getMilkingLogs');
  // }

  /* -------------------------------------------------------------------------- */
  /* Transactional Yield Inputs                                 */
  /* -------------------------------------------------------------------------- */

  public submitMilkEntry(input: {
    animalId: string;
    occurredAt: string;
    morningVolume: number | null;
    noonVolume: number | null;
    eveningVolume: number | null;
    note: string;
  }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation CreateMilkEntry($input: CreateMilkEntryInput!) {
          createMilkEntry(input: $input) {
            success
            message
            milking {
              id
              totalMilk
              morningMilk
              afternoonMilk
              eveningMilk
            }
          }
        }
      `,
      variables: { input }
    }).pipe(map((res) => res.data?.createMilkEntry));
  }

  public updateMilkEntry(input: {
    milkEntryId: string;
    occurredAt: string;
    morningVolume: number | null;
    noonVolume: number | null;
    eveningVolume: number | null;
    note: string;
  }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation UpdateMilkEntry($input: UpdateMilkEntryInput!) {
          updateMilkEntry(input: $input) {
            success
            message
          }
        }
      `,
      variables: { input }
    }).pipe(map((res) => res.data?.updateMilkEntry));
  }

  /* -------------------------------------------------------------------------- */
  /* Lactation Transition Records                               */
  /* -------------------------------------------------------------------------- */

  public createDryoff(input: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation CreateDryoff($input: CreateDryoffInput!) {
          createDryoff(input: $input) { success message }
        }
      `,
      variables: { input }
    }).pipe(map((res) => res.data?.createDryoff));
  }

  public updateDryoff(input: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation UpdateDryoff($input: UpdateDryoffInput!) {
          updateDryoff(input: $input) { success message }
        }
      `,
      variables: { input }
    }).pipe(map((res) => res.data?.updateDryoff));
  }
}