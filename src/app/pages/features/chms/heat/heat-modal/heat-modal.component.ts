import { Component, inject, Input, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  ModalController,
  AlertController,
  IonItemGroup,
  IonItemDivider,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonChip,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSpinner, IonRange
} from '@ionic/angular/standalone';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { firstValueFrom } from 'rxjs';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';
import { AnimalService } from 'src/app/services/animal/animal.service';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';

addIcons(allIcons);

@Component({
  selector: 'app-heat-modal',
  templateUrl: './heat-modal.component.html',
  styleUrls: ['./heat-modal.component.scss'],
  standalone: true,
  imports: [IonRange,
    SharedImportsModule,
    ReactiveFormsModule,
    IonItemGroup,
    IonItemDivider,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonChip,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSpinner
  ]
})
export class HeatModalComponent implements OnInit {
  @Input() type: 'create' | 'edit' | 'delete' | 'confirm' | 'cancel' = 'create';
  @Input() heat?: any;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private animalService = inject(AnimalService);
  private chmsService = inject(CattleMonitoringService);
  private eventUtil = inject(EventUtilityService);
  private cdr = inject(ChangeDetectorRef);

  public heatForm!: FormGroup;
  public submitting = signal(false);
  public selectedPreset = signal<string | null>(null);
  public maxDate: string = new Date().toISOString().slice(0, 16);

  public femaleCattleInventory: any[] = [];
  private farmId: string = '';

  public readonly cattleBreeds: string[] = [
    'Gir', 'Sahiwal', 'Red Sindhi', 'Tharparkar', 'Kankrej', 'Ongole',
    'Rathi', 'Hariana', 'Holstein Friesian (HF)', 'Jersey', 'HF Crossbred',
    'Jersey Crossbred', 'Murrah (Buffalo)', 'Nili-Ravi (Buffalo)',
    'Bhadawari (Buffalo)', 'Mehsana (Buffalo)', 'Jaffarabadi (Buffalo)',
    'Other / Indigenous'
  ];

  public readonly semenCompanies: string[] = [
    'NDDB (National Dairy Development Board)',
    'BAIF Development Research Foundation',
    'ABS India (Genus ABS)',
    'SAG (Sabarmati Ashram Gaushala)',
    'ALIMCO / State Livestock Development Board',
    'Amul Semen Station',
    'Mother Dairy',
    'CRV India',
    'STgenetics India',
    'World Wide Sires (WWS)',
    'Private Local Agency / Other'
  ];

  public readonly semenTypes: string[] = [
    'Conventional Straw',
    'Sexed Semen (Sorted - 90% Female)',
    'Imported High-Pedigree Straw',
    'Genomic Tested Straw'
  ];

  public readonly presetRemarks: string[] = [
    'Technician delayed / Missed optimal window',
    'Metritis / Abnormal vaginal discharge',
    'Silent heat / Signs disappeared before AI',
    'Desired semen straw unavailable',
    'Animal unwell / Low Body Condition Score (BCS)',
    'Repeat breeder - Requires veterinary review',
    'Planned skip by farmer'
  ];

  ngOnInit(): void {
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
    if (this.heat?.occurredAt) {
      const d = isNaN(Number(this.heat.occurredAt)) ? new Date(this.heat.occurredAt) : new Date(Number(this.heat.occurredAt));
      initialDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } else {
      const now = new Date();
      initialDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    // Dynamic Form Validation based on active type
    const cancellationGroup = this.fb.group({
      reasonCategory: ['HealthIssue', this.type === 'cancel' ? [Validators.required] : []],
      healthIssueType: ['Metritis'],
      remarks: ['', this.type === 'cancel' ? [Validators.required] : []]
    });

    const confirmGroup = this.fb.group({
      process: ['Artificial', this.type === 'confirm' ? [Validators.required] : []],
      bullName: [''],
      technicianName: [''],
      occurredAt: [new Date().toISOString().slice(0, 16), this.type === 'confirm' ? [Validators.required] : []],
      semenDetails: this.fb.group({
        type: ['Conventional Straw'],
        company: ['NDDB (National Dairy Development Board)'],
        customCompany: [''],
        breed: ['HF Crossbred'],
        customBreed: [''],
        batchNumber: ['']
      })
    });

    this.heatForm = this.fb.group({
      animalId: [this.heat?.animal?.id || this.heat?.animal?._id || this.heat?.animalId || '', [Validators.required]],
      cancellationInput: cancellationGroup,
      inseminationInput: confirmGroup
    });

    this.setupDynamicValidation();
    this.cdr.detectChanges();
  }

  private setupDynamicValidation(): void {
    if (this.type !== 'confirm') return;

    const insGroup = this.heatForm.get('inseminationInput');
    const semenGroup = insGroup?.get('semenDetails');

    insGroup?.get('process')?.valueChanges.subscribe(procType => {
      const bullCtrl = insGroup.get('bullName');
      if (procType === 'Natural') {
        bullCtrl?.setValidators([Validators.required]);
      } else {
        bullCtrl?.clearValidators();
        bullCtrl?.setValue('');
      }
      bullCtrl?.updateValueAndValidity();
    });

    semenGroup?.get('breed')?.valueChanges.subscribe(breed => {
      const customBreedCtrl = semenGroup.get('customBreed');
      if (breed === 'Other / Indigenous') {
        customBreedCtrl?.setValidators([Validators.required]);
      } else {
        customBreedCtrl?.clearValidators();
        customBreedCtrl?.setValue('');
      }
      customBreedCtrl?.updateValueAndValidity();
    });

    semenGroup?.get('company')?.valueChanges.subscribe(company => {
      const customCompCtrl = semenGroup.get('customCompany');
      if (company === 'Private Local Agency / Other') {
        customCompCtrl?.setValidators([Validators.required]);
      } else {
        customCompCtrl?.clearValidators();
        customCompCtrl?.setValue('');
      }
      customCompCtrl?.updateValueAndValidity();
    });
  }

  // public selectPreset(preset: string): void {
  //   const remarksCtrl = this.heatForm.get('cancellationInput.remarks');
  //   if (this.selectedPreset() === preset) {
  //     this.selectedPreset.set(null);
  //     remarksCtrl?.setValue('');
  //   } else {
  //     this.selectedPreset.set(preset);
  //     remarksCtrl?.setValue(preset);
  //   }
  //   remarksCtrl?.markAsDirty();
  //   remarksCtrl?.markAsTouched();
  // }


  public selectPreset(preset: string): void {
    const cancelGroup = this.heatForm.get('cancellationInput');
    const remarksCtrl = cancelGroup?.get('remarks');
    const categoryCtrl = cancelGroup?.get('reasonCategory');
    const healthCtrl = cancelGroup?.get('healthIssueType');

    if (this.selectedPreset() === preset) {
      // Deselect if tapping the same chip again
      this.selectedPreset.set(null);
      remarksCtrl?.setValue('');
      categoryCtrl?.setValue('ManagementDecision');
      healthCtrl?.setValue(null);
    } else {
      this.selectedPreset.set(preset);
      remarksCtrl?.setValue(preset);

      // 🌟 Dynamically map the category and health issue based on the preset
      if (preset.includes('Metritis')) {
        categoryCtrl?.setValue('HealthIssue');
        healthCtrl?.setValue('Metritis');
      } else if (preset.includes('Silent heat')) {
        categoryCtrl?.setValue('ReproductiveIssue');
        healthCtrl?.setValue('SilentHeat');
      } else if (preset.includes('unwell') || preset.includes('Body Condition')) {
        categoryCtrl?.setValue('HealthIssue');
        healthCtrl?.setValue('LowBCS');
      } else if (preset.includes('Repeat breeder')) {
        categoryCtrl?.setValue('ReproductiveIssue');
        healthCtrl?.setValue('RepeatBreeder');
      } else {
        // Management/Operational presets (Technician delayed, Semen unavailable, Planned skip)
        categoryCtrl?.setValue('ManagementDecision');
        healthCtrl?.setValue(null);
      }
    }

    remarksCtrl?.markAsDirty();
    remarksCtrl?.markAsTouched();
  }

  public onManualRemarkInput(event: any): void {
    if (event.target.value !== this.selectedPreset()) {
      this.selectedPreset.set(null);
    }
  }

  private async loadActiveFemaleInventory(): Promise<void> {
    try {
      const res = await firstValueFrom(this.animalService.getAnimals({
        filter: { farmId: this.farmId },
        options: { limit: 250, offset: 0 }
      }));
      const rawItems = res?.items || [];
      this.femaleCattleInventory = rawItems.filter((c: any) => c?.sex === 'Female');
    } catch {
      this.femaleCattleInventory = [];
    }
  }

  async onSubmit(): Promise<void> {
    if (this.heatForm.invalid) {
      this.heatForm.markAllAsTouched();
      return;
    }

    const formPayload = this.heatForm.value;
    const heatId = this.heat?.id || this.heat?._id;
    this.submitting.set(true);

    let inseminationInput = null;
    let cancellationInput = null;

    if (this.type === 'confirm') {
      const rawIns = formPayload.inseminationInput;
      const semen = rawIns.semenDetails;

      const finalBreed = semen?.breed === 'Other / Indigenous' ? semen?.customBreed?.trim() : semen?.breed;
      const finalCompany = semen?.company === 'Private Local Agency / Other' ? semen?.customCompany?.trim() : semen?.company;

      inseminationInput = {
        animalId: formPayload.animalId,
        process: rawIns.process,
        occurredAt: new Date(rawIns.occurredAt).toISOString(),
        bullName: rawIns.process === 'Natural' ? rawIns.bullName?.trim() : null,
        technicianName: rawIns.technicianName?.trim() || null,
        semenType: rawIns.process === 'Artificial' ? semen?.type : null,
        semenCompany: rawIns.process === 'Artificial' ? finalCompany : null,
        semenBreed: rawIns.process === 'Artificial' ? finalBreed : null,
        semenBatchNumber: rawIns.process === 'Artificial' ? (semen?.batchNumber?.trim() || null) : null
      };
    } else if (this.type === 'cancel') {
      const rawCancel = formPayload.cancellationInput;
      cancellationInput = {
        reasonCategory: rawCancel.reasonCategory,
        healthIssueType: rawCancel.reasonCategory === 'HealthIssue' ? rawCancel.healthIssueType : null,
        remarks: rawCancel.remarks?.trim()
      };
    }

    try {
      // Execute GraphQL Mutation Directly
      const res = await this.chmsService.resolveHeatEvent(
        heatId,
        inseminationInput,
        cancellationInput
      );

      this.submitting.set(false);

      if (res.success) {
        // Dismiss with updated: true so openHeatModal() triggers this.refresh()!
        this.modalCtrl.dismiss({ updated: true, res }, 'confirm');
      } else {
        this.showErrorAlert(res.message || 'Operation failed');
      }
    } catch (err: any) {
      this.submitting.set(false);
      this.showErrorAlert(err.message || 'Network error executing request');
    }
  }

  private async showErrorAlert(msg: string) {
    const alert = await this.alertCtrl.create({
      header: 'Submission Error',
      message: msg,
      buttons: ['OK']
    });
    await alert.present();
  }

  closeModal(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}