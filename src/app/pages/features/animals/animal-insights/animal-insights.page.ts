import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, finalize, take } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-luxon';
import { IonBackButton, IonNote, IonSegment, IonSegmentButton, IonGrid, IonRow, IonCol, IonCard, IonProgressBar, IonRange, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { DateTime } from 'luxon';
import { AnimalService } from 'src/app/services/animal/animal.service';
import { DairyManagementService } from 'src/app/services/dms/dms.service';

Chart.register(...registerables);
Chart.register(zoomPlugin);

@Component({
  selector: 'app-animals-insight',
  templateUrl: './animal-insights.page.html',
  styleUrls: ['./animal-insights.page.scss'],
  standalone: true,
  imports: [IonCardContent, IonCardTitle, IonCardHeader, IonRange, IonProgressBar, SharedImportsModule, IonBackButton, IonSegment, IonSegmentButton, IonNote, IonGrid, IonRow, IonCol, IonCard]
})
export class AnimalInsightsPage implements OnInit, OnDestroy {
  @ViewChild('myChartCanvas', { static: false }) myChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('milkingChartCanvas', { static: false }) milkingChartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly MILK_FILTER_CACHE_KEY = 'animal_insights_milk_preset';

  deviceNo: string | null = null;
  animalId: string | null = null;
  tagNo: string | null = null;

  selectedSegment: string = 'summary';

  selectedPreset: string = '7days';

  // selectedMilkPreset: string = '7days';

  isLoading: boolean = false;
  activitySubtitleText: string = 'Activities [per 1h]';
  private currentTimeUnitText: string = '1h';

  startDate!: Date;
  endDate!: Date;
  today: Date = new Date();
  maxStartDate: string = new Date().toISOString().split('T')[0];
  fixedMaxDate: string = new Date().toISOString().split('T')[0];

  //   milkStartDate!: Date;
  // milkEndDate!: Date;

  activeDatasets: boolean[] = [true, true, true, true, true, true, true, true];

  predefinedRangeLabels = [
    { id: '24h', label: 'Last 24 hours' },
    { id: 'thisWeek', label: 'This week' },
    { id: 'prevWeek', label: 'Previous week' },
    { id: 'thisMonth', label: 'This month' },
    { id: 'prevMonth', label: 'Previous month' },
    { id: 'last30', label: 'Last 30 days' },
    { id: 'last12m', label: 'Last 12 month' }
  ];

  // 1. Put this near your existing @ViewChild declaration

  // 2. Add a new tracking array and chart instance variable
  public processedMilkingEvents: any[] = [];
  private privateMilkingChartInstance: any = null;

  public processedChartData: any[] = [];
  public allEvents: any[] = [];

  // Dedicated arrays to map independent timestamps directly onto the time-scale
  public processedHeatEvents: any[] = [];
  public processedHealthEvents: any[] = [];

  animal: any;

  private garbageCollectorSub: Subscription = new Subscription();
  private dataFetchSub!: Subscription;
  private privateChartInstance: any = null;

  selectedMilkPreset: string = '7days';
  milkStartDate: Date = new Date();
  milkEndDate: Date = new Date();
  isMilkLoading: boolean = false;
  private milkDataFetchSub?: Subscription;

  showAllEvents: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private animalService: AnimalService,
    private dmsService: DairyManagementService,
    private location: Location,
    private cdr: ChangeDetectorRef,
  ) {
    this.calculatePresetDates(this.selectedPreset);
  }

  // ngOnInit() {
  //   this.today = new Date();
  // this.applyPresetRange('last30');

  //   this.selectedMilkPreset = this.loadMilkFilterConfigFromCache();
  //   this.calculateMilkPresetDates(this.selectedMilkPreset);

  //   this.garbageCollectorSub.add(
  //     this.activatedRoute.paramMap.subscribe((params) => {
  //       this.animalId = params.get('id');
  //       this.tagNo = params.get('tagNo');
  //       const matrixDeviceNo = params.get('deviceNo');

  //       if (matrixDeviceNo) {
  //         this.deviceNo = matrixDeviceNo;
  //         this.loadCachedFilterConfig();
  //         this.fetchChartDataPipeline();
  //       } else {
  //         console.error("Critical failure: 'deviceNo' parameter missing from route sequence.", params);
  //       }
  //     })
  //   );
  // }


  ngOnInit() {
    this.today = new Date();

    // 1. Prepare Milk Preset & Dates
    this.selectedMilkPreset = this.loadMilkFilterConfigFromCache();
    this.calculateMilkPresetDates(this.selectedMilkPreset);

    this.garbageCollectorSub.add(
      this.activatedRoute.paramMap.subscribe((params) => {
        this.animalId = params.get('id');
        this.tagNo = params.get('tagNo');
        const matrixDeviceNo = params.get('deviceNo');

        // 2. Fetch Milk Data (depends on animalId)
        if (this.animalId) {
          this.fetchMilkChartDataPipeline();
        }

        // 3. Fetch Activity Data (depends on deviceNo)
        if (matrixDeviceNo) {
          this.deviceNo = matrixDeviceNo;
          this.loadCachedFilterConfig();
          this.fetchChartDataPipeline();
        } else {
          console.error("Critical failure: 'deviceNo' parameter missing from route sequence.", params);
        }
      })
    );
  }

  ionViewDidEnter() {
    // This is the most reliable event in Ionic to render native components
    if (this.selectedSegment === 'summary') {
      this.renderChartInstance();
      this.renderMilkingChartInstance();
    }
  }

  ngOnDestroy() {
    this.garbageCollectorSub.unsubscribe();
    if (this.dataFetchSub) this.dataFetchSub.unsubscribe();
    const tooltipEl = document.querySelector("div.custom-chart-tooltip");
    if (tooltipEl) tooltipEl.remove();
  }

  // applyPresetRange(presetId: string, modalInstance?: any) {
  //   this.selectedPreset = presetId;
  //   const now = DateTime.local();

  //   switch (presetId) {
  //     case '24h':
  //       this.startDate = now.minus({ hours: 24 }).toJSDate();
  //       this.endDate = now.toJSDate();
  //       break;
  //     case 'thisWeek':
  //       this.startDate = now.startOf('week').toJSDate();
  //       this.endDate = now.endOf('week').toJSDate();
  //       break;
  //     case 'prevWeek':
  //       this.startDate = now.minus({ weeks: 1 }).startOf('week').toJSDate();
  //       this.endDate = now.minus({ weeks: 1 }).endOf('week').toJSDate();
  //       break;
  //     case 'thisMonth':
  //       this.startDate = now.startOf('month').toJSDate();
  //       this.endDate = now.endOf('month').toJSDate();
  //       break;
  //     case 'prevMonth':
  //       this.startDate = now.minus({ months: 1 }).startOf('month').toJSDate();
  //       this.endDate = now.minus({ months: 1 }).endOf('month').toJSDate();
  //       break;
  //     case 'last30':
  //       this.startDate = now.minus({ days: 30 }).toJSDate();
  //       this.endDate = now.toJSDate();
  //       break;
  //     case 'last12m':
  //       this.startDate = now.minus({ months: 12 }).startOf('month').toJSDate();
  //       this.endDate = now.endOf('month').toJSDate();
  //       break;
  //   }

  //   this.fetchChartDataPipeline();

  //   if (modalInstance) {
  //     modalInstance.dismiss();
  //   }
  // }


  // ==========================================
  // 1. ANIMAL / BEHAVIOR CHART PIPELINE
  // ==========================================

  // onPresetChange(duration: string) {
  //   this.selectedPreset = duration;
  //   this.calculatePresetDates(duration);
  //   this.saveFilterConfigToCache();
  //   this.fetchActivityChartDataPipeline();
  // }

  onMilkPresetChange(duration: string) {
    this.selectedMilkPreset = duration;
    this.calculateMilkPresetDates(duration);
    // Line removed
    this.fetchMilkChartDataPipeline();
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

  fetchActivityChartDataPipeline() {
    if (!this.deviceNo) {
      this.isLoading = false;
      return;
    }

    if (this.dataFetchSub) {
      this.dataFetchSub.unsubscribe();
    }

    this.isLoading = true;
    this.cdr.detectChanges(); // Force UI spinner

    const fromTime = DateTime.fromJSDate(this.startDate).toISO() || this.startDate.toISOString();
    const toTime = DateTime.fromJSDate(this.endDate).toISO() || this.endDate.toISOString();
    const currentDiffDays = this.calculateDiffDays();

    let timeBucket = '1d';
    if (currentDiffDays <= 2) {
      timeBucket = '1h';
    } else if (currentDiffDays <= 8) {
      timeBucket = '6h';
    }

    const chartData$ = this.animalService.getAnimalChartDatasets(this.deviceNo, fromTime, toTime, timeBucket)
      .pipe(
        take(1),
        catchError((err) => {
          console.error("❌ [API Error] Chart Service Execution Failed:", err);
          return of([]);
        })
      );

    const animalData$ = this.animalId
      ? this.animalService.getAnimal(this.animalId).pipe(take(1), catchError(() => of(null)))
      : of(null);

    const historyEvents$ = this.animalId
      ? this.animalService.getAnimalEvents({ targetPath: this.animalId }, { limit: 1000 }).pipe(take(1), catchError(() => of({ items: [] })))
      : of({ items: [] });

    this.dataFetchSub = forkJoin([chartData$, animalData$, historyEvents$]).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();

        if (this.selectedSegment === 'summary') {
          setTimeout(() => {
            this.renderChartInstance();
          }, 100);
        }
      })
    ).subscribe({
      next: ([chartPackets, animalMeta, eventPayload]) => {
        try {
          this.transformBackendPackets(chartPackets || []);
        } catch (e) {
          console.error(e);
        }

        if (animalMeta) {
          this.animal = animalMeta;
        }

        try {
          this.syncActivityHistoryLogs(eventPayload?.items || []);
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  // ==========================================
  // 2. MILK CHART PIPELINE (DEDICATED)
  // ==========================================

  // onMilkPresetChange(duration: string) {
  //   this.selectedMilkPreset = duration;
  //   this.calculateMilkPresetDates(duration);
  //   this.saveMilkFilterConfigToCache();
  //   this.fetchMilkChartDataPipeline();
  // }

  /**
   * Persists the selected milk preset to localStorage
   */
  private saveMilkFilterConfigToCache() {
    try {
      localStorage.setItem(this.MILK_FILTER_CACHE_KEY, this.selectedMilkPreset);
    } catch (err) {
      console.warn('Could not save milk filter config to cache:', err);
    }
  }

  /**
   * Restores the cached milk preset on component initialization
   */
  private loadMilkFilterConfigFromCache(): string {
    try {
      return localStorage.getItem(this.MILK_FILTER_CACHE_KEY) || '7days';
    } catch (err) {
      console.warn('Could not read milk filter config from cache:', err);
      return '30days';
    }
  }

  private calculateMilkPresetDates(preset: string) {
    this.milkEndDate = new Date();
    this.milkStartDate = new Date();

    if (preset === '7days') {
      this.milkStartDate.setDate(this.milkEndDate.getDate() - 7);
    } else if (preset === '30days') {
      this.milkStartDate.setMonth(this.milkEndDate.getMonth() - 1);
      this.milkStartDate.setHours(0, 0, 0, 0);
    } else if (preset === '90days') {
      this.milkStartDate.setMonth(this.milkEndDate.getMonth() - 3);
      this.milkStartDate.setHours(0, 0, 0, 0);
    }
    this.milkEndDate.setHours(23, 59, 59, 999);
  }

  fetchMilkChartDataPipeline() {
    if (!this.animalId) {
      return;
    }

    if (this.milkDataFetchSub) {
      this.milkDataFetchSub.unsubscribe();
    }

    this.isMilkLoading = true;
    this.cdr.detectChanges();

    const fromTime = DateTime.fromJSDate(this.milkStartDate).toISO() || this.milkStartDate.toISOString();
    const toTime = DateTime.fromJSDate(this.milkEndDate).toISO() || this.milkEndDate.toISOString();

    this.milkDataFetchSub = this.dmsService.getMilkingLogs({
      targetPath: this.animalId,
      from: fromTime,
      to: toTime
    }).pipe(
      take(1),
      catchError((err) => {
        console.error("❌ [API Error] Milking Service Execution Failed:", err);
        return of({ items: [] });
      }),
      finalize(() => {
        this.isMilkLoading = false;
        this.cdr.detectChanges();

        if (this.selectedSegment === 'summary') {
          setTimeout(() => {
            this.renderMilkingChartInstance();
          }, 100);
        }
      })
    ).subscribe({
      next: (milkingPayload) => {
        try {
          this.syncMilkingHistoryLogs(milkingPayload?.items || []);


        } catch (e) {
          console.error(e);
        }
      }
    });
  }


  // Handler for Milk Chart preset switch
  // onMilkPresetChange(preset: string) {
  //   this.selectedMilkPreset = preset;
  // }

  // onStartDateChanged(event: any, popoverInstance: any) {
  //   const value = event.detail.value;
  //   if (value) {
  //     let selectedStart = new Date(value);
  //     if (selectedStart > this.today) {
  //       selectedStart = new Date(this.today);
  //     }
  //     if (selectedStart > this.endDate) {
  //       this.endDate = new Date(selectedStart);
  //     }
  //     this.startDate = selectedStart;
  //     this.selectedPreset = 'custom';
  //     this.fetchChartDataPipeline();
  //     popoverInstance.dismiss();
  //   }
  // }

  // onEndDateChanged(event: any, popoverInstance: any) {
  //   const value = event.detail.value;
  //   if (value) {
  //     let selectedEnd = new Date(value);
  //     if (selectedEnd > this.today) {
  //       selectedEnd = new Date(this.today);
  //     }
  //     if (selectedEnd < this.startDate) {
  //       this.startDate = new Date(selectedEnd);
  //     }
  //     this.endDate = selectedEnd;
  //     this.selectedPreset = 'custom';
  //     this.fetchChartDataPipeline();
  //     popoverInstance.dismiss();
  //   }
  // }

  getISODateString(date: Date): string {
    return DateTime.fromJSDate(date).toISO() || '';
  }

  private saveFilterConfigToCache() {
    if (!this.deviceNo) return;
    const cachePayload = {
      selectedPreset: this.selectedPreset,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
      activeDatasets: this.activeDatasets
    };
    localStorage.setItem(`chms_insight_cache_device_${this.deviceNo}`, JSON.stringify(cachePayload));
  }

  private loadCachedFilterConfig() {
    if (!this.deviceNo) return;
    const cachedItem = localStorage.getItem(`chms_insight_cache_device_${this.deviceNo}`);
    if (cachedItem) {
      const config = JSON.parse(cachedItem);
      this.selectedPreset = config.selectedPreset || '7days';
      this.startDate = new Date(config.startDate);
      this.endDate = new Date(config.endDate);
      this.activeDatasets = config.activeDatasets || [true, true, true, true, true, true, true, true];
    }
  }

  onPickerDateChanged(event: { startDate: any; endDate: any } | null) {
    if (event && event.startDate && event.endDate) {
      this.startDate = event.startDate.toDate();
      this.endDate = event.endDate.toDate();
      this.selectedPreset = 'custom';
      this.fetchChartDataPipeline();
    }
  }

  // stepDateRange(direction: number) {
  //   const start = DateTime.fromJSDate(this.startDate);
  //   const end = DateTime.fromJSDate(this.endDate);
  //   const durationDays = Math.abs(end.diff(start, 'days').days);
  //   const shiftAmount = Math.max(Math.round(durationDays), 1);

  //   if (direction > 0) {
  //     this.startDate = start.plus({ days: shiftAmount }).toJSDate();
  //     this.endDate = end.plus({ days: shiftAmount }).toJSDate();
  //   } else {
  //     this.startDate = start.minus({ days: shiftAmount }).toJSDate();
  //     this.endDate = end.minus({ days: shiftAmount }).toJSDate();
  //   }

  //   this.selectedPreset = 'custom';
  //   this.fetchChartDataPipeline();
  // }

  onPresetChange(duration: string) {
    this.selectedPreset = duration;
    this.calculatePresetDates(duration);
    this.saveFilterConfigToCache();
    this.fetchChartDataPipeline();
  }

  // private calculatePresetDates(preset: string) {
  //   this.endDate = new Date();
  //   this.startDate = new Date();

  //   if (preset === '1day') {
  //     this.startDate.setDate(this.endDate.getDate() - 1);
  //   } else if (preset === '7days') {
  //     this.startDate.setDate(this.endDate.getDate() - 7);
  //   } else if (preset === '30days') {
  //     this.startDate.setMonth(this.endDate.getMonth() - 1);
  //     this.startDate.setHours(0, 0, 0, 0);
  //   } else if (preset === '90days') {
  //     this.startDate.setMonth(this.endDate.getMonth() - 3);
  //     this.startDate.setHours(0, 0, 0, 0);
  //   }
  //   this.endDate.setHours(23, 59, 59, 999);
  // }

  fetchChartDataPipeline() {
    if (!this.deviceNo) {
      this.isLoading = false;
      return;
    }

    if (this.dataFetchSub) {
      this.dataFetchSub.unsubscribe();
    }

    this.isLoading = true;
    this.cdr.detectChanges(); // <-- FORCE UI TO SHOW SPINNER IMMEDIATELY

    const fromTime = DateTime.fromJSDate(this.startDate).toISO() || this.startDate.toISOString();
    const toTime = DateTime.fromJSDate(this.endDate).toISO() || this.endDate.toISOString();
    const currentDiffDays = this.calculateDiffDays();

    let timeBucket = '1d';
    if (currentDiffDays <= 2) {
      timeBucket = '1h';
    } else if (currentDiffDays <= 8) {
      timeBucket = '6h';
    }

    const chartData$ = this.animalService.getAnimalChartDatasets(this.deviceNo, fromTime, toTime, timeBucket)
      .pipe(
        take(1),
        catchError((err) => {
          console.error("❌ [API Error] Chart Service Execution Failed:", err);
          return of([]);
        })
      );

    const animalData$ = this.animalId ? this.animalService.getAnimal(this.animalId).pipe(take(1), catchError(() => of(null))) : of(null);

    const historyEvents$ = this.animalId ? this.animalService.getAnimalEvents({ targetPath: this.animalId }, { limit: 1000 }).pipe(take(1), catchError(() => of({ items: [] }))) : of({ items: [] });

    const milkingEvents$ = this.animalId ? this.dmsService.getMilkingLogs({ targetPath: this.animalId }).pipe(take(1), catchError(() => of({ items: [] }))) : of({ items: [] });

    this.dataFetchSub = forkJoin([chartData$, animalData$, historyEvents$, milkingEvents$]).pipe(
      finalize(() => {
        this.isLoading = false;

        this.cdr.detectChanges(); // <-- FORCE UI TO HIDE SPINNER

        if (this.selectedSegment === 'summary') {
          // Use a short delay to ensure DOM element is painted
          setTimeout(() => {
            this.renderChartInstance();
            this.renderMilkingChartInstance();
          }, 100);
        }
      })
    ).subscribe({
      next: ([chartPackets, animalMeta, eventPayload, milkingPayload]) => {
        try { this.transformBackendPackets(chartPackets || []); } catch (e) { console.error(e); }
        if (animalMeta) {
          this.animal = animalMeta;
        }

        // Update this line to pass both payloads to sync down seamlessly
        try {

          // this.syncHistoryLogs(eventPayload?.items || [], milkingPayload?.items || []);

          // With a fallback check:
          const rawEvents = Array.isArray(eventPayload)
            ? eventPayload
            : (eventPayload?.items || eventPayload?.data || []);

          this.syncActivityHistoryLogs(rawEvents);

        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  toggleShowMore() {
    this.showAllEvents = !this.showAllEvents;
  }

  onDateRangeChange(isStartField: boolean, eventValue: any) {
    if (!eventValue) return;
    const cleanString = Array.isArray(eventValue) ? eventValue[0] : eventValue;
    let parsedTime = DateTime.fromISO(cleanString);
    if (!parsedTime.isValid) return;

    if (isStartField) {
      this.startDate = parsedTime.startOf('day').toJSDate();
      if (this.startDate > this.endDate) {
        this.endDate = DateTime.fromJSDate(this.startDate).endOf('day').toJSDate();
      }
    } else {
      this.endDate = parsedTime.endOf('day').toJSDate();
      if (this.endDate < this.startDate) {
        this.startDate = DateTime.fromJSDate(this.endDate).startOf('day').toJSDate();
      }
    }

    this.selectedPreset = 'custom';
    this.saveFilterConfigToCache();
    this.fetchChartDataPipeline();
  }

  // transformBackendPackets(rawPackets: any[]) {
  //   this.processedChartData = rawPackets
  //     .map((packet) => {
  //       const rawTimeSource = packet["timestamp"];
  //       if (!rawTimeSource) return null;

  //       let dateTimeObj = DateTime.fromISO(rawTimeSource);
  //       if (!dateTimeObj.isValid) {
  //         dateTimeObj = DateTime.fromJSDate(new Date(rawTimeSource));
  //       }

  //       return {
  //         isoX: dateTimeObj.toISO(),
  //         activity: {
  //           feeding: packet["feeding"] ?? packet["hourTotalFeedingActivity"] ?? null,
  //           rumination: packet["ruminating"] ?? packet["hourTotalRuminatingActivity"] ?? null,
  //           standing: packet["standing"] ?? packet["hourTotalStandingActivity"] ?? null,
  //           resting: packet["resting"] ?? packet["hourTotalRestingActivity"] ?? null,
  //           other: packet["other"] ?? packet["hourTotalOtherActivity"] ?? null,
  //           lying: packet["lying"] ?? packet["hourTotalLyingActivity"] ?? null,
  //         }
  //       };
  //     })
  //     .filter(item => item !== null)
  //     .reduce((acc: any[], current: any) => {
  //       const xDuplicate = acc.find(item => item.isoX === current.isoX);
  //       if (!xDuplicate) {
  //         acc.push(current);
  //       } else {
  //         Object.assign(xDuplicate.activity, current.activity);
  //       }
  //       return acc;
  //     }, [])
  //     .sort((x, y) => x.isoX.localeCompare(y.isoX));
  // }

  // syncHistoryLogs(rawLogs: any[], rawMilkingLogs?: any[]) {

  //   // 🔍 DEBUG LOGS: Let's see what is actually arriving at the function entry point
  //   console.log("📥 syncHistoryLogs entry - rawLogs length:", rawLogs?.length);
  //   console.log("📥 syncHistoryLogs entry - rawMilkingLogs:", rawMilkingLogs);
  //   console.log("🔍 Current Page Animal ID tracking state:", this.animalId);


  //   if (!Array.isArray(rawLogs)) {
  //     this.allEvents = [];
  //     this.processedHeatEvents = [];
  //     this.processedHealthEvents = [];
  //     return;
  //   }

  //   // 1. Determine the active time-bucket rule matching your current view
  //   const currentDiffDays = this.calculateDiffDays();
  //   let currentBucket: '1h' | '6h' | '1d' = '1d';
  //   if (currentDiffDays <= 2) {
  //     currentBucket = '1h';
  //   } else if (currentDiffDays <= 8) {
  //     currentBucket = '6h';
  //   }

  //   // Helper utility to floor custom event timestamps into clean matching bucket boundaries
  //   const snapToBucketWindow = (isoString: string, bucket: '1h' | '6h' | '1d'): string => {
  //     let dt = DateTime.fromISO(isoString);
  //     if (bucket === '1h') {
  //       return dt.startOf('hour').toISO() || isoString;
  //     } else if (bucket === '6h') {
  //       const currentHour = dt.hour;
  //       const snappedHour = currentHour - (currentHour % 6);
  //       return dt.set({ hour: snappedHour, minute: 0, second: 0, millisecond: 0 }).toISO() || isoString;
  //     } else {
  //       return dt.startOf('day').toISO() || isoString;
  //     }
  //   };

  //   const heatEventMap = new Map<string, number>();
  //   const healthEventMap = new Map<string, number>();

  //   // --- 1. Map Raw Milking Data by Date String ---
  //   const milkingMap = new Map<string, { morning: number; afternoon: number; evening: number; total: number }>();

  //   if (rawMilkingLogs && Array.isArray(rawMilkingLogs)) {
  //     rawMilkingLogs.forEach(log => {
  //       if (!log || !log.occurredAt) return;
  //       if (this.animalId && log.animal?.id !== this.animalId) return;

  //       const logDateKey = DateTime.fromISO(log.occurredAt).toFormat('yyyy-MM-dd');

  //       milkingMap.set(logDateKey, {
  //         morning: log.morningMilk || 0,
  //         afternoon: log.afternoonMilk || 0,
  //         evening: log.eveningMilk || 0,
  //         total: log.totalMilk || 0
  //       });
  //     });
  //   }

  //   // --- 2. Calculate the 7-Day Rolling Baseline (Skipping Unrecorded Gaps) ---
  //   const baselineMap = new Map<string, { baseline: number; isAnomalousDrop: boolean }>();
  //   const chronologicalDays = Array.from(milkingMap.entries())
  //     .map(([dateKey, metrics]) => ({ dateKey, ...metrics }))
  //     .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  //   chronologicalDays.forEach((currentDay, index) => {
  //     // Grab up to the last 7 recorded entries sequentially
  //     const startIdx = Math.max(0, index - 6);
  //     const activeWindow = chronologicalDays.slice(startIdx, index + 1);

  //     const totalVolumeInWindow = activeWindow.reduce((sum, day) => sum + day.total, 0);
  //     const runningAverage = totalVolumeInWindow / activeWindow.length;

  //     // Flag a drop if today's yield is less than 85% of her rolling average
  //     // We only run this if she has at least some historical baseline data context (index > 0)
  //     const isAnomalous = index > 0 && currentDay.total < (runningAverage * 0.85);

  //     baselineMap.set(currentDay.dateKey, {
  //       baseline: runningAverage,
  //       isAnomalousDrop: isAnomalous
  //     });
  //   });

  //   // --- 3. Align & Map Across the Active Multi-Bucket Timeline ---
  //   this.processedMilkingEvents = this.processedChartData.map(timelinePoint => {
  //     const timeKeyStr = timelinePoint.isoX;
  //     const dt = DateTime.fromISO(timeKeyStr);
  //     const timelineDateKey = dt.toFormat('yyyy-MM-dd');
  //     const xTimestamp = dt.valueOf();

  //     const milkData = milkingMap.get(timelineDateKey);
  //     const baselineData = baselineMap.get(timelineDateKey);

  //     // FIX: If the layout bucket is '1d', look for midnight (0). If '1h'/'6h', look for noon (12).
  //     // This keeps your bar chart centered and visible across all zoom levels.
  //     const isTargetSlot = currentBucket === '1d' ? dt.hour === 0 : dt.hour === 12;

  //     return {
  //       x: xTimestamp,
  //       morningMilk: (milkData && isTargetSlot) ? milkData.morning : 0,
  //       afternoonMilk: (milkData && isTargetSlot) ? milkData.afternoon : 0,
  //       eveningMilk: (milkData && isTargetSlot) ? milkData.evening : 0,
  //       totalMilk: (milkData && isTargetSlot) ? milkData.total : 0,
  //       baseline: (baselineData && isTargetSlot) ? baselineData.baseline : 0,
  //       isAnomalousDrop: (baselineData && isTargetSlot) ? baselineData.isAnomalousDrop : false
  //     };
  //   });

  //   console.log("🔥 Processed Milking Events Payload for Chart:", this.processedMilkingEvents.filter(p => p.totalMilk > 0));


  //   // --- Rest of your existing event list logs ---
  //   rawLogs.forEach(evt => {
  //     if (!evt) return;

  //     if (evt.__typename === 'Heat' && evt.occurredAt && evt.heatStrength !== undefined) {
  //       const snappedTimeKey = snapToBucketWindow(evt.occurredAt, currentBucket);
  //       heatEventMap.set(snappedTimeKey, parseInt(evt.heatStrength, 10) || 0);
  //     }

  //     if (evt.__typename === 'Health' && Array.isArray(evt.healthIndexTrendData)) {
  //       evt.healthIndexTrendData.forEach((point: any) => {
  //         if (!point || !point.timestamp) return;
  //         const pointIso = DateTime.fromMillis(parseInt(point.timestamp, 10)).toISO();
  //         if (pointIso) {
  //           const snappedTimeKey = snapToBucketWindow(pointIso, currentBucket);
  //           healthEventMap.set(snappedTimeKey, parseInt(point.value, 10) || 0);
  //         }
  //       });
  //     }
  //   });

  //   this.processedHeatEvents = this.processedChartData.map(timelinePoint => {
  //     const timeKey = timelinePoint.isoX;
  //     return {
  //       isoX: timeKey,
  //       value: heatEventMap.has(timeKey) ? heatEventMap.get(timeKey) : 0
  //     };
  //   });

  //   this.processedHealthEvents = this.processedChartData.map(timelinePoint => {
  //     const timeKey = timelinePoint.isoX;
  //     return {
  //       isoX: timeKey,
  //       value: healthEventMap.has(timeKey) ? healthEventMap.get(timeKey) : 100
  //     };
  //   });

  //   this.allEvents = rawLogs
  //     .map(item => {
  //       if (!item) return null;
  //       const type = item.__typename;
  //       let headingText = 'System Log Entry';
  //       let subText = item.note || 'No auxiliary details documented.';
  //       let icon = '';

  //       if (type === 'Heat') {
  //         headingText = 'Heat';
  //         subText = item.note || `Heat amplitude spike calculated at ${item.heatStrength || 0}%.`;
  //         icon = '../../../.././../assets/icons/estrus.png';
  //       } else if (type === 'Health') {
  //         headingText = 'Health';
  //         subText = item.note || `Health index level dropped down to ${item.healthIndex || 0}%.`;
  //         icon = '../../../.././../assets/icons/health.png';
  //       } else if (type === 'Insemination') {
  //         headingText = 'Insemination Logged';
  //         subText = item.note || 'Artificial breeding entry recorded.';
  //         icon = '../../../.././../assets/icons/insemination.png';
  //       } else if (type === 'Pregnancy') {
  //         headingText = 'Pregnancy Verification';
  //         subText = item.note || `Result logged: ${item.result || 'Pending'}.`;
  //         icon = '../../../.././../assets/icons/pregnancy.png';
  //       } else if (type === 'Calving') {
  //         headingText = 'Calving Event';
  //         subText = item.note || 'New calving delivery log updated.';
  //         icon = '../../../.././../assets/icons/calving.png';
  //       } else if (type === 'Dryoff') {
  //         headingText = 'Dry Off Log';
  //         subText = item.note || 'Animal status configured to Dry.';
  //         icon = '../../../.././../assets/icons/dryoff.png';
  //       }

  //       return {
  //         ...item,
  //         customTitle: headingText,
  //         customNote: subText,
  //         occurredAt: item.occurredAt ? new Date(item.occurredAt).getTime() : Date.now(),
  //         isActive: item.isActive,
  //         daysAgo: item.daysAgo,
  //         icon: icon
  //       };
  //     })
  //     .filter(event => event !== null)
  //     .sort((alpha, beta) => beta.occurredAt - alpha.occurredAt);
  // }



  // ==========================================
  // 1. BEHAVIOR / ACTIVITY DATA PROCESSING
  // ==========================================

  transformBackendPackets(rawPackets: any[]) {
    this.processedChartData = rawPackets
      .map((packet) => {
        const rawTimeSource = packet["timestamp"];
        if (!rawTimeSource) return null;

        let dateTimeObj = DateTime.fromISO(rawTimeSource);
        if (!dateTimeObj.isValid) {
          dateTimeObj = DateTime.fromJSDate(new Date(rawTimeSource));
        }

        return {
          isoX: dateTimeObj.toISO(),
          activity: {
            feeding: packet["feeding"] ?? packet["hourTotalFeedingActivity"] ?? null,
            rumination: packet["ruminating"] ?? packet["hourTotalRuminatingActivity"] ?? null,
            standing: packet["standing"] ?? packet["hourTotalStandingActivity"] ?? null,
            resting: packet["resting"] ?? packet["hourTotalRestingActivity"] ?? null,
            other: packet["other"] ?? packet["hourTotalOtherActivity"] ?? null,
            lying: packet["lying"] ?? packet["hourTotalLyingActivity"] ?? null,
          }
        };
      })
      .filter(item => item !== null)
      .reduce((acc: any[], current: any) => {
        const xDuplicate = acc.find(item => item.isoX === current.isoX);
        if (!xDuplicate) {
          acc.push(current);
        } else {
          Object.assign(xDuplicate.activity, current.activity);
        }
        return acc;
      }, [])
      .sort((x: any, y: any) => x.isoX.localeCompare(y.isoX));
  }

  syncActivityHistoryLogs(rawLogs: any[]) {
    console.log("📥 syncActivityHistoryLogs entry - rawLogs length:", rawLogs?.length);

    if (!Array.isArray(rawLogs)) {
      this.allEvents = [];
      this.processedHeatEvents = [];
      this.processedHealthEvents = [];
      return;
    }

    // Determine active time-bucket rule matching activity date range
    const currentDiffDays = this.calculateDiffDays();
    let currentBucket: '1h' | '6h' | '1d' = '1d';
    if (currentDiffDays <= 2) {
      currentBucket = '1h';
    } else if (currentDiffDays <= 8) {
      currentBucket = '6h';
    }

    const snapToBucketWindow = (isoString: string, bucket: '1h' | '6h' | '1d'): string => {
      let dt = DateTime.fromISO(isoString);
      if (bucket === '1h') {
        return dt.startOf('hour').toISO() || isoString;
      } else if (bucket === '6h') {
        const currentHour = dt.hour;
        const snappedHour = currentHour - (currentHour % 6);
        return dt.set({ hour: snappedHour, minute: 0, second: 0, millisecond: 0 }).toISO() || isoString;
      } else {
        return dt.startOf('day').toISO() || isoString;
      }
    };

    const heatEventMap = new Map<string, number>();
    const healthEventMap = new Map<string, number>();

    rawLogs.forEach(evt => {
      if (!evt) return;

      if (evt.__typename === 'Heat' && evt.occurredAt && evt.heatStrength !== undefined) {
        const snappedTimeKey = snapToBucketWindow(evt.occurredAt, currentBucket);
        heatEventMap.set(snappedTimeKey, parseInt(evt.heatStrength, 10) || 0);
      }

      if (evt.__typename === 'Health' && Array.isArray(evt.healthIndexTrendData)) {
        evt.healthIndexTrendData.forEach((point: any) => {
          if (!point || !point.timestamp) return;
          const pointIso = DateTime.fromMillis(parseInt(point.timestamp, 10)).toISO();
          if (pointIso) {
            const snappedTimeKey = snapToBucketWindow(pointIso, currentBucket);
            healthEventMap.set(snappedTimeKey, parseInt(point.value, 10) || 0);
          }
        });
      }
    });

    // Map behavior chart dataset overlays
    this.processedHeatEvents = this.processedChartData.map(timelinePoint => {
      const timeKey = timelinePoint.isoX;
      return {
        isoX: timeKey,
        value: heatEventMap.has(timeKey) ? heatEventMap.get(timeKey) : 0
      };
    });

    this.processedHealthEvents = this.processedChartData.map(timelinePoint => {
      const timeKey = timelinePoint.isoX;
      return {
        isoX: timeKey,
        value: healthEventMap.has(timeKey) ? healthEventMap.get(timeKey) : 100
      };
    });

    // Transform Event History Feed List
    this.allEvents = rawLogs
      .map(item => {
        if (!item) return null;
        const type = item.__typename;
        let headingText = 'System Log Entry';
        let subText = item.note || 'No auxiliary details documented.';
        let icon = '';

        if (type === 'Heat') {
          headingText = 'Heat';
          subText = item.note || `Heat amplitude spike calculated at ${item.heatStrength || 0}%.`;
          icon = '../../../.././../assets/icons/estrus.png';
        } else if (type === 'Health') {
          headingText = 'Health';
          subText = item.note || `Health index level dropped down to ${item.healthIndex || 0}%.`;
          icon = '../../../.././../assets/icons/health.png';
        } else if (type === 'Insemination') {
          headingText = 'Insemination Logged';
          subText = item.note || 'Artificial breeding entry recorded.';
          icon = '../../../.././../assets/icons/insemination.png';
        } else if (type === 'Pregnancy') {
          headingText = 'Pregnancy Verification';
          subText = item.note || `Result logged: ${item.result || 'Pending'}.`;
          icon = '../../../.././../assets/icons/pregnancy.png';
        } else if (type === 'Calving') {
          headingText = 'Calving Event';
          subText = item.note || 'New calving delivery log updated.';
          icon = '../../../.././../assets/icons/calving.png';
        } else if (type === 'Dryoff') {
          headingText = 'Dry Off Log';
          subText = item.note || 'Animal status configured to Dry.';
          icon = '../../../.././../assets/icons/dryoff.png';
        }

        return {
          ...item,
          customTitle: headingText,
          customNote: subText,
          occurredAt: item.occurredAt ? new Date(item.occurredAt).getTime() : Date.now(),
          isActive: item.isActive,
          daysAgo: item.daysAgo,
          icon: icon
        };
      })
      .filter(event => event !== null)
      .sort((alpha: any, beta: any) => beta.occurredAt - alpha.occurredAt);

    this.cdr.detectChanges();
  }

  // ==========================================
  // 2. MILK PRODUCTION DATA PROCESSING
  // ==========================================

  syncMilkingHistoryLogs(rawMilkingLogs: any[]) {
    console.log("📥 syncMilkingHistoryLogs entry - rawMilkingLogs:", rawMilkingLogs);

    if (!rawMilkingLogs || !Array.isArray(rawMilkingLogs)) {
      this.processedMilkingEvents = [];
      return;
    }

    // 1. Map Raw Milking Data by Date String (yyyy-MM-dd)
    const milkingMap = new Map<string, { morning: number; afternoon: number; evening: number; total: number }>();

    rawMilkingLogs.forEach(log => {
      if (!log || !log.occurredAt) return;
      if (this.animalId && log.animal?.id !== this.animalId) return;

      const logDateKey = DateTime.fromISO(log.occurredAt).toFormat('yyyy-MM-dd');

      milkingMap.set(logDateKey, {
        morning: log.morningMilk || 0,
        afternoon: log.afternoonMilk || 0,
        evening: log.eveningMilk || 0,
        total: log.totalMilk || 0
      });
    });

    // 2. Calculate the 7-Day Rolling Baseline
    const baselineMap = new Map<string, { baseline: number; isAnomalousDrop: boolean }>();
    const chronologicalDays = Array.from(milkingMap.entries())
      .map(([dateKey, metrics]) => ({ dateKey, ...metrics }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    chronologicalDays.forEach((currentDay, index) => {
      const startIdx = Math.max(0, index - 6);
      const activeWindow = chronologicalDays.slice(startIdx, index + 1);

      const totalVolumeInWindow = activeWindow.reduce((sum, day) => sum + day.total, 0);
      const runningAverage = totalVolumeInWindow / activeWindow.length;

      const isAnomalous = index > 0 && currentDay.total < (runningAverage * 0.85);

      baselineMap.set(currentDay.dateKey, {
        baseline: runningAverage,
        isAnomalousDrop: isAnomalous
      });
    });

    // 3. Align against Milk-Specific Timeline Grid
    const milkTimelinePoints = this.generateMilkingTimelinePoints();

    this.processedMilkingEvents = milkTimelinePoints.map(dt => {
      const timelineDateKey = dt.toFormat('yyyy-MM-dd');
      const xTimestamp = dt.valueOf();

      const milkData = milkingMap.get(timelineDateKey);
      const baselineData = baselineMap.get(timelineDateKey);

      return {
        x: xTimestamp,
        morningMilk: milkData ? milkData.morning : 0,
        afternoonMilk: milkData ? milkData.afternoon : 0,
        eveningMilk: milkData ? milkData.evening : 0,
        totalMilk: milkData ? milkData.total : 0,
        baseline: baselineData ? baselineData.baseline : 0,
        isAnomalousDrop: baselineData ? baselineData.isAnomalousDrop : false
      };
    });

    console.log("🔥 Processed Milking Events Payload for Chart:", this.processedMilkingEvents.filter((p: any) => p.totalMilk > 0));
  }

  /**
   * Utility to generate independent timeline timestamps for milk chart 
   * based on milkStartDate and milkEndDate
   */
  private generateMilkingTimelinePoints(): DateTime[] {
    const points: DateTime[] = [];
    let current = DateTime.fromJSDate(this.milkStartDate).startOf('day');
    const end = DateTime.fromJSDate(this.milkEndDate).startOf('day');

    while (current <= end) {
      points.push(current);
      current = current.plus({ days: 1 });
    }

    return points;
  }

  private calculateDiffDays(): number {
    if (!this.startDate || !this.endDate) return 1;
    const timeDelta = Math.abs(this.endDate.getTime() - this.startDate.getTime());
    return Math.ceil(timeDelta / (1000 * 60 * 60 * 24));
  }

  // private calculateAggregationInterval(): number {
  //   const diffDays = this.calculateDiffDays();

  //   if (diffDays <= 2) {
  //     return 60;
  //   } else if (diffDays <= 7) {
  //     return 360;
  //   } else {
  //     return 1440;
  //   }
  // }

  private getChartScaleConfig() {
    const diffDays = this.calculateDiffDays();

    // Rules based on your images
    if (diffDays <= 2) {
      return { unit: 'hour', stepSize: 3, format: 'h a', maxY1: 60, stepY1: 10 };
    } else if (diffDays <= 8) {
      return { unit: 'day', stepSize: 1, format: 'MMM dd', maxY1: 360, stepY1: 60 };
    } else {
      return { unit: 'day', stepSize: 7, format: 'MMM dd', maxY1: 1440, stepY1: 240 };
    }
  }

  private formatTimeInterval(msDiff: number, isFuture: boolean): string {
    const absMs = Math.abs(msDiff);

    const totalSeconds = Math.floor(absMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    // Approximate months calculation (assuming 30.44 days per average month)
    const months = Math.floor(totalDays / 30.44);
    const remainingDays = Math.floor(totalDays % 30.44);
    const remainingHours = totalHours % 24;
    const remainingMinutes = totalMinutes % 60;

    let timeString = '';

    if (months > 0) {
      timeString = `${months}m ${remainingDays}d`;
    } else if (totalDays > 0) {
      timeString = `${totalDays}d ${remainingHours}h`;
    } else if (totalHours > 0) {
      timeString = `${totalHours}h ${remainingMinutes}m`;
    } else {
      timeString = `${totalMinutes}m`;
    }

    return isFuture ? `${timeString} left` : `${timeString} ago`;
  }

  isWindowActive(window: any): boolean {
    if (!window || !window.startedAt || !window.optimalEndedAt) {
      return false;
    }
    const now = Date.now();
    return now < +window.optimalEndedAt;
  }

  isHealthActive(window: any): boolean {
    if (!window || !window.occurredAt) {
      return false;
    }

    const now = Date.now();
    const occurredTime = new Date(window.occurredAt).getTime();

    // 48 hours in milliseconds = 48 * 60 * 60 * 1000
    const fortyEightHours = 172800000;

    // Returns true if 'now' is after it occurred, but before the 48-hour window expires
    return now >= occurredTime && now <= (occurredTime + fortyEightHours);
  }

  /**
 * Calculates the percentage position of the current time relative to the window
 */
  getCurrentProgress(window: any): number {
    if (!window?.startedAt || !window?.endedAt) return 0;

    const start = +window.startedAt;
    const end = +window.endedAt;
    const now = Date.now();

    if (now <= start) return 0;
    if (now >= end) return 100;

    return ((now - start) / (end - start)) * 100;
  }


  /**
   * Calculates the percentage offset and width of the optimal breeding zone
   */
  getOptimalZoneStyles(window: any): { left: string; width: string } {
    if (!window?.startedAt || !window?.endedAt || !window?.optimalStartedAt || !window?.optimalEndedAt) {
      return { left: '0%', width: '0%' };
    }

    const totalStart = +window.startedAt;
    const totalEnd = +window.endedAt;
    const optStart = +window.optimalStartedAt;
    const optEnd = +window.optimalEndedAt;

    const totalDuration = totalEnd - totalStart;

    const leftPercent = ((optStart - totalStart) / totalDuration) * 100;
    const widthPercent = ((optEnd - optStart) / totalDuration) * 100;

    return {
      left: `${Math.max(0, Math.min(100, leftPercent))}%`,
      width: `${Math.max(0, Math.min(100, widthPercent))}%`
    };
  }

  /**
  * Returns string detailing how long until the total window starts or when it ended
  */
  getWindowStartEndText(window: any): { startText: string, endText: string } {
    if (!window?.startedAt || !window?.endedAt) return { startText: '', endText: '' };

    const now = Date.now();
    const start = +window.startedAt;
    const end = +window.endedAt;

    // Track start point boundary
    const startText = now < start
      ? `Opens in ${this.formatTimeInterval(start - now, true).replace(' left', '')}`
      : `Opened ${this.formatTimeInterval(now - start, false)}`;

    // Track end point boundary
    const endText = now < end
      ? this.formatTimeInterval(end - now, true)
      : `Closed ${this.formatTimeInterval(now - end, false)}`;

    return { startText, endText };
  }

  /**
   * Returns precise tracking string for the Optimal green window boundaries
   */
  getOptimalHoverText(window: any): string {
    if (!window?.optimalStartedAt || !window?.optimalEndedAt) return '';

    const now = Date.now();
    const optStart = +window.optimalStartedAt;
    const optEnd = +window.optimalEndedAt;

    if (now < optStart) {
      const timePhrase = this.formatTimeInterval(optStart - now, true).replace(' left', '');
      return `Optimal zone starts in ${timePhrase}`;
    } else if (now >= optStart && now <= optEnd) {
      return `CRITICAL BREEDING WINDOW: ${this.formatTimeInterval(optEnd - now, true)}`;
    } else {
      return `Optimal zone expired ${this.formatTimeInterval(now - optEnd, false)}`;
    }
  }

  /**
   * Direct summary badge translation update
   */
  getOptimalRemainingText(window: any): string {
    if (!window?.optimalStartedAt || !window?.optimalEndedAt) return 'N/A';

    const now = Date.now();
    const optStart = +window.optimalStartedAt;
    const optEnd = +window.optimalEndedAt;

    if (now < optStart) return 'Pending';
    if (now > optEnd) return 'Passed';

    // Active state counter
    return this.formatTimeInterval(optEnd - now, true);
  }

  renderChartInstance() {
    const config = this.getChartScaleConfig();

    const canvas = this.myChartCanvas?.nativeElement;
    if (!canvas) {
      console.warn("Canvas not found, retrying in 200ms...");
      setTimeout(() => this.renderChartInstance(), 200);
      return;
    }

    if (this.privateChartInstance) {
      this.privateChartInstance.destroy();
    }

    this.privateChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          {
            yAxisID: 'y2',
            tension: 0.4,
            label: 'Heat intensity',
            data: this.processedHeatEvents,
            parsing: { xAxisKey: 'isoX', yAxisKey: 'value' },
            fill: false,
            borderWidth: 2.5, // Slightly reduced to avoid clutter
            borderColor: '#89bf8d',
            pointRadius: 0,
            spanGaps: true
          },
          {
            yAxisID: 'y2',
            tension: 0.4,
            label: 'Health index',
            data: this.processedHealthEvents,
            parsing: { xAxisKey: 'isoX', yAxisKey: 'value' },
            fill: false,
            borderWidth: 2.5,
            borderColor: '#bf4b60',
            pointRadius: 0,
            spanGaps: true
          },
          {
            yAxisID: 'y1',
            tension: 0.4,
            label: 'Rumination',
            data: this.processedChartData,
            parsing: { xAxisKey: 'isoX', yAxisKey: 'activity.rumination' },
            fill: false,
            stack: 'activityStack',
            borderColor: '#A62B93',
            borderWidth: 2.5, // Cleaner line rendering
            pointRadius: 0,
            spanGaps: true
          },
          {
            yAxisID: 'y1',
            tension: 0.4,
            label: 'Feeding',
            data: this.processedChartData,
            parsing: { xAxisKey: 'isoX', yAxisKey: 'activity.feeding' },
            fill: false,
            stack: 'activityStack',
            backgroundColor: '#11162525',
            borderColor: '#111625',
            borderWidth: 2.5,
            pointRadius: 0,
            spanGaps: true
          },
          {
            yAxisID: 'y1',
            tension: 0.4,
            label: 'Resting',
            data: this.processedChartData,
            parsing: { xAxisKey: 'isoX', yAxisKey: 'activity.resting' },
            fill: false,
            stack: 'activityStack',
            backgroundColor: '#E66E2625',
            borderColor: '#E66E26',
            borderWidth: 2.5,
            pointRadius: 0,
            spanGaps: true
          },
          {
            yAxisID: 'y1',
            tension: 0.4,
            label: 'Other',
            data: this.processedChartData,
            parsing: { xAxisKey: 'isoX', yAxisKey: 'activity.other' },
            fill: false,
            stack: 'activityStack',
            backgroundColor: '#A36F3725',
            borderColor: '#A36F37',
            borderWidth: 2.5,
            pointRadius: 0,
            spanGaps: true
          },
          {
            yAxisID: 'y1',
            tension: 0.4,
            label: 'Standing',
            data: this.processedChartData,
            parsing: { xAxisKey: 'isoX', yAxisKey: 'activity.standing' },
            fill: false,
            stack: 'activityStack',
            backgroundColor: '#0044AA25',
            borderColor: '#0044AA',
            borderWidth: 2.5,
            pointRadius: 0,
            spanGaps: true
          },
          {
            yAxisID: 'y1',
            tension: 0.4,
            label: 'Lying',
            data: this.processedChartData,
            parsing: { xAxisKey: 'isoX', yAxisKey: 'activity.lying' },
            fill: false,
            stack: 'activityStack',
            backgroundColor: '#E2E8F040',
            borderColor: '#94A3B8',
            borderWidth: 2.5,
            pointRadius: 0,
            spanGaps: true
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            bounds: 'data',
            time: {
              unit: config.unit as any,
              displayFormats: { hour: 'ha', day: 'MMM d' }
            },
            ticks: {
              stepSize: config.stepSize,
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 4,
              callback: (val: any) => {
                const dt = DateTime.fromMillis(val);
                const fmt = config.unit === 'hour' ? 'h a' : 'dd MMM';
                return dt.toFormat(config.format || fmt);
              },
              font: {
                weight: "bolder"
              }

            },
            grid: {
              display: false,
              offset: true,
            }
          },
          y1: {
            stacked: false,
            position: 'left',
            min: 0,
            max: config.maxY1,
            ticks: {
              stepSize: config.stepY1,
              maxTicksLimit: 6,
              callback: (v) => `${v}m`,

              mirror: true,
              z: 10,
              align: 'center',
              color: '#252525',
              backdropColor: '#ddd',
              backdropPadding: { bottom: 4, top: 4, left: 4, right: 4 },
              showLabelBackdrop: true,
              font: {
                weight: "bolder"
              }
            },
            grid: { drawOnChartArea: true, display: true }
          },
          y2: {
            stacked: false,
            position: 'right',
            min: 0,
            max: 100,
            ticks: {
              maxTicksLimit: 6,
              mirror: true,
              z: 10,
              align: 'center',
              color: '252525',
              backdropColor: '#fff',
              backdropPadding: { bottom: 4, top: 4, left: 4, right: 4 },
              showLabelBackdrop: true,
              font: {
                weight: "bolder"
              },
              callback: (value) => `${value}`
            },
            grid: { display: false }
          }
        },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          zoom: {
            pan: { enabled: true, mode: 'x' },
          },
          tooltip: {
            enabled: true,
            padding: 10,
            backgroundColor: '#fff',
            bodyColor: "#252525",
            titleColor: "#000",
            bodySpacing: 4,
            bodyAlign: "left",
            cornerRadius: 10,
            titleMarginBottom: 10,
            mode: "x"
          }
        }
      }
    });

    this.applyCachedVisibilitySettings();
  }

  toggleDataset(idx: number) {
    if (!this.privateChartInstance) return;
    const currentlyVisible = this.privateChartInstance.isDatasetVisible(idx);
    this.activeDatasets[idx] = !currentlyVisible;
    if (currentlyVisible) this.privateChartInstance.hide(idx);
    else this.privateChartInstance.show(idx);
    this.saveFilterConfigToCache();
  }

  private applyCachedVisibilitySettings() {
    this.activeDatasets.forEach((isVisible, idx) => {
      if (this.privateChartInstance && this.privateChartInstance.data.datasets[idx]) {
        if (!isVisible) this.privateChartInstance.hide(idx);
        else this.privateChartInstance.show(idx);
      }
    });
  }

  onSelectChartSegment(event: any) {
    this.selectedSegment = event.detail.value;
    // Tell Angular to update the DOM immediately
    this.cdr.detectChanges();

    if (this.selectedSegment === 'summary') {
      // Re-render only after DOM is ready
      this.renderChartInstance();
      this.renderMilkingChartInstance();
    }
  }

  // async goBack() {
  //   this.location.back();
  // }

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
      // Rolling average calculation now runs across the last 7 recorded entries seamlessly
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

  renderMilkingChartInstance() {
    const canvas = this.milkingChartCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.privateMilkingChartInstance) {
      this.privateMilkingChartInstance.destroy();
      this.privateMilkingChartInstance = null;
    }

    const chartData = this.getProcessedPerformanceData();
    const pointColors = chartData.map(d => d.isAnomalousDrop ? '#ff4961' : '#3880ff');
    const pointRadii = chartData.map(d => d.isAnomalousDrop ? 6 : 4);
    const pointHoverRadii = chartData.map(d => d.isAnomalousDrop ? 8 : 6);

    // Create a smooth vertical gradient under the main line for a premium look
    const areaGradient = ctx.createLinearGradient(0, 0, 0, 220);
    areaGradient.addColorStop(0, 'rgba(56, 128, 255, 0.14)');
    areaGradient.addColorStop(1, 'rgba(56, 128, 255, 0.00)');

    // Common typography styling to match system font stacks
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
            borderWidth: 2.5,
            tension: 0.4, // Smooth curves beautifully without creating unnatural loops
            fill: true,
            backgroundColor: areaGradient,
            pointBackgroundColor: pointColors,
            pointBorderColor: '#ffffff',
            pointRadius: pointRadii,
            pointHoverRadius: pointHoverRadii,
            pointHoverBackgroundColor: pointColors,
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
            order: 1 // Layer actual data on top of baseline
          },
          {
            label: '7-Day Baseline',
            data: chartData.map(d => ({ x: d.timestamp, y: d.baseline })),
            borderColor: '#687484', // Neutral slate grey to de-emphasize vs main line
            borderWidth: 2.5,
            borderDash: [5, 5], // Elegant dashed indicator
            fill: false,
            pointRadius: 0, // Keeps line clean; dots are unnecessary here
            pointHoverRadius: 0,
            tension: 0.4,
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          // Prevents extreme high/low data points or labels from getting cut off at canvas borders
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
              display: false // Cleans up vertical lines to prioritize temporal flow
            },
            ticks: {
              // font: systemFont,
              color: '#8a94a6',
              maxRotation: 0, // Keeps dates flat and easy to scan horizontally on mobile
              autoSkip: true,
              maxTicksLimit: 6
            }
          },
          y: {
            type: 'linear',
            beginAtZero: true,
            grace: '10%', // Automatically appends 10% ceiling headroom above your highest data point
            grid: {
              color: 'rgba(0, 0, 0, 0.04)', // Ultra-faint gridlines
              tickLength: 0 // Removes ugly tick nubs extending from graph area
            },
            ticks: {
              // font: systemFont,
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
            align: 'end', // Shifts legend cleanly to top-right corner
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true, // Swaps out ugly square boxes for neat dots
              pointStyle: 'circle',
              // font: { ...systemFont, size: 12 },
              color: '#444d56',
              padding: 16
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(25, 30, 40, 0.95)', // Sleek dark-mode aesthetic toast
            titleFont: { ...systemFont, size: 12, weight: 'bold' },
            // bodyFont: systemFont,
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
                // Standardizes date rendering format at top of tooltips
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

}
