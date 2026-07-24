import { Component, inject, Input, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { ModalController, AlertController, IonItemGroup, IonItemDivider } from '@ionic/angular/standalone';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { firstValueFrom } from 'rxjs';
import { SharedImportsModule } from 'src/app/shared/shared-imports';

import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';
import { DairyManagementService } from 'src/app/services/dms/dms.service';
import { AnimalService } from 'src/app/services/animal/animal.service';

addIcons(allIcons);

export const atLeastOneYieldValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const morning = control.get('morning')?.value;
  const afternoon = control.get('afternoon')?.value;
  const evening = control.get('evening')?.value;

  const hasMorning = morning !== null && morning !== undefined && morning !== '';
  const hasAfternoon = afternoon !== null && afternoon !== undefined && afternoon !== '';
  const hasEvening = evening !== null && evening !== undefined && evening !== '';

  return (hasMorning || hasAfternoon || hasEvening) ? null : { requireOneYield: true };
};

@Component({
  selector: 'app-dairy-modal',
  templateUrl: './dairy-modal.component.html',
  styleUrls: ['./dairy-modal.component.scss'],
  standalone: true,
  imports: [SharedImportsModule, ReactiveFormsModule, IonItemGroup, IonItemDivider]
})
export class DairyModalComponent implements OnInit {
  @Input() type: 'create' | 'edit' | 'delete' = 'create';
  @Input() dairy?: any; // Receives pre-mapped item payloads from central timelines

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private dmsService = inject(DairyManagementService);
  private animalService = inject(AnimalService);
  private eventUtil = inject(EventUtilityService);
  private cdr = inject(ChangeDetectorRef);

  public dairyForm!: FormGroup;
  public submitting = signal(false);
  public maxDate = new Date().toISOString().slice(0, 16);

  public femaleCattleInventory: any[] = [];
  public filteredFemaleInventory: any[] = [];
  private farmId: string = '';

  ngOnInit() {
    console.log('Dairy Object Input State Context: ', this.dairy);
    this.syncSavedFarmSelection();
    this.initializeForm();
    this.loadActiveFemaleInventory();
  }

  private syncSavedFarmSelection(): void {
    const selections = this.eventUtil.getSavedSelections();
    this.farmId = selections?.farmId || '';
  }

  private initializeForm(): void {
    let initialDate = '';
    if (this.dairy?.occurredAt) {
      const d = isNaN(Number(this.dairy.occurredAt)) ? new Date(this.dairy.occurredAt) : new Date(Number(this.dairy.occurredAt));
      initialDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } else {
      const now = new Date();
      initialDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    // Determine default log category behavior based on incoming structural type mappings

    this.dairyForm = this.fb.group({
      animalId: [this.dairy?.animal?.id || this.dairy?.animal?._id || this.dairy?.animalId || '', [Validators.required]],
      occurredAt: [initialDate, [Validators.required]],
      note: [this.dairy?.note || '']
    });

    const initMorning = this.dairy?.morningVolume ?? this.dairy?.morningMilk ?? '';
    const initAfternoon = this.dairy?.noonVolume ?? this.dairy?.afternoonMilk ?? '';
    const initEvening = this.dairy?.eveningVolume ?? this.dairy?.eveningMilk ?? '';

    this.dairyForm.addControl('milkInput', this.fb.group({
      morning: [initMorning, [Validators.min(0)]],
      afternoon: [initAfternoon, [Validators.min(0)]],
      evening: [initEvening, [Validators.min(0)]]
    }, { validators: [atLeastOneYieldValidator] }));

  }

  /**
   * Dynamically tracks, injects, and shifts form validation structures depending on 
   * whether users are lodging production yields or retiring cattle status to Dry.
   */
  public toggleDairyInputs(): void {

    // Map properties safely across context variants (e.g. edit payloads vs default values)
    const initMorning = this.dairy?.morningVolume ?? this.dairy?.morningMilk ?? '';
    const initAfternoon = this.dairy?.noonVolume ?? this.dairy?.afternoonMilk ?? '';
    const initEvening = this.dairy?.eveningVolume ?? this.dairy?.eveningMilk ?? '';

    this.dairyForm.addControl('milkInput', this.fb.group({
      morning: [initMorning, [Validators.min(0)]],
      afternoon: [initAfternoon, [Validators.min(0)]],
      evening: [initEvening, [Validators.min(0)]]
    }, { validators: [atLeastOneYieldValidator] }));

    this.cdr.detectChanges();
  }

  private async loadActiveFemaleInventory(): Promise<void> {
    try {
      const res = await firstValueFrom(this.animalService.getAnimals({
        filter: { farmId: this.farmId },
        options: { limit: 250, offset: 0 }
      }));

      const rawItems = res?.items || [];
      this.femaleCattleInventory = rawItems.filter((cattle: any) => cattle?.sex === 'Female');
      this.filteredFemaleInventory = [...this.femaleCattleInventory];
      this.cdr.detectChanges();
    } catch (err) {
      console.error("Error pulling dairy-eligible herd assets:", err);
      this.femaleCattleInventory = [];
      this.filteredFemaleInventory = [];
    }
  }

  public handleFemaleSearch(event: any): void {
    const query = event.target.value?.toLowerCase().trim() || '';
    this.filteredFemaleInventory = query
      ? this.femaleCattleInventory.filter(c =>
        c.tagNo.toLowerCase().includes(query) ||
        (c.name && c.name.toLowerCase().includes(query))
      )
      : [...this.femaleCattleInventory];
  }

  public selectFemaleCattle(cattle: any, popover: any): void {
    this.dairyForm.get('animalId')?.setValue(cattle.id || cattle._id);
    this.dairyForm.get('animalId')?.markAsDirty();
    popover.dismiss();
  }

  public getSelectedFemaleLabel(): string {
    const currentId = this.dairyForm.get('animalId')?.value;
    if (!currentId) return 'Select Animal';

    if (this.dairy?.animal?.id === currentId || this.dairy?.animal?._id === currentId) {
      return `${this.dairy.animal.tagNo} ${this.dairy.animal.name ? '• ' + this.dairy.animal.name : ''}`.trim();
    }

    const match = this.femaleCattleInventory.find(c => (c.id === currentId || c._id === currentId));
    return match ? `${match.tagNo} ${match.name ? '• ' + match.name : ''}`.trim() : 'Select Targeted Female Cattle';
  }

  private async showAlert(config: {
    header: string;
    subHeader?: string;
    message?: string;
    isConfirmDialog?: boolean;
    confirmButtonText?: string;
    role?: 'error' | 'success' | 'warning';
    onConfirmAction?: () => void;
  }): Promise<void> {
    let actionButtons: any[] = ['OK'];

    if (config.isConfirmDialog) {
      actionButtons = [
        { text: 'Cancel', role: 'cancel' },
        {
          text: config.confirmButtonText || 'Confirm',
          role: config.role === 'error' || config.role === 'warning' ? 'destructive' : '',
          handler: () => {
            if (config.onConfirmAction) config.onConfirmAction();
          }
        }
      ];
    }

    const customAlert = await this.alertCtrl.create({
      header: config.header,
      subHeader: config.subHeader,
      message: config.message,
      buttons: actionButtons,
      cssClass: `custom-alert-${config.role || 'info'}`
    });

    await customAlert.present();
  }

  async onSubmit(): Promise<void> {
    if (this.dairyForm.invalid) {
      this.dairyForm.markAllAsTouched();
      return;
    }

    const formPayload = this.dairyForm.value;
    this.submitting.set(true);

    const isoStringDate = new Date(formPayload.occurredAt).toISOString();
    const commonNotes = formPayload.note?.trim() || '';

    try {
      // Isolate individual shift text boxes into pure numeric formats or explicit null structures
      const morningVal = formPayload.milkInput?.morning !== '' && formPayload.milkInput?.morning !== null ? Number(formPayload.milkInput.morning) : null;
      const afternoonVal = formPayload.milkInput?.afternoon !== '' && formPayload.milkInput?.afternoon !== null ? Number(formPayload.milkInput.afternoon) : null;
      const eveningVal = formPayload.milkInput?.evening !== '' && formPayload.milkInput?.evening !== null ? Number(formPayload.milkInput.evening) : null;

      if (this.type === 'create') {
        const milkPayload = {
          animalId: formPayload.animalId,
          occurredAt: isoStringDate, // Synchronized exact naming matching schema
          morningVolume: morningVal,
          noonVolume: afternoonVal,
          eveningVolume: eveningVal,
          note: commonNotes
        };
        await firstValueFrom(this.dmsService.submitMilkEntry(milkPayload));
        await this.handleSuccessMsg('Milk production record submitted successfully.');
      } else if (this.type === 'edit') {
        await firstValueFrom(this.dmsService.updateMilkEntry({
          milkEntryId: this.dairy.id || this.dairy._id,
          occurredAt: isoStringDate,
          morningVolume: morningVal,
          noonVolume: afternoonVal,
          eveningVolume: eveningVal,
          note: commonNotes
        }));
        await this.handleSuccessMsg('Milk production entry modified parameters confirmed.');
      }

    } catch (err: any) {
      await this.handleFailureMsg(err);
    }
  }

  async onDelete(): Promise<void> {
    if (!this.dairy?.id && !this.dairy?._id) return;
    const activeLabel = this.getSelectedFemaleLabel() || 'this operational item';

    await this.showAlert({
      header: 'Permanently Drop Record?',
      subHeader: `Are you completely sure you want to drop this record for ${activeLabel}?`,
      isConfirmDialog: true,
      confirmButtonText: 'Confirm',
      role: 'error',
      onConfirmAction: () => this.executeDairyDeletionPipeline()
    });
  }

  private async executeDairyDeletionPipeline(): Promise<void> {
    this.submitting.set(true);

    try {
      await this.handleSuccessMsg('Operational record removed cleanly.');
    } catch (err: any) {
      await this.handleFailureMsg(err);
    }
  }

  private async handleSuccessMsg(message: string): Promise<void> {
    this.submitting.set(false);
    await this.showAlert({
      header: 'Success',
      message: message,
      role: 'success'
    });
    this.modalCtrl.dismiss({ updated: true }, 'confirm');
  }

  private async handleFailureMsg(err: any): Promise<void> {
    this.submitting.set(false);
    await this.showAlert({
      header: 'Operation Refused',
      subHeader: err?.message || 'The server rejected your payload schema validation rules.',
      role: 'error'
    });
  }

  closeModal(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}