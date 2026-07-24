import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { Subscription, firstValueFrom } from 'rxjs';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { InputHandlerService } from 'src/app/utils/input-handler/input-handler.service';
import { AlertController, ToastController } from '@ionic/angular';
import { ColumnConfig } from 'src/app/shared/interface';
import { PregnancyModalComponent } from './pregnancy-modal/pregnancy-modal.component';
import { ModalController, IonRange, IonImg } from '@ionic/angular/standalone';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { SystemService } from 'src/app/services/system/system.service';
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";
import { CalvingModalComponent } from '../calving/calving-modal/calving-modal.component';

@Component({
  selector: 'app-pregnancy',
  templateUrl: './pregnancy.page.html',
  styleUrls: ['./pregnancy.page.scss'],
  standalone: true,
  imports: [IonImg, IonRange, SharedImportsModule, CustomHeaderComponent]
})
export class PregnancyPage implements OnInit, OnDestroy {
  private modalCtrl = inject(ModalController);

  results = signal<any[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  p = signal(1);
  activeRange: number = 0.033;

  filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
  options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };


  public tableColumns: ColumnConfig[] = [
    { key: 'tagNo', label: 'Tag No. | Name', visible: true },
    { key: 'deviceNo', label: 'Collar Tag', visible: true },
    { key: 'resultStatus', label: 'Result Status', visible: true },
    { key: 'checkDate', label: 'Check Date', visible: true },
    { key: 'expectedCalving', label: 'Expected Calving', visible: true },
    { key: 'hasCalved', label: 'Has Calved?', visible: true },
    { key: 'actions', label: 'Actions', visible: true }
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
    this.setRange(0.033);
    this.initSyncs();
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

  async loadPregnancies() {
    this.isLoading.set(true);
    this.options.offset = (this.p() - 1) * this.options.limit;

    try {
      const res = await firstValueFrom(this.chmsService.getPregnancies({
        filter: this.filter,
        options: this.options
      }));

      const mapped = (res?.items ?? []).map((item: any) => ({
        ...item,
        isEditing: false,
        uiHasCalved: undefined,
        uiFailureReason: 'Misscarriage',
        editForm: { result: '', occurredAt: '', expectedCalvingDate: '' }
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

  // ─── INLINE CRUD EDIT MODIFIERS ───
  startInlineEdit(item: any) {
    item.isEditing = true;
    item.editForm = {
      result: item.result,
      occurredAt: item.occurredAt ? new Date(item.occurredAt).toISOString().split('T')[0] : '',
      expectedCalvingDate: item.expectedCalvingDate ? new Date(item.expectedCalvingDate).toISOString().split('T')[0] : ''
    };
  }

  cancelInlineEdit(item: any) {
    item.isEditing = false;
  }

  async saveInlineEdit(item: any) {
    try {
      await firstValueFrom(this.chmsService.updatePregnancy({
        pregnancyId: item.id || item._id,
        input: {
          result: item.editForm.result,
          occurredAt: new Date(item.editForm.occurredAt).toISOString(),
          expectedCalvingDate: item.editForm.expectedCalvingDate ? new Date(item.editForm.expectedCalvingDate).toISOString() : null
        }
      }));
      this.showToast('Pregnancy record metrics updated.');
      this.refresh();
    } catch (err: any) {
      this.showToast(err.message || 'Update failed.', 'danger');
    }
  }

  async executeSoftDelete(item: any) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Record',
      message: 'Remove this pregnancy entry from active tracking charts?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.chmsService.deletePregnancy(item.id || item._id));
              this.showToast('Record deleted successfully.');
              this.refresh();
            } catch {
              this.showToast('Deletions failed.', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // ─── LIFECYCLE RESOLUTION LOGIC ───
  toggleResolutionState(item: any, hasCalved: boolean) {
    item.uiHasCalved = hasCalved;
  }

  async executeResolution(item: any) {
    const statusLabel = item.uiHasCalved ? 'Calved (New Lactation Setup)' : `Failed Delivery [${item.uiFailureReason}]`;
    const alert = await this.alertCtrl.create({
      header: 'Process Lifecycle Change',
      message: `Deactivate pregnancy tracking line and mark as: ${statusLabel}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Proceed',
          handler: async () => {
            try {
              await firstValueFrom(this.chmsService.resolvePregnancySelection({
                pregnancyId: item.id || item._id,
                hasCalved: item.uiHasCalved,
                resolutionInput: {
                  occurredAt: new Date().toISOString(),
                  failureReason: !item.uiHasCalved ? item.uiFailureReason : null,
                  note: item.uiHasCalved ? "Successful Delivery" : `Failed calving lifecycle state: ${item.uiFailureReason}`
                }
              }));
              this.showToast('Event resolved successfully.');
              this.refresh();
            } catch (err: any) {
              this.showToast(err.message || 'Resolution execution failed.', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: string = 'success') {
    const t = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }

  refresh() { this.p.set(1); this.loadPregnancies(); }
  onPageChange(page: number) { this.p.set(page); this.loadPregnancies(); }
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
  clearDates() { this.setRange(0.033); }
  private syncSelections() {
    const { targetPath, farmId } = this.eventUtil.getSavedSelections();
    this.filter.targetPath = targetPath;
    this.filter.farmId = farmId;
  }
  ngOnDestroy() { this.subs.unsubscribe(); }

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

  async openCalvingModal(type: string, calving?: any) {
      const modal = await this.modalCtrl.create({
        component: CalvingModalComponent, // This should be your actual modal component
        // 🌟 Pass data into the Modal component's @Input fields
        componentProps: {
          type: type,
          calving: calving
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