// import { Component, inject, Input, OnInit, signal, ChangeDetectorRef } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { 
//   ModalController, 
//   IonHeader, 
//   IonToolbar, 
//   IonButtons, 
//   IonButton, 
//   IonIcon, 
//   IonTitle, 
//   IonContent, 
//   IonLabel, 
//   IonItemGroup, 
//   IonItemDivider, 
//   IonList, 
//   IonItem, 
//   IonSelect, 
//   IonSelectOption, 
//   IonInput, 
//   IonTextarea, 
//   IonFooter, 
//   IonSpinner 
// } from '@ionic/angular/standalone';
// import { SharedImportsModule } from "../../../../../shared/shared-imports";

// @Component({
//   selector: 'app-pregnancy-modal',
//   templateUrl: './pregnancy-modal.component.html',
//   styleUrls: ['./pregnancy-modal.component.scss'],
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     IonHeader,
//     IonToolbar,
//     IonButtons,
//     IonButton,
//     IonIcon,
//     IonTitle,
//     IonContent,
//     IonLabel,
//     IonItemGroup,
//     IonItemDivider,
//     IonList,
//     IonItem,
//     IonSelect,
//     IonSelectOption,
//     IonInput,
//     IonTextarea,
//     IonFooter,
//     IonSpinner,
//     SharedImportsModule
// ]
// })
// export class PregnancyModalComponent implements OnInit {
//   @Input() type: 'confirm' | 'cancel' = 'confirm';
//   @Input() pregnancy?: any;

//   private fb = inject(FormBuilder);
//   private modalCtrl = inject(ModalController);
//   private cdr = inject(ChangeDetectorRef);

//   // Synchronously initialize the FormGroup to prevent NG0100
//   public pregnancyForm: FormGroup = this.fb.group({
//     animalId: ['', [Validators.required]],

//     confirmationInput: this.fb.group({
//       method: ['RECTAL_PALPATION'],
//       checkedAt: [new Date().toISOString().slice(0, 10)],
//       examinerName: [''],
//       note: ['']
//     }),

//     cancellationInput: this.fb.group({
//       reasonCategory: ['FailedConception'],
//       nextAction: ['RE_OPEN_HEAT'],
//       remarks: ['']
//     })
//   });

//   public submitting = signal(false);
//   public selectedPreset = signal<string | null>(null);
//   public maxDate: string = new Date().toISOString().slice(0, 10);
//   public calculatedCalvingDate: Date | null = null;

//   public readonly presetRemarks: string[] = [
//     'Normal cycle - Failed conception',
//     'Anestrus / Non-cyclic ovaries',
//     'Uterine infection / Abnormal discharge',
//     'Suspected early embryonic loss',
//     'Cystic ovaries / Irregular heat',
//     'Low Body Condition Score (BCS)'
//   ];

//   ngOnInit(): void {
//     this.setupValidationAndValues();
//     this.calculateExpectedCalvingDate();
//   }

//   private setupValidationAndValues(): void {
//     const todayStr = new Date().toISOString().slice(0, 10);

//     // Dynamic validator assignment without breaking structure
//     if (this.type === 'confirm') {
//       this.pregnancyForm.get('confirmationInput.method')?.setValidators([Validators.required]);
//       this.pregnancyForm.get('confirmationInput.checkedAt')?.setValidators([Validators.required]);
//     } else if (this.type === 'cancel') {
//       this.pregnancyForm.get('cancellationInput.reasonCategory')?.setValidators([Validators.required]);
//       this.pregnancyForm.get('cancellationInput.nextAction')?.setValidators([Validators.required]);
//       this.pregnancyForm.get('cancellationInput.remarks')?.setValidators([Validators.required]);
//     }

//     this.pregnancyForm.patchValue({
//       animalId: this.pregnancy?.animal?.id || this.pregnancy?.animal?._id || '',
//       confirmationInput: {
//         checkedAt: todayStr
//       }
//     });

//     this.pregnancyForm.updateValueAndValidity();
//     // Resolves NG0100 by forcing initial pass synchronization
//     this.cdr.detectChanges();
//   }

//   private calculateExpectedCalvingDate(): void {
//     if (!this.pregnancy?.occurredAt) return;
//     const baseDate = new Date(this.pregnancy.occurredAt);
//     const isBuffalo = this.pregnancy?.animal?.breed?.toLowerCase().includes('buffalo');
//     const gestationDays = isBuffalo ? 310 : 280;

//     const calving = new Date(baseDate);
//     calving.setDate(calving.getDate() + gestationDays);
//     this.calculatedCalvingDate = calving;
//   }

//   public selectPreset(preset: string): void {
//     const cancelGroup = this.pregnancyForm.get('cancellationInput');
//     const remarksCtrl = cancelGroup?.get('remarks');
//     const categoryCtrl = cancelGroup?.get('reasonCategory');
//     const actionCtrl = cancelGroup?.get('nextAction');

//     if (this.selectedPreset() === preset) {
//       this.selectedPreset.set(null);
//       remarksCtrl?.setValue('');
//     } else {
//       this.selectedPreset.set(preset);
//       remarksCtrl?.setValue(preset);

//       if (preset.includes('infection') || preset.includes('discharge')) {
//         categoryCtrl?.setValue('UterineInfection');
//         actionCtrl?.setValue('VET_REVIEW');
//       } else if (preset.includes('Anestrus') || preset.includes('Cystic')) {
//         categoryCtrl?.setValue('ReproductiveIssue');
//         actionCtrl?.setValue('SYNC_PROTOCOL');
//       } else if (preset.includes('loss')) {
//         categoryCtrl?.setValue('EmbryonicLoss');
//         actionCtrl?.setValue('RE_OPEN_HEAT');
//       } else {
//         categoryCtrl?.setValue('FailedConception');
//         actionCtrl?.setValue('RE_OPEN_HEAT');
//       }
//     }

//     remarksCtrl?.markAsDirty();
//     remarksCtrl?.markAsTouched();
//     this.cdr.detectChanges();
//   }

//   public onManualRemarkInput(event: any): void {
//     const val = event.detail?.value || event.target?.value;
//     if (val !== this.selectedPreset()) {
//       this.selectedPreset.set(null);
//     }
//   }

//   async onSubmit(): Promise<void> {
//     if (this.pregnancyForm.invalid) {
//       this.pregnancyForm.markAllAsTouched();
//       return;
//     }

//     this.submitting.set(true);
//     const rawValue = this.pregnancyForm.value;
//     const pregnancyId = this.pregnancy?.id || this.pregnancy?._id;

//     let confirmationInput = null;
//     let cancellationInput = null;

//     if (this.type === 'confirm') {
//       const c = rawValue.confirmationInput;
//       confirmationInput = {
//         animalId: rawValue.animalId,
//         method: c.method,
//         checkedAt: new Date(c.checkedAt).toISOString(),
//         examinerName: c.examinerName?.trim() || null,
//         expectedCalvingDate: this.calculatedCalvingDate?.toISOString(),
//         note: c.note?.trim() || null
//       };
//     } else if (this.type === 'cancel') {
//       const k = rawValue.cancellationInput;
//       cancellationInput = {
//         reasonCategory: k.reasonCategory,
//         nextAction: k.nextAction,
//         remarks: k.remarks?.trim()
//       };
//     }

//     this.modalCtrl.dismiss({
//       updated: true,
//       pregnancyId,
//       confirmationInput,
//       cancellationInput
//     }, 'confirm');
//   }

//   closeModal(): void {
//     this.modalCtrl.dismiss(null, 'cancel');
//   }
// }



import { Component, inject, Input, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { 
  ModalController, 
  ToastController,
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonTitle, 
  IonContent, 
  IonLabel, 
  IonItemGroup, 
  IonItemDivider, 
  IonList, 
  IonItem, 
  IonSelect, 
  IonSelectOption, 
  IonInput, 
  IonTextarea, 
  IonFooter, 
  IonSpinner 
} from '@ionic/angular/standalone';
import { CattleMonitoringService, PregnancyResolutionInput } from 'src/app/services/chms/chms.service';
import { SharedImportsModule } from 'src/app/shared/shared-imports';

@Component({
  selector: 'app-pregnancy-modal',
  templateUrl: './pregnancy-modal.component.html',
  styleUrls: ['./pregnancy-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonLabel,
    IonItemGroup,
    IonItemDivider,
    IonList,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonTextarea,
    IonFooter,
    IonSpinner,
    SharedImportsModule
  ]
})
export class PregnancyModalComponent implements OnInit {
  @Input() type: 'confirm' | 'cancel' = 'confirm';
  @Input() pregnancy?: any;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private chmsService = inject(CattleMonitoringService);
  private cdr = inject(ChangeDetectorRef);

  public pregnancyForm: FormGroup = this.fb.group({
    animalId: ['', [Validators.required]],

    confirmationInput: this.fb.group({
      method: ['RECTAL_PALPATION'],
      checkedAt: [new Date().toISOString().slice(0, 10)],
      examinerName: [''],
      note: ['']
    }),

    cancellationInput: this.fb.group({
      reasonCategory: ['FailedConception'],
      nextAction: ['RE_OPEN_HEAT'],
      remarks: ['']
    })
  });

  public submitting = signal(false);
  public selectedPreset = signal<string | null>(null);
  public maxDate: string = new Date().toISOString().slice(0, 10);
  public calculatedCalvingDate: Date | null = null;

  public readonly presetRemarks: string[] = [
    'Normal cycle - Failed conception',
    'Anestrus / Non-cyclic ovaries',
    'Uterine infection / Abnormal discharge',
    'Suspected early embryonic loss',
    'Cystic ovaries / Irregular heat',
    'Low Body Condition Score (BCS)'
  ];

  ngOnInit(): void {
    this.setupValidationAndValues();
    this.calculateExpectedCalvingDate();
  }

  private setupValidationAndValues(): void {
    const todayStr = new Date().toISOString().slice(0, 10);

    if (this.type === 'confirm') {
      this.pregnancyForm.get('confirmationInput.method')?.setValidators([Validators.required]);
      this.pregnancyForm.get('confirmationInput.checkedAt')?.setValidators([Validators.required]);
    } else if (this.type === 'cancel') {
      this.pregnancyForm.get('cancellationInput.reasonCategory')?.setValidators([Validators.required]);
      this.pregnancyForm.get('cancellationInput.nextAction')?.setValidators([Validators.required]);
      this.pregnancyForm.get('cancellationInput.remarks')?.setValidators([Validators.required]);
    }

    this.pregnancyForm.patchValue({
      animalId: this.pregnancy?.animal?.id || this.pregnancy?.animal?._id || '',
      confirmationInput: {
        checkedAt: todayStr
      }
    });

    this.pregnancyForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  private calculateExpectedCalvingDate(): void {
    if (!this.pregnancy?.occurredAt) return;
    const baseDate = new Date(this.pregnancy.occurredAt);
    const isBuffalo = this.pregnancy?.animal?.breed?.toLowerCase().includes('buffalo');
    const gestationDays = isBuffalo ? 310 : 280;

    const calving = new Date(baseDate);
    calving.setDate(calving.getDate() + gestationDays);
    this.calculatedCalvingDate = calving;
  }

  public selectPreset(preset: string): void {
    const cancelGroup = this.pregnancyForm.get('cancellationInput');
    const remarksCtrl = cancelGroup?.get('remarks');
    const categoryCtrl = cancelGroup?.get('reasonCategory');
    const actionCtrl = cancelGroup?.get('nextAction');

    if (this.selectedPreset() === preset) {
      this.selectedPreset.set(null);
      remarksCtrl?.setValue('');
    } else {
      this.selectedPreset.set(preset);
      remarksCtrl?.setValue(preset);

      if (preset.includes('infection') || preset.includes('discharge')) {
        categoryCtrl?.setValue('UterineInfection');
        actionCtrl?.setValue('VET_REVIEW');
      } else if (preset.includes('Anestrus') || preset.includes('Cystic')) {
        categoryCtrl?.setValue('ReproductiveIssue');
        actionCtrl?.setValue('SYNC_PROTOCOL');
      } else if (preset.includes('loss')) {
        categoryCtrl?.setValue('EmbryonicLoss');
        actionCtrl?.setValue('RE_OPEN_HEAT');
      } else {
        categoryCtrl?.setValue('FailedConception');
        actionCtrl?.setValue('RE_OPEN_HEAT');
      }
    }

    remarksCtrl?.markAsDirty();
    remarksCtrl?.markAsTouched();
    this.cdr.detectChanges();
  }

  public onManualRemarkInput(event: any): void {
    const val = event.detail?.value || event.target?.value;
    if (val !== this.selectedPreset()) {
      this.selectedPreset.set(null);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.pregnancyForm.invalid) {
      this.pregnancyForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const rawValue = this.pregnancyForm.value;
    const pregnancyId = this.pregnancy?.id || this.pregnancy?._id;

    let resolutionInput: PregnancyResolutionInput = {
      occurredAt: new Date().toISOString()
    };

    if (this.type === 'confirm') {
      const c = rawValue.confirmationInput;
      resolutionInput.confirmationInput = {
        animalId: rawValue.animalId,
        method: c.method,
        checkedAt: new Date(c.checkedAt).toISOString(),
        examinerName: c.examinerName?.trim() || null,
        expectedCalvingDate: this.calculatedCalvingDate?.toISOString() || null,
        note: c.note?.trim() || null
      };
    } else if (this.type === 'cancel') {
      const k = rawValue.cancellationInput;
      resolutionInput.cancellationInput = {
        reasonCategory: k.reasonCategory,
        nextAction: k.nextAction,
        remarks: k.remarks?.trim()
      };
      resolutionInput.failureReason = k.remarks?.trim();
    }

    // this.chmsService.resolvePregnancyEvent(pregnancyId, false, resolutionInput).subscribe({
    //   next: async (res) => {
    //     this.submitting.set(false);
    //     await this.showToast(res.message, 'success');
    //     this.modalCtrl.dismiss({ updated: true }, 'confirm');
    //   },
    //   error: async (err) => {
    //     this.submitting.set(false);
    //     await this.showToast(err.message || 'Failed to update pregnancy status', 'danger');
    //   }
    // });

    this.chmsService.resolvePregnancyEvent({
  pregnancyId,
  hasCalved: false,
  resolutionInput
}).subscribe({
  next: async (res) => {
    this.submitting.set(false);
    await this.showToast(res.message, 'success');
    this.modalCtrl.dismiss({ updated: true }, 'confirm');
  },
  error: async (err) => {
    this.submitting.set(false);
    await this.showToast(err.message || 'Failed to update pregnancy status', 'danger');
  }
});

  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  closeModal(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}