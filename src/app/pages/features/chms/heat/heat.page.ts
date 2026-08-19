import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { Subscription, firstValueFrom } from 'rxjs';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { InputHandlerService } from 'src/app/utils/input-handler/input-handler.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { ModalController } from "@ionic/angular/standalone";
import { ColumnConfig } from 'src/app/shared/interface';
import { HeatModalComponent } from './heat-modal/heat-modal.component';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { AnimalService } from 'src/app/services/animal/animal.service';
import { SystemService } from 'src/app/services/system/system.service';
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";

@Component({
  selector: "app-heat",
  templateUrl: "./heat.page.html",
  styleUrls: ["./heat.page.scss"],
  standalone: true,
  imports: [SharedImportsModule, CustomHeaderComponent],
})
export class HeatPage implements OnInit, OnDestroy {

  private modalCtrl = inject(ModalController);

  // UI State Signals
  results = signal<any[]>([]);
  farmBulls = signal<any[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  p = signal(1);

  maxDate = new Date().toISOString();
  activeRange: number = 0.066;

  // 🟢 Add these properties to your existing HeatPage Class state variables
  isCreateModalOpen = false;
  femaleCattleInventory = signal<any[]>([]);

  isSearchbarVisible = false;

  newHeat = {
    animalId: '',
    heatStrength: '0',
    isSilent: false,
    occurredAt: ''
  };

  public tableColumns: ColumnConfig[] = [
    { key: 'tagNo', label: 'Tag No. | Name', visible: true },
    { key: 'deviceNo', label: 'Collar Tag', visible: true },
    { key: 'intensity', label: 'Intensity', visible: true },
    { key: 'occurredAt', label: 'Occurred At', visible: true },
    { key: 'startedAt', label: 'Started At', visible: false },
    { key: 'endedAt', label: 'Ended At', visible: false },
    { key: 'aiWindow', label: 'AI Window', visible: true },
    { key: 'lastHeat', label: 'Last Heat', visible: true },
    { key: 'inseminationDone', label: 'Insemination Done?', visible: true },
    { key: 'actions', label: 'Actions', visible: true }
  ];

  // Static Indian Dropdown Master Catalogs
  readonly indianSemenCompanies: string[] = [
    'ABS India',
    'BAIF (Bharatiya Agro Industries Foundation)',
    'SAG (Sabarmati Ashram Gaushala / NDDB)',
    'Amul Research and Development Association',
    'Mehsana District Co-operative Milk Producers Union',
    'MDFV (Milkfed Punjab / Punjab Breeding)',
    'Alwar Semen Station (Rajasthan)',
    'Haldwani Semen Station (Uttarakhand)',
    'Deep Frozen Semen Station (Bhadbhada, MP)',
    'Central Cattle Breeding Farm (CCBF)',
    'JK Trust (JK Bovagen)',
    'Sagar Semen Station',
    'Government State Semen Bank / Animal Husbandry Dept'
  ];

  readonly indianBreeds: string[] = [
    'Gir',
    'Sahiwal',
    'Red Sindhi',
    'Tharparkar',
    'Kankrej',
    'Hariana',
    'Rathi',
    'Murrah (Buffalo)',
    'Jafarabadi (Buffalo)',
    'Nili Ravi (Buffalo)',
    'Holstein Friesian (HF)',
    'Jersey',
    'Crossbred HF (CB HF)',
    'Crossbred Jersey (CB Jersey)'
  ];

  readonly semenTypes: string[] = [
    'Sexed Semen (90%+ Female Selection)',
    'Conventional Semen (Standard)',
    'High Genomic Index Straw',
    'Imported Genetics Straw'
  ];

  // Logic Objects (Matches Backend Inputs)
  filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
  options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };

  private subs = new Subscription();

  constructor(
    private systemService: SystemService,
    private animalService: AnimalService,
    private chmsService: CattleMonitoringService,
    private eventUtil: EventUtilityService,
    private inputHandler: InputHandlerService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
  ) { }

  ngOnInit() {

    this.syncSelections();
    this.activeRange = 0.066;
    this.setRange(0.066);
    this.initSyncs();

    this.loadMaleCattleInventory();
    this.loadFemaleCattleInventory(); // Load active inventory options

    // this.syncSelections();

    // this.activeRange = 0.066;
    // this.setRange(0.066);

    // this.initSyncs();
    // this.loadMaleCattleInventory();
  }

  private initSyncs() {
    this.subs.add(this.inputHandler.getSearchStream(400).subscribe(term => {
      this.filter.search = term;
      this.refresh();
    }));

    this.subs.add(this.systemService.selectionChanged$.subscribe(() => {
      this.syncSelections();
      this.refresh();
      this.loadMaleCattleInventory();
    }));
  }

  async loadMaleCattleInventory() {
    try {
      const res = await firstValueFrom(this.animalService.getAnimals({
        filter: { farmId: this.filter.farmId },
        options: { limit: 100, offset: 0 }
      }));
      this.farmBulls.set(res?.items ?? []);
    } catch (err) {
      console.error("Error retrieving asset catalog:", err);
      this.farmBulls.set([]);
    }
  }


  // /**
  //  * Calculates the percentage position of the current time relative to the window
  //  */
  // getCurrentProgress(window: any): number {
  //   if (!window?.startedAt || !window?.endedAt) return 0;

  //   const start = +window.startedAt;
  //   const end = +window.endedAt;
  //   const now = Date.now();

  //   if (now <= start) return 0;
  //   if (now >= end) return 100;

  //   return ((now - start) / (end - start)) * 100;
  // }

  /**
 * Calculates the percentage position of the current time relative to the window,
 * rounded to 1 decimal place to avoid NG0100 microsecond shift errors.
 */
getCurrentProgress(window: any): number {
  if (!window?.startedAt || !window?.endedAt) return 0;

  const start = +window.startedAt;
  const end = +window.endedAt;
  const now = Date.now();

  if (now <= start) return 0;
  if (now >= end) return 100;

  const progress = ((now - start) / (end - start)) * 100;
  
  // Rounding to 1 decimal place keeps the value stable during Angular's Dev mode pass
  return Math.round(progress * 10) / 10;
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

  async loadHeats() {
    this.isLoading.set(true);
    this.options.offset = (this.p() - 1) * this.options.limit;

    try {
      const res = await firstValueFrom(this.chmsService.getHeats({
        filter: this.filter,
        options: this.options
      }));

      const mappedItems = (res?.items ?? []).map((item: any) => ({
        ...item,
        uiSelection: null,
        aiProcess: 'Artificial',
        selectedBullId: '',
        customBullName: '',
        semenCompany: '',
        semenBreed: '',
        semenType: '',

        // 🟢 Add local temporary CRUD UI state flags
        isEditing: false,
        editStrength: '',
        editOccurredAt: '',
        editNote: ''
      }));

      this.results.set(mappedItems);
      this.totalCount.set(res?.totalCount ?? 0);
    } catch {
      this.results.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  getDynamicProgressColor(strength: string | number): string {
    const value = Number(strength);
    const hue = (value / 100) * 120;
    return `hsl(${hue}, 80%, 45%)`;
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

    if (now < optStart) return 'Active';
    if (now > optEnd) return 'Expired';

    // Active state counter
    return this.formatTimeInterval(optEnd - now, true);
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

  // 🟢 Fetch active milking/dry female cows for entry validation mapping
  async loadFemaleCattleInventory() {
    try {
      const res = await firstValueFrom(this.animalService.getAnimals({
        filter: { farmId: this.filter.farmId },
        options: { limit: 250, offset: 0 } // Large limit to catch herd tags
      }));
      this.femaleCattleInventory.set(res?.items ?? []);
    } catch (err) {
      console.error("Error pulling female herd directory:", err);
      this.femaleCattleInventory.set([]);
    }
  }

  // --- 🟢 Add Create Action Management Handlers ---

  openHeatForm() {
    // Prime local datetime values for instantaneous default initialization
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    this.newHeat = {
      animalId: '',
      heatStrength: '0',
      isSilent: false,
      occurredAt: localIso
    };

    // Make sure inventory is fresh for the farm selected
    this.loadFemaleCattleInventory();
    this.isCreateModalOpen = true;
  }

  async submitManualHeat() {
    if (!this.newHeat.animalId) {
      const toast = await this.toastCtrl.create({ message: 'Please select a tag number.', duration: 2000, color: 'warning' });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Registering heat cycle...' });
    await loading.present();

    try {
      const response = await firstValueFrom(this.chmsService.createHeat({
        animalId: this.newHeat.animalId,
        heatStrength: this.newHeat.heatStrength || '0',
        isSilent: this.newHeat.isSilent,
        occurredAt: new Date(this.newHeat.occurredAt).toISOString()
      }));

      const rawCreatedNode = response?.data?.createHeat;

      if (rawCreatedNode) {
        // Map it clean into your existing table row variable model bindings
        const newTableItem = {
          ...rawCreatedNode,
          uiSelection: null,
          aiProcess: 'Artificial',
          selectedBullId: '',
          customBullName: '',
          semenCompany: '',
          semenBreed: '',
          semenType: '',
          isEditing: false,
          editStrength: '',
          editOccurredAt: '',
          editNote: ''
        };

        // Unshift prepends the manual entry straight to the top of your visual row list natively!
        this.results.set([newTableItem, ...this.results()]);
        this.totalCount.set(this.totalCount() + 1);

        this.isCreateModalOpen = false; // Hide Modal

        const toast = await this.toastCtrl.create({ message: 'Manual heat recorded successfully.', duration: 1500, color: 'success' });
        await toast.present();
      }
    } catch (err: any) {
      console.error(err);
      const toast = await this.toastCtrl.create({ message: err?.message || 'Failed saving record.', duration: 2500, color: 'danger' });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  // --- 🟢 Inline CRUD Handling Methods ---

  startInlineEdit(item: any) {
    // ISO transformation to match local standard datetime-local field values
    const dateObj = item.occurredAt ? new Date(item.occurredAt) : new Date();
    // Compensation for timezone offset to prevent shifting times back and forth in inputs
    const localIso = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    item.editStrength = item.heatStrength || '0';
    item.editOccurredAt = localIso;
    item.editNote = item.note || '';
    item.isEditing = true;
  }

  cancelInlineEdit(item: any) {
    item.isEditing = false;
  }

  async saveInlineEdit(item: any) {
    const loading = await this.loadingCtrl.create({ message: 'Updating heat log entries...' });
    await loading.present();

    try {
      const response = await firstValueFrom(this.chmsService.updateHeat({
        heatId: item.id || item._id,
        heatStrength: item.editStrength,
        isSilentHeat: item.isSilentHeat || false,
        occurredAt: new Date(item.editOccurredAt).toISOString(),
        note: item.editNote?.trim() || ''
      }));

      // 🟢 Extract the inner data object returned by Apollo Client execution layers safely
      const mutationResult = response?.data?.updateHeat;

      if (mutationResult) {
        // Update frontend state gracefully without forcing a full network table refresh
        item.heatStrength = mutationResult.heatStrength;
        item.occurredAt = mutationResult.occurredAt;
        item.note = mutationResult.note;
        item.isEditing = false;

        const toast = await this.toastCtrl.create({
          message: 'Heat log optimized.',
          duration: 1500,
          color: 'success'
        });
        await toast.present();
      } else {
        throw new Error("Empty response received from the data server.");
      }
    } catch (err: any) {
      console.error(err);
      const toast = await this.toastCtrl.create({
        message: err?.message || 'Error updating data record.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  async deleteHeatItem(item: any) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Confirm Deletion';
    alert.message = `Are you sure you want to drop the heat record for animal tag ${item.animal?.tagNo}?`;
    alert.buttons = [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          const loading = await this.loadingCtrl.create({ message: 'Dropping entry records...' });
          await loading.present();
          try {
            await firstValueFrom(this.chmsService.deleteHeat(item.id || item._id));

            // Pull item from local signal views natively
            this.results.set(this.results().filter(h => h.id !== item.id && h._id !== item._id));
            this.totalCount.set(Math.max(0, this.totalCount() - 1));

            const toast = await this.toastCtrl.create({ message: 'Entry removed successfully.', duration: 1500, color: 'success' });
            await toast.present();
          } catch (e: any) {
            const toast = await this.toastCtrl.create({ message: e?.message || 'Failed execution.', duration: 2000, color: 'danger' });
            await toast.present();
          } finally {
            await loading.dismiss();
          }
        }
      }
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  // --- UI Action Handlers ---

  async onSelectNo(item: any) {
    await this.submitResolution(item);
  }

  async submitResolution(item: any) {
    const loading = await this.loadingCtrl.create({ message: 'Saving event state...' });
    await loading.present();

    let inseminationInput = null;

    if (item.uiSelection === 'YES') {
      let finalBullName = '';

      if (item.aiProcess === 'Natural') {
        if (item.selectedBullId && item.selectedBullId !== 'NOT_LISTED') {
          const matchedBull = this.farmBulls().find(b => b.id === item.selectedBullId);
          finalBullName = matchedBull ? `${matchedBull.tagNo} ${matchedBull.name || ''}`.trim() : 'Farm Bull';
        } else {
          finalBullName = item.customBullName?.trim() || 'Unlisted Breeding Bull';
        }
      }

      // Prepares clean structure matching GraphQL parameters
      inseminationInput = {
        animalId: item.animal?.id || item.animal?._id,
        process: item.aiProcess,
        bullName: item.aiProcess === 'Natural' ? finalBullName : null,
        semenCompany: item.aiProcess === 'Artificial' ? (item.semenCompany || null) : null,
        semenBreed: item.aiProcess === 'Artificial' ? (item.semenBreed || null) : null,
        semenType: item.aiProcess === 'Artificial' ? (item.semenType || null) : null,
        occurredAt: new Date().toISOString()
      };
    }

    try {
      await firstValueFrom(this.chmsService.resolveHeatSelection({
        heatId: item.id || item._id,
        inseminationInput
      }));

      const toast = await this.toastCtrl.create({
        message: 'Heat log updated successfully.',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      this.results.set(this.results().filter(h => (h.id !== item.id && h._id !== item._id)));
      this.totalCount.set(Math.max(0, this.totalCount() - 1));

    } catch (err: any) {
      console.error(err);
      const toast = await this.toastCtrl.create({
        message: err?.message || 'Error executing modification.',
        duration: 2500,
        color: 'danger'
      });
      await toast.present();
      item.uiSelection = null;
    } finally {
      await loading.dismiss();
    }
  }

  refresh() { this.p.set(1); this.loadHeats(); }

  onPageChange(page: number) { this.p.set(page); this.loadHeats(); }

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
    this.activeRange = 0.066;
    this.setRange(0.066);
  }

  private syncSelections() {
    const { targetPath, farmId } = this.eventUtil.getSavedSelections();
    this.filter.targetPath = targetPath;
    this.filter.farmId = farmId;
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  // async openHeatModal(type: string, heat?: any) {
  //   const modal = await this.modalCtrl.create({
  //     component: HeatModalComponent,
  //     // 🌟 Pass data into the Modal component's @Input fields
  //     componentProps: {
  //       type: type,
  //       heat: heat
  //     }
  //   });

  //   await modal.present();

  //   // 🌟 Listen for the response data payload when modal closes
  //   const { data, role } = await modal.onDidDismiss();

  //   if (role === 'confirm' && data?.updated) {
  //     console.log('Received updated data from modal:', data);
  //     this.refresh();
  //     // Trigger table refresh or update state here!
  //   }
  // }

  async openHeatModal(type: string, heat?: any) {
  const modal = await this.modalCtrl.create({
    component: HeatModalComponent,
    componentProps: {
      type: type,
      heat: heat
    }
  });

  await modal.present();

  const { data, role } = await modal.onDidDismiss();

  if (role === 'confirm' && data?.updated) {
    console.log('Received updated data from modal:', data);
    this.refresh(); // Now triggers refresh perfectly!
  }
}

    onClickSearchIcon(){
    if(this.isSearchbarVisible === false){
      this.isSearchbarVisible = true;
    }
  }

  onCloseSearchbar(){
    if(this.isSearchbarVisible === true){
      this.isSearchbarVisible = false;
    }
  }
}