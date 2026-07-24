import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { Subscription, firstValueFrom } from 'rxjs';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { InputHandlerService } from 'src/app/utils/input-handler/input-handler.service';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { ColumnConfig } from 'src/app/shared/interface';
import { ModalController, IonText, IonImg } from '@ionic/angular/standalone';
import { InseminationModalComponent } from './insemination-modal/insemination-modal.component';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { AnimalService } from 'src/app/services/animal/animal.service';
import { SystemService } from 'src/app/services/system/system.service';
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";
import { PregnancyModalComponent } from '../pregnancy/pregnancy-modal/pregnancy-modal.component';

@Component({
  selector: "app-insemination",
  templateUrl: "./insemination.page.html",
  styleUrls: ["./insemination.page.scss"],
  standalone: true,
  imports: [IonImg, SharedImportsModule, IonText, CustomHeaderComponent],
})
export class InseminationPage implements OnInit, OnDestroy {

  private modalCtrl = inject(ModalController);


  // UI State Signals
  results = signal<any[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  p = signal(1);
  maxDate = new Date().toISOString();
  activeRange: number = 1;
  isCreateModalOpen = false;

  // Static Dropdown Catalogs
  readonly indianSemenCompanies = ['ABS India', 'BAIF', 'SAG (NDDB)', 'Amul R&D', 'Mehsana Union', 'JK Trust'];
  readonly indianBreeds = ['Gir', 'Sahiwal', 'Red Sindhi', 'Tharparkar', 'Holstein Friesian (HF)', 'Jersey', 'Crossbred HF'];
  readonly semenTypes = ['Sexed Semen (90%+ Female Selection)', 'Conventional Semen (Standard)', 'High Genomic Index Straw'];

  // Asset Inventories
  farmBulls = signal<any[]>([]);
  femaleCattleInventory = signal<any[]>([]);

  // Logic Objects (Matches Backend Inputs)
  filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
  options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };

  // New Manual Record Model Form Binding
  newIns = { animalId: '', process: 'Artificial', selectedBullId: '', customBullName: '', semenCompany: '', semenBreed: '', semenType: '', occurredAt: '', note: '' };

  // // 🟢 FRONTEND PRESENTATION MATRIX FOR CUSTOM HIDING/SHOWING
  // public tableColumns: ColumnConfig[] = [
  //   { key: 'tagNo', label: 'Tag No. | Name', visible: true },
  //   { key: 'collar', label: 'Collar Tag', visible: true },
  //   { key: 'farm', label: 'Farm Name', visible: true },
  //   { key: 'breed', label: 'Breed', visible: true },
  //   { key: 'status', label: 'Status', visible: true },
  //   { key: 'actions', label: 'Actions', visible: true }
  // ];

  // 🟢 FRONTEND PRESENTATION MATRIX FOR CUSTOM HIDING/SHOWING
public tableColumns: ColumnConfig[] = [
  { key: 'tagNo', label: 'Tag No. | Name', visible: true },
  { key: 'deviceNo', label: 'Collar Tag', visible: true },
  { key: 'serviceMethod', label: 'Service Method', visible: true },
  { key: 'semenProperties', label: 'Semen / Bull Properties', visible: true },
  { key: 'detectedServed', label: 'Detected / Served', visible: true },
  { key: 'pregnancyConfirmed', label: 'Is Pregnancy Confirmed?', visible: true },
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
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.syncSelections();
    this.activeRange = 1;
    this.setRange(1); // Initial load (1 Day)
    this.loadAssetInventories();
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
      this.loadAssetInventories();
      this.refresh();
    }));
  }

  async loadAssetInventories() {
    try {
      const male = await firstValueFrom(this.animalService.getAnimals({ filter: { farmId: this.filter.farmId, gender: 'MALE' }, options: { limit: 100, offset: 0 } }));
      this.farmBulls.set(male?.items || []);
      const female = await firstValueFrom(this.animalService.getAnimals({ filter: { farmId: this.filter.farmId, gender: 'FEMALE' }, options: { limit: 300, offset: 0 } }));
      this.femaleCattleInventory.set(female?.items || []);
    } catch (e) { console.error(e); }
  }

  async loadInseminations() {
    this.isLoading.set(true);
    this.options.offset = (this.p() - 1) * this.options.limit;

    try {
      const res = await firstValueFrom(this.chmsService.getInseminations({
        filter: this.filter,
        options: this.options
      }));

      // Inject Workspace UI variables for inline workflows
      const rawItems = res?.items ?? [];
      this.results.set(rawItems.map((i: any) => ({
        ...i,
        pregSelection: null,
        isEditing: false,
        editProcess: i.process || 'Artificial',
        editBullId: '',
        customBullName: '',
        editCompany: i.company || '',
        editBreed: i.breed || '',
        editType: i.type || '',
        editOccurredAt: i.occurredAt ? i.occurredAt.slice(0, 10) : '',
        editNote: i.note || ''
      })));

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

  // --- Workflow Resolution Engine ---
  async handlePregnancyResolution(item: any, choice: 'YES' | 'NO') {
    const confirmationPromptText = choice === 'YES'
      ? `Confirming pregnancy will automatically execute backend status advances, deactivate Insemination record, and open a fresh Pregnant data node for Cow ${item.animal?.tagNo || ''}. Continue?`
      : `Selecting 'No' will report this sequence iteration as a negative verification event loop and deactivate this active service node. Continue?`;

    const alert = await this.alertCtrl.create({
      header: 'Workflow Lifecycle Advancement',
      message: confirmationPromptText,
      buttons: [
        { text: 'Cancel', role: 'cancel', handler: () => item.pregSelection = null },
        {
          text: 'Confirm',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Committing transaction records...' });
            await loading.present();
            try {
              // 1. Fire universal state deactivation mutation to close service node loop
              await firstValueFrom(this.chmsService.deactivateEvent(item.id, 'Insemination'));

              // 2. If positive signal, chain parameters downstream to instantiate pregnancy data node
              if (choice === 'YES') {
                await firstValueFrom(this.chmsService.createPregnancy({
                  animalId: item.animal?.id || item.animal?._id,
                  result: 'Positive',
                  occurredAt: new Date().toISOString()
                }));
              }

              // 3. Update view layout array natively
              this.results.set(this.results().filter(r => r.id !== item.id));
              this.totalCount.set(Math.max(0, this.totalCount() - 1));

              const toast = await this.toastCtrl.create({ message: 'Cycle status transformation completed.', duration: 2000, color: 'success' });
              await toast.present();
            } catch (err: any) {
              const toast = await this.toastCtrl.create({ message: err?.message || 'Transaction processing fault.', duration: 2500, color: 'danger' });
              await toast.present();
              item.pregSelection = null;
            } finally { loading.dismiss(); }
          }
        }
      ]
    });
    await alert.present();
  }

  // --- Inline Workspace Updates ---
  startInlineEdit(item: any) {
    item.editProcess = item.process || 'Artificial';
    item.editCompany = item.company || '';
    item.editBreed = item.breed || '';
    item.editType = item.type || '';
    item.editOccurredAt = item.occurredAt ? item.occurredAt.slice(0, 10) : '';
    item.editNote = item.note || '';
    item.isEditing = true;
  }

  cancelInlineEdit(item: any) { item.isEditing = false; }

  async saveInlineEdit(item: any) {
    const loading = await this.loadingCtrl.create({ message: 'Synchronizing payload blocks...' });
    await loading.present();
    try {
      let bName = null;
      if (item.editProcess === 'Natural') {
        const matched = this.farmBulls().find(b => b.id === item.editBullId);
        bName = matched ? `${matched.tagNo}` : item.customBullName || 'Farm Bull';
      }

      const res = await firstValueFrom(this.chmsService.updateInsemination({
        inseminationId: item.id,
        process: item.editProcess,
        bullName: bName,
        company: item.editProcess === 'Artificial' ? item.editCompany : null,
        breed: item.editProcess === 'Artificial' ? item.editBreed : null,
        type: item.editProcess === 'Artificial' ? item.editType : null,
        occurredAt: new Date(item.editOccurredAt).toISOString(),
        note: item.editNote
      }));

      const payloadOutput = res?.data?.updateInsemination;
      if (payloadOutput) {
        item.process = payloadOutput.process;
        item.bullName = payloadOutput.bullName;
        item.company = payloadOutput.company;
        item.breed = payloadOutput.breed;
        item.type = payloadOutput.type;
        item.occurredAt = payloadOutput.occurredAt;
        item.note = payloadOutput.note;
        item.isEditing = false;

        const toast = await this.toastCtrl.create({ message: 'Record entry modernized.', duration: 1500, color: 'success' });
        await toast.present();
      } else {
        this.refresh(); // Fallback update alignment
      }
    } catch (e: any) {
      const toast = await this.toastCtrl.create({ message: e?.message || 'Update processing failed.', duration: 2500, color: 'danger' });
      await toast.present();
    } finally { loading.dismiss(); }
  }

  async deleteInseminationItem(item: any) {
    const alert = await this.alertCtrl.create({
      header: 'Purge Service Entry',
      message: `Remove this confirmation record number safely?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Purge permanently',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Dropping database links...' });
            await loading.present();
            try {
              await firstValueFrom(this.chmsService.deleteInsemination(item.id));
              this.results.set(this.results().filter(r => r.id !== item.id));
              this.totalCount.set(Math.max(0, this.totalCount() - 1));
              const toast = await this.toastCtrl.create({ message: 'Item dropped.', duration: 1500, color: 'success' });
              await toast.present();
            } catch (err: any) { console.error(err); }
            finally { loading.dismiss(); }
          }
        }
      ]
    });
    await alert.present();
  }

  openCreateModal() {
    this.newIns = {
      animalId: '', process: 'Artificial', selectedBullId: '', customBullName: '',
      semenCompany: 'ABS India', semenBreed: 'Gir', semenType: 'Conventional Semen (Standard)',
      occurredAt: new Date().toISOString().slice(0, 10), note: ''
    };
    this.isCreateModalOpen = true;
  }

  async submitManualInsemination() {
    if (!this.newIns.animalId) return;
    const loading = await this.loadingCtrl.create({ message: 'Forging new straw mapping index...' });
    await loading.present();
    try {
      let bName = null;
      if (this.newIns.process === 'Natural') {
        const matched = this.farmBulls().find(b => b.id === this.newIns.selectedBullId);
        bName = matched ? `${matched.tagNo}` : this.newIns.customBullName || 'External Service Bull';
      }

      const res = await firstValueFrom(this.chmsService.createInsemination({
        input: {
          animalId: this.newIns.animalId,
          process: this.newIns.process,
          bullName: bName,
          semenCompany: this.newIns.process === 'Artificial' ? this.newIns.semenCompany : null,
          semenBreed: this.newIns.process === 'Artificial' ? this.newIns.semenBreed : null,
          semenType: this.newIns.process === 'Artificial' ? this.newIns.semenType : null,
          occurredAt: new Date(this.newIns.occurredAt).toISOString(),
          note: this.newIns.note
        }
      }));

      if (res) {
        this.isCreateModalOpen = false;
        this.refresh();
        const toast = await this.toastCtrl.create({ message: 'Record created.', duration: 1500, color: 'success' });
        await toast.present();
      }
    } catch (e) { console.error(e); }
    finally { loading.dismiss(); }
  }

  // --- UI Action Handlers ---

  refresh() { this.p.set(1); this.loadInseminations(); }

  onPageChange(page: number) { this.p.set(page); this.loadInseminations(); }

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
    this.activeRange = 1;
    this.setRange(1);
  }

  private syncSelections() {
    const { targetPath, farmId } = this.eventUtil.getSavedSelections();
    this.filter.targetPath = targetPath;
    this.filter.farmId = farmId;
  }

  ngOnDestroy() { this.subs.unsubscribe(); }


  async openInseminationModal(type: string, insemination?: any) {
    const modal = await this.modalCtrl.create({
      component: InseminationModalComponent,
      // 🌟 Pass data into the Modal component's @Input fields
      componentProps: {
        type: type,
        insemination: insemination
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

   async openPregnancyModal(type: string, pregnancy?: any) {
      const modal = await this.modalCtrl.create({
        component: PregnancyModalComponent,
        componentProps: {
          type: type,
          pregnancy: pregnancy
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