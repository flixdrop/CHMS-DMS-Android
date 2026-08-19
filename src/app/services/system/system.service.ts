// import { inject, Injectable, signal, computed } from '@angular/core';
// import { Apollo } from 'apollo-angular';
// import { BehaviorSubject, firstValueFrom } from 'rxjs';
// import { DASHBOARD_ITEMS } from 'src/app/graphql/queries/dashboard.queries';
// import { CREATE_USER, UPDATE_USER } from 'src/app/graphql/queries/auth.queries';

// export interface FilterState {
//   primaryUser: string;
//   managedUser: string;
//   farmId: string;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class SystemService {

//   [x: string]: any;
  
//     // A simple pipe to announce that selections have changed
//     private selectionChangedSource = new BehaviorSubject<void>(undefined);
//     selectionChanged$ = this.selectionChangedSource.asObservable();
  
//     private STORAGE_KEY = 'chms-dms.web.selected_options';
    
//     // Default State
//     private defaultState: FilterState = {
//       primaryUser: '',
//       managedUser: '',
//       farmId: ''
//     };
    
//     // Load saved data immediately or use defaults
//     private saved = JSON.parse(localStorage.getItem('chms-dms.web.selected_options') || '{"primary":"","managed":"","farm":""}');
    
//     private filterSubject = new BehaviorSubject(this.saved);
//     filters$ = this.filterSubject.asObservable();
      

//   private readonly apollo = inject(Apollo);

//   #globalCounts = signal<any>(null);
//   // Track active data-fetching queries
//   #activeFetchCount = signal<number>(0); 

//   readonly globalCounts = this.#globalCounts.asReadonly();
  
//   // Progress bar displays if any fetch operation is active
//   readonly isFetching = computed(() => this.#activeFetchCount() > 0);

//   incrementFetch() {
//     this.#activeFetchCount.update(count => count + 1);
//   }

//   decrementFetch() {
//     this.#activeFetchCount.update(count => Math.max(0, count - 1));
//   }

//   async loadDashboardCounts(targetPath: string) {
//     this.incrementFetch(); // Fire progress bar
//     try {
//       const res = await firstValueFrom(
//         this.apollo.query<any>({
//           query: DASHBOARD_ITEMS,
//           variables: { filter: { targetPath } },
//           fetchPolicy: 'network-only',
//         })
//       );
      
//       if (res?.data?.getDashboardCounts) {
//         this.#globalCounts.set(res.data.getDashboardCounts);
//       }
//     } catch (err) {
//       console.error('Global Load Error:', err);
//     } finally {
//       this.decrementFetch(); // Turn off progress bar
//     }
//   }

//     private loadFromStorage(): FilterState {
//       const saved = localStorage.getItem(this.STORAGE_KEY);
//       return saved ? JSON.parse(saved) : this.defaultState;
      
//     }
  
//     notifySelectionChanged() {
//       this.selectionChangedSource.next();
//     }
    
//     updateFilters(newFilters: any) {
//       const updated = { ...this.filterSubject.value, ...newFilters };
//       localStorage.setItem('chms-dms.web.selected_options', JSON.stringify(updated));
//       this.filterSubject.next(updated);
//     }
  
//     get current() {
//       return this.filterSubject.value;
//     }
// }


import { inject, Injectable, signal, computed } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { DASHBOARD_ITEMS } from 'src/app/graphql/queries/dashboard.queries';

export interface FilterState {
  primaryUser: string;
  managedUser: string;
  farmId: string;
}

@Injectable({
  providedIn: 'root',
})
export class SystemService {
  [x: string]: any;

  // Pipe to announce selection updates to observers
  private selectionChangedSource = new BehaviorSubject<void>(undefined);
  selectionChanged$ = this.selectionChangedSource.asObservable();

  private STORAGE_KEY = 'chms-dms.web.selected_options';

  // Default State
  private defaultState: FilterState = {
    primaryUser: '',
    managedUser: '',
    farmId: '',
  };

  // Load saved options from localStorage or fall back to empty defaults
  private saved = this.loadFromStorage();

  private filterSubject = new BehaviorSubject<any>(this.saved);
  filters$ = this.filterSubject.asObservable();

  private readonly apollo = inject(Apollo);

  #globalCounts = signal<any>(null);
  // Track active data-fetching queries
  #activeFetchCount = signal<number>(0);

  readonly globalCounts = this.#globalCounts.asReadonly();

  // Progress bar displays if any fetch operation is active
  readonly isFetching = computed(() => this.#activeFetchCount() > 0);

  incrementFetch() {
    this.#activeFetchCount.update((count) => count + 1);
  }

  decrementFetch() {
    this.#activeFetchCount.update((count) => Math.max(0, count - 1));
  }

  async loadDashboardCounts(targetPath: string) {
    this.incrementFetch(); // Fire progress bar
    try {
      const res = await firstValueFrom(
        this.apollo.query<any>({
          query: DASHBOARD_ITEMS,
          variables: { filter: { targetPath } },
          fetchPolicy: 'network-only',
        })
      );

      if (res?.data?.getDashboardCounts) {
        this.#globalCounts.set(res.data.getDashboardCounts);
      }
    } catch (err) {
      console.error('Global Load Error:', err);
    } finally {
      this.decrementFetch(); // Turn off progress bar
    }
  }

  private loadFromStorage(): any {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved options from localStorage:', e);
      }
    }
    return { primary: '', managed: '', farm: '' };
  }

  notifySelectionChanged() {
    this.selectionChangedSource.next();
  }

  updateFilters(newFilters: any) {
    const updated = { ...this.filterSubject.value, ...newFilters };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    this.filterSubject.next(updated);
  }

  get current() {
    return this.filterSubject.value;
  }
}