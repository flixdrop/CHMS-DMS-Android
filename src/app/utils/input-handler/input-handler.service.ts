// import { Injectable } from "@angular/core";

// @Injectable({
//   providedIn: "root",
// })
// export class InputHandlerService {

//   results: any[] = [];

//   constructor() {}

//   handleInput(input: any, items: any[]): any[] {
   
//     if (!items || items.length === 0) {
//       this.results = [];
//       return [];
//     }

//     const query = input.toLowerCase();

//     return items.filter((item) => {
//       return Object.values(item || {}).some((value: any) => {
//         // Check if value exists and is a string, then match the query
//         if (value && typeof value === "string") {
//           return value.toLowerCase().includes(query);
//         }
//         // Check if value is an object, then search within its values
//         else if (value && typeof value === "object") {
//           return Object.values(value || {}).some((nestedValue: any) => {
//             if (nestedValue && typeof nestedValue === "string") {
//               return nestedValue.toLowerCase().includes(query);
//             }
//             return false;
//           });
//         }
//         return false;
//       });
//     });
  

//   }
// }


// import { Injectable } from "@angular/core";
// import { Subject, Observable } from "rxjs";
// import { debounceTime, distinctUntilChanged } from "rxjs/operators";

// @Injectable({
//   providedIn: "root",
// })
// export class InputHandlerService {
//   // A stream of search terms
//   private searchSubject = new Subject<string>();

//   constructor() {}

//   /**
//    * Push a new search term into the stream
//    */
//   search(query: string) {
//     this.searchSubject.next(query);
//   }

//   /**
//    * Returns an observable that only emits when the user 
//    * has stopped typing for 300ms.
//    */
//   getSearchStream(): Observable<string> {
//     return this.searchSubject.asObservable().pipe(
//       debounceTime(300), // Wait 300ms after last keystroke
//       distinctUntilChanged() // Only emit if the value is different from the last one
//     );
//   }
// }


import { Injectable } from "@angular/core";
import { Subject, Observable } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class InputHandlerService {
  private searchSubject = new Subject<string>();

  // Push the value here
  search(query: string) {
    this.searchSubject.next(query);
  }

  // Component listens here
  getSearchStream(delay: number = 400): Observable<string> {
    return this.searchSubject.asObservable().pipe(
      debounceTime(delay),
      distinctUntilChanged()
    );
  }
}