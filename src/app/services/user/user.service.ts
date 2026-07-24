// import { Injectable } from '@angular/core';
// import { Apollo } from 'apollo-angular';
// import { CREATE_USER, UPDATE_USER } from 'src/app/graphql/queries/auth.queries';

// @Injectable({
//     providedIn: 'root',
// })
// export class DataService {

//     constructor(private apollo: Apollo) { }

//     createUser(formData: any) {
//         return this.apollo.mutate({
//             mutation: CREATE_USER,
//             variables: {
//                 input: {
//                     name: formData.name,
//                     username: formData.username,
//                     password: formData.password,
//                     accessLevel: formData.accessLevel,
//                     accountTier: formData.accountTier ? Number(formData.accountTier) : null,
//                     parent: formData.parent || null,
//                     email: formData.email || null,
//                     contact: formData.contact || null
//                 }
//             }
//         });
//     }

//     updateUser(id: string, formData: any) {
//         return this.apollo.mutate({
//             mutation: UPDATE_USER,
//             variables: {
//                 id: id,
//                 input: {
//                     name: formData.name,
//                     username: formData.username,
//                     ...(formData.password ? { password: formData.password } : {}),
//                     accessLevel: formData.accessLevel,
//                     accountTier: formData.accountTier ? Number(formData.accountTier) : null,
//                     parent: formData.parent || null,
//                     email: formData.email || null,
//                     contact: formData.contact || null
//                 }
//             }
//         });
//     }

// }


import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { CREATE_USER, UPDATE_USER } from 'src/app/graphql/queries/auth.queries';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly apollo = inject(Apollo);

  /**
   * Dispatches a mutation payload to provision a new system or operator user profile
   */
  createUser(formData: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: CREATE_USER,
      variables: {
        input: {
          name: formData.name,
          username: formData.username,
          password: formData.password,
          accessLevel: formData.accessLevel,
          accountTier: formData.accountTier ? Number(formData.accountTier) : null,
          parent: formData.parent || null,
          email: formData.email || null,
          contact: formData.contact || null
        }
      }
    });
  }

  /**
   * Patches an existing user profile record by ID, safely ignoring un-modified password variables
   */
  updateUser(id: string, formData: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_USER,
      variables: {
        id: id,
        input: {
          name: formData.name,
          username: formData.username,
          ...(formData.password ? { password: formData.password } : {}),
          accessLevel: formData.accessLevel,
          accountTier: formData.accountTier ? Number(formData.accountTier) : null,
          parent: formData.parent || null,
          email: formData.email || null,
          contact: formData.contact || null
        }
      }
    });
  }
}