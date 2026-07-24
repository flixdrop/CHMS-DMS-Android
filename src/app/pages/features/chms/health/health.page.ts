import { Component, ElementRef, inject, OnDestroy, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { Subscription, firstValueFrom } from 'rxjs';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { InputHandlerService } from 'src/app/utils/input-handler/input-handler.service';
import { AlertController, ToastController } from '@ionic/angular';
import { ColumnConfig } from 'src/app/shared/interface';
import { HealthModalComponent } from './health-modal/health-modal.component';
import { ModalController, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';

import { Chart } from 'chart.js/auto';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { SystemService } from 'src/app/services/system/system.service';
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";

@Component({
  selector: "app-health",
  templateUrl: "./health.page.html",
  styleUrls: ["./health.page.scss"],
  standalone: true,
  imports: [IonSegmentButton, IonSegment, SharedImportsModule, CustomHeaderComponent],
})
export class HealthPage implements OnInit, OnDestroy {
  private modalCtrl = inject(ModalController);

  @ViewChildren('sparklineCanvas') sparklineCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  private activeCharts: Chart[] = [];

  results = signal<any[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  p = signal(1);
  maxDate = new Date().toISOString();
  activeRange: number = 0.066;

  filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
  options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };

  // 🟢 FRONTEND PRESENTATION MATRIX FOR CUSTOM HIDING/SHOWING
  public tableColumns: ColumnConfig[] = [
    { key: 'tagNo', label: 'Tag No. | Name', visible: true },
    { key: 'deviceNo', label: 'Collar Tag', visible: true },
    { key: 'healthIndex', label: 'Health Index', visible: true },
    { key: 'trendData', label: 'Trend History', visible: true },
    { key: 'duration', label: 'Duration', visible: true },
    { key: 'abnormalBehaviors', label: 'Behaviors', visible: true },
    { key: 'notes', label: 'Notes', visible: true }
  ];

  private subs = new Subscription();

  constructor(
    private systemService: SystemService,
    private chmsService: CattleMonitoringService,
    private eventUtil: EventUtilityService,
    private inputHandler: InputHandlerService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.syncSelections();
    this.setRange(0.066);
    this.initSyncs();
  }

  ngAfterViewInit() {
    // Listen to changes in the DOM query (e.g. when items load, filter, or paginate)
    this.subs.add(
      this.sparklineCanvases.changes.subscribe(() => {
        this.renderAllSparklines();
      })
    );
  }

  private renderAllSparklines() {
    // 1. Clear out any existing charts running in memory
    this.destroyCharts();

    const canvasElements = this.sparklineCanvases.toArray();
    const dataItems = this.results();

    // 2. Loop through each canvas element rendered by the template *ngFor
    canvasElements.forEach((canvasRef, index) => {
      const item = dataItems[index];
      if (!item || !item.healthIndexTrendData || item.healthIndexTrendData.length === 0) return;

      const ctx = canvasRef.nativeElement.getContext('2d');
      if (!ctx) return;

      const isCritical = +item.healthIndex <= 85;

      // 3. Build Chart.js instance directly as a BAR chart
      const chartInstance = new Chart(canvasRef.nativeElement, {
        type: 'bar', // 🌟 Switched to bar presentation
        data: {
          labels: item.healthIndexTrendData.map((_: any, i: number) => i),
          datasets: [{
            data: item.healthIndexTrendData.map((d: any) => d.value ?? 100),
            // Match your existing active thematic condition colors
            backgroundColor: isCritical ? '#eb445a' : '#2dd36f',
            hoverBackgroundColor: isCritical ? '#cf3c4f' : '#28b961',
            borderRadius: 2,         // Gives a soft rounded finish to the top of the bars
            barPercentage: 0.85,     // Dictates width thickness ratio per bar block
            categoryPercentage: 0.9  // Adjusts the pacing gaps between data points
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: true,
              displayColors: false,
              callbacks: {
                // 🌟 Customize the tooltip title to show the specific time
                title: (tooltipItems) => {
                  const idx = tooltipItems[0].dataIndex;
                  const rawData = item.healthIndexTrendData[idx];
                  if (rawData && rawData.timestamp) {
                    // Converts UNIX string/number timestamps to a clean localized format
                    const dateObj = new Date(+rawData.timestamp);
                    return dateObj.toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  }
                  return '';
                },
                // 🌟 Keep the health index percentage as the body text below the time
                label: (context) => {
                  return ` Health Index: ${context.parsed.y}%`;
                }
              }
            }
          },
          scales: {
            x: { display: false },
            y: { display: false, min: 0, max: 100 }
          }
        }
      });

      // Track it so we can clean it up later
      this.activeCharts.push(chartInstance);
    });
  }

  private destroyCharts() {
    this.activeCharts.forEach(chart => chart.destroy());
    this.activeCharts = [];
  }

  private initSyncs() {
    this.subs.add(this.inputHandler.getSearchStream(400).subscribe(term => {
      this.filter.search = term;
      this.refresh();
    }));

    this.subs.add(this.systemService.selectionChanged$.subscribe(() => {
      this.syncSelections();
      this.refresh();
    }));
  }

  async loadHealths() {
    this.isLoading.set(true);
    this.options.offset = (this.p() - 1) * this.options.limit;

    try {
      const res = await firstValueFrom(this.chmsService.getHealths({
        filter: this.filter,
        options: this.options
      }));

      const mapped = (res?.items ?? []).map((item: any) => ({
        ...item,
        isEditing: false,
        uiIsTreatmentDone: undefined,
        treatmentFields: {
          treatmentType: '',
          medicineDetails: '',
          feedDetails: '',
          attachmentName: '',
          attachmentBase64: ''
        },
        editForm: { healthIndex: 0, occurredAt: '', startedAt: '', endedAt: '' }
      }));

      this.results.set(mapped);
      this.totalCount.set(res?.totalCount ?? 0);
    } catch {
      this.results.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  // 🟢 COLUMN VISIBILITY CHECKER HELPER
  isColumnVisible(key: string): boolean {
    const col = this.tableColumns.find(c => c.key === key);
    return col ? col.visible : true;
  }

  // 🟢 TOGGLE COLUMN VISIBILITY
  toggleColumnVisibility(key: string): void {
    const col = this.tableColumns.find(c => c.key === key);
    if (col) {
      col.visible = !col.visible;
    }
  }

  refresh() { this.p.set(1); this.loadHealths(); }
  onPageChange(page: number) { this.p.set(page); this.loadHealths(); }
  handleInput(event: any) { this.inputHandler.search(event.detail.value); }

  toggleSort(column: string) {
    this.options.sortOrder = (this.options.sortBy === column) ? (this.options.sortOrder * -1) : -1;
    this.options.sortBy = column;
    this.refresh();
  }

  setRange(months: number) {
    this.activeRange = months;
    const range = this.eventUtil.calculateRange(months);
    this.filter.startDate = range.start;
    this.filter.endDate = range.end;
    this.refresh();
  }

  clearDates() { this.setRange(0.066); }

  private syncSelections() {
    const { targetPath, farmId } = this.eventUtil.getSavedSelections();
    this.filter.targetPath = targetPath;
    this.filter.farmId = farmId;
  }

  ngOnDestroy() {
    this.destroyCharts();
    this.subs.unsubscribe();
  }

  async openHealthModal(type: string, health?: any) {
    const modal = await this.modalCtrl.create({
      component: HealthModalComponent,
      componentProps: {
        type: type,
        health: health
      }
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data?.updated) {
      console.log('Received updated data from modal:', data);
      this.refresh();
    }
  }
}