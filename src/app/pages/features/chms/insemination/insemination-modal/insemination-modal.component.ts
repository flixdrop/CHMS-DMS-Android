import { Component, inject, Input, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, AlertController, IonItemGroup, IonItemDivider } from '@ionic/angular/standalone';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { firstValueFrom } from 'rxjs';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { AnimalService } from 'src/app/services/animal/animal.service';

@Component({
  selector: 'app-insemination-modal',
  templateUrl: './insemination-modal.component.html',
  styleUrls: ['./insemination-modal.component.scss'],
  standalone: true,
  imports: [SharedImportsModule, ReactiveFormsModule, IonItemGroup, IonItemDivider]
})
export class InseminationModalComponent implements OnInit {
  @Input() type: 'create' | 'edit' | 'delete' | 'resolve' = 'create';
  @Input() insemination?: any;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private animalService = inject(AnimalService);
  private chmsService = inject(CattleMonitoringService);
  private eventUtil = inject(EventUtilityService);
  private cdr = inject(ChangeDetectorRef);

  public inseminationForm!: FormGroup;
  public submitting = signal(false);
  public maxDate = new Date().toISOString().slice(0, 16);

  // Static Dropdown Catalogs
  readonly indianSemenCompanies = ['ABS India', 'BAIF', 'SAG (NDDB)', 'Amul R&D', 'Mehsana Union', 'JK Trust'];
  readonly indianBreeds = ['Gir', 'Sahiwal', 'Red Sindhi', 'Tharparkar', 'Holstein Friesian (HF)', 'Jersey', 'Crossbred HF'];
  readonly semenTypes = ['Sexed Semen (90%+ Female Selection)', 'Conventional Semen (Standard)', 'High Genomic Index Straw'];

  public femaleCattleInventory: any[] = [];
  public filteredFemaleInventory: any[] = [];
  private farmId: string = '';

  ngOnInit() {
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
    if (this.insemination?.occurredAt) {
      const d = isNaN(Number(this.insemination.occurredAt)) ? new Date(this.insemination.occurredAt) : new Date(Number(this.insemination.occurredAt));
      initialDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } else {
      const now = new Date();
      initialDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    const currentProcess = this.insemination?.process || 'Artificial';

    this.inseminationForm = this.fb.group({
      animalId: [this.insemination?.animal?.id || this.insemination?.animal?._id || this.insemination?.animalId || '', [Validators.required]],
      process: [currentProcess, [Validators.required]],
      bullName: [this.insemination?.bullName || ''],
      semenCompany: [this.insemination?.company || this.insemination?.semenDetails?.company || ''],
      semenBreed: [this.insemination?.breed || this.insemination?.semenDetails?.breed || ''],
      semenType: [this.insemination?.type || this.insemination?.semenDetails?.type || ''],
      occurredAt: [initialDate, [Validators.required]],
      note: [this.insemination?.note || ''],

      // Control input parameter specifically optimized to manage 'resolve' configurations
      pregnancyVerified: ['YES']
    });

    if (this.type === 'delete') {
      this.inseminationForm.disable();
    } else if (this.type === 'resolve') {
      // Set the validation context for resolution flow
      this.inseminationForm.get('pregnancyVerified')?.setValidators([Validators.required]);
      this.inseminationForm.get('process')?.clearValidators();
      this.inseminationForm.get('occurredAt')?.clearValidators();
    } else {
      this.onProcessChange();
    }
  }

  /**
   * Evaluates breeding process switches and dynamically adapts validation criteria.
   */
  public onProcessChange(): void {
    if (this.type === 'resolve') return;

    const processValue = this.inseminationForm.get('process')?.value;
    const bullCtrl = this.inseminationForm.get('bullName');
    const companyCtrl = this.inseminationForm.get('semenCompany');
    const breedCtrl = this.inseminationForm.get('semenBreed');
    const typeCtrl = this.inseminationForm.get('semenType');

    if (processValue === 'Natural') {
      bullCtrl?.setValidators([Validators.required]);
      companyCtrl?.clearValidators();
      breedCtrl?.clearValidators();
      typeCtrl?.clearValidators();
    } else {
      bullCtrl?.clearValidators();
      bullCtrl?.setValue('');

      // Inject native dropdown baseline selection states if handling an empty create view
      if (this.type === 'create') {
        if (!companyCtrl?.value) companyCtrl?.setValue('ABS India');
        if (!breedCtrl?.value) breedCtrl?.setValue('Gir');
        if (!typeCtrl?.value) typeCtrl?.setValue('Conventional Semen (Standard)');
      }
    }

    bullCtrl?.updateValueAndValidity();
    companyCtrl?.updateValueAndValidity();
    breedCtrl?.updateValueAndValidity();
    typeCtrl?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  private async loadActiveFemaleInventory(): Promise<void> {
    try {
      const res = await firstValueFrom(this.animalService.getAnimals({
        filter: { farmId: this.farmId },
        options: { limit: 250, offset: 0 }
      }));

      const rawItems = res?.items || [];
      this.femaleCattleInventory = rawItems.filter((cattle: any) => cattle?.sex === 'Female' || cattle?.gender?.toUpperCase() === 'FEMALE');
      this.filteredFemaleInventory = [...this.femaleCattleInventory];
      this.cdr.detectChanges();
    } catch (err) {
      console.error("Error pulling female herd assets:", err);
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
    this.inseminationForm.get('animalId')?.setValue(cattle.id || cattle._id);
    this.inseminationForm.get('animalId')?.markAsDirty();
    popover.dismiss();
  }

  public getSelectedFemaleLabel(): string {
    const currentId = this.inseminationForm.get('animalId')?.value;
    if (!currentId) return 'Select Targeted Female Cattle';

    if (this.insemination?.animal?.id === currentId || this.insemination?.animal?._id === currentId) {
      return `${this.insemination.animal.tagNo} ${this.insemination.animal.name ? '• ' + this.insemination.animal.name : ''}`.trim();
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
    if (this.inseminationForm.invalid) {
      this.inseminationForm.markAllAsTouched();
      return;
    }

    const formPayload = this.inseminationForm.value;
    this.submitting.set(true);

    try {
      if (this.type === 'create') {
        const isoStringDate = new Date(formPayload.occurredAt).toISOString();
        await firstValueFrom(this.chmsService.createInsemination({
          input: {
            animalId: formPayload.animalId,
            process: formPayload.process,
            bullName: formPayload.process === 'Natural' ? formPayload.bullName?.trim() : null,
            semenCompany: formPayload.process === 'Artificial' ? formPayload.semenCompany : null,
            semenBreed: formPayload.process === 'Artificial' ? formPayload.semenBreed : null,
            semenType: formPayload.process === 'Artificial' ? formPayload.semenType : null,
            occurredAt: isoStringDate,
            note: formPayload.note?.trim() || ''
          }
        }));
        await this.handleSuccessMsg('Insemination record generated and locked to animal history tree.');

      } else if (this.type === 'edit') {
        const isoStringDate = new Date(formPayload.occurredAt).toISOString();
        await firstValueFrom(this.chmsService.updateInsemination({
          inseminationId: this.insemination.id || this.insemination._id,
          process: formPayload.process,
          bullName: formPayload.process === 'Natural' ? formPayload.bullName?.trim() : null,
          company: formPayload.process === 'Artificial' ? formPayload.semenCompany : null,
          breed: formPayload.process === 'Artificial' ? formPayload.semenBreed : null,
          type: formPayload.process === 'Artificial' ? formPayload.semenType : null,
          occurredAt: isoStringDate,
          note: formPayload.note?.trim() || ''
        }));
        await this.handleSuccessMsg('Breeding record parameters successfully adapted.');

      } else if (this.type === 'resolve') {
        const choice = formPayload.pregnancyVerified;
        const targetInseminationId = this.insemination.id || this.insemination._id;
        const targetAnimalId = formPayload.animalId;

        // 1. Deactivate the active service tracking node loop
        await firstValueFrom(this.chmsService.deactivateEvent(targetInseminationId, 'Insemination'));

        // 2. If confirmation checks out positive, chain parameter downstream to forge a new pregnancy record node
        if (choice === 'YES') {
          await firstValueFrom(this.chmsService.createPregnancy({
            animalId: targetAnimalId,
            result: 'Positive',
            occurredAt: new Date().toISOString()
          }));
          await this.handleSuccessMsg('Workflow advanced successfully: Pregnancy logs instantiated.');
        } else {
          await this.handleSuccessMsg('Workflow closed successfully: Record flagged as negative verification cycle.');
        }
      }

    } catch (err: any) {
      await this.handleFailureMsg(err);
    }
  }

  async onDelete(): Promise<void> {
    if (!this.insemination?.id && !this.insemination?._id) return;
    const activeLabel = this.getSelectedFemaleLabel() || 'this record';

    await this.showAlert({
      header: 'Delete Insemination Record?',
      subHeader: `Are you sure you want to drop the breeding row associated with ${activeLabel}?`,
      isConfirmDialog: true,
      confirmButtonText: 'Confirm',
      role: 'error',
      onConfirmAction: () => this.executeInseminationDeletionPipeline()
    });
  }

  private async executeInseminationDeletionPipeline(): Promise<void> {
    this.submitting.set(true);
    try {
      const targetId = this.insemination.id || this.insemination._id;
      await firstValueFrom(this.chmsService.deleteInsemination(targetId));
      await this.handleSuccessMsg('Breeding timeline tracking block purged safely.');
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
      subHeader: err?.message || 'The server rejected your request payload configuration.',
      role: 'error'
    });
  }

  closeModal(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}