import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { Subscription, firstValueFrom } from 'rxjs';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { InputHandlerService } from 'src/app/utils/input-handler/input-handler.service';
import { ColumnConfig } from 'src/app/shared/interface';
import { DairyModalComponent } from './dairy-modal/dairy-modal.component';
import { ModalController, IonRange, IonImg } from '@ionic/angular/standalone';
import { DairyManagementService } from 'src/app/services/dms/dms.service';
import { SystemService } from 'src/app/services/system/system.service';
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";

@Component({
  selector: 'app-dairy',
  templateUrl: './dairy.page.html',
  styleUrls: ['./dairy.page.scss'],
  standalone: true,
  imports: [IonImg, IonRange, SharedImportsModule, CustomHeaderComponent]
})
export class DairyPage implements OnInit, OnDestroy {

  private modalCtrl = inject(ModalController);

  // UI State Signals
  results = signal<any[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  p = signal(1);
  maxDate = new Date().toISOString();
  activeRange: number = 0.033;

  // Logic Objects (Matches Backend Inputs)
  filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
  options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };

 // 🟢 FRONTEND PRESENTATION MATRIX FOR CUSTOM HIDING/SHOWING
public tableColumns: ColumnConfig[] = [
  { key: 'tagNo', label: 'Tag No. | Name', visible: true },
  { key: 'deviceNo', label: 'Collar Tag', visible: true },
  { key: 'occurredAt', label: 'Milked on', visible: true },
  { key: 'sessions', label: 'Morning | Noon | Evening', visible: true },
  { key: 'totalMilk', label: 'Total Milk', visible: true },
  { key: 'actions', label: 'Actions', visible: true }
];

  private subs = new Subscription();

  constructor(
    private systemService: SystemService,
    private dmsService: DairyManagementService,
    private eventUtil: EventUtilityService,
    private inputHandler: InputHandlerService,
  ) { }

  ngOnInit() {
    this.syncSelections();

    // this.activeRange = 0.033; // Reset to 'All' or a null state
    // this.setRange(0.033); // Initial load (1 Day)
    this.setRange(-1);

    this.initSyncs();
  }

  private initSyncs() {
    // 1. Debounced Search Sync
    this.subs.add(this.inputHandler.getSearchStream(400).subscribe(term => {
      this.filter.search = term;
      this.refresh();
    }));

    // 2. Global Branch/Farm Selection Sync
    this.subs.add(this.systemService.selectionChanged$.subscribe(() => {
      this.syncSelections();
      this.refresh();
    }));
  }

  async loadMilkEvents() {
    this.isLoading.set(true);
    this.options.offset = (this.p() - 1) * this.options.limit;

    try {
      const res = await firstValueFrom(this.dmsService.getMilkingLogs({
        filter: this.filter,
        options: this.options
      }));
      this.results.set(res?.items ?? []);
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

  // --- UI Action Handlers ---

  refresh() { this.p.set(1); this.loadMilkEvents(); }

  onPageChange(page: number) { this.p.set(page); this.loadMilkEvents(); }

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

  clearDates() {
    this.activeRange = 0.033; // Reset to 'All' or a null state
    // this.setRange(0.033);
    this.setRange(-1); 
  }

  private syncSelections() {
    const { targetPath, farmId } = this.eventUtil.getSavedSelections();
    this.filter.targetPath = targetPath;
    this.filter.farmId = farmId;
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

    async openDairyModal(type: string, entry?: any) {
      const modal = await this.modalCtrl.create({
        component: DairyModalComponent,
        // 🌟 Pass data into the Modal component's @Input fields
        componentProps: {
          type: type,
          entry: entry
        }
      });
  
      await modal.present();
  
      // 🌟 Listen for the response data payload when modal closes
      const { data, role } = await modal.onDidDismiss();
  
      if (role === 'confirm' && data?.updated) {
        console.log('Received updated data from modal:', data);
        this.refresh();
        // Trigger table refresh or update state here!
      }
    }

}
