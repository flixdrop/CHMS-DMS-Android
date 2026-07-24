import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { InputHandlerService } from 'src/app/utils/input-handler/input-handler.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { ColumnConfig } from 'src/app/shared/interface';
import { DeviceModalComponent } from './device-modal/device-modal.component';
import { ModalController, IonRange, IonImg } from '@ionic/angular/standalone';
import { DeviceService } from 'src/app/services/device/device.service';
import { SystemService } from 'src/app/services/system/system.service';
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";
import { AnimalModalComponent } from '../animals/animal-modal/animal-modal.component';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss'],
  standalone: true,
  imports: [IonImg, IonRange, SharedImportsModule, CustomHeaderComponent],
})
export class DevicesPage implements OnInit, OnDestroy {

  private modalCtrl = inject(ModalController);

  results = signal<any[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  p = signal(1);
  maxDate = new Date().toISOString();
  activeRange: number = 0.033;

  filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
  // filter = { targetPath: '', farmId: '', search: '' };

  // options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };
  options = { limit: 10, offset: 0, sortBy: '', sortOrder: -1};


// 🟢 FRONTEND PRESENTATION MATRIX FOR CUSTOM HIDING/SHOWING
public tableColumns: ColumnConfig[] = [
  { key: 'tagNo', label: 'Paired Animal', visible: true },
  { key: 'deviceNo', label: 'Device No.', visible: true },
  { key: 'lastSeenAt', label: 'Last Seen', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'batteryRemaining', label: 'Battery Level', visible: true },
  { key: 'ambientTemperature', label: 'Temperature', visible: true },
  { key: 'rssi', label: 'Signal Strength', visible: true },
  { key: 'actions', label: 'Actions', visible: true }
];

  private subs = new Subscription();

  constructor(
    private systemService: SystemService,
    private deviceService: DeviceService,
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

  async loadDevices() {
    this.isLoading.set(true);
    this.options.offset = (this.p() - 1) * this.options.limit;

    try {
      const res = await firstValueFrom(this.deviceService.getDevices({
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

  refresh() { this.p.set(1); this.loadDevices(); }

  onPageChange(page: number) { this.p.set(page); this.loadDevices(); }

  handleInput(event: any) { this.inputHandler.search(event.detail.value); }

  toggleSort(column: string) {
    this.options.sortOrder = (this.options.sortBy === column) ? (this.options.sortOrder * -1) : -1;
    this.options.sortBy = column;
    this.refresh();
  }

  setRange(months: number) {
    this.activeRange = months;
    const range = this.eventUtil.calculateRange(months);
    // this.filter.startDate = range.start;
    // this.filter.endDate = range.end;
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

    async openDeviceModal(type: string, device?: any) {
        const modal = await this.modalCtrl.create({
          component: DeviceModalComponent,
          // 🌟 Pass data into the Modal component's @Input fields
          componentProps: {
            type: type,
            device: device
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

  async openAnimalModal(type: string, animal?: any) {
    const modal = await this.modalCtrl.create({
      component: AnimalModalComponent,
      componentProps: { type: type, animal: animal }
    });

    await modal.present();
    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data?.updated) {
      this.refresh();
    }
  }

}
