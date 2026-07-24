// // import { Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from "@angular/core";
// // import { AuthService } from "src/app/features/auth/auth.service";
// // import { DataService } from "src/app/services/data/data.service";
// // import Chart, { ChartConfiguration } from "chart.js/auto";
// // import { TranslateModule, TranslateService } from "@ngx-translate/core";
// // import { BehaviorSubject, combineLatest, filter, firstValueFrom, map, Observable, shareReplay, startWith, Subscription, switchMap } from "rxjs";
// // import { CommonModule, DatePipe } from "@angular/common";
// // import { IonNote, IonLabel, IonTitle, IonItem, IonContent, IonSpinner, IonChip, IonToolbar, IonHeader, IonGrid, IonRow, IonCol, IonRippleEffect, IonIcon, IonButton, IonButtons, IonMenu, IonMenuButton, MenuController, IonFab, IonFabButton, IonFooter } from "@ionic/angular/standalone";
// // import { FormsModule } from "@angular/forms";
// // import { RouterModule } from "@angular/router";
// // import { NavigationComponent } from "src/app/components/navigation/navigation.component";
// // import { GET_DASHBOARD_ITEMS } from "src/app/graphql/data.queries";
// // import { Apollo, QueryRef } from "apollo-angular";
// // import { CountUpPipe } from "../../utils/pipes/count-up/count-up-pipe";
// // import { systemService } from "src/app/services/navigation/user.service";
// // import { EventUtilityService } from "src/app/utils/event-util/event-util.service";

// // @Component({
// //   selector: 'app-dashboard',
// //   imports: [
// //     CommonModule, FormsModule, TranslateModule,
// //     DatePipe,
// //     RouterModule,
// //     IonNote,
// //     IonLabel,
// //     IonItem,
// //     IonTitle,
// //     IonContent,
// //     IonSpinner,
// //     IonChip,
// //     IonToolbar,
// //     NavigationComponent,
// //     IonHeader,
// //     IonGrid,
// //     IonRow,
// //     IonCol,
// //     IonRippleEffect,
// //     CountUpPipe,
// //     IonIcon,
// //     IonButton,
// //     IonButtons,
// //     IonMenu,
// //     IonMenuButton,
// //     IonFab,
// //     IonFabButton,
// //     IonFooter
// //   ],
// //   templateUrl: './dashboard.page.html',
// //   styleUrls: ['./dashboard.page.scss'],
// //   standalone: true,
// // })
// // export class DashboardPage implements OnInit, OnDestroy {

// //   @ViewChild("myChart_1", { static: false }) myChart_1: ElementRef;
// //   @ViewChild("myChart_2", { static: false }) myChart_2: ElementRef;

// //   ctx_1: CanvasRenderingContext2D;
// //   ctx_2: CanvasRenderingContext2D;

// //   private subscriptions: Subscription = new Subscription(); // Use a single Subscription

// //   private fetchUserDataSub: Subscription;
// //   private userDataSub: Subscription;
// //   private farmIdSubscription: Subscription;

// //   // isLoading: boolean = true;
// //   progress: number = 0;

// //   globalDashboardQueryRef: QueryRef<any>;
// //   // globalCounts$: Observable<any>;

// //   dashboardQueryRef: QueryRef<any>;
// //   // counts$: Observable<any>;

// //   // These will be used by (counts$ | async) and (globalCounts$ | async) in your HTML
// //   private dashboardData$ = new BehaviorSubject<any>(null);
// //   counts$: Observable<any> = this.dashboardData$.asObservable();

// //   private globalData$ = new BehaviorSubject<any>(null);
// //   globalCounts$: Observable<any> = this.globalData$.asObservable();

// //   // Define the selection object
// //   selections = {
// //     primary: '',
// //     managed: '',
// //     farm: ''
// //   };

// //   auth_user: any = null;

// //   isLoading = signal(false);

// //   // Standardized Parameters (Same as Heats)
// //   filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
// //   options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };


// //   private subs = new Subscription();


// //   constructor(
// //     private systemService: systemService,
// //     private apollo: Apollo,
// //     private eventUtil: EventUtilityService,
// //     private dataService: DataService
// //   ) { }

// //   ngOnInit() {
// //       const auth_user = localStorage.getItem('chms-dms.mobile.user');
// //       if (auth_user) this.auth_user = JSON.parse(auth_user);

// //     this.syncSelections();
// //     this.setRange(-1);
// //     this.initSyncs();

// //   }

// //   setRange(months: number) {
// //     const range = this.eventUtil.calculateRange(months);
// //     this.filter.startDate = range.start;
// //     this.filter.endDate = range.end;
// //     this.refresh();
// //   }

// //   private initSyncs() {
// //     this.subs.add(this.systemService.selectionChanged$.subscribe(() => {
// //       this.syncSelections();
// //       this.refresh();
// //     }));
// //   }


// //   refresh() {
// //     this.loadManagedCounts();
// //     this.loadGlobalCounts();
// //   }

// //   private syncSelections() {
// //     const { targetPath, farmId } = this.eventUtil.getSavedSelections();
// //     this.filter.targetPath = targetPath;
// //     this.filter.farmId = farmId;
// //   }

// //   ngOnDestroy() { this.subs.unsubscribe(); }

 
// //   async loadManagedCounts() {
// //     try {
// //       const res = await firstValueFrom(
// //         this.apollo.query<any>({
// //           query: GET_DASHBOARD_ITEMS,
// //           variables: {
// //             filter: {
// //               targetPath: this.filter.targetPath,
// //               farmId: this.filter.farmId,
// //               startDate: this.filter.startDate,
// //               endDate: this.filter.endDate
// //             }
// //           },
// //           fetchPolicy: 'network-only'
// //         })
// //       );

// //       if (res.data) {
// //         this.dashboardData$.next(res.data.getDashboardCounts);
// //       }
// //     } catch (err) {
// //       console.error("Managed Load Error:", err);
// //     }
// //   }


// //   async loadGlobalCounts() {
// //     try {
// //       const res = await firstValueFrom(
// //         this.apollo.query<any>({
// //           query: GET_DASHBOARD_ITEMS,
// //           variables: { filter: { targetPath: "" } }, 
// //           fetchPolicy: 'network-only'
// //         })
// //       );
// //       if (res.data) this.globalData$.next(res.data.getDashboardCounts);
// //     } catch (err) { console.error("Global Load Error:", err); }
// //   }
// // }



// import { Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from "@angular/core";
// import { TranslateModule } from "@ngx-translate/core";
// import { BehaviorSubject, Subscription, Observable, firstValueFrom } from "rxjs";
// import { CommonModule, DatePipe } from "@angular/common";
// import { IonNote, IonLabel, IonTitle, IonItem, IonContent, IonSpinner, IonChip, IonToolbar, IonHeader, IonGrid, IonRow, IonCol, IonRippleEffect, IonIcon, IonButton, IonButtons, IonMenu, IonMenuButton, MenuController, IonFab, IonFabButton, IonFooter, IonCard, IonSegment, IonSegmentButton } from "@ionic/angular/standalone";
// import { FormsModule } from "@angular/forms";
// import { RouterModule } from "@angular/router";
// import { NavigationComponent } from "src/app/pages/components/navigation/navigation.component";
// import { Apollo } from "apollo-angular";
// import { EventUtilityService } from "src/app/utils/event-util/event-util.service";
// import { DASHBOARD_ITEMS } from "src/app/graphql/queries/dashboard.queries";
// import { CountUpPipe } from "src/app/utils/pipes/count-up/count-up-pipe";
// import { SystemService } from "src/app/services/system/system.service";
// import { HeatPage } from "../chms/heat/heat.page";
// import { HealthPage } from "../chms/health/health.page";

// @Component({
//   selector: 'app-dashboard',
//   imports: [
//     CommonModule, FormsModule, TranslateModule,
//     DatePipe,
//     RouterModule,
//     IonNote,
//     IonLabel,
//     IonItem,
//     IonTitle,
//     IonContent,
//     IonSpinner,
//     IonChip,
//     IonToolbar,
//     NavigationComponent,
//     IonHeader,
//     IonGrid,
//     IonRow,
//     IonCol,
//     IonRippleEffect,
//     CountUpPipe,
//     IonIcon,
//     IonButton,
//     IonButtons,
//     IonMenu,
//     IonMenuButton,
//     IonFab,
//     IonFabButton,
//     IonFooter,
//     IonCard,
//     IonSegment,
//     IonSegmentButton,
//     HeatPage,
//     HealthPage
// ],
//   templateUrl: './dashboard.page.html',
//   styleUrls: ['./dashboard.page.scss'],
//   standalone: true,
// })
// export class DashboardPage implements OnInit, OnDestroy {

//   @ViewChild("myChart_1", { static: false }) myChart_1: ElementRef;
//   @ViewChild("myChart_2", { static: false }) myChart_2: ElementRef;

//   ctx_1: CanvasRenderingContext2D;
//   ctx_2: CanvasRenderingContext2D;

//   progress: number = 0;
//   auth_user: any = null;
//   isLoading = signal(false);

//   // Standardized Parameters aligned with backend filters
//   filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
//   options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };

//   // 🟢 Fixed: Cleaned and explicit behavioral subject bindings for pipeline synchronization
//   private dashboardData$ = new BehaviorSubject<any>(null);
//   counts$: Observable<any> = this.dashboardData$.asObservable();

//   private globalData$ = new BehaviorSubject<any>(null);
//   globalCounts$: Observable<any> = this.globalData$.asObservable();

//   private subs = new Subscription();

//   constructor(
//     private systemService: SystemService,
//     private apollo: Apollo,
//     private eventUtil: EventUtilityService,
//   ) { }

//   ngOnInit() {
//     const auth_user = localStorage.getItem('chms-dms.mobile.user');
//     if (auth_user) this.auth_user = JSON.parse(auth_user);

//     this.syncSelections();
//     this.setRange(-1);
//     this.initSyncs();
//   }

//   setRange(months: number) {
//     const range = this.eventUtil.calculateRange(months);
//     this.filter.startDate = range.start;
//     this.filter.endDate = range.end;
//     this.refresh();
//   }

//   private initSyncs() {
//     this.subs.add(this.systemService.selectionChanged$.subscribe(() => {
//       this.syncSelections();
//       this.refresh();
//     }));
//   }

//   refresh() {
//     this.loadManagedCounts();
//     // this.loadGlobalCounts();
//   }

//   private syncSelections() {
//     const selections = this.eventUtil.getSavedSelections();
//     if (selections) {
//       this.filter.targetPath = selections.targetPath || '';
//       this.filter.farmId = selections.farmId || '';
//     }
//   }

//   ngOnDestroy() { 
//     this.subs.unsubscribe(); 
//   }

//   async loadManagedCounts() {
//     try {
//       const res = await firstValueFrom(
//         this.apollo.query<any>({
//           query: DASHBOARD_ITEMS,
//           variables: {
//             filter: {
//               targetPath: this.filter.targetPath,
//               farmId: this.filter.farmId,
//               startDate: this.filter.startDate,
//               endDate: this.filter.endDate
//             }
//           },
//           fetchPolicy: 'network-only'
//         })
//       );

//       if (res?.data?.getDashboardCounts) {
//         this.dashboardData$.next(res.data.getDashboardCounts);
//       }
//     } catch (err) {
//       console.error("Managed Load Error:", err);
//     }
//   }

//   // async loadGlobalCounts() {
//   //   try {
//   //     const res = await firstValueFrom(
//   //       this.apollo.query<any>({
//   //         query: DASHBOARD_ITEMS,
//   //         variables: { filter: { targetPath: "" } }, 
//   //         fetchPolicy: 'network-only'
//   //       })
//   //     );
//   //     if (res?.data?.getDashboardCounts) {
//   //       this.globalData$.next(res.data.getDashboardCounts);
//   //     }
//   //   } catch (err) { 
//   //     console.error("Global Load Error:", err); 
//   //   }
//   // }
// }




import { Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { BehaviorSubject, Subscription, Observable, firstValueFrom } from "rxjs";
import { CommonModule, DatePipe } from "@angular/common";
import { 
  IonNote, IonLabel, IonTitle, IonItem, IonContent, IonSpinner, IonChip, 
  IonToolbar, IonHeader, IonGrid, IonRow, IonCol, IonRippleEffect, IonIcon, 
  IonButton, IonButtons, IonMenu, IonMenuButton, IonFab, IonFabButton, 
  IonFooter, IonCard, IonSegment, IonSegmentButton 
} from "@ionic/angular/standalone";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { NavigationComponent } from "src/app/pages/components/navigation/navigation.component";
import { Apollo } from "apollo-angular";
import { EventUtilityService } from "src/app/utils/event-util/event-util.service";
import { DASHBOARD_ITEMS } from "src/app/graphql/queries/dashboard.queries";
import { CountUpPipe } from "src/app/utils/pipes/count-up/count-up-pipe";
import { SystemService } from "src/app/services/system/system.service";
import { HeatPage } from "../chms/heat/heat.page";
import { HealthPage } from "../chms/health/health.page";

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule, FormsModule, TranslateModule,
    DatePipe,
    RouterModule,
    IonNote,
    IonLabel,
    IonItem,
    IonTitle,
    IonContent,
    IonSpinner,
    IonChip,
    IonToolbar,
    NavigationComponent,
    IonHeader,
    IonGrid,
    IonRow,
    IonCol,
    IonRippleEffect,
    CountUpPipe,
    IonIcon,
    IonButton,
    IonButtons,
    IonMenu,
    IonMenuButton,
    IonFab,
    IonFabButton,
    IonFooter,
    IonCard,
    IonSegment,
    IonSegmentButton,
    HeatPage,
    HealthPage
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
})
export class DashboardPage implements OnInit, OnDestroy {

  @ViewChild("myChart_1", { static: false }) myChart_1: ElementRef;
  @ViewChild("myChart_2", { static: false }) myChart_2: ElementRef;

  ctx_1: CanvasRenderingContext2D;
  ctx_2: CanvasRenderingContext2D;

  progress: number = 0;
  auth_user: any = null;
  isLoading = signal(false);

  // Standardized Parameters aligned with backend filters
  filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
  options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };

  private dashboardData$ = new BehaviorSubject<any>(null);
  counts$: Observable<any> = this.dashboardData$.asObservable();

  private globalData$ = new BehaviorSubject<any>(null);
  globalCounts$: Observable<any> = this.globalData$.asObservable();

  private subs = new Subscription();

  constructor(
    private systemService: SystemService,
    private apollo: Apollo,
    private eventUtil: EventUtilityService,
  ) { }

  ngOnInit() {
    const auth_user = localStorage.getItem('chms-dms.mobile.user');
    if (auth_user) this.auth_user = JSON.parse(auth_user);

    this.syncSelections();
    this.setRange(-1); // Automatically calls refresh() internally
    this.initSyncs();
  }

  setRange(months: number) {
    const range = this.eventUtil.calculateRange(months);
    this.filter.startDate = range.start;
    this.filter.endDate = range.end;
    this.refresh();
  }

  private initSyncs() {
    this.subs.add(this.systemService.selectionChanged$.subscribe(() => {
      this.syncSelections();
      this.refresh();
    }));
  }

  refresh() {
    this.loadManagedCounts();
  }

  private syncSelections() {
    const selections = this.eventUtil.getSavedSelections();
    if (selections) {
      this.filter.targetPath = selections.targetPath || '';
      this.filter.farmId = selections.farmId || '';
    }
  }

  ngOnDestroy() { 
    this.subs.unsubscribe(); 
  }

  async loadManagedCounts() {
    // Prevent duplicate overlapping network executions
    if (this.isLoading()) return;
    this.isLoading.set(true);

    try {
      // 🚀 EXCLUSIVE MATCH RESOLUTION: If an explicit farm selection is present, 
      // set targetPath to null so the backend scopes strictly to the farm entity.
      const hasFarm = this.filter.farmId && this.filter.farmId !== 'null' && this.filter.farmId !== 'undefined';
      
      const res = await firstValueFrom(
        this.apollo.query<any>({
          query: DASHBOARD_ITEMS,
          variables: {
            filter: {
              farmId: hasFarm ? this.filter.farmId : null,
              targetPath: hasFarm ? null : (this.filter.targetPath || null),
              startDate: this.filter.startDate || null,
              endDate: this.filter.endDate || null
            }
          },
          fetchPolicy: 'network-only'
        })
      );

      if (res?.data?.getDashboardCounts) {
        this.dashboardData$.next(res.data.getDashboardCounts);
      }
    } catch (err) {
      console.error("Managed Load Error:", err);
    } finally {
      this.isLoading.set(false);
    }
  }
}