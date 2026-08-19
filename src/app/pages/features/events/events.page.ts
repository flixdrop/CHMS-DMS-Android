import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { Subscription, firstValueFrom } from 'rxjs';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { InputHandlerService } from 'src/app/utils/input-handler/input-handler.service';
import { ColumnConfig } from 'src/app/shared/interface';
import { IonCard, IonNote, ModalController, ToastController, LoadingController } from '@ionic/angular/standalone';
import { HeatModalComponent } from '../chms/heat/heat-modal/heat-modal.component';
import { HealthModalComponent } from '../chms/health/health-modal/health-modal.component';
import { InseminationModalComponent } from '../chms/insemination/insemination-modal/insemination-modal.component';
import { PregnancyModalComponent } from '../chms/pregnancy/pregnancy-modal/pregnancy-modal.component';
import { CalvingModalComponent } from '../chms/calving/calving-modal/calving-modal.component';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { AnimalService } from 'src/app/services/animal/animal.service';
import { SystemService } from 'src/app/services/system/system.service';
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";

@Component({
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
  standalone: true,
  imports: [SharedImportsModule, IonCard, IonNote, CustomHeaderComponent],
})
export class EventsPage implements OnInit, OnDestroy {

  private modalCtrl = inject(ModalController);

  // UI State Signals
  results = signal<any[]>([]);
  farmBulls = signal<any[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  p = signal(1);
  maxDate = new Date().toISOString();
  activeRange: number = -1;

  isCreateModalOpen = false;
  femaleCattleInventory = signal<any[]>([]);

  newHeat = {
    animalId: '',
    heatStrength: 'MEDIUM',
    isSilent: false,
    occurredAt: '',
  };

  // Static Dropdown Master Catalogs
  readonly indianSemenCompanies: string[] = [
    'ABS India', 'BAIF (Bharatiya Agro Industries Foundation)', 'SAG (Sabarmati Ashram Gaushala / NDDB)',
    'Amul Research and Development Association', 'Mehsana District Co-operative Milk Producers Union',
    'MDFV (Milkfed Punjab / Punjab Breeding)', 'Alwar Semen Station (Rajasthan)', 'Haldwani Semen Station (Uttarakhand)',
    'Deep Frozen Semen Station (Bhadbhada, MP)', 'Central Cattle Breeding Farm (CCBF)', 'JK Trust (JK Bovagen)',
    'Sagar Semen Station', 'Government State Semen Bank / Animal Husbandry Dept',
  ];

  readonly indianBreeds: string[] = [
    'Gir', 'Sahiwal', 'Red Sindhi', 'Tharparkar', 'Kankrej', 'Hariana', 'Rathi',
    'Murrah (Buffalo)', 'Jafarabadi (Buffalo)', 'Nili Ravi (Buffalo)', 'Holstein Friesian (HF)',
    'Jersey', 'Crossbred HF (CB HF)', 'Crossbred Jersey (CB Jersey)',
  ];

  readonly semenTypes: string[] = [
    'Sexed Semen (90%+ Female Selection)', 'Conventional Semen (Standard)',
    'High Genomic Index Straw', 'Imported Genetics Straw',
  ];

  // Logic Objects (Matches Backend Timeline Input Schema)
  filter = {
    targetPath: '',
    farmId: '',
    search: '',
    startDate: '',
    endDate: '',
    eventType: null // 👈 Added: Allows selective filtering (Heat, Health, etc.) or null for everything
  };
  options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };

  // Presentation Matrix for Dynamic Grid Adjustments
  public tableColumns: ColumnConfig[] = [
    { key: 'tagNo', label: 'Tag No. | Name', visible: true },
    { key: 'collar', label: 'Collar Tag', visible: true },
    { key: 'farm', label: 'Farm Name', visible: true },
    { key: 'breed', label: 'Breed', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'actions', label: 'Actions', visible: true }
  ];

  private subs = new Subscription();

  constructor(
    private systemService: SystemService,
    private animalService: AnimalService,
    private chmsService: CattleMonitoringService,
    private eventUtil: EventUtilityService,
    private inputHandler: InputHandlerService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    // 1. First establish contextual selections (farmId, targetPath)
    this.syncSelections();

    // 2. Set default date ranges (this will trigger a refresh() internally)
    this.setRange(-1);

    // 3. Fire background asset catalog lookups safely
    this.loadMaleCattleInventory();
    this.loadFemaleCattleInventory();

    // 4. Bind listeners to catch user runtime changes
    this.initSyncs();
  }

  private initSyncs() {
    this.subs.add(
      this.inputHandler.getSearchStream(400).subscribe((term) => {
        this.filter.search = term;
        this.refresh();
      })
    );

    this.subs.add(
      this.systemService.selectionChanged$.subscribe(() => {
        this.syncSelections();
        this.refresh();
        this.loadMaleCattleInventory();
        this.loadFemaleCattleInventory();
      })
    );
  }

  async loadMaleCattleInventory() {
    if (!this.filter.farmId) return;
    try {
      const res = await firstValueFrom(
        this.animalService.getAnimals({
          filter: { farmId: this.filter.farmId },
          options: { limit: 100, offset: 0 },
        })
      );
      this.farmBulls.set(res?.items ?? []);
    } catch (err) {
      console.error('Error retrieving male asset catalog:', err);
      this.farmBulls.set([]);
    }
  }

  async loadFemaleCattleInventory() {
    if (!this.filter.farmId) return;
    try {
      const res = await firstValueFrom(
        this.animalService.getAnimals({
          filter: { farmId: this.filter.farmId },
          options: { limit: 250, offset: 0 },
        })
      );
      this.femaleCattleInventory.set(res?.items ?? []);
    } catch (err) {
      console.error('Error pulling female herd directory:', err);
      this.femaleCattleInventory.set([]);
    }
  }

  async loadAllEvents() {
  this.isLoading.set(true);
  this.options.offset = (this.p() - 1) * this.options.limit;

  console.log('Sending Unified Timeline Filters:', JSON.stringify(this.filter));

  try {
    const res = await firstValueFrom(
      this.chmsService.getAllEvents({
        filter: this.filter,
        options: this.options,
      })
    );

    console.log('Unified Event Payload Received:', res);

    const mappedItems = (res?.items ?? [])
      .map((item: any) => {
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
          // 🌟 First map everything from the response item
          ...item,

          // 🌟 Explicit identity protection mapping so identifiers are guaranteed
          id: item.id, 
          customTitle: headingText,
          customNote: subText,
          icon: icon,
          occurredAt: item.occurredAt ? new Date(item.occurredAt).getTime() : Date.now(),
          startedAt: item.startedAt ? new Date(item.startedAt).getTime() : Date.now(),
          endedAt: item.endedAt ? new Date(item.endedAt).getTime() : Date.now(),
          tagNo: item.animal?.tagNo || 'Unknown',
          deviceNo: item.animal?.activeTag?.deviceNo || 'N/A',
          // Retaining your specific state management variables
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
          editNote: '',
        };
      })
      .filter((event: any) => event !== null);

    this.results.set(mappedItems);
    this.totalCount.set(res?.totalCount ?? 0);
  } catch (error) {
    console.error('Failed processing unified data streams:', error);
    this.results.set([]);
    this.totalCount.set(0);
  } finally {
    this.isLoading.set(false);
  }
}

  isColumnVisible(key: string): boolean {
    const col = this.tableColumns.find(c => c.key === key);
    return col ? col.visible : true;
  }

  toggleColumnVisibility(key: string): void {
    const col = this.tableColumns.find(c => c.key === key);
    if (col) col.visible = !col.visible;
  }

  openCreateModal() {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    this.newHeat = {
      animalId: '',
      heatStrength: 'MEDIUM',
      isSilent: false,
      occurredAt: localIso,
    };

    this.loadFemaleCattleInventory();
    this.isCreateModalOpen = true;
  }

  async submitManualHeat() {
    if (!this.newHeat.animalId) {
      const toast = await this.toastCtrl.create({
        message: 'Please select a tag number.',
        duration: 2000,
        color: 'warning',
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Registering heat cycle...' });
    await loading.present();

    try {
      const response = await firstValueFrom(
        this.chmsService.createHeat({
          animalId: this.newHeat.animalId,
          heatStrength: this.newHeat.heatStrength,
          isSilent: this.newHeat.isSilent,
          occurredAt: new Date(this.newHeat.occurredAt).toISOString(),
        })
      );

      if (response?.success || response) {
        this.isCreateModalOpen = false;
        this.refresh(); // Better to trigger full refresh to let the service populate animal metrics properly

        const toast = await this.toastCtrl.create({
          message: 'Manual heat recorded successfully.',
          duration: 1500,
          color: 'success',
        });
        await toast.present();
      }
    } catch (err: any) {
      console.error(err);
      const toast = await this.toastCtrl.create({
        message: err?.message || 'Failed saving record.',
        duration: 2500,
        color: 'danger',
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  startInlineEdit(item: any) {
    const dateObj = item.occurredAt ? new Date(item.occurredAt) : new Date();
    const localIso = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    item.editStrength = item.heatStrength || 'MEDIUM';
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
      await firstValueFrom(
        this.chmsService.updateHeat({
          heatId: item.id || item._id,
          heatStrength: item.editStrength,
          isSilentHeat: item.isSilentHeat || false,
          occurredAt: new Date(item.editOccurredAt).toISOString(),
          note: item.editNote?.trim() || '',
        })
      );

      this.refresh();
      item.isEditing = false;

      const toast = await this.toastCtrl.create({
        message: 'Heat log optimized.',
        duration: 1500,
        color: 'success',
      });
      await toast.present();
    } catch (err: any) {
      console.error(err);
      const toast = await this.toastCtrl.create({
        message: err?.message || 'Error updating data record.',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  async deleteHeatItem(item: any) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Confirm Deletion';
    alert.message = `Are you sure you want to drop the heat record for animal tag ${item.animal?.tagNo || 'this animal'}?`;
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
            this.refresh();

            const toast = await this.toastCtrl.create({
              message: 'Entry removed successfully.',
              duration: 1500,
              color: 'success',
            });
            await toast.present();
          } catch (e: any) {
            const toast = await this.toastCtrl.create({
              message: e?.message || 'Failed execution.',
              duration: 2000,
              color: 'danger',
            });
            await toast.present();
          } finally {
            await loading.dismiss();
          }
        },
      },
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

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
          const matchedBull = this.farmBulls().find((b) => b.id === item.selectedBullId);
          finalBullName = matchedBull ? `${matchedBull.tagNo} ${matchedBull.name || ''}`.trim() : 'Farm Bull';
        } else {
          finalBullName = item.customBullName?.trim() || 'Unlisted Breeding Bull';
        }
      }

      inseminationInput = {
        animalId: item.animal?.id || item.animal?._id,
        process: item.aiProcess,
        bullName: item.aiProcess === 'Natural' ? finalBullName : null,
        semenCompany: item.aiProcess === 'Artificial' ? item.semenCompany || null : null,
        semenBreed: item.aiProcess === 'Artificial' ? item.semenBreed || null : null,
        semenType: item.aiProcess === 'Artificial' ? item.semenType || null : null,
        occurredAt: new Date().toISOString(),
      };
    }

    try {
      await firstValueFrom(
        this.chmsService.resolveHeatSelection({
          heatId: item.id || item._id,
          inseminationInput,
        })
      );

      const toast = await this.toastCtrl.create({
        message: 'Heat log updated successfully.',
        duration: 2000,
        color: 'success',
      });
      await toast.present();

      this.refresh();
    } catch (err: any) {
      console.error(err);
      const toast = await this.toastCtrl.create({
        message: err?.message || 'Error executing modification.',
        duration: 2500,
        color: 'danger',
      });
      await toast.present();
      item.uiSelection = null;
    } finally {
      await loading.dismiss();
    }
  }

  refresh() {
    this.p.set(1);
    this.loadAllEvents();
  }

  onPageChange(page: number) {
    this.p.set(page);
    this.loadAllEvents();
  }

  handleInput(event: any) {
    this.inputHandler.search(event.detail.value);
  }

  toggleSort(column: string) {
    this.options.sortOrder = this.options.sortBy === column ? this.options.sortOrder * -1 : -1;
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
    this.activeRange = -1;
    this.setRange(-1);
  }

  // Triggered instantly when a dropdown option is picked
  onEventTypeChange() {
    console.log('Selected event layer focus altered to:', this.filter.eventType);
    this.refresh();
  }

  // Ensures values apply safely before modal container dismissal closes
  applyAndDismiss(modalElement: any) {
    this.refresh();
    modalElement.dismiss(null, 'confirm');
  }

  // UPDATED: Standardized clear handler that completely handles clearing dates and resetting event drop-downs
  clearFilters() {
    this.filter.eventType = null; // Revert selection back to fetching all logs
    this.activeRange = -1;
    this.setRange(-1); // Internally handles this.refresh() invocation execution
  }

  private syncSelections() {
    const saved = this.eventUtil.getSavedSelections();
    this.filter.targetPath = saved?.targetPath || '';
    this.filter.farmId = saved?.farmId || '';
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async openModal(type: string, event?: any) {
    // Fallback initializations
    let modalComponent: any = null;
    let customComponentProps: any = {};

    const typeName = event?.__typename;

    // 🌟 Route everything strictly based on event.__typename
    switch (typeName) {
      case 'Heat':
        modalComponent = HeatModalComponent;
        customComponentProps = {
          type: type, // Pass down 'edit' or 'delete' 
          heat: event
        };
        break;

      case 'Health':
        modalComponent = HealthModalComponent;
        customComponentProps = {
          type: type, // Pass down 'edit' or 'delete'
          health: event
        };
        break;

      case 'Insemination':
        modalComponent = InseminationModalComponent;
        customComponentProps = {
          type: type,
          insemination: event
        };
        break;

      case 'Pregnancy':
        modalComponent = PregnancyModalComponent;
        customComponentProps = {
          type: type,
          pregnancy: event
        };
        break;

      case 'Calving':
        modalComponent = CalvingModalComponent;
        customComponentProps = {
          type: type,
          calving: event
        };
        break;

      default:
        return;
    }

    // Double-check a component was resolved successfully 
    if (!modalComponent) return;

    // Create and show the modal instance
    const modal = await this.modalCtrl.create({
      component: modalComponent,
      componentProps: customComponentProps
    });

    await modal.present();

    // Listen for modal dismissal and refresh if confirmed
    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data?.updated) {
      console.log('Event updated successfully, refreshing dataset...');
      this.refresh();
    }
  }


}