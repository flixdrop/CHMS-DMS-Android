// import {
//   Component,
//   ElementRef,
//   OnDestroy,
//   OnInit,
//   ViewChild,
// } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TranslateModule } from '@ngx-translate/core';
// import { Location } from '@angular/common';
// import {
//   Observable,
//   Subscription,
//   take,
// } from 'rxjs';
// import 'chartjs-adapter-date-fns';
// import Chart from 'chart.js/auto';
// import zoomplugin from 'chartjs-plugin-zoom';
// import { Apollo, QueryRef } from 'apollo-angular';
// import { AuthService } from 'src/app/features/auth/auth.service';
// import { DataService } from 'src/app/services/data/data.service';

// import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, IonToolbar, IonItem, IonChip, IonIcon, IonModal, IonButtons, IonButton, IonTitle, IonDatetimeButton, IonDatetime, IonHeader, IonProgressBar, IonSegmentButton, IonPopover, IonNote, IonImg, IonAccordionGroup, IonAccordion } from '@ionic/angular/standalone';


// Chart.register(zoomplugin);

// @Component({
//   selector: 'app-detail',
//   standalone: true,
//   imports: [CommonModule, FormsModule, TranslateModule,
//     IonContent,
//     IonGrid,
//     IonRow,
//     IonCol,
//     IonCard,
//     IonLabel,
//     IonToolbar,
//     IonItem,
//     IonChip,
//     IonIcon,
//     IonModal,
//     IonButtons,
//     IonButton,
//     IonTitle,
//     IonDatetimeButton,
//     IonDatetime,
//     IonHeader, IonProgressBar, IonSegmentButton, IonPopover, IonNote, IonImg, IonAccordionGroup, IonAccordion],
//   templateUrl: './detail.page.html',
//   styleUrls: ['./detail.page.scss'],
//   providers: [DatePipe],
// })



import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Location } from '@angular/common';
import {
  Observable,
  Subscription,
  take,
} from 'rxjs';
import 'chartjs-adapter-date-fns';
import Chart from 'chart.js/auto';
import zoomplugin from 'chartjs-plugin-zoom';
import { Apollo, QueryRef } from 'apollo-angular';
import { AuthService } from 'src/app/features/auth/auth.service';
import { DataService } from 'src/app/services/data/data.service';

import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, IonToolbar, IonItem, IonChip, IonSegment, IonIcon, IonModal, IonButtons, IonButton, IonTitle, IonDatetimeButton, IonDatetime, IonHeader, IonProgressBar, IonSegmentButton, IonPopover, IonNote, IonImg, IonAccordionGroup, IonAccordion } from '@ionic/angular/standalone';
import { NgxPaginationModule } from 'ngx-pagination';

Chart.register(zoomplugin);

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule,
    IonSegment,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonLabel,
    IonToolbar,
    IonItem,
    IonChip,
    IonIcon,
    IonModal,
    IonButtons,
    IonButton,
    IonTitle,
    IonDatetimeButton,
    IonDatetime,
    NgxPaginationModule,
    IonHeader, IonProgressBar, IonSegmentButton, IonPopover, IonNote, IonImg, IonAccordionGroup, IonAccordion],
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
  providers: [DatePipe],
})

export class DetailPage implements OnInit, OnDestroy {
  @ViewChild('myChart2', { static: false }) myChart2!: ElementRef;

  userDataSub: Subscription;
  graphDataSub: Subscription;
  authSub: Subscription;

  public chart1!: Chart;
  public chart2!: Chart;

  healthEvents: any[] = [];
  heatEvents: any[] = [];
  inseminations: any[] = [];
  milkings: any[] = [];
  cachedAnimalGraphData: any[] = [];
  activeDatasets: boolean[] = [true, true, true, true, true, true, true];

  showFullHistory: boolean = false;
  chartUnitCount: number = 10;
  progress: number = 0;
  selectedSegment = 'summary';

  fixedMaxDate = new Date().toISOString();

  subscriptions: Subscription = new Subscription();
  queryRef: any;
  milkQueryRef: QueryRef<any>;

  animal: string | null;
  animalObject: any[] = [];
  data: any[] = [];
  allEvents: any[] = [];

  lastHeat: any;
  lastHealth: any;
  lastInsemination: any;

  isLoading: boolean = true;
  selectedPreset: string = '7days';
  startDate: Date = new Date();
  endDate: Date = new Date();

  milkData$: Observable<any>;
  milk_target = { totalMilk: 0, numCows: 0, avgMilkPerCow: 0, efficiency: 0 };
  totalMilkVolume$: any;
  milkingEvents: any[] = [];
  groupedEvents: any[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private dataService: DataService,
    private location: Location,
    private apollo: Apollo,
    private datePipe: DatePipe,
  ) {}

  ngOnInit() {
    this.animal = this.activatedRoute.snapshot.paramMap.get('animal');
    this.loadFilterSettings();
    this.initDataStream();
    // this.setupAuthSubscription();
  }

  initDataStream() {
    if (!this.animal) return;

    this.isLoading = true;

    // Call the service method
    this.queryRef = this.dataService.getAnimalDetails(
      this.animal,
      this.startDate.toISOString(),
      this.endDate.toISOString(),
    );

    this.subscriptions.add(
      this.queryRef.valueChanges.subscribe(({ data, loading }: any) => {
        this.isLoading = loading;

        if (data?.getAnimalDetails) {
          const res = data.getAnimalDetails;

          // Map response data to component variables
          this.animalObject = res.animal;

          console.log('Animal Log: ', this.animalObject);

          this.allEvents = res.allEvents.filter((event) => {
            return event['eventType'] !== 'MILK_ENTRY';
          });

          this.milkingEvents = res.allEvents.filter((event) => {
            return event['eventType'] === 'MILK_ENTRY';
          });

          this.calculateMilkMetrics();
          this.plotLineChart();

          this.lastHeat = res.lastHeat;
          this.lastHealth = res.lastHealth;
          this.lastInsemination = res.lastInsemination;

          console.log('last health: ', this.lastHealth);

          this.data = this.transformToChartFormat(res.activities);
          this.plotAnimalChart();
        }
      }),
    );
  }

  calculateMilkMetrics() {
    if (!this.milkingEvents || this.milkingEvents.length === 0) return;

    const totalMilk = this.milkingEvents.reduce(
      (sum, entry) => sum + (entry.totalMilk || 0),
      0,
    );

    const uniqueCows = new Set(this.milkingEvents.map((e) => e.animal?.id))
      .size;

    const avgMilkPerCow = uniqueCows > 0 ? totalMilk / uniqueCows : 0;
    const efficiency = (totalMilk / (uniqueCows * 20)) * 100;

    this.milk_target = {
      totalMilk,
      numCows: uniqueCows,
      avgMilkPerCow: parseFloat(avgMilkPerCow.toFixed(2)),
      efficiency: parseFloat(efficiency.toFixed(1)),
    };

    const groups = {};
    this.milkingEvents.forEach((entry) => {
      const date = this.datePipe.transform(
        parseInt(entry.eventDateTime),
        'yyyy-MM-dd',
      );
      if (!groups[date]) groups[date] = { date, entries: [] };
      groups[date].entries.push(entry);
    });

    this.groupedEvents = Object.values(groups).sort((a: any, b: any) =>
      b.date.localeCompare(a.date),
    );
  }

  onPresetChange(duration: any) {
    this.selectedPreset = duration;
    this.endDate = new Date();
    this.startDate = new Date();

    switch (duration) {
      case '1day':
        this.startDate.setDate(this.endDate.getDate() - 1);
        break;
      case '7days':
        this.startDate.setDate(this.endDate.getDate() - 7);
        break;
      case '30days':
        this.startDate.setMonth(this.endDate.getMonth() - 1);
        break;
      case '90days':
        this.startDate.setMonth(this.endDate.getMonth() - 3);
        break;
      default:
        return;
    }

    this.endDate.setHours(23, 59, 59, 999);
    this.saveFilterSettings();

    // Trigger update via refetch
    if (this.queryRef) {
      this.isLoading = true;
      this.queryRef.refetch({
        animalId: this.animal,
        startDate: this.startDate.toISOString(),
        endDate: this.endDate.toISOString(),
      });
    }
  }

  transformToChartFormat(activities: any[]): any[] {
    return activities
      .map((item) => {
        const [year, month, day] = item.date.split('-').map(Number);
        const [hours, minutes] = item.timeIntervalUtc
          .split(' - ')[0]
          .split(':')
          .map(Number);

        const combinedDate = new Date(
          Date.UTC(year, month - 1, day, hours, minutes) + 90 * 60 * 1000,
        );

        return {
          date: combinedDate,
          activity: {
            feeding: +item.feeding,
            other: +item.other,
            resting: +item.resting,
            rumination: +item.ruminating,
            standing: +item.standing,
            heat: 0,
            health: 100,
          },
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Simplified Summary Getters
  getLastHealthIndex() {
    return this.lastHealth || { healthIndex: 0 };
  }
  getLastHeatStrength() {
    return this.lastHeat || { heatStrength: 0 };
  }
  getLastInsemination() {
    return this.lastInsemination || { eventDateTime: null };
  }

  onClickShowMoreHistory() {
    this.showFullHistory = !this.showFullHistory;
  }

  plotMilkingChart() {
    if (this.chart2) {
      this.chart2.destroy();
    }

    this.chart2 = new Chart(this.myChart2.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Milk Production'],
        datasets: [
          {
            label: 'Total Milk',
            data: [+this.milk_target.totalMilk],
            backgroundColor: ['#00B4DB'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Avg Milk',
            data: [this.milk_target.avgMilkPerCow],
            backgroundColor: ['#a17fe0'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Efficiency',
            data: [+this.milk_target.efficiency],
            backgroundColor: ['#00F260'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },

      options: {
        borderColor: 'white',
        devicePixelRatio: 4,
        elements: {
          point: {
            radius: 0,
          },
        },

        scales: {
          x: {
            border: {
              display: true,
            },
            grid: {
              display: false,
            },
          },
          y: {
            border: {
              display: true,
            },
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              padding: 10,
              textAlign: 'right',
              font: {
                weight: 'bolder',
              },
              usePointStyle: true,
              pointStyle: 'rect',
            },
            reverse: false,
          },
          title: {
            padding: 10,
            align: 'start',
            position: 'top',
            display: true,
            font: {
              weight: 'bolder',
            },
          },
          tooltip: {
            position: 'average',
          },
        },
      },
    });
  }

  async plotLineChart() {
    if (!this.milkingEvents || this.milkingEvents.length === 0) return;

    const chartDataMap = new Map();
    this.milkingEvents.forEach((event) => {
      const date = this.datePipe.transform(
        parseInt(event.eventDateTime),
        'yyyy-MM-dd',
      );
      const currentTotal = chartDataMap.get(date) || 0;
      chartDataMap.set(date, currentTotal + event.totalMilk);
    });

    const sortedDates = Array.from(chartDataMap.keys()).sort();
    const dataPoints = sortedDates.map((date) => chartDataMap.get(date));

    if (this.chart2) {
      this.chart2.destroy();
    }

    this.chart2 = new Chart('myChart2', {
      type: 'bar',
      data: {
        labels: ['Milk Production'],
        datasets: [
          {
            label: 'Total Milk',
            data: [+this.milk_target.totalMilk],
            backgroundColor: ['#00B4DB'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'No. of Cows',
            data: [+this.milk_target.numCows],
            backgroundColor: ['#FDFC47'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Avg Milk',
            data: [this.milk_target.avgMilkPerCow],
            backgroundColor: ['#a17fe0'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Efficiency',
            data: [+this.milk_target.efficiency],
            backgroundColor: ['#00F260'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: true,
        elements: {
          point: {
            radius: 0,
          },
        },

        scales: {
          x: {
            offset: true,
            border: {
              display: true,
            },
            grid: {
              display: false,
            },
            ticks: {
              autoSkip: true,
            },
          },
          y: {
            border: {
              display: true,
            },
            grid: {
              display: false,
            },
            ticks: {
              autoSkip: true,
            },
            title: {
              display: true,
              text: 'Production (Liters)',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              padding: 10,
              textAlign: 'right',
              font: {
                weight: 'bolder',
              },
              usePointStyle: true,
              pointStyle: 'rect',
            },
            reverse: false,
          },
          title: {
            padding: 10,
            align: 'start',
            position: 'top',
            display: true,
            font: {
              weight: 'bolder',
            },
          },
          tooltip: {
            position: 'average',
          },
        },
      },
    });
  }

  private saveFilterSettings() {
    const settings = {
      selectedPreset: this.selectedPreset,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
      activeDatasets: this.activeDatasets,
    };
    localStorage.setItem(
      `chart_filters_${this.animal}`,
      JSON.stringify(settings),
    );
  }

  private loadFilterSettings() {
    const saved = localStorage.getItem(`chart_filters_${this.animal}`);
    if (saved) {
      const settings = JSON.parse(saved);
      this.selectedPreset = settings.selectedPreset;
      this.startDate = new Date(settings.startDate);
      this.endDate = new Date(settings.endDate);
      this.activeDatasets = settings.activeDatasets;
    }
  }

  toggleDataset(value: number) {
    const showValue = this.chart1.isDatasetVisible(value);
    this.activeDatasets[value] = !showValue;

    if (showValue === true) {
      this.chart1.hide(value);
    } else {
      this.chart1.show(value);
    }

    this.saveFilterSettings();
  }

  private applyLoadedVisibility() {
    this.activeDatasets.forEach((isVisible, index) => {
      if (!isVisible) {
        this.chart1.hide(index);
      } else {
        this.chart1.show(index);
      }
    });
  }

  get minEndDate(): string {
    return this.startDate.toISOString();
  }

  get maxStartDate(): string {
    return this.endDate.toISOString();
  }

  ngOnDestroy() {
    if (this.chart1) {
      this.chart1.destroy();
    }
    if (this.chart2) {
      this.chart2.destroy();
    }
    this.subscriptions.unsubscribe();
    if (this.userDataSub) this.userDataSub.unsubscribe();
    if (this.graphDataSub) this.graphDataSub.unsubscribe();
  }

  setInitialDateRange(days: number) {
    this.endDate = new Date();
    this.startDate = new Date(this.endDate);
    this.startDate.setDate(this.endDate.getDate() - days);
  }

  async goBack() {
    this.location.back();
  }

  private calculateAggregationInterval(): number {
    const diffDays = this.calculateDiffDays();

    if (diffDays <= 2) {
      return 60;
    } else if (diffDays <= 7) {
      return 360;
    } else {
      return 1440;
    }
  }

  private handleInitialGraphData(resData: any[]) {
    if (!resData || resData.length === 0) {
      console.warn('No graph data received.');
      this.isLoading = false;
      return;
    }

    this.cachedAnimalGraphData = resData;
    if (this.selectedPreset === 'all') {
      this.onPresetChange('all');
    }

    this.applyDateRangeFilter(this.cachedAnimalGraphData);
  }

  refreshContent() {
    this.isLoading = true;

    if (this.cachedAnimalGraphData.length > 0) {
      this.applyDateRangeFilter(this.cachedAnimalGraphData);
    } else {
      console.warn('Cannot refresh chart: cached data is empty.');
      this.isLoading = false;
    }
  }

  applyDateRangeFilter(animalData: any[]) {
    const startTs = this.startDate.getTime();
    const endTs = this.endDate.getTime();

    const filteredData = animalData.filter((item: any) => {
      const dateStr = item['date'];
      const timeIntervalStr = item['timeIntervalUtc'];
      const startTimeStr = timeIntervalStr.split(' - ')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = startTimeStr.split(':').map(Number);

      const itemDate = new Date(
        Date.UTC(year, month - 1, day, hours, minutes) + 90 * 60 * 1000,
      );
      const itemTs = itemDate.getTime();

      return itemTs >= startTs && itemTs <= endTs;
    });

    this.data = this.transformToChartFormat(filteredData);
    this.plotAnimalChart();
    this.isLoading = false;
  }

  private fetchScaledGraphData() {
    if (!this.animal) return;

    this.isLoading = true;

    const startStr = this.startDate.toISOString().split('T')[0];
    const endStr = this.endDate.toISOString().split('T')[0];

    this.dataService
      .getGraphData(this.animal, startStr, endStr)
      .pipe(take(1))
      .subscribe({
        next: (resData) => {
          this.data = this.transformToChartFormat(resData);
          this.plotAnimalChart();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Fetch failed:', err);
          this.isLoading = false;
        },
      });
  }

  onDateRangeChange(
    isStart: boolean,
    dateString: string | string[] | null | undefined,
  ) {
    if (dateString) {
      const newDate = new Date(dateString as string);
      if (isStart) {
        newDate.setHours(0, 0, 0, 0);
        this.startDate = newDate;

        if (this.startDate > this.endDate) {
          this.endDate = new Date(this.startDate);
          this.endDate.setHours(23, 59, 59, 999);
        }
      } else {
        newDate.setHours(23, 59, 59, 999);
        this.endDate = newDate;

        if (this.endDate < this.startDate) {
          this.startDate = new Date(this.endDate);
          this.startDate.setHours(0, 0, 0, 0);
        }
      }
    }

    this.selectedPreset = 'custom';
    this.saveFilterSettings();

    this.fetchScaledGraphData();
    this.isLoading = true;
    this.refreshContent();
  }

  private calculateDiffDays(): number {
    if (!this.startDate || !this.endDate) return 1;

    const start = new Date(this.startDate).getTime();
    const end = new Date(this.endDate).getTime();

    const diffTime = Math.abs(end - start);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays || 1;
  }

  plotAnimalChart() {
    if (this.chart1) {
      this.chart1.destroy();
    }

    const aggregationUnit = this.calculateAggregationInterval();

    const diffDays = this.calculateDiffDays();

    let maxY1 = 60;
    let stepSize = 10;
    if (diffDays <= 2) {
      maxY1 = 60;
      stepSize = 10;
    } else if (diffDays <= 8) {
      maxY1 = 360;
      stepSize = 60;
    } else {
      maxY1 = 1440;
      stepSize = 240;
    }

    this.chart1 = new Chart('myChart1', {
      type: 'line',
      data: {
        datasets: [
          {
            yAxisID: 'y2',
            tension: 0.4,
            label: 'Heat Intensity',
            data: this.data,
            parsing: {
              xAxisKey: 'date',
              yAxisKey: 'activity.heat',
            },
            fill: false,
            segment: {
              borderColor: (ctx) => '#72A60397',
              borderWidth: 2,
            },
            spanGaps: true,
          },
          {
            yAxisID: 'y2',
            tension: 0.4,
            label: 'Health Index',
            data: this.data,
            parsing: {
              xAxisKey: 'date',
              yAxisKey: 'activity.health',
            },
            fill: false,
            segment: {
              borderColor: (ctx) => '#D9040497',
              borderWidth: 2,
            },
            spanGaps: true,
          },
          {
            yAxisID: 'y1',
            tension: 0.4,
            label: 'Rumination',
            data: this.data,
            parsing: {
              xAxisKey: 'date',
              yAxisKey: 'activity.rumination',
            },
            fill: false,
            segment: {
              borderColor: (ctx) => '#DA22FF80',
              borderWidth: 2,
            },
            spanGaps: true,
          },
          {
            yAxisID: 'y1',
            tension: 0.4,
            label: 'Feeding',
            data: this.data,
            parsing: {
              xAxisKey: 'date',
              yAxisKey: 'activity.feeding',
            },
            fill: false,
            segment: {
              borderColor: (ctx) => '#101820',
              borderWidth: 2,
            },
            spanGaps: true,
          },

          {
            yAxisID: 'y1',
            tension: 0.4,
            label: 'Resting',
            data: this.data,
            parsing: {
              xAxisKey: 'date',
              yAxisKey: 'activity.resting',
            },
            fill: false,
            segment: {
              borderColor: (ctx) => '#ff6319',
              borderWidth: 2,
            },
            spanGaps: true,
          },
          {
            yAxisID: 'y1',
            tension: 0.4,
            label: 'Other',
            data: this.data,
            parsing: {
              xAxisKey: 'date',
              yAxisKey: 'activity.other',
            },
            fill: false,
            segment: {
              borderColor: (ctx) => '#996633',
              borderWidth: 2,
            },
            spanGaps: true,
          },
          {
            yAxisID: 'y1',
            tension: 0.2,
            label: 'Standing',
            data: this.data,
            parsing: {
              xAxisKey: 'date',
              yAxisKey: 'activity.standing',
            },
            fill: false,
            segment: {
              borderColor: (ctx) => '#0039a680',
              borderWidth: 2,
            },
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        elements: {
          point: {
            radius: 0,
            hitRadius: 10,
          },
          line: {
            borderWidth: 2,
          },
        },
        scales: {
          x: {
            offset: true,
            type: 'time',
            position: 'bottom',
            adapters: {
              date: {
                zone: 'UTC',
              },
            },
            time: {
              unit:
                this.calculateAggregationInterval() === 1440 ? 'day' : 'hour',
              displayFormats: {
                hour: 'h:mm a',
                day: 'MMM d',
              },
              tooltipFormat: 'PPp',
            },
            grid: {
              display: false,
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 3,
              font: {
                size: 10,
              },
              callback: function (val, index, ticks) {
                const date = new Date(ticks[index].value);
                if (date.getHours() === 0 && date.getMinutes() === 0) {
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }
                return date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  hour12: true,
                });
              },
            },
          },
          y1: {
            offset: true,
            min: 0,
            max: maxY1,
            position: 'left',
            beginAtZero: false,
            type: 'linear',

            afterDataLimits: (axis) => {
              axis.max = maxY1;
            },
            title: {
              display: false,
            },
            ticks: {
              mirror: true,
              z: 10,
              stepSize: stepSize,
              autoSkip: false,
              callback: (value) => `${value}m`,
              font: {
                size: 10,
              },
              backdropColor: 'rgba(255, 255, 255)',
              showLabelBackdrop: true,
            },

            border: {
              display: false,
            },
            grid: { drawOnChartArea: true },
          },
          y2: {
            stacked: false,
            offset: true,
            grid: {
              drawOnChartArea: false,
            },
            min: 0,
            max: 100,
            position: 'right',
            beginAtZero: false,
            type: 'linear',
            display: true,
            afterDataLimits: (axis) => {
              axis.max = 100;
            },
            title: {
              display: false,
            },
            ticks: {
              mirror: true,
              z: 10,
              stepSize: stepSize,
              autoSkip: false,
              font: {
                size: 10,
              },
              backdropColor: 'rgba(255, 255, 255)',
              showLabelBackdrop: true,

              callback: function (value, index, values) {
                return `${value}`;
              },
            },
            border: {
              display: false,
            },
          },
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          zoom: {
            limits: {
              y1: {
                min: 0,
                max: 1440,
                minRange: 0,
              },
              y2: {
                min: 0,
                max: 100,
                minRange: 0,
              },
            },
            pan: {
              enabled: true,
              mode: 'x',
            },
          },
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
          },
        },
      },
    });

    this.applyLoadedVisibility();
  }

  onSelectChartSegment(event: any) {
    this.selectedSegment = event.detail.value;
    if (this.selectedSegment === 'history') {
      this.refreshContent();
    }
  }

  daysSince(pastDate: any): string {
    if (!pastDate) return '';

    let dateObj: Date;

    if (typeof pastDate === 'string' && !isNaN(Number(pastDate))) {
      const num = Number(pastDate);
      dateObj = new Date(num < 10000000000 ? num * 1000 : num);
    } else {
      dateObj = new Date(pastDate);
    }

    if (isNaN(dateObj.getTime())) return '';

    const diffMs = new Date().getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
    if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    if (diffDays >= 1) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    return 'less than a day ago';
  }

  async plotMilkChart() {
    if (!this.milkingEvents || this.milkingEvents.length === 0) return;

    const chartDataMap = new Map();
    this.milkingEvents.forEach((event) => {
      const date = this.datePipe.transform(
        parseInt(event.eventDateTime),
        'yyyy-MM-dd',
      );
      const currentTotal = chartDataMap.get(date) || 0;
      chartDataMap.set(date, currentTotal + event.totalMilk);
    });

    const sortedDates = Array.from(chartDataMap.keys()).sort();
    const dataPoints = sortedDates.map((date) => chartDataMap.get(date));

    if (this.chart2) {
      this.chart2.destroy();
    }

    this.chart2 = new Chart('myChart2', {
      type: 'bar',
      data: {
        labels: ['Milk Production'],
        datasets: [
          {
            label: 'Total Milk',
            data: [+this.milk_target.totalMilk],
            backgroundColor: ['#00B4DB'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'No. of Cows',
            data: [+this.milk_target.numCows],
            backgroundColor: ['#FDFC47'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Avg Milk',
            data: [this.milk_target.avgMilkPerCow],
            backgroundColor: ['#a17fe0'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Efficiency',
            data: [+this.milk_target.efficiency],
            backgroundColor: ['#00F260'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: true,
        elements: {
          point: {
            radius: 0,
          },
        },

        scales: {
          x: {
            offset: true,
            border: {
              display: true,
            },
            grid: {
              display: false,
            },
            ticks: {
              autoSkip: true,
            },
          },
          y: {
            border: {
              display: true,
            },
            grid: {
              display: false,
            },
            ticks: {
              autoSkip: true,
            },
            title: {
              display: true,
              text: 'Production (Liters)',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              padding: 10,
              textAlign: 'right',
              font: {
                weight: 'bolder',
              },
              usePointStyle: true,
              pointStyle: 'rect',
            },
            reverse: false,
          },
          title: {
            padding: 10,
            align: 'start',
            position: 'top',
            display: true,
            font: {
              weight: 'bolder',
            },
          },
          tooltip: {
            position: 'average',
          },
        },
      },
    });
  }
}
