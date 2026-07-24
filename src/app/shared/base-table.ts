import { inject, signal, OnInit, OnDestroy, Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/services/navigation/user.service';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { InputHandlerService } from 'src/app/utils/input-handler/input-handler.service';

@Component({ template: '' })
export abstract class BaseTable implements OnInit, OnDestroy {
  // Global View Engine Variables
  results = signal<any[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  p = signal(1);
  activeRange = 0.033; // Default 1 Month

  filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
  options = { limit: 10, offset: 0, sortBy: 'createdAt', sortOrder: -1 };
  columns = signal<any[]>([]);

  protected userSubscription!: Subscription;
  protected searchSubscription!: Subscription;

  // Shared Core Infrastructure Injections
  protected userService = inject(UserService);
  protected eventUtil = inject(EventUtilityService);
  protected inputHandler = inject(InputHandlerService);

  ngOnInit() {
    // 1. Listen for dropdown changes across Admin -> Managed User -> Farm hierarchies
    this.userSubscription = this.userService['userCombinedPath$'].subscribe((pathInfo) => {
      if (pathInfo) {
        this.filter.targetPath = pathInfo.combinedPath;
        this.filter.farmId = pathInfo.farmId;
        this.refresh();
      }
    });

    // 2. Stream top-bar search bar inputs straight into local data queries
    this.searchSubscription = this.inputHandler['search$'].subscribe((searchValue) => {
      this.filter.search = searchValue;
      this.refresh();
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) this.userSubscription.unsubscribe();
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
  }

  // Abstract method forced down to children to invoke specific DataService endpoints
  abstract loadPageData(): Promise<void>;

  refresh() {
    this.p.set(1);
    this.options.offset = 0;
    this.loadPageData();
  }

  onPageChange(page: number) {
    this.p.set(page);
    this.options.offset = (page - 1) * this.options.limit;
    this.loadPageData();
  }

  handleInput(event: any) {
    this.inputHandler.search(event.detail.value);
  }

  toggleSort(column: string) {
    this.options.sortOrder = this.options.sortBy === column ? this.options.sortOrder * -1 : -1;
    this.options.sortBy = column;
    this.refresh();
  }

  isColumnVisible(key: string): boolean {
  const col = this.columns().find(c => c.key === key);
  return col ? col.visible !== false : true; // Defaults to true if visibility state hasn't been explicitly declared
}

// Flips checkbox boolean markers cleanly inside the signal registry mapping context
toggleColumnVisibility(key: string) {
  this.columns.update(cols => cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
}

  setRange(months: number) {
    this.activeRange = months;
    if (months === -1) {
      this.filter.startDate = '';
      this.filter.endDate = '';
    } else {
      const range = this.eventUtil.calculateRange(months);
      this.filter.startDate = range.start;
      this.filter.endDate = range.end;
    }
    this.refresh();
  }

    clearDates() {
    this.activeRange = 0.033;
    this.setRange(0.033);
  }
}