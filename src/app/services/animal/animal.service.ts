// import { Injectable } from '@angular/core';
// import { Apollo } from 'apollo-angular';
// import { map, Observable, catchError, throwError, filter, of } from 'rxjs';
// import { ANIMALS, GET_ANIMAL, GET_ANIMAL_CHART_DATASETS, GET_ANIMAL_EVENTS } from 'src/app/graphql/queries/animal.queries';

// @Injectable({
//     providedIn: 'root',
// })
// export class AnimalService {

//     constructor(private apollo: Apollo) { }

//     private fetchApolloQuery<T>(
//         query: any,
//         variables: any,
//         dataKey: string,
//     ): Observable<T> {
//         return this.apollo
//             .query<any>({
//                 query,
//                 variables,
//                 fetchPolicy: 'network-only',
//             })
//             .pipe(
//                 map((result) => result.data[dataKey]),
//                 catchError((error) => {
//                     console.error(`Error fetching ${dataKey}:`, error);
//                     return throwError(() => error);
//                 })
//             );
//     }

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

//     getAnimals(inputs: { filter: any, options: any }): Observable<any> {
//         return this.watchApolloQuery(ANIMALS, inputs, 'getAnimals');
//     }

//     getAnimal(animalId: string): Observable<any> {
//         return this.fetchApolloQuery(GET_ANIMAL, { animalId }, 'getAnimal');
//     }

//     getAnimalEvents(filter: any, options: any): Observable<any> {
//         return this.fetchApolloQuery(GET_ANIMAL_EVENTS, { filter, options }, 'getAnimalEvents');
//     }

//     getAnimalChartDatasets(deviceNo: string, fromTime: string, toTime: string, timeBucket: string = '1d'): Observable<any[]> {
//         return this.apollo.query<any>({
//             query: GET_ANIMAL_CHART_DATASETS,
//             variables: { deviceNo, fromTime, toTime, timeBucket },
//             fetchPolicy: 'network-only'
//         }).pipe(
//             map(res => res.data?.getAnimalChartDatasets || []),
//             catchError((err) => {
//                 console.error("[API Error] Chart Service Execution Failed:", err);
//                 return of([]);
//             })
//         );
//     }

// }



import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable, catchError, throwError, filter, of } from 'rxjs';
import { ANIMALS, GET_ANIMAL, GET_ANIMAL_CHART_DATASETS, GET_ANIMAL_EVENTS } from 'src/app/graphql/queries/animal.queries';

@Injectable({
  providedIn: 'root',
})
export class AnimalService {
  private readonly apollo = inject(Apollo);

  /**
   * Universal execution wrapper for single shot network-only queries
   */
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
        map((result) => result.data[dataKey] as T),
        catchError((error) => {
          console.error(`[API Error] Single fetch operation failed for ${dataKey}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Universal execution wrapper for watched queries (UI live streaming updates)
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
          console.error(`[API Error] Active stream execution failed for ${dataKey}:`, error);
          return throwError(() => error);
        })
      );
  }

  getAnimals(inputs: { filter: any; options: any }): Observable<any> {
    return this.watchApolloQuery<any>(ANIMALS, inputs, 'getAnimals');
  }

  getAnimal(animalId: string): Observable<any> {
    return this.fetchApolloQuery<any>(GET_ANIMAL, { animalId }, 'getAnimal');
  }

  getAnimalEvents(filter: any, options: any): Observable<any> {
    return this.fetchApolloQuery<any>(GET_ANIMAL_EVENTS, { filter, options }, 'getAnimalEvents');
  }

  getAnimalChartDatasets(
    deviceNo: string, 
    fromTime: string, 
    toTime: string, 
    timeBucket: string = '1d'
  ): Observable<any[]> {
    return this.apollo
      .query<any>({
        query: GET_ANIMAL_CHART_DATASETS,
        variables: { deviceNo, fromTime, toTime, timeBucket },
        fetchPolicy: 'network-only'
      })
      .pipe(
        map((res) => res.data?.getAnimalChartDatasets || []),
        catchError((err) => {
          console.error("[API Error] Chart data generation pipeline failed:", err);
          return of([]); // Graceful structural fallback to keep UI charts alive without breaking
        })
      );
  }


  // // 🌟 GENERATE COMPLETE FARM LEVEL INVENTORY PDF
  // fetchServerFarmReport(filter: any): Observable<any> {
  //   const GENERATE_FARM_REPORT = gql`
  //     query GenerateFarmReport($filter: ReportFilterInput!) {
  //       generateFarmReport(filter: $filter) {
  //         downloadUrl
  //         fileType
  //         generatedAt
  //       }
  //     }
  //   `;
  //   return this.apollo.query<any>({
  //     query: GENERATE_FARM_REPORT,
  //     variables: { filter },
  //     fetchPolicy: 'network-only'
  //   }).pipe(map(response => response.data?.generateFarmReport));
  // }

  // // 🌟 GENERATE INDIVIDUAL ANIMAL LIFECYCLE & ACTIVITY REPORT PDF
  // fetchServerAnimalReport(animalId: string, filter: any): Observable<any> {
  //   const GENERATE_ANIMAL_REPORT = gql`
  //     query GenerateAnimalReport($animalId: ID!, $filter: ReportFilterInput!) {
  //       generateAnimalReport(animalId: $animalId, filter: $filter) {
  //         downloadUrl
  //         fileType
  //         generatedAt
  //       }
  //     }
  //   `;
  //   return this.apollo.query<any>({
  //     query: GENERATE_ANIMAL_REPORT,
  //     variables: { animalId, filter },
  //     fetchPolicy: 'network-only'
  //   }).pipe(map(response => response.data?.generateAnimalReport));
  // }


  // 🌟 UPDATED: Expecting `fileBuffer`, `fileName`, and `fileType` instead of a URL
  fetchServerFarmReport(filter: any): Observable<any> {
    const GENERATE_FARM_REPORT = gql`
      query GenerateFarmReport($filter: ReportFilterInput!) {
        generateFarmReport(filter: $filter) {
          fileBuffer
          fileName
          fileType
          generatedAt
        }
      }
    `;
    return this.apollo.query<any>({
      query: GENERATE_FARM_REPORT,
      variables: { filter },
      fetchPolicy: 'network-only'
    }).pipe(map(response => response.data?.generateFarmReport));
  }

  fetchServerAnimalReport(animalId: string, filter: any): Observable<any> {
    const GENERATE_ANIMAL_REPORT = gql`
      query GenerateAnimalReport($animalId: ID!, $filter: ReportFilterInput!) {
        generateAnimalReport(animalId: $animalId, filter: $filter) {
          fileBuffer
          fileName
          fileType
          generatedAt
        }
      }
    `;
    return this.apollo.query<any>({
      query: GENERATE_ANIMAL_REPORT,
      variables: { animalId, filter },
      fetchPolicy: 'network-only'
    }).pipe(map(response => response.data?.generateAnimalReport));
  }
  
}