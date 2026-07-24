import { Component, inject, Input, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, AlertController, IonItemGroup, IonItemDivider } from '@ionic/angular/standalone';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { firstValueFrom } from 'rxjs';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { AnimalService } from 'src/app/services/animal/animal.service';

@Component({
  selector: 'app-recovery-modal',
  templateUrl: './recovery-modal.component.html',
  styleUrls: ['./recovery-modal.component.scss'],
  standalone: true,
  imports: [SharedImportsModule, ReactiveFormsModule, IonItemGroup, IonItemDivider]
})
export class RecoveryModalComponent implements OnInit {
  @Input() type: 'create' | 'edit' | 'delete' | 'resolve' = 'create';
  @Input() recovery?: any; // Receives the specific Recovery schema mapping from lists/dashboards

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private animalService = inject(AnimalService);
  private chmsService = inject(CattleMonitoringService);
  private eventUtil = inject(EventUtilityService);
  private cdr = inject(ChangeDetectorRef);

  public recoveryForm!: FormGroup;
  public submitting = signal(false);
  public fileName = signal<string | null>(null);
  public maxDate = new Date().toISOString().slice(0, 16);

  public universalAnimalInventory: any[] = [];
  public filteredAnimalInventory: any[] = [];
  private farmId: string = '';
  private base64FileString: string | null = null;

  ngOnInit() {
    this.syncSavedFarmSelection();
    this.initializeForm();
    this.loadActiveFarmInventory();
  }

  private syncSavedFarmSelection(): void {
    const selections = this.eventUtil.getSavedSelections();
    this.farmId = selections?.farmId || '';
  }

  private initializeForm(): void {
    let initialDate = '';
    let startDate = '';
    
    if (this.recovery?.occurredAt) {
      const d = isNaN(Number(this.recovery.occurredAt)) ? new Date(this.recovery.occurredAt) : new Date(Number(this.recovery.occurredAt));
      initialDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } else {
      const now = new Date();
      initialDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    if (this.recovery?.startedAt) {
      const d = isNaN(Number(this.recovery.startedAt)) ? new Date(this.recovery.startedAt) : new Date(Number(this.recovery.startedAt));
      startDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    const healthIdxString = this.recovery?.healthIndex !== undefined ? String(this.recovery.healthIndex) : '80';

    this.recoveryForm = this.fb.group({
      animalId: [this.recovery?.animal?.id || this.recovery?.animal?._id || this.recovery?.animalId || '', [Validators.required]],
      healthIndex: [healthIdxString, [Validators.required, Validators.min(0), Validators.max(100)]],
      occurredAt: [initialDate, [Validators.required]],
      startedAt: [startDate],
      isTreatmentDone: [false]
    });

    if (this.type === 'delete') {
      this.recoveryForm.disable();
    } else if (this.type === 'resolve') {
      this.toggleTreatmentInputs();
    }
  }

  /**
   * Generates dynamic validation rules for resolution execution matching TreatmentInput.
   */
  public toggleTreatmentInputs(): void {
    const isTreatmentDone = this.recoveryForm.get('isTreatmentDone')?.value;

    if (isTreatmentDone) {
      const txGroup = this.fb.group({
        treatmentType: ['General Checkup', [Validators.required]],
        medicineDetails: [''],
        feedDetails: ['']
      });
      this.recoveryForm.addControl('treatmentDetails', txGroup);
    } else {
      this.recoveryForm.removeControl('treatmentDetails');
      this.base64FileString = null;
      this.fileName.set(null);
    }
    this.cdr.detectChanges();
  }

  /**
   * Reads, processes, and converts uploaded attachments to clean base64 data matrices.
   */
  public onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.fileName.set(file.name);
    const fileReader = new FileReader();
    fileReader.onload = () => {
      this.base64FileString = fileReader.result as string;
    };
    fileReader.readAsDataURL(file);
  }

  private async loadActiveFarmInventory(): Promise<void> {
    try {
      const res = await firstValueFrom(this.animalService.getAnimals({
        filter: { farmId: this.farmId },
        options: { limit: 250, offset: 0 }
      }));
      
      this.universalAnimalInventory = res?.items || [];
      this.filteredAnimalInventory = [...this.universalAnimalInventory];
      this.cdr.detectChanges();
    } catch (err) {
      console.error("Error pulling agricultural livestock matrices:", err);
      this.universalAnimalInventory = [];
      this.filteredAnimalInventory = [];
    }
  }

  public handleAnimalSearch(event: any): void {
    const query = event.target.value?.toLowerCase().trim() || '';
    this.filteredAnimalInventory = query 
      ? this.universalAnimalInventory.filter(c => 
          c.tagNo.toLowerCase().includes(query) || 
          (c.name && c.name.toLowerCase().includes(query))
        )
      : [...this.universalAnimalInventory];
  }

  public selectAnimalCattle(cattle: any, popover: any): void {
    this.recoveryForm.get('animalId')?.setValue(cattle.id || cattle._id);
    this.recoveryForm.get('animalId')?.markAsDirty();
    popover.dismiss();
  }

  public getSelectedAnimalLabel(): string {
    const currentId = this.recoveryForm.get('animalId')?.value;
    if (!currentId) return 'Select Target Livestock';
    
    if (this.recovery?.animal?.id === currentId || this.recovery?.animal?._id === currentId) {
      return `${this.recovery.animal.tagNo} ${this.recovery.animal.name ? '• ' + this.recovery.animal.name : ''}`.trim();
    }

    const match = this.universalAnimalInventory.find(c => (c.id === currentId || c._id === currentId));
    return match ? `${match.tagNo} ${match.name ? '• ' + match.name : ''}`.trim() : 'Select Target Livestock';
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
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    const formPayload = this.recoveryForm.value;
    this.submitting.set(true);

    const stringifiedIndex = String(formPayload.healthIndex);
    const isoOccurredAt = new Date(formPayload.occurredAt).toISOString();

    try {
      if (this.type === 'create') {
        await firstValueFrom(this.chmsService.createHealth({
          animalId: formPayload.animalId,
          healthIndex: stringifiedIndex,
          occurredAt: isoOccurredAt
        }));
        await this.handleSuccessMsg('Livestock medical event logged successfully.');
        
      } else if (this.type === 'edit') {
        const inputPayload: any = {
          healthIndex: stringifiedIndex,
          occurredAt: isoOccurredAt
        };
        if (formPayload.startedAt) {
          inputPayload.startedAt = new Date(formPayload.startedAt).toISOString();
        }

        await firstValueFrom(this.chmsService.updateHealth({
          healthId: this.recovery.id || this.recovery._id,
          input: inputPayload
        }));
        await this.handleSuccessMsg('Health alert logging metadata adjusted smoothly.');
        
      } else if (this.type === 'resolve') {
        let structuralTxInput: any = null;

        if (formPayload.isTreatmentDone && formPayload.treatmentDetails) {
          structuralTxInput = {
            treatmentType: formPayload.treatmentDetails.treatmentType,
            medicineDetails: formPayload.treatmentDetails.medicineDetails || '',
            feedDetails: formPayload.treatmentDetails.feedDetails || '',
            prescriptionAttachment: this.base64FileString && this.fileName() ? {
              filename: this.fileName(),
              base64String: this.base64FileString
            } : null
          };
        }

        await firstValueFrom(this.chmsService.resolveHealthSelection({
          healthId: this.recovery.id || this.recovery._id,
          isTreatmentDone: !!formPayload.isTreatmentDone,
          treatmentDetails: structuralTxInput
        }));
        await this.handleSuccessMsg('Health anomaly successfully resolved and deactivated.');
      }

    } catch (err: any) {
      await this.handleFailureMsg(err);
    }
  }

  async onDelete(): Promise<void> {
    if (!this.recovery?.id && !this.recovery?._id) return;
    const activeLabel = this.getSelectedAnimalLabel() || 'this record';

    await this.showAlert({
      header: 'Delete Health Alert Log?',
      subHeader: `Are you sure you want to completely scrub the health logging index history associated with ${activeLabel}?`,
      isConfirmDialog: true,
      confirmButtonText: 'Confirm',
      role: 'error',
      onConfirmAction: () => this.executeHealthDeletionPipeline()
    });
  }

  private async executeHealthDeletionPipeline(): Promise<void> {
    this.submitting.set(true);
    try {
      const targetId = this.recovery.id || this.recovery._id;
      await firstValueFrom(this.chmsService.deleteHealth(targetId));
      await this.handleSuccessMsg('Health tracking log item deleted from active systems.');
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
      subHeader: err?.message || 'The server rejected your query transaction structural logic.',
      role: 'error'
    });
  }

  closeModal(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}