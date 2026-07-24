// import { inject, Injectable } from '@angular/core';
// import { Apollo } from 'apollo-angular';
// import { map, Observable, catchError, throwError, filter } from 'rxjs';
// import { GET_DEVICES } from 'src/app/graphql/queries/device.queries';

// @Injectable({
//   providedIn: 'root',
// })
// export class DeviceService {
//   private readonly apollo = inject(Apollo);

//   /**
//    * Universal execution wrapper for watched query streams (IoT collar data updates)
//    */
//   private watchApolloQuery<T>(
//     query: any,
//     variables: any,
//     dataKey: string,
//   ): Observable<T> {
//     return this.apollo
//       .watchQuery<any>({
//         query,
//         variables,
//         fetchPolicy: 'network-only',
//       })
//       .valueChanges.pipe(
//         filter((result) => !!result.data && result.data[dataKey] !== undefined),
//         map((result) => result.data[dataKey] as T),
//         catchError((error) => {
//           console.error(`[API Error] Active hardware telemetry stream failed for ${dataKey}:`, error);
//           return throwError(() => error);
//         })
//       );
//   }

//   getDevices(inputs: { filter: any; options: any }): Observable<any> {
//     return this.watchApolloQuery<any>(GET_DEVICES, inputs, 'getDevices');
//   }
// }


import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, Observable, catchError, throwError, filter } from 'rxjs';
import { GET_DEVICES } from 'src/app/graphql/queries/device.queries';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private readonly apollo = inject(Apollo);

  /**
   * Universal execution wrapper for watched query streams (IoT collar data updates)
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
          console.error(`[API Error] Active hardware telemetry stream failed for ${dataKey}:`, error);
          return throwError(() => error);
        })
      );
  }

  getDevices(inputs: { filter: any; options: any }): Observable<any> {
    return this.watchApolloQuery<any>(GET_DEVICES, inputs, 'getDevices');
  }
}