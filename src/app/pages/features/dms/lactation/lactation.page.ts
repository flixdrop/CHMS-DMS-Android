import { Component, OnInit, signal } from '@angular/core';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { Subscription, firstValueFrom } from 'rxjs';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { InputHandlerService } from 'src/app/utils/input-handler/input-handler.service';
import { ColumnConfig } from 'src/app/shared/interface';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { SystemService } from 'src/app/services/system/system.service';

@Component({
  selector: "app-lactation",
  templateUrl: "./lactation.page.html",
  styleUrls: ["./lactation.page.scss"],
  standalone: true,
  imports: [SharedImportsModule],
})
export class LactationPage implements OnInit {
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
  { key: 'status', label: 'Status', visible: true },
  { key: 'milestones', label: 'Milestones', visible: true },
  { key: 'startedAt', label: 'Event Window', visible: true },
  { key: 'lactationNumber', label: 'Lactation Number', visible: true },
  { key: 'expectedDryoffDate', label: 'Expected Dryoff', visible: true },
  { key: 'expectedCalvingDate', label: 'Expected Calving', visible: true }
];

  private subs = new Subscription();

  constructor(
    private systemService: SystemService,
    private chmsService: CattleMonitoringService,
    private eventUtil: EventUtilityService,
    private inputHandler: InputHandlerService,
  ) { }

  ngOnInit() {
    this.syncSelections();

    this.activeRange = 0.033; // Reset to 'All' or a null state
    this.setRange(0.033); // Initial load (1 Day)
    // this.setRange(-1);

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

  async loadLactations() {
    this.isLoading.set(true);
    this.options.offset = (this.p() - 1) * this.options.limit;

    try {
      const res = await firstValueFrom(this.chmsService.getLactations({
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

  refresh() { this.p.set(1); this.loadLactations(); }

  onPageChange(page: number) { this.p.set(page); this.loadLactations(); }

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
    this.setRange(0.033);
    // this.setRange(-1); 
  }

  private syncSelections() {
    const { targetPath, farmId } = this.eventUtil.getSavedSelections();
    this.filter.targetPath = targetPath;
    this.filter.farmId = farmId;
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

}
