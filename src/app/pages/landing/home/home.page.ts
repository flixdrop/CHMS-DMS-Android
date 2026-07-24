// import { ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from "@angular/core";
// import { TranslateModule } from "@ngx-translate/core";
// import { BehaviorSubject, Subscription, Observable, firstValueFrom, catchError, finalize, forkJoin, of } from "rxjs";
// import { take } from "rxjs/operators";
// import { CommonModule } from "@angular/common";
// import { IonLabel, IonItem, IonContent, IonImg, IonProgressBar, IonRow, IonRefresher, IonRefresherContent, IonGrid, IonCol, IonRippleEffect, IonCard, IonSegmentButton, IonSegment, ModalController } from "@ionic/angular/standalone";
// import { FormsModule } from "@angular/forms";
// import { RouterModule } from "@angular/router";
// import { Apollo } from "apollo-angular";
// import { EventUtilityService } from "src/app/utils/event-util/event-util.service";
// import { DASHBOARD_ITEMS } from "src/app/graphql/queries/dashboard.queries";
// import { CountUpPipe } from "src/app/utils/pipes/count-up/count-up-pipe";
// import { SystemService } from "src/app/services/system/system.service";
// import { CattleMonitoringService } from "src/app/services/chms/chms.service";
// import { SharedImportsModule } from 'src/app/shared/shared-imports';
// import { DairyManagementService } from "src/app/services/dms/dms.service";

// import { Chart, registerables } from 'chart.js';
// import zoomPlugin from 'chartjs-plugin-zoom';
// import 'chartjs-adapter-luxon';
// import { DateTime } from 'luxon';
// import { DairyModalComponent } from "../../features/dms/dairy/dairy-modal/dairy-modal.component";

// Chart.register(...registerables);
// Chart.register(zoomPlugin);

// @Component({
//   selector: 'app-home',
//   templateUrl: './home.page.html',
//   styleUrls: ['./home.page.scss'],
//   imports: [IonSegment, IonSegmentButton, IonCard, IonRippleEffect, IonCol, IonGrid, IonRefresherContent, IonRefresher, IonRow, IonProgressBar, IonImg, CommonModule, FormsModule, TranslateModule, RouterModule, IonLabel, IonItem, IonContent, CountUpPipe, SharedImportsModule],
//   standalone: true,
// })
// export class HomePage implements OnInit, OnDestroy {
  
//   private modalCtrl = inject(ModalController);

//   @ViewChild('milkingChartCanvas', { static: false }) milkingChartCanvas!: ElementRef<HTMLCanvasElement>;

//   progress: number = 0;
//   auth_user: any = null;
//   isLoading = signal(false);

//   startDate!: Date;
//   endDate!: Date;
//   today: Date = new Date();

//   filter = {
//     targetPath: '',
//     farmId: '',
//     search: '',
//     startDate: '',
//     endDate: '',
//     eventType: null 
//   };
//   options = { limit: 100, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };

//   selectedPreset: string = '7days';
//   public processedMilkingEvents: any[] = [];
//   private privateMilkingChartInstance: Chart | null = null;

//   private dashboardData$ = new BehaviorSubject<any>(null);
//   counts$: Observable<any> = this.dashboardData$.asObservable();

//   private globalData$ = new BehaviorSubject<any>(null);
//   globalCounts$: Observable<any> = this.globalData$.asObservable();

//   private dataFetchSub!: Subscription;
//   private subs = new Subscription();

//   constructor(
//     private systemService: SystemService,
//     private apollo: Apollo,
//     private eventUtil: EventUtilityService,
//     private chmsService: CattleMonitoringService,
//     private dmsService: DairyManagementService,
//     private cdr: ChangeDetectorRef,
//   ) { }

//   ngOnInit() {
//     const auth_user = localStorage.getItem('chms-dms.mobile.user');
//     if (auth_user) this.auth_user = JSON.parse(auth_user);

//     this.syncSelections();
    
//     // Set parameters for 7days by default on initialization
//     this.calculatePresetDates(this.selectedPreset);
//     this.filter.startDate = this.startDate.toISOString();
//     this.filter.endDate = this.endDate.toISOString();

//     this.initSyncs();
//     this.refresh();
//   }

//   ionViewDidEnter() {
//     this.renderMilkingChartInstance();
//   }

//   setRange(months: number) {
//     const range = this.eventUtil.calculateRange(months);
//     this.filter.startDate = range.start;
//     this.filter.endDate = range.end;

//     this.startDate = range.start ? new Date(range.start) : new Date();
//     this.endDate = range.end ? new Date(range.end) : new Date();

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
//     this.fetchChartDataPipeline();
//   }

//   fetchChartDataPipeline() {
//     if (this.dataFetchSub) {
//       this.dataFetchSub.unsubscribe();
//     }

//     this.isLoading.set(true);
//     this.cdr.detectChanges(); 

//     const hasFarm = this.filter.farmId && this.filter.farmId !== 'null' && this.filter.farmId !== 'undefined';

//     const allEvents$ = this.dmsService.getMilkingLogs({
//       filter: {
//         farmId: hasFarm ? this.filter.farmId : null,
//         targetPath: hasFarm ? null : (this.filter.targetPath || null),
//       }
//     }).pipe(take(1), catchError(() => of({ items: [] })));

//     this.dataFetchSub = forkJoin([allEvents$]).pipe(
//       finalize(() => {
//         this.isLoading.set(false);
//         this.cdr.detectChanges(); 
//         this.renderMilkingChartInstance();
//       })
//     ).subscribe({
//       next: ([eventsPayload]) => {
//         try {
//           console.log('All Events: ', eventsPayload);
//           this.syncHistoryLogs(eventsPayload?.items || []);
//         } catch (e) {
//           console.error("Pipeline breakdown processing events details:", e);
//         }
//       }
//     });
//   }

//   onPresetChange(duration: string) {
//     this.selectedPreset = duration;
//     this.calculatePresetDates(duration);
//     this.fetchChartDataPipeline();
//   }

//   private calculatePresetDates(preset: string) {
//     this.endDate = new Date();
//     this.startDate = new Date();

//     if (preset === '1day') {
//       this.startDate.setDate(this.endDate.getDate() - 1);
//     } else if (preset === '7days') {
//       this.startDate.setDate(this.endDate.getDate() - 7);
//     } else if (preset === '30days') {
//       this.startDate.setMonth(this.endDate.getMonth() - 1);
//       this.startDate.setHours(0, 0, 0, 0);
//     } else if (preset === '90days') {
//       this.startDate.setMonth(this.endDate.getMonth() - 3);
//       this.startDate.setHours(0, 0, 0, 0);
//     }
//     this.endDate.setHours(23, 59, 59, 999);
//   }

//   syncHistoryLogs(rawMilkingLogs?: any[]) {
//     if (!rawMilkingLogs || !Array.isArray(rawMilkingLogs)) {
//       this.processedMilkingEvents = [];
//       return;
//     }

//     // Determine current timestamp filters based on selected range parameters
//     const startMs = DateTime.fromJSDate(this.startDate || new Date()).startOf('day').valueOf();
//     const endMs = DateTime.fromJSDate(this.endDate || new Date()).endOf('day').valueOf();

//     // 1. Keep only elements that contain valid logs and fit inside your window boundaries
//     const filteredLogs = rawMilkingLogs.filter(log => {
//       if (!log || !log.occurredAt) return false;
//       const logMs = DateTime.fromISO(log.occurredAt).valueOf();
//       return logMs >= startMs && logMs <= endMs;
//     });

//     // 2. Sort chronologically so lines map seamlessly across the time axis scale
//     filteredLogs.sort((a, b) => DateTime.fromISO(a.occurredAt).valueOf() - DateTime.fromISO(b.occurredAt).valueOf());

//     // 3. Map values directly. We leave out non-existent days entirely instead of appending zeros.
//     this.processedMilkingEvents = filteredLogs.map(log => {
//       const dt = DateTime.fromISO(log.occurredAt);
//       const noonSlot = dt.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });

//       return {
//         x: noonSlot.valueOf(),
//         morningMilk: log.morningMilk || 0,
//         afternoonMilk: log.afternoonMilk || 0,
//         eveningMilk: log.eveningMilk || 0,
//         totalMilk: log.totalMilk || 0
//       };
//     });

//     console.log("🔥 Processed Milking Events (Skipped Missing Days):", this.processedMilkingEvents);
//   }

//   getProcessedPerformanceData() {
//     const dailyTotals: { dateStr: string; timestamp: number; totalYield: number }[] = [];
    
//     const uniqueDays = Array.from(new Set(this.processedMilkingEvents.map(e => 
//       DateTime.fromMillis(e.x).toFormat('yyyy-MM-dd')
//     )));

//     uniqueDays.forEach(dateStr => {
//       const dayPoints = this.processedMilkingEvents.filter(e => 
//         DateTime.fromMillis(e.x).toFormat('yyyy-MM-dd') === dateStr
//       );
      
//       const dayTotal = dayPoints.reduce((sum, p) => sum + (p.totalMilk || 0), 0);
      
//       dailyTotals.push({
//         dateStr,
//         timestamp: DateTime.fromISO(dateStr).valueOf(),
//         totalYield: dayTotal
//       });
//     });

//     dailyTotals.sort((a, b) => a.timestamp - b.timestamp);

//     return dailyTotals.map((currentDay, index, arr) => {
//       // Rolling average calculation now runs across the last 7 recorded entries seamlessly
//       const startIdx = Math.max(0, index - 6);
//       const subset = arr.slice(startIdx, index + 1);
//       const averageBaseline = subset.reduce((sum, d) => sum + d.totalYield, 0) / subset.length;

//       const deviationThreshold = averageBaseline * 0.85;
//       const isAnomalousDrop = currentDay.totalYield > 0 && currentDay.totalYield < deviationThreshold;

//       return {
//         ...currentDay,
//         baseline: Math.round(averageBaseline * 10) / 10, 
//         isAnomalousDrop
//       };
//     });
//   }
  
//   renderMilkingChartInstance() {
//     const canvas = this.milkingChartCanvas?.nativeElement;
//     if (!canvas) return;

//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     if (this.privateMilkingChartInstance) {
//       this.privateMilkingChartInstance.destroy();
//       this.privateMilkingChartInstance = null;
//     }

//     const chartData = this.getProcessedPerformanceData();
//     const pointColors = chartData.map(d => d.isAnomalousDrop ? '#ff4961' : '#3880ff');
//     const pointRadii = chartData.map(d => d.isAnomalousDrop ? 6 : 4);
//     const pointHoverRadii = chartData.map(d => d.isAnomalousDrop ? 8 : 6);

//     // Create a smooth vertical gradient under the main line for a premium look
//     const areaGradient = ctx.createLinearGradient(0, 0, 0, 220);
//     areaGradient.addColorStop(0, 'rgba(56, 128, 255, 0.14)');
//     areaGradient.addColorStop(1, 'rgba(56, 128, 255, 0.00)');

//     // Common typography styling to match system font stacks
//     const systemFont = {
//       family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
//       size: 11,
//       weight: '500' as const
//     };

//     this.privateMilkingChartInstance = new Chart(canvas, {
//       type: 'line',
//       data: {
//         datasets: [
//           {
//             label: 'Daily Yield',
//             data: chartData.map(d => ({ x: d.timestamp, y: d.totalYield })),
//             borderColor: '#3880ff',
//             borderWidth: 3,
//             tension: 0.35, // Smooth curves beautifully without creating unnatural loops
//             fill: true,
//             backgroundColor: areaGradient,
//             pointBackgroundColor: pointColors,
//             pointBorderColor: '#ffffff',
//             pointBorderWidth: 1.5,
//             pointRadius: pointRadii,
//             pointHoverRadius: pointHoverRadii,
//             pointHoverBackgroundColor: pointColors,
//             pointHoverBorderColor: '#ffffff',
//             pointHoverBorderWidth: 2,
//             order: 1 // Layer actual data on top of baseline
//           },
//           {
//             label: '7-Day Baseline',
//             data: chartData.map(d => ({ x: d.timestamp, y: d.baseline })),
//             borderColor: '#687484', // Neutral slate grey to de-emphasize vs main line
//             borderWidth: 1.5,
//             borderDash: [5, 5], // Elegant dashed indicator
//             fill: false,
//             pointRadius: 0, // Keeps line clean; dots are unnecessary here
//             pointHoverRadius: 0,
//             tension: 0.3,
//             order: 2
//           }
//         ]
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         layout: {
//           // Prevents extreme high/low data points or labels from getting cut off at canvas borders
//           padding: { top: 12, bottom: 4, left: 6, right: 14 }
//         },
//         scales: {
//           x: {
//             type: 'time',
//             time: {
//               unit: 'day',
//               displayFormats: { day: 'dd MMM' }
//             },
//             grid: {
//               display: false // Cleans up vertical lines to prioritize temporal flow
//             },
//             ticks: {
//               // font: systemFont,
//               color: '#8a94a6',
//               maxRotation: 0, // Keeps dates flat and easy to scan horizontally on mobile
//               autoSkip: true,
//               maxTicksLimit: 6
//             }
//           },
//           y: {
//             type: 'linear',
//             beginAtZero: true,
//             grace: '10%', // Automatically appends 10% ceiling headroom above your highest data point
//             grid: {
//               color: 'rgba(0, 0, 0, 0.04)', // Ultra-faint gridlines
//               tickLength: 0 // Removes ugly tick nubs extending from graph area
//             },
//             ticks: {
//               // font: systemFont,
//               color: '#8a94a6',
//               padding: 8,
//               callback: (value) => `${value}L`
//             }
//           }
//         },
//         plugins: {
//           legend: {
//             display: true,
//             position: 'top',
//             align: 'end', // Shifts legend cleanly to top-right corner
//             labels: {
//               boxWidth: 8,
//               boxHeight: 8,
//               usePointStyle: true, // Swaps out ugly square boxes for neat dots
//               pointStyle: 'circle',
//               // font: { ...systemFont, size: 12 },
//               color: '#444d56',
//               padding: 16
//             }
//           },
//           tooltip: {
//             enabled: true,
//             mode: 'index',
//             intersect: false,
//             backgroundColor: 'rgba(25, 30, 40, 0.95)', // Sleek dark-mode aesthetic toast
//             titleFont: { ...systemFont, size: 12, weight: 'bold' },
//             // bodyFont: systemFont,
//             padding: 12,
//             cornerRadius: 8,
//             caretSize: 6,
//             displayColors: true,
//             boxWidth: 6,
//             boxHeight: 6,
//             boxPadding: 6,
//             callbacks: {
//               title: (items) => {
//                 if (!items.length) return '';
//                 // Standardizes date rendering format at top of tooltips
//                 return DateTime.fromMillis(items[0].parsed.x).toFormat('cccc, dd LLL');
//               },
//               label: (context) => {
//                 const dataPoint = chartData[context.dataIndex];
//                 const rawValue = context.parsed.y;
                
//                 if (context.datasetIndex === 0) {
//                   const alertPrefix = dataPoint.isAnomalousDrop ? '⚠️ ' : '';
//                   return ` ${alertPrefix}Yield: ${rawValue.toFixed(1)} Liters`;
//                 }
//                 return ` Target: ${rawValue.toFixed(1)} Liters`;
//               }
//             }
//           }
//         }
//       }
//     });
//   }

//   private syncSelections() {
//     const selections = this.eventUtil.getSavedSelections();
//     if (selections) {
//       this.filter.targetPath = selections.targetPath || '';
//       this.filter.farmId = selections.farmId || '';
//     }
//   }

//   ngOnDestroy() { 
//     if (this.privateMilkingChartInstance) {
//       this.privateMilkingChartInstance.destroy();
//     }
//     this.subs.unsubscribe(); 
//     if (this.dataFetchSub) this.dataFetchSub.unsubscribe();
//   }

//   async loadManagedCounts() {
//     if (this.isLoading()) return;
//     this.isLoading.set(true);

//     try {
//       const hasFarm = this.filter.farmId && this.filter.farmId !== 'null' && this.filter.farmId !== 'undefined';
      
//       const res = await firstValueFrom(
//         this.apollo.query<any>({
//           query: DASHBOARD_ITEMS,
//           variables: {
//             filter: {
//               farmId: hasFarm ? this.filter.farmId : null,
//               targetPath: hasFarm ? null : (this.filter.targetPath || null),
//               startDate: this.filter.startDate || null,
//               endDate: this.filter.endDate || null
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
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//     async openDairyModal(type: string, entry?: any) {
//         const modal = await this.modalCtrl.create({
//           component: DairyModalComponent,
//           // 🌟 Pass data into the Modal component's @Input fields
//           componentProps: {
//             type: type,
//             entry: entry
//           }
//         });
    
//         await modal.present();
    
//         // 🌟 Listen for the response data payload when modal closes
//         const { data, role } = await modal.onDidDismiss();
    
//         if (role === 'confirm' && data?.updated) {
//           console.log('Received updated data from modal:', data);
//           this.refresh();
//           this.renderMilkingChartInstance();
//           // Trigger table refresh or update state here!
//         }
//       }
// }



import { ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { BehaviorSubject, Subscription, Observable, firstValueFrom, catchError, finalize, forkJoin, of } from "rxjs";
import { filter, take } from "rxjs/operators";
import { CommonModule } from "@angular/common";
import { 
  IonLabel, 
  IonItem, 
  IonContent, 
  IonImg, 
  IonProgressBar, 
  IonRow, 
  IonRefresher, 
  IonRefresherContent, 
  IonGrid, 
  IonCol, 
  IonRippleEffect, 
  IonCard, 
  IonSegmentButton, 
  IonSegment, 
  ModalController 
} from "@ionic/angular/standalone";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { Apollo } from "apollo-angular";
import { EventUtilityService } from "src/app/utils/event-util/event-util.service";
import { DASHBOARD_ITEMS } from "src/app/graphql/queries/dashboard.queries";
import { CountUpPipe } from "src/app/utils/pipes/count-up/count-up-pipe";
import { SystemService } from "src/app/services/system/system.service";
import { CattleMonitoringService } from "src/app/services/chms/chms.service";
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { DairyManagementService } from "src/app/services/dms/dms.service";

import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-luxon';
import { DateTime } from 'luxon';
import { DairyModalComponent } from "../../features/dms/dairy/dairy-modal/dairy-modal.component";

Chart.register(...registerables);
Chart.register(zoomPlugin);

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonSegment, 
    IonSegmentButton, 
    IonCard, 
    IonRippleEffect, 
    IonCol, 
    IonGrid, 
    IonRefresherContent, 
    IonRefresher, 
    IonRow, 
    IonProgressBar, 
    IonImg, 
    CommonModule, 
    FormsModule, 
    TranslateModule, 
    RouterModule, 
    IonLabel, 
    IonItem, 
    IonContent, 
    CountUpPipe, 
    SharedImportsModule
  ],
  standalone: true,
})
export class HomePage implements OnInit, OnDestroy {
  
  private modalCtrl = inject(ModalController);
  private systemService = inject(SystemService);
  private apollo = inject(Apollo);
  private eventUtil = inject(EventUtilityService);
  private chmsService = inject(CattleMonitoringService);
  private dmsService = inject(DairyManagementService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('milkingChartCanvas', { static: false }) milkingChartCanvas!: ElementRef<HTMLCanvasElement>;

  progress: number = 0;
  auth_user: any = null;
  isLoading = signal(false);

  startDate!: Date;
  endDate!: Date;
  today: Date = new Date();

  filter = {
    targetPath: '',
    farmId: '',
    search: '',
    startDate: '',
    endDate: '',
    eventType: null 
  };
  options = { limit: 100, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };

  selectedPreset: string = '7days';
  public processedMilkingEvents: any[] = [];
  private privateMilkingChartInstance: Chart | null = null;

  private dashboardData$ = new BehaviorSubject<any>(null);
  counts$: Observable<any> = this.dashboardData$.asObservable();

  private globalData$ = new BehaviorSubject<any>(null);
  globalCounts$: Observable<any> = this.globalData$.asObservable();

  private dataFetchSub!: Subscription;
  private subs = new Subscription();

  private router = inject(Router);
  private routerSub!: Subscription;

  ngOnInit() {
    this.initSyncs();

    // 💡 Listen to Router NavigationEnd: Fires EVERY time user lands on home!
    this.routerSub = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Check if current route is Home (or landed back on Home)
      if (event.urlAfterRedirects.includes('/landing/tabs/home')) {
        console.log('⚡ NavigationEnd detected: Refreshing HomePage...');
        this.reinitializeAndRefresh();
      }
    });

  }

// home.page.ts

handleRefresh(event: any) {
  // Re-fetch counts and chart pipeline
  this.loadManagedCounts();
  
  // Perform pipeline fetch
  if (this.dataFetchSub) {
    this.dataFetchSub.unsubscribe();
  }

  const hasFarm = this.filter.farmId && this.filter.farmId !== 'null';

  this.dataFetchSub = this.dmsService.getMilkingLogs({
    filter: {
      farmId: hasFarm ? this.filter.farmId : null,
      targetPath: hasFarm ? null : (this.filter.targetPath || null),
    }
  }).pipe(
    take(1),
    finalize(() => {
      // 💡 ALWAYS complete the event when the stream finishes or errors out
      event.target.complete();
      this.isLoading.set(false);
      this.cdr.detectChanges();
    })
  ).subscribe({
    next: (data) => {
      this.syncHistoryLogs(data?.items || []);
      this.renderMilkingChartInstance();
    },
    error: (err) => {
      console.error('Refresher failed:', err);
    }
  });
}

  /**
   * Ionic Lifecycle Hook:
   * Triggers EVERY time the route/page becomes active (initial load + returning navigation)
   */
  // ionViewWillEnter() {
    // this.reinitializeAndRefresh();
  // }

  // ✅ Use ionViewWillEnter — fires EVERY time navigation returns to Home:
  // ionViewWillEnter() {
  //   this.reinitializeAndRefresh();
  //   this.refresh();
  // }

  /**
   * Ionic Lifecycle Hook:
   * Fires after view entry animations finish — ideal for initial chart canvas mounting
   */
  ionViewDidEnter() {
    this.renderMilkingChartInstance();
  }

  /**
   * Ionic Lifecycle Hook:
   * Fires when navigating away — cleans up active Chart instances to free GPU/Memory
   */
  ionViewDidLeave() {
    this.destroyChartInstance();
  }

  ngOnDestroy() { 
    this.destroyChartInstance();
    this.subs.unsubscribe(); 
    if (this.dataFetchSub) this.dataFetchSub.unsubscribe();
  }

  /**
   * Reinitializes state & forces a full re-fetch of all component APIs & filters
   */
  private reinitializeAndRefresh() {
    const auth_user = localStorage.getItem('chms-dms.mobile.user');
    if (auth_user) this.auth_user = JSON.parse(auth_user);

    this.syncSelections();
    
    // Reset parameters back to default ranges
    this.calculatePresetDates(this.selectedPreset);
    this.filter.startDate = this.startDate.toISOString();
    this.filter.endDate = this.endDate.toISOString();

    // Trigger API calls
    this.refresh();
  }

  refresh() {
    this.loadManagedCounts();
    this.fetchChartDataPipeline();
  }

  setRange(months: number) {
    const range = this.eventUtil.calculateRange(months);
    this.filter.startDate = range.start;
    this.filter.endDate = range.end;

    this.startDate = range.start ? new Date(range.start) : new Date();
    this.endDate = range.end ? new Date(range.end) : new Date();

    this.refresh();
  }

  private initSyncs() {
    this.subs.add(this.systemService.selectionChanged$.subscribe(() => {
      this.syncSelections();
      this.refresh();
    }));
  }

  fetchChartDataPipeline() {
    if (this.dataFetchSub) {
      this.dataFetchSub.unsubscribe();
    }

    this.isLoading.set(true);
    this.cdr.detectChanges(); 

    const hasFarm = this.filter.farmId && this.filter.farmId !== 'null' && this.filter.farmId !== 'undefined';

    const allEvents$ = this.dmsService.getMilkingLogs({
      filter: {
        farmId: hasFarm ? this.filter.farmId : null,
        targetPath: hasFarm ? null : (this.filter.targetPath || null),
      },
    }).pipe(take(1), catchError(() => of({ items: [] })));

    this.dataFetchSub = forkJoin([allEvents$]).pipe(
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.detectChanges(); 
        this.renderMilkingChartInstance();
      })
    ).subscribe({
      next: ([eventsPayload]) => {
        try {
          this.syncHistoryLogs(eventsPayload?.items || []);
        } catch (e) {
          console.error("Pipeline breakdown processing events details:", e);
        }
      }
    });
  }

  onPresetChange(duration: string) {
    this.selectedPreset = duration;
    this.calculatePresetDates(duration);
    this.fetchChartDataPipeline();
  }

  private calculatePresetDates(preset: string) {
    this.endDate = new Date();
    this.startDate = new Date();

    if (preset === '1day') {
      this.startDate.setDate(this.endDate.getDate() - 1);
    } else if (preset === '7days') {
      this.startDate.setDate(this.endDate.getDate() - 7);
    } else if (preset === '30days') {
      this.startDate.setMonth(this.endDate.getMonth() - 1);
      this.startDate.setHours(0, 0, 0, 0);
    } else if (preset === '90days') {
      this.startDate.setMonth(this.endDate.getMonth() - 3);
      this.startDate.setHours(0, 0, 0, 0);
    }
    this.endDate.setHours(23, 59, 59, 999);
  }

  syncHistoryLogs(rawMilkingLogs?: any[]) {
    if (!rawMilkingLogs || !Array.isArray(rawMilkingLogs)) {
      this.processedMilkingEvents = [];
      return;
    }

    const startMs = DateTime.fromJSDate(this.startDate || new Date()).startOf('day').valueOf();
    const endMs = DateTime.fromJSDate(this.endDate || new Date()).endOf('day').valueOf();

    const filteredLogs = rawMilkingLogs.filter(log => {
      if (!log || !log.occurredAt) return false;
      const logMs = DateTime.fromISO(log.occurredAt).valueOf();
      return logMs >= startMs && logMs <= endMs;
    });

    filteredLogs.sort((a, b) => DateTime.fromISO(a.occurredAt).valueOf() - DateTime.fromISO(b.occurredAt).valueOf());

    this.processedMilkingEvents = filteredLogs.map(log => {
      const dt = DateTime.fromISO(log.occurredAt);
      const noonSlot = dt.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });

      return {
        x: noonSlot.valueOf(),
        morningMilk: log.morningMilk || 0,
        afternoonMilk: log.afternoonMilk || 0,
        eveningMilk: log.eveningMilk || 0,
        totalMilk: log.totalMilk || 0
      };
    });
  }

  getProcessedPerformanceData() {
    const dailyTotals: { dateStr: string; timestamp: number; totalYield: number }[] = [];
    
    const uniqueDays = Array.from(new Set(this.processedMilkingEvents.map(e => 
      DateTime.fromMillis(e.x).toFormat('yyyy-MM-dd')
    )));

    uniqueDays.forEach(dateStr => {
      const dayPoints = this.processedMilkingEvents.filter(e => 
        DateTime.fromMillis(e.x).toFormat('yyyy-MM-dd') === dateStr
      );
      
      const dayTotal = dayPoints.reduce((sum, p) => sum + (p.totalMilk || 0), 0);
      
      dailyTotals.push({
        dateStr,
        timestamp: DateTime.fromISO(dateStr).valueOf(),
        totalYield: dayTotal
      });
    });

    dailyTotals.sort((a, b) => a.timestamp - b.timestamp);

    return dailyTotals.map((currentDay, index, arr) => {
      const startIdx = Math.max(0, index - 6);
      const subset = arr.slice(startIdx, index + 1);
      const averageBaseline = subset.reduce((sum, d) => sum + d.totalYield, 0) / subset.length;

      const deviationThreshold = averageBaseline * 0.85;
      const isAnomalousDrop = currentDay.totalYield > 0 && currentDay.totalYield < deviationThreshold;

      return {
        ...currentDay,
        baseline: Math.round(averageBaseline * 10) / 10, 
        isAnomalousDrop
      };
    });
  }
  
  private destroyChartInstance() {
    if (this.privateMilkingChartInstance) {
      this.privateMilkingChartInstance.destroy();
      this.privateMilkingChartInstance = null;
    }
  }

  renderMilkingChartInstance() {
    const canvas = this.milkingChartCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.destroyChartInstance();

    const chartData = this.getProcessedPerformanceData();
    const pointColors = chartData.map(d => d.isAnomalousDrop ? '#ff4961' : '#3880ff');
    const pointRadii = chartData.map(d => d.isAnomalousDrop ? 6 : 4);
    const pointHoverRadii = chartData.map(d => d.isAnomalousDrop ? 8 : 6);

    const areaGradient = ctx.createLinearGradient(0, 0, 0, 220);
    areaGradient.addColorStop(0, 'rgba(56, 128, 255, 0.14)');
    areaGradient.addColorStop(1, 'rgba(56, 128, 255, 0.00)');

    const systemFont = {
      family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      size: 11,
      weight: '500' as const
    };

    this.privateMilkingChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Daily Yield',
            data: chartData.map(d => ({ x: d.timestamp, y: d.totalYield })),
            borderColor: '#3880ff',
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            backgroundColor: areaGradient,
            pointBackgroundColor: pointColors,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: pointRadii,
            pointHoverRadius: pointHoverRadii,
            pointHoverBackgroundColor: pointColors,
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
            order: 1
          },
          {
            label: '7-Day Baseline',
            data: chartData.map(d => ({ x: d.timestamp, y: d.baseline })),
            borderColor: '#687484',
            borderWidth: 1.5,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.3,
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 12, bottom: 4, left: 6, right: 14 }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: { day: 'dd MMM' }
            },
            grid: {
              display: false
            },
            ticks: {
              color: '#8a94a6',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6
            }
          },
          y: {
            type: 'linear',
            beginAtZero: true,
            grace: '10%',
            grid: {
              color: 'rgba(0, 0, 0, 0.04)',
              tickLength: 0
            },
            ticks: {
              color: '#8a94a6',
              padding: 8,
              callback: (value) => `${value}L`
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#444d56',
              padding: 16
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(25, 30, 40, 0.95)',
            titleFont: { ...systemFont, size: 12, weight: 'bold' },
            padding: 12,
            cornerRadius: 8,
            caretSize: 6,
            displayColors: true,
            boxWidth: 6,
            boxHeight: 6,
            boxPadding: 6,
            callbacks: {
              title: (items) => {
                if (!items.length) return '';
                return DateTime.fromMillis(items[0].parsed.x).toFormat('cccc, dd LLL');
              },
              label: (context) => {
                const dataPoint = chartData[context.dataIndex];
                const rawValue = context.parsed.y;
                
                if (context.datasetIndex === 0) {
                  const alertPrefix = dataPoint.isAnomalousDrop ? '⚠️ ' : '';
                  return ` ${alertPrefix}Yield: ${rawValue.toFixed(1)} Liters`;
                }
                return ` Target: ${rawValue.toFixed(1)} Liters`;
              }
            }
          }
        }
      }
    });
  }

  private syncSelections() {
    const selections = this.eventUtil.getSavedSelections();
    if (selections) {
      this.filter.targetPath = selections.targetPath || '';
      this.filter.farmId = selections.farmId || '';
    }
  }

  async loadManagedCounts() {
    this.isLoading.set(true);

    try {
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
          fetchPolicy: 'network-only' // Guarantees fresh server data without caching
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

  async openDairyModal(type: string, entry?: any) {
    const modal = await this.modalCtrl.create({
      component: DairyModalComponent,
      componentProps: {
        type: type,
        entry: entry
      }
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data?.updated) {
      this.refresh();
      this.renderMilkingChartInstance();
    }
  }
}