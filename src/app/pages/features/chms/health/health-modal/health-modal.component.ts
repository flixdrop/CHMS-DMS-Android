// // import { Component, inject, Input, OnInit, signal, ChangeDetectorRef } from '@angular/core';
// // import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// // import { ModalController, AlertController, IonItemGroup, IonItemDivider } from '@ionic/angular/standalone';
// // import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
// // import { firstValueFrom } from 'rxjs';
// // import { SharedImportsModule } from 'src/app/shared/shared-imports';
// // import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
// // import { AnimalService } from 'src/app/services/animal/animal.service';

// // @Component({
// //   selector: 'app-health-modal',
// //   templateUrl: './health-modal.component.html',
// //   styleUrls: ['./health-modal.component.scss'],
// //   standalone: true,
// //   imports: [SharedImportsModule, ReactiveFormsModule, IonItemGroup, IonItemDivider]
// // })
// // export class HealthModalComponent implements OnInit {
// //   @Input() type: 'create' | 'edit' | 'delete' | 'resolve' = 'create';
// //   @Input() health?: any;

// //   private fb = inject(FormBuilder);
// //   private modalCtrl = inject(ModalController);
// //   private alertCtrl = inject(AlertController);
// //   private animalService = inject(AnimalService);
// //   private chmsService = inject(CattleMonitoringService);
// //   private eventUtil = inject(EventUtilityService);
// //   private cdr = inject(ChangeDetectorRef);

// //   public healthForm!: FormGroup;
// //   public submitting = signal(false);
// //   public maxDate = new Date().toISOString().slice(0, 16);

// //   public cattleInventory: any[] = [];
// //   public filteredCattleInventory: any[] = [];
// //   private farmId: string = '';

// //   public selectedFilePayload: { filename: string; base64String: string } | null = null;

// //   ngOnInit() {
// //     console.log('Health Event in Health Modal: ', this.health);
// //     this.syncSavedFarmSelection();
// //     this.initializeForm();
// //     this.loadActiveCattleInventory();
// //   }

// //   private syncSavedFarmSelection(): void {
// //     const selections = this.eventUtil.getSavedSelections();
// //     this.farmId = selections?.farmId || '';
// //   }

// //   private initializeForm(): void {
// //     let initialDate = '';
// //     if (this.health?.occurredAt) {
// //       const d = isNaN(Number(this.health.occurredAt)) ? new Date(this.health.occurredAt) : new Date(Number(this.health.occurredAt));
// //       initialDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
// //     } else {
// //       const now = new Date();
// //       initialDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
// //     }

// //     const initialIndex = this.health?.healthIndex !== undefined ? Number(this.health.healthIndex) : 30;

// //     this.healthForm = this.fb.group({
// //       animalId: [this.health?.animal?.id || this.health?.animal?._id || this.health?.animalId || '', [Validators.required]],
// //       healthIndex: [initialIndex, [Validators.required, Validators.min(0), Validators.max(100)]],
// //       occurredAt: [initialDate, [Validators.required]],
// //       notes: [this.health?.notes || this.health?.note || ''],

// //       // Control resolution selector configuration matching types
// //       isTreatmentDone: [false]
// //     });

// //     if (this.type === 'delete') {
// //       this.healthForm.disable();
// //     } else if (this.type === 'resolve') {
// //       this.toggleTreatmentInputs();
// //     }
// //   }

// //   public toggleTreatmentInputs(): void {
// //     const isTreatmentDone = this.healthForm.get('isTreatmentDone')?.value;

// //     if (isTreatmentDone) {
// //       const treatmentGroup = this.fb.group({
// //         // Set a default option matching your template, or leave empty '' for placeholder selection
// //         treatmentType: ['Home Remidies', [Validators.required]],
// //         medicineDetails: ['', [Validators.required]],
// //         feedDetails: ['']
// //       });

// //       this.healthForm.addControl('treatmentDetails', treatmentGroup);

// //       // Listen to treatmentType changes to clear prescription files if the path shifts away from VET
// //       treatmentGroup.get('treatmentType')?.valueChanges.subscribe((selectedType) => {
// //         if (selectedType !== 'VET') {
// //           this.selectedFilePayload = null;
// //           // Clear file chooser input DOM element value if necessary so the change event triggers again correctly
// //           const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
// //           if (fileInput) fileInput.value = '';
// //         }
// //       });

// //     } else {
// //       this.healthForm.removeControl('treatmentDetails');
// //       this.selectedFilePayload = null;
// //     }
// //     this.cdr.detectChanges();
// //   }

// //   private async loadActiveCattleInventory(): Promise<void> {
// //     try {
// //       const res = await firstValueFrom(this.animalService.getAnimals({
// //         filter: { farmId: this.farmId },
// //         options: { limit: 250, offset: 0 }
// //       }));

// //       this.cattleInventory = res?.items || [];
// //       this.filteredCattleInventory = [...this.cattleInventory];
// //       this.cdr.detectChanges();
// //     } catch (err) {
// //       console.error("Error pulling clinical livestock metrics catalog:", err);
// //       this.cattleInventory = [];
// //       this.filteredCattleInventory = [];
// //     }
// //   }

// //   public handleCattleSearch(event: any): void {
// //     const query = event.target.value?.toLowerCase().trim() || '';
// //     this.filteredCattleInventory = query
// //       ? this.cattleInventory.filter(c =>
// //         c.tagNo.toLowerCase().includes(query) ||
// //         (c.name && c.name.toLowerCase().includes(query))
// //       )
// //       : [...this.cattleInventory];
// //   }

// //   public selectCattle(cattle: any, popover: any): void {
// //     this.healthForm.get('animalId')?.setValue(cattle.id || cattle._id);
// //     this.healthForm.get('animalId')?.markAsDirty();
// //     popover.dismiss();
// //   }

// //   public getSelectedCattleLabel(): string {
// //     const currentId = this.healthForm.get('animalId')?.value;
// //     if (!currentId) return 'Select Targeted Livestock Record';

// //     if (this.health?.animal?.id === currentId || this.health?.animal?._id === currentId) {
// //       return `${this.health.animal.tagNo} ${this.health.animal.name ? '• ' + this.health.animal.name : ''}`.trim();
// //     }

// //     const match = this.cattleInventory.find(c => (c.id === currentId || c._id === currentId));
// //     return match ? `${match.tagNo} ${match.name ? '• ' + match.name : ''}`.trim() : 'Select Targeted Livestock Record';
// //   }

// //   private async showAlert(config: {
// //     header: string;
// //     subHeader?: string;
// //     message?: string;
// //     isConfirmDialog?: boolean;
// //     confirmButtonText?: string;
// //     role?: 'error' | 'success' | 'warning';
// //     onConfirmAction?: () => void;
// //   }): Promise<void> {
// //     let actionButtons: any[] = ['OK'];

// //     if (config.isConfirmDialog) {
// //       actionButtons = [
// //         { text: 'Cancel', role: 'cancel' },
// //         {
// //           text: config.confirmButtonText || 'Confirm',
// //           role: config.role === 'error' || config.role === 'warning' ? 'destructive' : '',
// //           handler: () => {
// //             if (config.onConfirmAction) config.onConfirmAction();
// //           }
// //         }
// //       ];
// //     }

// //     const customAlert = await this.alertCtrl.create({
// //       header: config.header,
// //       subHeader: config.subHeader,
// //       message: config.message,
// //       buttons: actionButtons,
// //       cssClass: `custom-alert-${config.role || 'info'}`
// //     });

// //     await customAlert.present();
// //   }

// //   // 2. Add this method to handle file/image selections and convert them into base64 structures
// //   public onFileSelected(event: any): void {
// //     const file = event.target.files?.[0];
// //     if (!file) return;

// //     const reader = new FileReader();
// //     reader.onload = () => {
// //       this.selectedFilePayload = {
// //         filename: file.name,
// //         base64String: reader.result as string
// //       };
// //       this.cdr.detectChanges();
// //     };
// //     reader.readAsDataURL(file);
// //   }


// //   // Add these helper methods inside your HealthModalComponent class

// //   /**
// //    * Checks if the file path points to an image file
// //    */
// //   public isImageFile(filePath: string): boolean {
// //     if (!filePath) return false;
// //     const extension = filePath.split('.').pop()?.toLowerCase();
// //     return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
// //   }

// //   /**
// //    * Assigns a specific Ionic icon depending on the file type extension
// //    */
// //   public getFileIcon(filePath: string): string {
// //     if (!filePath) return 'document-outline';
// //     const extension = filePath.split('.').pop()?.toLowerCase();

// //     switch (extension) {
// //       case 'pdf': return 'document-text-outline';
// //       case 'xls':
// //       case 'xlsx': return 'grid-outline';
// //       case 'doc':
// //       case 'docx': return 'reader-outline';
// //       default: return 'download-outline';
// //     }
// //   }

// //   /**
// //    * Constructs the absolute URL to your backend server instance
// //    */
// //   public getAbsoluteFileUrl(relativeRef: string): string {
// //     // Replace with your running backend host variable or environment configuration link
// //     const backendHost = 'http://localhost:5000';
// //     return relativeRef.startsWith('http') ? relativeRef : `${backendHost}${relativeRef}`;
// //   }

// //   public async openAttachment(relativeRef: string, event: Event): Promise<void> {
// //     if (event) {
// //       event.stopPropagation();
// //     }

// //     // Fallback path layer verification in case relativeRef parameter arrives empty or truncated
// //     const targetRef = relativeRef || this.health?.prescriptionRef || this.health?.treatmentDetails?.prescriptionRef;

// //     if (!targetRef) {
// //       console.warn("No valid target prescription attachment reference path provided.");
// //       return;
// //     }

// //     try {
// //       const response: any = await firstValueFrom(this.chmsService.getPrescriptionAttachment(targetRef));

// //       if (!response || !response.success) {
// //         console.error("File retrieval failed:", response?.message);
// //         return;
// //       }

// //       const { base64Data, mimeType, filename } = response;

// //       const byteCharacters = atob(base64Data);
// //       const byteNumbers = new Array(byteCharacters.length);
// //       for (let i = 0; i < byteCharacters.length; i++) {
// //         byteNumbers[i] = byteCharacters.charCodeAt(i);
// //       }
// //       const byteArray = new Uint8Array(byteNumbers);
// //       const binaryBlob = new Blob([byteArray], { type: mimeType });
// //       const virtualBlobUrl = URL.createObjectURL(binaryBlob);

// //       if (mimeType === 'text/html' || mimeType.startsWith('image/') || mimeType === 'application/pdf') {
// //         window.open(virtualBlobUrl, '_blank');
// //       } else {
// //         const anchorElement = document.createElement('a');
// //         anchorElement.href = virtualBlobUrl;
// //         anchorElement.download = filename || 'attachment';
// //         document.body.appendChild(anchorElement);
// //         anchorElement.click();
// //         document.body.removeChild(anchorElement);
// //       }

// //       setTimeout(() => URL.revokeObjectURL(virtualBlobUrl), 10000);

// //     } catch (error) {
// //       console.error("Error running client attachment lookup strategy:", error);
// //     }
// //   }


// //   async onSubmit(): Promise<void> {
// //     if (this.healthForm.invalid) {
// //       this.healthForm.markAllAsTouched();
// //       return;
// //     }

// //     const formPayload = this.healthForm.value;
// //     this.submitting.set(true);

// //     const isoStringDate = new Date(formPayload.occurredAt).toISOString();
// //     // Safely transform into explicit String serialization matching your types
// //     const stringifiedIndex = String(formPayload.healthIndex);
// //     const targetHealthId = this.health?.id || this.health?._id;

// //     try {
// //       if (this.type === 'create') {
// //         await firstValueFrom(this.chmsService.createHealth({
// //           animalId: formPayload.animalId,
// //           healthIndex: stringifiedIndex,
// //           occurredAt: isoStringDate
// //         }));
// //         await this.handleSuccessMsg('Health anomaly parameter alert logged successfully.');

// //       } else if (this.type === 'edit') {
// //         await firstValueFrom(this.chmsService.updateHealth({
// //           healthId: targetHealthId,
// //           input: {
// //             healthIndex: stringifiedIndex, // Sent as String inside Input wrapper object
// //             occurredAt: isoStringDate
// //           }
// //         }));
// //         await this.handleSuccessMsg('Health logging structural metadata parameters adjusted smoothly.');

// //       }

// //       else if (this.type === 'resolve') {
// //         let treatmentInputPayload: any = null;

// //         if (formPayload.isTreatmentDone && formPayload.treatmentDetails) {
// //           const rawTreatment = formPayload.treatmentDetails;
// //           treatmentInputPayload = {
// //             treatmentType: rawTreatment.treatmentType,
// //             medicineDetails: rawTreatment.medicineDetails?.trim(),
// //             feedDetails: rawTreatment.feedDetails?.trim() || '',
// //             // Sync attachment directly into the mutation map properties matching your schema expectations
// //             prescriptionAttachment: this.selectedFilePayload ? {
// //               filename: this.selectedFilePayload.filename,
// //               base64String: this.selectedFilePayload.base64String
// //             } : null
// //           };
// //         }

// //         await firstValueFrom(this.chmsService.resolveHealthSelection({
// //           healthId: targetHealthId,
// //           isTreatmentDone: !!formPayload.isTreatmentDone,
// //           treatmentDetails: treatmentInputPayload
// //         }));
// //         await this.handleSuccessMsg('Veterinary medical response synced and diagnostic logging vector closed.');
// //       }

// //     } catch (err: any) {
// //       await this.handleFailureMsg(err);
// //     }
// //   }


// //   async onDelete(): Promise<void> {
// //     if (!this.health?.id && !this.health?._id) return;
// //     const activeLabel = this.getSelectedCattleLabel() || 'this record';

// //     await this.showAlert({
// //       header: 'Delete Health Record?',
// //       subHeader: `Are you sure you want to drop the diagnostic history associated with ${activeLabel}?`,
// //       isConfirmDialog: true,
// //       confirmButtonText: 'Confirm',
// //       role: 'error',
// //       onConfirmAction: () => this.executeHealthDeletionPipeline()
// //     });
// //   }

// //   private async executeHealthDeletionPipeline(): Promise<void> {
// //     this.submitting.set(true);
// //     try {
// //       const targetId = this.health.id || this.health._id;
// //       await firstValueFrom(this.chmsService.deleteHealth(targetId));
// //       await this.handleSuccessMsg('Target diagnostic log safely removed from active matrix maps.');
// //     } catch (err: any) {
// //       await this.handleFailureMsg(err);
// //     }
// //   }

// //   private async handleSuccessMsg(message: string): Promise<void> {
// //     this.submitting.set(false);
// //     await this.showAlert({
// //       header: 'Success',
// //       message: message,
// //       role: 'success'
// //     });
// //     this.modalCtrl.dismiss({ updated: true }, 'confirm');
// //   }

// //   private async handleFailureMsg(err: any): Promise<void> {
// //     this.submitting.set(false);
// //     await this.showAlert({
// //       header: 'Operation Refused',
// //       subHeader: err?.message || 'The backend schema engine rejected your request payload config.',
// //       role: 'error'
// //     });
// //   }

// //   closeModal(): void {
// //     this.modalCtrl.dismiss(null, 'cancel');
// //   }
// // }


// import { Component, inject, Input, OnInit, signal, ChangeDetectorRef } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import {
//   ModalController,
//   AlertController,
//   IonHeader,
//   IonToolbar,
//   IonButtons,
//   IonButton,
//   IonTitle,
//   IonContent,
//   IonCard,
//   IonCardContent,
//   IonChip,
//   IonIcon,
//   IonList,
//   IonItemGroup,
//   IonItemDivider,
//   IonItem,
//   IonPopover,
//   IonSearchbar,
//   IonInput,
//   IonTextarea,
//   IonSelect,
//   IonSelectOption,
//   IonFooter,
//   IonSpinner,
//   IonLabel
// } from '@ionic/angular/standalone';
// import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
// import { firstValueFrom } from 'rxjs';
// import { SharedImportsModule } from 'src/app/shared/shared-imports';
// import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
// import { AnimalService } from 'src/app/services/animal/animal.service';

// @Component({
//   selector: 'app-health-modal',
//   templateUrl: './health-modal.component.html',
//   styleUrls: ['./health-modal.component.scss'],
//   standalone: true,
//   imports: [
//     SharedImportsModule,
//     ReactiveFormsModule,
//     IonHeader,
//     IonToolbar,
//     IonButtons,
//     IonButton,
//     IonTitle,
//     IonContent,
//     IonCard,
//     IonCardContent,
//     IonChip,
//     IonIcon,
//     IonList,
//     IonItemGroup,
//     IonItemDivider,
//     IonItem,
//     IonPopover,
//     IonSearchbar,
//     IonInput,
//     IonTextarea,
//     IonSelect,
//     IonSelectOption,
//     IonFooter,
//     IonSpinner,
//     IonLabel
//   ]
// })
// export class HealthModalComponent implements OnInit {
//   @Input() type: 'create' | 'edit' | 'delete' | 'resolve' = 'create';
//   @Input() health?: any;

//   private fb = inject(FormBuilder);
//   private modalCtrl = inject(ModalController);
//   private alertCtrl = inject(AlertController);
//   private animalService = inject(AnimalService);
//   private chmsService = inject(CattleMonitoringService);
//   private eventUtil = inject(EventUtilityService);
//   private cdr = inject(ChangeDetectorRef);

//   public healthForm!: FormGroup;
//   public submitting = signal(false);
//   public maxDate = new Date().toISOString().slice(0, 16);

//   public cattleInventory: any[] = [];
//   public filteredCattleInventory: any[] = [];
//   private farmId: string = '';

//   public selectedFilePayload: { filename: string; base64String: string } | null = null;

//   ngOnInit() {
//     console.log('Health Event in Health Modal: ', this.health);
//     this.syncSavedFarmSelection();
//     this.initializeForm();
//     this.loadActiveCattleInventory();
//   }

//   private syncSavedFarmSelection(): void {
//     const selections = this.eventUtil.getSavedSelections();
//     this.farmId = selections?.farmId || '';
//   }

//   private initializeForm(): void {
//     let initialDate = '';
//     if (this.health?.occurredAt) {
//       const d = isNaN(Number(this.health.occurredAt)) ? new Date(this.health.occurredAt) : new Date(Number(this.health.occurredAt));
//       initialDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
//     } else {
//       const now = new Date();
//       initialDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
//     }

//     const initialIndex = this.health?.healthIndex !== undefined ? Number(this.health.healthIndex) : 30;

//     this.healthForm = this.fb.group({
//       animalId: [this.health?.animal?.id || this.health?.animal?._id || this.health?.animalId || '', [Validators.required]],
//       healthIndex: [initialIndex, [Validators.required, Validators.min(0), Validators.max(100)]],
//       occurredAt: [initialDate, [Validators.required]],
//       notes: [this.health?.notes || this.health?.note || ''],
//       isTreatmentDone: [false]
//     });

//     if (this.type === 'delete') {
//       this.healthForm.disable();
//     } else if (this.type === 'resolve') {
//       this.toggleTreatmentInputs();
//     }
//   }

//   // --- PRESET HELPERS FOR QUICK LOGGING ---

//   /**
//    * Applies an issue preset (e.g. Mastitis, Bloat) to auto-fill index and baseline observation notes
//    */
//   public applyHealthPreset(issueTitle: string, defaultIndex: number, defaultNote: string): void {
//     if (!this.healthForm) return;

//     this.healthForm.patchValue({
//       healthIndex: defaultIndex,
//       notes: defaultNote
//     });
//     this.healthForm.markAsDirty();
//     this.cdr.detectChanges();
//   }

//   /**
//    * Appends quick observation notes to the notes text area
//    */
//   public appendNote(noteText: string): void {
//     if (!this.healthForm) return;

//     const currentNotes = this.healthForm.get('notes')?.value || '';
//     const updatedNotes = currentNotes ? `${currentNotes.trim()} ${noteText}` : noteText;

//     this.healthForm.patchValue({ notes: updatedNotes });
//     this.healthForm.markAsDirty();
//     this.cdr.detectChanges();
//   }

//   // --- FORM DYNAMICS & VET ATTACHMENTS ---

//   public toggleTreatmentInputs(): void {
//     const isTreatmentDone = this.healthForm.get('isTreatmentDone')?.value;

//     if (isTreatmentDone) {
//       const treatmentGroup = this.fb.group({
//         treatmentType: ['Home Remidies', [Validators.required]],
//         medicineDetails: ['', [Validators.required]],
//         feedDetails: ['']
//       });

//       this.healthForm.addControl('treatmentDetails', treatmentGroup);

//       treatmentGroup.get('treatmentType')?.valueChanges.subscribe((selectedType) => {
//         if (selectedType !== 'VET') {
//           this.selectedFilePayload = null;
//           const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
//           if (fileInput) fileInput.value = '';
//         }
//       });
//     } else {
//       this.healthForm.removeControl('treatmentDetails');
//       this.selectedFilePayload = null;
//     }
//     this.cdr.detectChanges();
//   }

//   private async loadActiveCattleInventory(): Promise<void> {
//     try {
//       const res = await firstValueFrom(this.animalService.getAnimals({
//         filter: { farmId: this.farmId },
//         options: { limit: 250, offset: 0 }
//       }));

//       this.cattleInventory = res?.items || [];
//       this.filteredCattleInventory = [...this.cattleInventory];
//       this.cdr.detectChanges();
//     } catch (err) {
//       console.error("Error pulling clinical livestock metrics catalog:", err);
//       this.cattleInventory = [];
//       this.filteredCattleInventory = [];
//     }
//   }

//   public handleCattleSearch(event: any): void {
//     const query = event.target.value?.toLowerCase().trim() || '';
//     this.filteredCattleInventory = query
//       ? this.cattleInventory.filter(c =>
//         c.tagNo.toLowerCase().includes(query) ||
//         (c.name && c.name.toLowerCase().includes(query))
//       )
//       : [...this.cattleInventory];
//   }

//   public selectCattle(cattle: any, popover: any): void {
//     this.healthForm.get('animalId')?.setValue(cattle.id || cattle._id);
//     this.healthForm.get('animalId')?.markAsDirty();
//     popover.dismiss();
//   }

//   public getSelectedCattleLabel(): string {
//     const currentId = this.healthForm.get('animalId')?.value;
//     if (!currentId) return 'Select Targeted Livestock Record';

//     if (this.health?.animal?.id === currentId || this.health?.animal?._id === currentId) {
//       return `${this.health.animal.tagNo} ${this.health.animal.name ? '• ' + this.health.animal.name : ''}`.trim();
//     }

//     const match = this.cattleInventory.find(c => (c.id === currentId || c._id === currentId));
//     return match ? `${match.tagNo} ${match.name ? '• ' + match.name : ''}`.trim() : 'Select Targeted Livestock Record';
//   }

//   public onFileSelected(event: any): void {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = () => {
//       this.selectedFilePayload = {
//         filename: file.name,
//         base64String: reader.result as string
//       };
//       this.cdr.detectChanges();
//     };
//     reader.readAsDataURL(file);
//   }

//   public isImageFile(filePath: string): boolean {
//     if (!filePath) return false;
//     const extension = filePath.split('.').pop()?.toLowerCase();
//     return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
//   }

//   public getFileIcon(filePath: string): string {
//     if (!filePath) return 'document-outline';
//     const extension = filePath.split('.').pop()?.toLowerCase();

//     switch (extension) {
//       case 'pdf': return 'document-text-outline';
//       case 'xls':
//       case 'xlsx': return 'grid-outline';
//       case 'doc':
//       case 'docx': return 'reader-outline';
//       default: return 'download-outline';
//     }
//   }

//   public getAbsoluteFileUrl(relativeRef: string): string {
//     const backendHost = 'http://localhost:5000';
//     return relativeRef.startsWith('http') ? relativeRef : `${backendHost}${relativeRef}`;
//   }

//   public async openAttachment(relativeRef: string, event: Event): Promise<void> {
//     if (event) event.stopPropagation();

//     const targetRef = relativeRef || this.health?.prescriptionRef || this.health?.treatmentDetails?.prescriptionRef;

//     if (!targetRef) {
//       console.warn("No valid target prescription attachment reference path provided.");
//       return;
//     }

//     try {
//       const response: any = await firstValueFrom(this.chmsService.getPrescriptionAttachment(targetRef));

//       if (!response || !response.success) {
//         console.error("File retrieval failed:", response?.message);
//         return;
//       }

//       const { base64Data, mimeType, filename } = response;
//       const byteCharacters = atob(base64Data);
//       const byteNumbers = new Array(byteCharacters.length);
//       for (let i = 0; i < byteCharacters.length; i++) {
//         byteNumbers[i] = byteCharacters.charCodeAt(i);
//       }
//       const byteArray = new Uint8Array(byteNumbers);
//       const binaryBlob = new Blob([byteArray], { type: mimeType });
//       const virtualBlobUrl = URL.createObjectURL(binaryBlob);

//       if (mimeType === 'text/html' || mimeType.startsWith('image/') || mimeType === 'application/pdf') {
//         window.open(virtualBlobUrl, '_blank');
//       } else {
//         const anchorElement = document.createElement('a');
//         anchorElement.href = virtualBlobUrl;
//         anchorElement.download = filename || 'attachment';
//         document.body.appendChild(anchorElement);
//         anchorElement.click();
//         document.body.removeChild(anchorElement);
//       }

//       setTimeout(() => URL.revokeObjectURL(virtualBlobUrl), 10000);
//     } catch (error) {
//       console.error("Error running client attachment lookup strategy:", error);
//     }
//   }

//   // --- ACTIONS & SUBMISSION ---

//   async onSubmit(): Promise<void> {
//     if (this.healthForm.invalid) {
//       this.healthForm.markAllAsTouched();
//       return;
//     }

//     const formPayload = this.healthForm.value;
//     this.submitting.set(true);

//     const isoStringDate = new Date(formPayload.occurredAt).toISOString();
//     const stringifiedIndex = String(formPayload.healthIndex);
//     const targetHealthId = this.health?.id || this.health?._id;

//     try {
//       if (this.type === 'create') {
//         await firstValueFrom(this.chmsService.createHealth({
//           animalId: formPayload.animalId,
//           healthIndex: stringifiedIndex,
//           occurredAt: isoStringDate
//         }));
//         await this.handleSuccessMsg('Health anomaly record logged successfully.');
//       } else if (this.type === 'edit') {
//         await firstValueFrom(this.chmsService.updateHealth({
//           healthId: targetHealthId,
//           input: {
//             healthIndex: stringifiedIndex,
//             occurredAt: isoStringDate
//           }
//         }));
//         await this.handleSuccessMsg('Health record updated successfully.');
//       } else if (this.type === 'resolve') {
//         let treatmentInputPayload: any = null;

//         if (formPayload.isTreatmentDone && formPayload.treatmentDetails) {
//           const rawTreatment = formPayload.treatmentDetails;
//           treatmentInputPayload = {
//             treatmentType: rawTreatment.treatmentType,
//             medicineDetails: rawTreatment.medicineDetails?.trim(),
//             feedDetails: rawTreatment.feedDetails?.trim() || '',
//             prescriptionAttachment: this.selectedFilePayload ? {
//               filename: this.selectedFilePayload.filename,
//               base64String: this.selectedFilePayload.base64String
//             } : null
//           };
//         }

//         await firstValueFrom(this.chmsService.resolveHealthSelection({
//           healthId: targetHealthId,
//           isTreatmentDone: !!formPayload.isTreatmentDone,
//           treatmentDetails: treatmentInputPayload
//         }));
//         await this.handleSuccessMsg('Health incident resolved and medical response recorded.');
//       }
//     } catch (err: any) {
//       await this.handleFailureMsg(err);
//     }
//   }

//   async onDelete(): Promise<void> {
//     if (!this.health?.id && !this.health?._id) return;
//     const activeLabel = this.getSelectedCattleLabel() || 'this record';

//     await this.showAlert({
//       header: 'Delete Health Record?',
//       subHeader: `Are you sure you want to delete the diagnostic history for ${activeLabel}?`,
//       isConfirmDialog: true,
//       confirmButtonText: 'Delete',
//       role: 'error',
//       onConfirmAction: () => this.executeHealthDeletionPipeline()
//     });
//   }

//   private async executeHealthDeletionPipeline(): Promise<void> {
//     this.submitting.set(true);
//     try {
//       const targetId = this.health.id || this.health._id;
//       await firstValueFrom(this.chmsService.deleteHealth(targetId));
//       await this.handleSuccessMsg('Target health record deleted successfully.');
//     } catch (err: any) {
//       await this.handleFailureMsg(err);
//     }
//   }

//   private async showAlert(config: {
//     header: string;
//     subHeader?: string;
//     message?: string;
//     isConfirmDialog?: boolean;
//     confirmButtonText?: string;
//     role?: 'error' | 'success' | 'warning';
//     onConfirmAction?: () => void;
//   }): Promise<void> {
//     let actionButtons: any[] = ['OK'];

//     if (config.isConfirmDialog) {
//       actionButtons = [
//         { text: 'Cancel', role: 'cancel' },
//         {
//           text: config.confirmButtonText || 'Confirm',
//           role: config.role === 'error' || config.role === 'warning' ? 'destructive' : '',
//           handler: () => {
//             if (config.onConfirmAction) config.onConfirmAction();
//           }
//         }
//       ];
//     }

//     const customAlert = await this.alertCtrl.create({
//       header: config.header,
//       subHeader: config.subHeader,
//       message: config.message,
//       buttons: actionButtons,
//       cssClass: `custom-alert-${config.role || 'info'}`
//     });

//     await customAlert.present();
//   }

//   private async handleSuccessMsg(message: string): Promise<void> {
//     this.submitting.set(false);
//     await this.showAlert({
//       header: 'Success',
//       message: message,
//       role: 'success'
//     });
//     this.modalCtrl.dismiss({ updated: true }, 'confirm');
//   }

//   private async handleFailureMsg(err: any): Promise<void> {
//     this.submitting.set(false);
//     await this.showAlert({
//       header: 'Operation Failed',
//       subHeader: err?.message || 'The server rejected your request payload.',
//       role: 'error'
//     });
//   }

//   closeModal(): void {
//     this.modalCtrl.dismiss(null, 'cancel');
//   }
// }


import { Component, inject, Input, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  ModalController,
  AlertController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonChip,
  IonIcon,
  IonList,
  IonItemGroup,
  IonItemDivider,
  IonItem,
  IonPopover,
  IonSearchbar,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonFooter,
  IonSpinner,
  IonLabel
} from '@ionic/angular/standalone';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { firstValueFrom } from 'rxjs';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { AnimalService } from 'src/app/services/animal/animal.service';

@Component({
  selector: 'app-health-modal',
  templateUrl: './health-modal.component.html',
  styleUrls: ['./health-modal.component.scss'],
  standalone: true,
  imports: [
    SharedImportsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonChip,
    IonIcon,
    IonList,
    IonItemGroup,
    IonItemDivider,
    IonItem,
    IonPopover,
    IonSearchbar,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonFooter,
    IonSpinner,
    IonLabel
  ]
})
export class HealthModalComponent implements OnInit {
  @Input() type: 'create' | 'edit' | 'delete' | 'confirm' | 'cancel' = 'create';
  @Input() health?: any;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private animalService = inject(AnimalService);
  private chmsService = inject(CattleMonitoringService);
  private eventUtil = inject(EventUtilityService);
  private cdr = inject(ChangeDetectorRef);

  public healthForm!: FormGroup;
  public submitting = signal(false);
  public maxDate = new Date().toISOString().slice(0, 16);

  public cattleInventory: any[] = [];
  public filteredCattleInventory: any[] = [];
  private farmId: string = '';

  public selectedFilePayload: { filename: string; base64String: string } | null = null;

  // Cancellation Presets & Signal Tracker
  public selectedPreset = signal<string | null>(null);
  public presetRemarks: string[] = [
    'False Alarm / Recovery Observed',
    'Animal Inspected & Cleared',
    'Minor Anomaly / Monitored Only',
    'Duplicates / Wrong Entry'
  ];

  ngOnInit() {
    this.syncSavedFarmSelection();
    this.initializeForm();
    this.loadActiveCattleInventory();
  }

  private syncSavedFarmSelection(): void {
    const selections = this.eventUtil.getSavedSelections();
    this.farmId = selections?.farmId || '';
  }

  private initializeForm(): void {
    let initialDate = '';
    if (this.health?.occurredAt) {
      const d = isNaN(Number(this.health.occurredAt)) ? new Date(this.health.occurredAt) : new Date(Number(this.health.occurredAt));
      initialDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } else {
      const now = new Date();
      initialDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    const initialIndex = this.health?.healthIndex !== undefined ? Number(this.health.healthIndex) : 30;

    this.healthForm = this.fb.group({
      animalId: [this.health?.animal?.id || this.health?.animal?._id || this.health?.animalId || '', [Validators.required]],
      healthIndex: [initialIndex, [Validators.required, Validators.min(0), Validators.max(100)]],
      occurredAt: [initialDate, [Validators.required]],
      notes: [this.health?.notes || this.health?.note || '']
    });

    if (this.type === 'confirm') {
      const treatmentGroup = this.fb.group({
        treatmentType: ['Home Remidies', [Validators.required]],
        medicineDetails: ['', [Validators.required]],
        feedDetails: ['']
      });

      this.healthForm.addControl('treatmentInput', treatmentGroup);

      treatmentGroup.get('treatmentType')?.valueChanges.subscribe((selectedType) => {
        if (selectedType !== 'VET') {
          this.selectedFilePayload = null;
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      });
    } else if (this.type === 'cancel') {
      const cancellationGroup = this.fb.group({
        remarks: ['', [Validators.required]]
      });

      this.healthForm.addControl('cancellationInput', cancellationGroup);
    } else if (this.type === 'delete') {
      this.healthForm.disable();
    }
  }

  // --- CANCELLATION / PRESET LOGIC ---

  public selectPreset(preset: string): void {
    if (this.selectedPreset() === preset) {
      this.selectedPreset.set(null);
      this.healthForm.get('cancellationInput.remarks')?.setValue('');
    } else {
      this.selectedPreset.set(preset);
      this.healthForm.get('cancellationInput.remarks')?.setValue(preset);
    }
    this.healthForm.get('cancellationInput.remarks')?.markAsDirty();
  }

  public onManualRemarkInput(event: any): void {
    const val = event.target.value;
    if (this.selectedPreset() && val !== this.selectedPreset()) {
      this.selectedPreset.set(null);
    }
  }

  // --- PRESET HELPER METHODS FOR CREATE / EDIT ---

  public applyHealthPreset(issueTitle: string, defaultIndex: number, defaultNote: string): void {
    if (!this.healthForm) return;

    this.healthForm.patchValue({
      healthIndex: defaultIndex,
      notes: defaultNote
    });
    this.healthForm.markAsDirty();
    this.cdr.detectChanges();
  }

  public appendNote(noteText: string): void {
    if (!this.healthForm) return;

    const currentNotes = this.healthForm.get('notes')?.value || '';
    const updatedNotes = currentNotes ? `${currentNotes.trim()} ${noteText}` : noteText;

    this.healthForm.patchValue({ notes: updatedNotes });
    this.healthForm.markAsDirty();
    this.cdr.detectChanges();
  }

  // --- CATTLE INVENTORY & FILE HELPERS ---

  private async loadActiveCattleInventory(): Promise<void> {
    try {
      const res = await firstValueFrom(this.animalService.getAnimals({
        filter: { farmId: this.farmId },
        options: { limit: 250, offset: 0 }
      }));

      this.cattleInventory = res?.items || [];
      this.filteredCattleInventory = [...this.cattleInventory];
      this.cdr.detectChanges();
    } catch (err) {
      console.error("Error pulling livestock inventory:", err);
      this.cattleInventory = [];
      this.filteredCattleInventory = [];
    }
  }

  public handleCattleSearch(event: any): void {
    const query = event.target.value?.toLowerCase().trim() || '';
    this.filteredCattleInventory = query
      ? this.cattleInventory.filter(c =>
        c.tagNo.toLowerCase().includes(query) ||
        (c.name && c.name.toLowerCase().includes(query))
      )
      : [...this.cattleInventory];
  }

  public selectCattle(cattle: any, popover: any): void {
    this.healthForm.get('animalId')?.setValue(cattle.id || cattle._id);
    this.healthForm.get('animalId')?.markAsDirty();
    popover.dismiss();
  }

  public getSelectedCattleLabel(): string {
    const currentId = this.healthForm.get('animalId')?.value;
    if (!currentId) return 'Select Targeted Livestock Record';

    if (this.health?.animal?.id === currentId || this.health?.animal?._id === currentId) {
      return `${this.health.animal.tagNo} ${this.health.animal.name ? '• ' + this.health.animal.name : ''}`.trim();
    }

    const match = this.cattleInventory.find(c => (c.id === currentId || c._id === currentId));
    return match ? `${match.tagNo} ${match.name ? '• ' + match.name : ''}`.trim() : 'Select Targeted Livestock Record';
  }

  public onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.selectedFilePayload = {
        filename: file.name,
        base64String: reader.result as string
      };
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  public getFileIcon(filePath: string): string {
    if (!filePath) return 'document-outline';
    const extension = filePath.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf': return 'document-text-outline';
      case 'xls':
      case 'xlsx': return 'grid-outline';
      case 'doc':
      case 'docx': return 'reader-outline';
      default: return 'download-outline';
    }
  }

  public async openAttachment(relativeRef: string, event: Event): Promise<void> {
    if (event) event.stopPropagation();

    const targetRef = relativeRef || this.health?.prescriptionRef || this.health?.treatmentDetails?.prescriptionRef;
    if (!targetRef) return;

    try {
      const response: any = await firstValueFrom(this.chmsService.getPrescriptionAttachment(targetRef));
      if (!response || !response.success) return;

      const { base64Data, mimeType, filename } = response;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const binaryBlob = new Blob([byteArray], { type: mimeType });
      const virtualBlobUrl = URL.createObjectURL(binaryBlob);

      if (mimeType === 'text/html' || mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        window.open(virtualBlobUrl, '_blank');
      } else {
        const anchorElement = document.createElement('a');
        anchorElement.href = virtualBlobUrl;
        anchorElement.download = filename || 'attachment';
        document.body.appendChild(anchorElement);
        anchorElement.click();
        document.body.removeChild(anchorElement);
      }

      setTimeout(() => URL.revokeObjectURL(virtualBlobUrl), 10000);
    } catch (error) {
      console.error("Error opening attachment:", error);
    }
  }

  // --- ACTIONS & SUBMISSIONS ---

  async onSubmit(): Promise<void> {
    if (this.healthForm.invalid) {
      this.healthForm.markAllAsTouched();
      return;
    }

    const formPayload = this.healthForm.value;
    this.submitting.set(true);

    const isoStringDate = new Date(formPayload.occurredAt).toISOString();
    const stringifiedIndex = String(formPayload.healthIndex);
    const targetHealthId = this.health?.id || this.health?._id;

    try {
      if (this.type === 'create') {
        await firstValueFrom(this.chmsService.createHealth({
          animalId: formPayload.animalId,
          healthIndex: stringifiedIndex,
          occurredAt: isoStringDate
        }));
        await this.handleSuccessMsg('Health incident logged successfully.');
      } else if (this.type === 'edit') {
        await firstValueFrom(this.chmsService.updateHealth({
          healthId: targetHealthId,
          input: {
            healthIndex: stringifiedIndex,
            occurredAt: isoStringDate
          }
        }));
        await this.handleSuccessMsg('Health record updated successfully.');
      } else if (this.type === 'confirm') {
        const rawTreatment = formPayload.treatmentInput;
        const treatmentInputPayload = {
          treatmentType: rawTreatment.treatmentType,
          medicineDetails: rawTreatment.medicineDetails?.trim(),
          feedDetails: rawTreatment.feedDetails?.trim() || '',
          prescriptionAttachment: this.selectedFilePayload ? {
            filename: this.selectedFilePayload.filename,
            base64String: this.selectedFilePayload.base64String
          } : null
        };

        await firstValueFrom(this.chmsService.resolveHealthSelection({
          healthId: targetHealthId,
          isTreatmentDone: true,
          treatmentDetails: treatmentInputPayload
        }));
        await this.handleSuccessMsg('Treatment recorded and case confirmed.');
      } else if (this.type === 'cancel') {
        await firstValueFrom(this.chmsService.resolveHealthSelection({
          healthId: targetHealthId,
          isTreatmentDone: false,
          treatmentDetails: {
            notes: formPayload.cancellationInput?.remarks || ''
          }
        }));
        await this.handleSuccessMsg('Health case dismissed without treatment.');
      }
    } catch (err: any) {
      await this.handleFailureMsg(err);
    }
  }

  async onDelete(): Promise<void> {
    if (!this.health?.id && !this.health?._id) return;
    const activeLabel = this.getSelectedCattleLabel() || 'this record';

    await this.showAlert({
      header: 'Delete Health Record?',
      subHeader: `Are you sure you want to delete the diagnostic history for ${activeLabel}?`,
      isConfirmDialog: true,
      confirmButtonText: 'Delete',
      role: 'error',
      onConfirmAction: () => this.executeHealthDeletionPipeline()
    });
  }

  private async executeHealthDeletionPipeline(): Promise<void> {
    this.submitting.set(true);
    try {
      const targetId = this.health.id || this.health._id;
      await firstValueFrom(this.chmsService.deleteHealth(targetId));
      await this.handleSuccessMsg('Health record deleted successfully.');
    } catch (err: any) {
      await this.handleFailureMsg(err);
    }
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
      header: 'Operation Failed',
      subHeader: err?.message || 'The server rejected your request payload.',
      role: 'error'
    });
  }

  closeModal(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}