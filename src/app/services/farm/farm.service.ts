// import { Injectable } from '@angular/core';
// import { Apollo } from 'apollo-angular';
// import { Observable, map } from 'rxjs';
// import { CREATE_FARM } from 'src/app/graphql/queries/farm.queries';
// import { MANAGED_FARMS_LIST, MANAGED_USERS_LIST } from 'src/app/graphql/queries/system.queries';

// @Injectable({
//   providedIn: 'root',
// })
// export class FarmService {
//   constructor(private apollo: Apollo) {}

//   getFarms(targetUserId?: string): Observable<any[]> {
//     return this.apollo
//       .watchQuery<{ getManagedFarms }>({
//         query: MANAGED_FARMS_LIST,
//         variables: { targetUserId },
//         fetchPolicy: 'network-only',
//       })
//       .valueChanges.pipe(
//         map((result) => result.data.getManagedFarms)
//       );
//   }

//   createFarm(input: any): Observable<any> {
//     return this.apollo.mutate({
//       mutation: CREATE_FARM,
//       variables: { input },
//       refetchQueries: [{ query: MANAGED_USERS_LIST }],
//     });
//   }
// }



import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { CREATE_FARM } from 'src/app/graphql/queries/farm.queries';
import { MANAGED_FARMS_LIST, MANAGED_USERS_LIST } from 'src/app/graphql/queries/system.queries';

@Injectable({
  providedIn: 'root',
})
export class FarmService {
  private readonly apollo = inject(Apollo);

  /**
   * Retrieves an array of managed farms, optionally scoped to a target manager/user
   */
  getFarms(targetUserId?: string): Observable<any[]> {
    return this.apollo
      .watchQuery<any>({
        query: MANAGED_FARMS_LIST,
        variables: { targetUserId },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((result) => result.data?.getManagedFarms || [])
      );
  }

  /**
   * Provisions a new farm entity and updates parent user/tenant relationship layers
   */
  createFarm(input: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: CREATE_FARM,
      variables: { input },
      refetchQueries: [{ query: MANAGED_USERS_LIST }],
    });
  }
}