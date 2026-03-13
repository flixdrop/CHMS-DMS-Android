// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Apollo, QueryRef } from 'apollo-angular';
// import { map, Observable, concatMap, catchError, throwError } from 'rxjs';
// import {
//   GET_ALL_EVENTS,
//   GET_ANIMAL_DETAILS,
//   GET_ANIMALS,
//   GET_CALVINGS,
//   GET_DRYOFF_EVENTS,
//   GET_HEALTHS,
//   GET_HEATS,
//   GET_INSEMINATIONS,
//   GET_MILK_ENTRIES,
//   GET_PREGNANCIES,
//   GET_RECOVERIES,
// } from 'src/app/graphql/data.queries';
// import { environment } from 'src/environments/environment';

// @Injectable({
//   providedIn: 'root',
// })
// export class DataService {
//   constructor(
//     private http: HttpClient,
//     private apollo: Apollo,
//   ) {}

//   getAnimals(
//     userId: string,
//     limit: number,
//     offset: number,
//     search: string = '',
//   ): Observable<any> {
//     return this.apollo
//       .watchQuery<any>({
//         fetchPolicy: 'network-only',
//         query: GET_ANIMALS,
//         variables: {
//           limit,
//           offset,
//           search,
//         },
//       })
//       .valueChanges.pipe(
//         map((result) => {
//           console.log('userID at Service:', userId);
//           const data = result?.data?.getAnimals;
//           if (!data) {
//             console.warn('No data returned from getAnimals');
//             return { items: [], totalCount: 0 };
//           }
//           return data;
//         }),
//         catchError((error) => {
//           console.error('Service getAnimals Error:', error);
//           return throwError(
//             () => new Error(error.message || 'Server error fetching Animals.'),
//           );
//         }),
//       );
//   }

//   getHeats(
//     userId: string,
//     limit: number,
//     offset: number,
//     search: string,
//     startDate?: string,
//     endDate?: string,
//   ): Observable<any> {
//     return this.apollo
//       .watchQuery<any>({
//         fetchPolicy: 'cache-and-network',
//         query: GET_HEATS,
//         variables: {
//           userId,
//           limit,
//           offset,
//           search,
//           startDate,
//           endDate,
//         },
//       })
//       .valueChanges.pipe(
//         map((result) => {
//           console.log('userID at Service:', userId);
//           console.log('Get Heats at Service:', result);
//           const data = result?.data?.getHeats;
//           if (!data) {
//             console.warn('No data returned from getHeats');
//             return { items: [], totalCount: 0 };
//           }
//           return data;
//         }),
//         catchError((error) => {
//           console.error('Service getHeats Error:', error);
//           return throwError(
//             () =>
//               new Error(error.message || 'Server error fetching Heat Events.'),
//           );
//         }),
//       );
//   }

//   getHealths(
//     userId: string,
//     limit: number,
//     offset: number,
//     search: string,
//     startDate?: string,
//     endDate?: string,
//   ): Observable<any> {
//     return this.apollo
//       .watchQuery<any>({
//         fetchPolicy: 'network-only',
//         query: GET_HEALTHS,
//         variables: {
//           userId,
//           limit,
//           offset,
//           search,
//           startDate,
//           endDate,
//         },
//       })
//       .valueChanges.pipe(
//         map((result) => {
//           console.log('userID at Service:', userId);
//           const data = result?.data?.getHealths;
//           if (!data) {
//             console.warn('No data returned from getHealths');
//             return { items: [], totalCount: 0 };
//           }
//           return data;
//         }),
//         catchError((error) => {
//           console.error('Service getHealths Error:', error);
//           return throwError(
//             () =>
//               new Error(
//                 error.message || 'Server error fetching Health Events.',
//               ),
//           );
//         }),
//       );
//   }

//   getRecoveries(
//     userId: string,
//     limit: number,
//     offset: number,
//     search: string,
//     startDate?: string,
//     endDate?: string,
//   ): Observable<any> {
//     return this.apollo
//       .watchQuery<any>({
//         fetchPolicy: 'network-only',
//         query: GET_RECOVERIES,
//         variables: {
//           userId,
//           limit,
//           offset,
//           search,
//           startDate,
//           endDate,
//         },
//       })
//       .valueChanges.pipe(
//         map((result) => {
//           console.log('userID at Service:', userId);
//           const data = result?.data?.getRecoveries;
//           if (!data) {
//             console.warn('No data returned from getRecoveries');
//             return { items: [], totalCount: 0 };
//           }
//           return data;
//         }),
//         catchError((error) => {
//           console.error('Service getRecoveries Error:', error);
//           return throwError(
//             () =>
//               new Error(
//                 error.message || 'Server error fetching Recovery Events.',
//               ),
//           );
//         }),
//       );
//   }

//   getInseminations(
//     userId: string,
//     limit: number,
//     offset: number,
//     search: string,
//     startDate?: string,
//     endDate?: string,
//   ): Observable<any> {
//     return this.apollo
//       .watchQuery<any>({
//         fetchPolicy: 'network-only',
//         query: GET_INSEMINATIONS,
//         variables: {
//           userId,
//           limit,
//           offset,
//           search,
//           startDate,
//           endDate,
//         },
//       })
//       .valueChanges.pipe(
//         map((result) => {
//           console.log('userID at Service:', userId);
//           const data = result?.data?.getInseminations;
//           if (!data) {
//             console.warn('No data returned from getInseminations');
//             return { items: [], totalCount: 0 };
//           }
//           return data;
//         }),
//         catchError((error) => {
//           console.error('Service getInseminations Error:', error);
//           return throwError(
//             () =>
//               new Error(
//                 error.message || 'Server error fetching Insemination Events.',
//               ),
//           );
//         }),
//       );
//   }

//   getPregnancies(
//     userId: string,
//     limit: number,
//     offset: number,
//     search: string,
//     startDate?: string,
//     endDate?: string,
//   ): Observable<any> {
//     return this.apollo
//       .watchQuery<any>({
//         fetchPolicy: 'network-only',
//         query: GET_PREGNANCIES,
//         variables: {
//           userId,
//           limit,
//           offset,
//           search,
//           startDate,
//           endDate,
//         },
//       })
//       .valueChanges.pipe(
//         map((result) => {
//           console.log('userID at Service:', userId);
//           const data = result?.data?.getPregnancies;
//           if (!data) {
//             console.warn('No data returned from getPregnancies');
//             return { items: [], totalCount: 0 };
//           }
//           return data;
//         }),
//         catchError((error) => {
//           console.error('Service getPregnancies Error:', error);
//           return throwError(
//             () =>
//               new Error(
//                 error.message || 'Server error fetching Pregnancy Events.',
//               ),
//           );
//         }),
//       );
//   }

//   getCalvings(
//     userId: string,
//     limit: number,
//     offset: number,
//     search: string,
//     startDate?: string,
//     endDate?: string,
//   ): Observable<any> {
//     return this.apollo
//       .watchQuery<any>({
//         fetchPolicy: 'network-only',
//         query: GET_CALVINGS,
//         variables: {
//           userId,
//           limit,
//           offset,
//           search,
//           startDate,
//           endDate,
//         },
//       })
//       .valueChanges.pipe(
//         map((result) => {
//           console.log('userID at Service:', userId);
//           const data = result?.data?.getCalvings;
//           if (!data) {
//             console.warn('No data returned from getCalvings');
//             return { items: [], totalCount: 0 };
//           }
//           return data;
//         }),
//         catchError((error) => {
//           console.error('Service getCalvings Error:', error);
//           return throwError(
//             () =>
//               new Error(
//                 error.message || 'Server error fetching Calving Events.',
//               ),
//           );
//         }),
//       );
//   }

//   getDryoffEvents(
//     userId: string,
//     limit: number,
//     offset: number,
//     search: string,
//     startDate?: string,
//     endDate?: string,
//   ): Observable<any> {
//     return this.apollo
//       .watchQuery<any>({
//         fetchPolicy: 'network-only',
//         query: GET_DRYOFF_EVENTS,
//         variables: {
//           userId,
//           limit,
//           offset,
//           search,
//           startDate,
//           endDate,
//         },
//       })
//       .valueChanges.pipe(
//         map((result) => {
//           console.log('userID at Service:', userId);
//           const data = result?.data?.getDryoffEvents;
//           if (!data) {
//             console.warn('No data returned from getDryoffEvents');
//             return { items: [], totalCount: 0 };
//           }
//           return data;
//         }),
//         catchError((error) => {
//           console.error('Service getDryoffEvents Error:', error);
//           return throwError(
//             () =>
//               new Error(
//                 error.message || 'Server error fetching Dryoff Events.',
//               ),
//           );
//         }),
//       );
//   }

//   getMilkEntries(
//     userId: string,
//     limit: number,
//     offset: number,
//     search: string,
//     startDate?: string,
//     endDate?: string,
//   ): Observable<any> {
//     return this.apollo
//       .watchQuery<any>({
//         fetchPolicy: 'network-only',
//         query: GET_MILK_ENTRIES,
//         variables: {
//           userId,
//           limit,
//           offset,
//           search,
//           startDate,
//           endDate,
//         },
//       })
//       .valueChanges.pipe(
//         map((result) => {
//           console.log('userID at Service:', userId);
//           const data = result?.data?.getMilkEntries;
//           if (!data) {
//             console.warn('No data returned from getMilkEntries');
//             return { items: [], totalCount: 0 };
//           }
//           return data;
//         }),
//         catchError((error) => {
//           console.error('Service getMilkEntries Error:', error);
//           return throwError(
//             () =>
//               new Error(error.message || 'Server error fetching Milk Entries.'),
//           );
//         }),
//       );
//   }

//   getAllEvents(
//     userId: string,
//     limit: number,
//     offset: number,
//     search: string,
//     startDate?: string,
//     endDate?: string,
//   ): Observable<any> {
//     return this.apollo
//       .watchQuery<any>({
//         fetchPolicy: 'network-only',
//         query: GET_ALL_EVENTS,
//         variables: {
//           userId,
//           limit,
//           offset,
//           search,
//           startDate,
//           endDate,
//         },
//       })
//       .valueChanges.pipe(
//         map((result) => {
//           console.log('userID at Service:', userId);
//           const data = result?.data?.getAllEvents;
//           console.log('Get All Events at Service:', data);

//           if (!data) {
//             console.warn('No data returned from getAllEvents');
//             return { items: [], totalCount: 0 };
//           }
//           return data;
//         }),
//         catchError((error) => {
//           console.error('Service getAllEvents Error:', error);
//           return throwError(
//             () =>
//               new Error(error.message || 'Server error fetching All Events.'),
//           );
//         }),
//       );
//   }

//   // Returns the QueryRef so the component can call .refetch() or .valueChanges
//   getAnimalDetails(
//     animalId: string,
//     start: string,
//     end: string,
//   ): QueryRef<any> {
//     return this.apollo.watchQuery<any>({
//       query: GET_ANIMAL_DETAILS,
//       variables: {
//         animalId,
//         startDate: start,
//         endDate: end,
//       },
//       fetchPolicy: 'cache-and-network',
//     });
//   }

//   getGraphData(
//     animalNo: string,
//     startDate: string,
//     endDate: string,
//   ): Observable<any> {
//     const requestBody1 = {
//       query: `
//       query GetActivityData($animalId: String!, $startDate: String!, $endDate: String!) {
//         getActivitiesByAnimal(animalId: $animalId, startDate: $startDate, endDate: $endDate) {
//           feeding
//           date
//           other
//           resting
//           ruminating
//           standing
//           timeIntervalUtc
//         }
//       }
//     `,
//       variables: {
//         animalId: animalNo,
//         startDate: startDate,
//         endDate: endDate,
//       },
//     };

//     return this.http.post(environment.server.url, requestBody1).pipe(
//       map((res: any) => {
//         if (res?.data?.getActivitiesByAnimal) {
//           return res.data.getActivitiesByAnimal;
//         }
//         return [];
//       }),
//     );
//   }

//   confirmInsemination(data: any) {
//     console.log('Insemination Form: ', data);

//     const requestBody1 = {
//       query: `
//       mutation{
//         deactivateHeat(eventId:"${data['heat']['id']}"){
//           id
//         }
//       }
//       `,
//     };

//     const requestBody2 = {
//       query: `
//       mutation{
//         createInsemination(inseminationInput:{animalId:"${data.heat.animal.id}", process:"${data.insemination_form.process}", cattle_name: "${data.insemination_form.bull_name}", semen_type:"${data.insemination_form.semen_type}", semen_company:"${data.insemination_form.semen_company}", semen_breed: "${data.insemination_form.semen_breed}", eventDateTime:"${data.insemination_form.insemination_date}"}){
//           id
//         }
//       }
//       `,
//     };

//     const postRequest1 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody1),
//     );
//     const postRequest2 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody2),
//     );

//     return postRequest1.pipe(
//       concatMap((response1) => {
//         return postRequest2;
//       }),
//     );
//   }

//   reportInseminationFailure(data: any) {
//     console.log('Insemination Failure Form at service: ', data);

//     const requestBody1 = {
//       query: `
//       mutation{
//         reportInseminationFailure(eventId:"${data.heat.id}", note: "${data.insemination_form.note}"){
//           id
//         }
//       }
//       `,
//     };

//     const postRequest1 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody1),
//     );

//     return postRequest1;
//   }

//   confirmPregnancy(data: any) {
//     console.log('Pregnancy Form: ', data);

//     const requestBody1 = {
//       query: `
//       mutation{
//         deactivateInsemination(eventId:"${data['insemination']['id']}"){
//           id
//         }
//       }
//       `,
//     };

//     const requestBody2 = {
//       query: `
//       mutation{
//         createPregnancyCheck(animalId:"${data['insemination']['animal']['id']}", eventDateTime:"${data['eventDateTime']}"){
//           id
//         }
//       }

//       `,
//     };

//     const postRequest1 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody1),
//     );
//     const postRequest2 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody2),
//     );

//     return postRequest1.pipe(
//       concatMap((response1) => {
//         return postRequest2;
//       }),
//     );
//   }

//   reportPregnancyFailure(data: any) {
//     const requestBody1 = {
//       query: `
//       mutation{
//         reportPregnancyFailure(eventId:"${data['insemination']['id']}"){
//           id
//         }
//       }
//       `,
//     };

//     const postRequest1 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody1),
//     );

//     return postRequest1;
//   }

//   confirmCalved(data: any) {
//     console.log('Calved Form: ', data);

//     const requestBody1 = {
//       query: `
//       mutation{
//         deactivatePregnancyCheck(eventId:"${data['pregnancy_check']['id']}"){
//           id
//         }
//       }
//       `,
//     };

//     const requestBody2 = {
//       query: `
//       mutation{
//         createCalving(animalId:"${data['pregnancy_check']['animal']['id']}",eventDateTime:"${data['eventDateTime']}"){
//           id
//         }
//       }

//       `,
//     };

//     const postRequest1 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody1),
//     );
//     const postRequest2 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody2),
//     );

//     return postRequest1.pipe(
//       concatMap((response1) => {
//         return postRequest2;
//       }),
//     );
//   }

//   reportMiscarriage(data: any) {
//     console.log('Miscarriage Form: ', data);

//     const requestBody1 = {
//       query: `
//       mutation{
//         reportMiscarriage(eventId:"${data['pregnancy_check']['id']}", note: "${data.miscarriageForm.note}"){
//           id
//         }
//       }
//       `,
//     };

//     const postRequest1 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody1),
//     );

//     return postRequest1;
//   }

//   reportTreatment(data: any) {
//     console.log('Treatment Form: ', data);

//     const requestBody1 = {
//       query: `
//       mutation{
//         reportTreatment (reportTreatmentInput: {
//             healthEventId: "${data.health.id}",
//             typeOfTreatment: "${data.treatment_form.treatmentType}",
//             medicine:"${data.treatment_form.medicine}",
//             nutrition:"${data.treatment_form.nutrition}",
//             prescriptionRef:"${data.treatment_form.prescriptionRef}"
//           },
//         ){
//             id
//             isActive
//         }
//       }
//       `,
//     };

//     const postRequest1 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody1),
//     );

//     return postRequest1;
//   }

//   reportTreatmentFailure(data: any) {
//     console.log('Health ID: ', data);

//     const requestBody1 = {
//       query: `
//       mutation{
//         reportTreatmentFailure (
//             healthEventId: "${data.health.id}",
//             note: "${data.reason}",
//         ){
//             id
//             isActive
//         }
//       }
//       `,
//     };

//     const postRequest1 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody1),
//     );

//     return postRequest1;
//   }

//   submitMilkEntry(data: any) {
//     console.log('Milk Entry Form: ', data);

//     const requestBody1 = {
//       query: `
//       mutation{
//         createMilkEntry(animalId:"${data['animalId']}", eventDateTime:"${data['eventDateTime']}" , morningMilk:${data['morningVolume']}, afternoonMilk:${data['noonVolume']},eveningMilk:${data['eveningVolume']}){
//           id
//           totalMilk
//         }
//       }
//       `,
//     };

//     const postRequest1 = this.http.post<any>(
//       environment.server.url,
//       JSON.stringify(requestBody1),
//     );

//     return postRequest1;
//   }
// }

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql, QueryRef } from 'apollo-angular';
import {
  map,
  Observable,
  concatMap,
  catchError,
  throwError,
  filter,
} from 'rxjs';
import {
  GET_ALL_EVENTS,
  GET_ANIMAL_DETAILS,
  GET_ANIMALS,
  GET_CALVINGS,
  GET_DRYOFF_EVENTS,
  GET_HEALTHS,
  GET_HEATS,
  GET_INSEMINATIONS,
  GET_MILK_ENTRIES,
  GET_PREGNANCIES,
  GET_RECOVERIES,
} from 'src/app/graphql/data.queries';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(
    private http: HttpClient,
    private apollo: Apollo,
  ) {}

  /**
   * Helper to handle boilerplate for Apollo WatchQueries
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
        fetchPolicy: 'network-only', // Shows cache first, then updates from network
      })
      .valueChanges.pipe(
        // Crucial: Only let the stream continue if data is actually present
        filter((result) => !!result.data && !!result.data[dataKey]),
        map((result) => result.data[dataKey]),
        catchError((error) => {
          console.error(`Error fetching ${dataKey}:`, error);
          return throwError(
            () =>
              new Error(error.message || `Server error fetching ${dataKey}`),
          );
        }),
      );
  }

  getAnimals(
    limit: number,
    offset: number,
    search: string = '',
  ): Observable<any> {
    return this.watchApolloQuery(
      GET_ANIMALS,
      {
        getListInputType: {
          limit: limit,
          offset: offset,
          search: search,
        },
      },
      'getAnimals',
    );
  }

  getHeats(
    userId: string,
    limit: number,
    offset: number,
    search: string,
    startDate?: string,
    endDate?: string,
  ): Observable<any> {
    return this.watchApolloQuery(
      GET_HEATS,
      { userId, limit, offset, search, startDate, endDate },
      'getHeats',
    );
  }

  getHealths(
    userId: string,
    limit: number,
    offset: number,
    search: string,
    startDate?: string,
    endDate?: string,
  ): Observable<any> {
    return this.watchApolloQuery(
      GET_HEALTHS,
      { userId, limit, offset, search, startDate, endDate },
      'getHealths',
    );
  }

  getRecoveries(
    userId: string,
    limit: number,
    offset: number,
    search: string,
    startDate?: string,
    endDate?: string,
  ): Observable<any> {
    return this.watchApolloQuery(
      GET_RECOVERIES,
      { userId, limit, offset, search, startDate, endDate },
      'getRecoveries',
    );
  }

  getInseminations(
    userId: string,
    limit: number,
    offset: number,
    search: string,
    startDate?: string,
    endDate?: string,
  ): Observable<any> {
    return this.watchApolloQuery(
      GET_INSEMINATIONS,
      { userId, limit, offset, search, startDate, endDate },
      'getInseminations',
    );
  }

  getPregnancies(
    userId: string,
    limit: number,
    offset: number,
    search: string,
    startDate?: string,
    endDate?: string,
  ): Observable<any> {
    return this.watchApolloQuery(
      GET_PREGNANCIES,
      { userId, limit, offset, search, startDate, endDate },
      'getPregnancies',
    );
  }

  getCalvings(
    userId: string,
    limit: number,
    offset: number,
    search: string,
    startDate?: string,
    endDate?: string,
  ): Observable<any> {
    return this.watchApolloQuery(
      GET_CALVINGS,
      { userId, limit, offset, search, startDate, endDate },
      'getCalvings',
    );
  }

  getDryoffEvents(
    userId: string,
    limit: number,
    offset: number,
    search: string,
    startDate?: string,
    endDate?: string,
  ): Observable<any> {
    return this.watchApolloQuery(
      GET_DRYOFF_EVENTS,
      { userId, limit, offset, search, startDate, endDate },
      'getDryoffEvents',
    );
  }

  getMilkEntries(
    userId: string,
    limit: number,
    offset: number,
    search: string,
    startDate?: string,
    endDate?: string,
  ): Observable<any> {
    return this.watchApolloQuery(
      GET_MILK_ENTRIES,
      { userId, limit, offset, search, startDate, endDate },
      'getMilkEntries',
    );
  }

  getAllEvents(
    userId: string,
    limit: number,
    offset: number,
    search: string,
    startDate?: string,
    endDate?: string,
    eventType? : string
  ): Observable<any> {

      console.log('Event Type in Service: ', eventType);

    return this.watchApolloQuery(
      GET_ALL_EVENTS,
      { userId, limit, offset, search, startDate, endDate, eventType },
      'getAllEvents',
    );
  }

  getAnimalDetails(
    animalId: string,
    start: string,
    end: string,
  ): QueryRef<any> {
    return this.apollo.watchQuery<any>({
      query: GET_ANIMAL_DETAILS,
      variables: { animalId, startDate: start, endDate: end },
      fetchPolicy: 'cache-and-network',
    });
  }

  getGraphData(
    animalNo: string,
    startDate: string,
    endDate: string,
  ): Observable<any> {
    const requestBody = {
      query: `
      query GetActivityData($animalId: String!, $startDate: String!, $endDate: String!) {
        getActivitiesByAnimal(animalId: $animalId, startDate: $startDate, endDate: $endDate) {
          feeding, date, other, resting, ruminating, standing, timeIntervalUtc
        }
      }`,
      variables: { animalId: animalNo, startDate, endDate },
    };
    return this.http
      .post(environment.server.url, requestBody)
      .pipe(map((res: any) => res?.data?.getActivitiesByAnimal || []));
  }

  // MUTATIONS (Stay as HTTP Post or switch to Apollo.mutate for better cache management)
  confirmInsemination(data: any) {
    const req1 = {
      query: `mutation{ deactivateHeat(eventId:"${data.heat.id}"){ id } }`,
    };
    const req2 = {
      query: `mutation{ createInsemination(inseminationInput:{animalId:"${data.heat.animal.id}", process:"${data.insemination_form.process}", cattle_name: "${data.insemination_form.bull_name}", semen_type:"${data.insemination_form.semen_type}", semen_company:"${data.insemination_form.semen_company}", semen_breed: "${data.insemination_form.semen_breed}", eventDateTime:"${data.insemination_form.insemination_date}"}){ id } }`,
    };
    return this.http
      .post(environment.server.url, JSON.stringify(req1))
      .pipe(
        concatMap(() =>
          this.http.post(environment.server.url, JSON.stringify(req2)),
        ),
      );
  }

  // reportInseminationFailure(data: any) {
  //   console.log('Event : ', data);
  //   const req = {
  //     query: `mutation{ reportInseminationFailure(eventId:"${JSON.stringify(data.heat.id)}", note: "${data.insemination_form.note}"){ id } }`,
  //   };
  //   return this.http.post(environment.server.url, JSON.stringify(req));
  // }


  reportInseminationFailure(data: any) {
  console.log('Event Data:', data);

  const req = {
    // 1. The 'query' matches your API definition exactly
    query: `
      mutation Mutation($eventId: String!, $note: String) {
        reportInseminationFailure(eventId: $eventId, note: $note) {
          id
        }
      }
    `,
    // 2. The 'variables' object maps data to the $ arguments above
    variables: {
      eventId: data.heat.id, // No need for JSON.stringify here
      note: data.insemination_form.note
    }
  };

  // 3. Send the request
  return this.http.post(environment.server.url, req);
}

  confirmPregnancy(data: any) {
    const req1 = {
      query: `mutation{ deactivateInsemination(eventId:"${data.insemination.id}"){ id } }`,
    };
    const req2 = {
      query: `mutation{ createPregnancyCheck(animalId:"${data.insemination.animal.id}", eventDateTime:"${data.eventDateTime}"){ id } }`,
    };
    return this.http
      .post(environment.server.url, JSON.stringify(req1))
      .pipe(
        concatMap(() =>
          this.http.post(environment.server.url, JSON.stringify(req2)),
        ),
      );
  }

  reportPregnancyFailure(data: any) {
    const req = {
      query: `mutation{ reportPregnancyFailure(eventId:"${data.insemination.id}"){ id } }`,
    };
    return this.http.post(environment.server.url, JSON.stringify(req));
  }

  confirmCalved(data: any) {
    const req1 = {
      query: `mutation{ deactivatePregnancyCheck(eventId:"${data.pregnancy_check.id}"){ id } }`,
    };
    const req2 = {
      query: `mutation{ createCalving(animalId:"${data.pregnancy_check.animal.id}", eventDateTime:"${data.eventDateTime}"){ id } }`,
    };
    return this.http
      .post(environment.server.url, JSON.stringify(req1))
      .pipe(
        concatMap(() =>
          this.http.post(environment.server.url, JSON.stringify(req2)),
        ),
      );
  }

  reportMiscarriage(data: any) {
    const req = {
      query: `mutation{ reportMiscarriage(eventId:"${data.pregnancy_check.id}", note: "${data.miscarriageForm.note}"){ id } }`,
    };
    return this.http.post(environment.server.url, JSON.stringify(req));
  }

  reportTreatment(data: any) {
    const req = {
      query: `mutation{ reportTreatment(reportTreatmentInput: { healthEventId: "${data.health.id}", typeOfTreatment: "${data.treatment_form.treatmentType}", medicine:"${data.treatment_form.medicine}", nutrition:"${data.treatment_form.nutrition}", prescriptionRef:"${data.treatment_form.prescriptionRef}" }){ id isActive } }`,
    };
    return this.http.post(environment.server.url, JSON.stringify(req));
  }

  reportTreatmentFailure(data: any) {
    const req = {
      query: `mutation{ reportTreatmentFailure(healthEventId: "${data.health.id}", note: "${data.reason}"){ id isActive } }`,
    };
    return this.http.post(environment.server.url, JSON.stringify(req));
  }

  submitMilkEntry(data: any) {
    const req = {
      query: `mutation{ createMilkEntry(animalId:"${data.animalId}", eventDateTime:"${data.eventDateTime}" , morningMilk:${data.morningVolume}, afternoonMilk:${data.noonVolume}, eveningMilk:${data.eveningVolume}){ id totalMilk } }`,
    };
    return this.http.post(environment.server.url, JSON.stringify(req));
  }
}
