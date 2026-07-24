// // // import { Component, Input, OnInit, WritableSignal, signal, inject, ChangeDetectorRef } from '@angular/core';
// // // import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// // // import { IonPopover, ModalController, ToastController, IonItemGroup, IonItemDivider } from '@ionic/angular/standalone';
// // // import { Apollo } from 'apollo-angular';
// // // import { firstValueFrom } from 'rxjs';
// // // import { CREATE_CALVING, UPDATE_CALVING, DELETE_CALVING } from 'src/app/graphql/queries/event.queries';
// // // import { AnimalService } from 'src/app/services/animal/animal.service';
// // // import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
// // // import { SharedImportsModule } from 'src/app/shared/shared-imports';
// // // import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';

// // // @Component({
// // //   selector: 'app-calving-modal',
// // //   templateUrl: './calving-modal.component.html',
// // //   styleUrls: ['./calving-modal.component.scss'],
// // //   standalone: true,
// // //   imports: [SharedImportsModule, ReactiveFormsModule, IonItemGroup, IonItemDivider]
// // // })
// // // export class CalvingModalComponent implements OnInit {
// // //   @Input() type: 'create' | 'edit' | 'delete'| 'confirm'| 'cancel' = 'create';
// // //   @Input() calving: any;

// // //   // Inject dependencies
// // //   private fb = inject(FormBuilder);
// // //   private modalCtrl = inject(ModalController);
// // //   private apollo = inject(Apollo);
// // //   private toastCtrl = inject(ToastController);
// // //   private animalService = inject(AnimalService);
// // //   private chmsService = inject(CattleMonitoringService);
// // //   private eventUtil = inject(EventUtilityService);
// // //   private cdr = inject(ChangeDetectorRef);

// // //   calvingForm!: FormGroup;
// // //   submitting: WritableSignal<boolean> = signal(false);

// // //   // Structural Lookup Inventory State Arrays
// // //   femaleInventory: any[] = [];
// // //   filteredFemaleInventory: any[] = [];
// // //   selectedFemaleCattle: any = null;
// // //   private farmId: string = '';

// // //   ngOnInit() {
// // //     this.syncSavedFarmSelection();
// // //     this.initForm();
// // //     this.prepareInventoryContext();
// // //   }

// // //   /**
// // //    * Extracts the current active farm identifier configuration context
// // //    */
// // //   private syncSavedFarmSelection(): void {
// // //     const selections = this.eventUtil.getSavedSelections();
// // //     this.farmId = selections?.farmId || '';
// // //   }

// // //   /**
// // //    * Initializes standard reactive form components
// // //    */
// // //   private initForm() {
// // //     // Standardize dates to ISO format yyyy-MM-dd safely for html5 date inputs
// // //     let initialDate = new Date().toISOString().split('T')[0];
// // //     let initialNote = '';

// // //     if ((this.type === 'edit' || this.type === 'delete') && this.calving) {
// // //       if (this.calving.occurredAt) {
// // //         initialDate = new Date(Number(this.calving.occurredAt) || this.calving.occurredAt)
// // //           .toISOString()
// // //           .split('T')[0];
// // //       }
// // //       initialNote = this.calving.note || '';
// // //     }

// // //     this.calvingForm = this.fb.group({
// // //       occurredAt: [initialDate, Validators.required],
// // //       note: [initialNote]
// // //     });

// // //     if (this.type === 'delete') {
// // //       this.calvingForm.disable();
// // //     }
// // //   }

// // //   /**
// // //    * Builds context arrays based on whether the form is spawned standalone 
// // //    * or linked to an active livestock component row.
// // //    */
// // //   private async prepareInventoryContext() {
// // //     // Case 1: If working from a parent livestock context details view row directly
// // //     if (this.calving && (this.calving.animal || this.calving.tagNo)) {
// // //       const animalContext = this.calving.animal ? this.calving.animal : this.calving;
// // //       this.selectedFemaleCattle = animalContext;
// // //       this.femaleInventory = [animalContext];
// // //       this.filteredFemaleInventory = [animalContext];
// // //     } else {
// // //       // Case 2: Load broader active inventory variables for global standalone creation
// // //       await this.loadActiveFemaleInventory();
// // //     }
// // //   }

// // //   /**
// // //    * Pulls female herd inventory via chmsService to back selection list popovers
// // //    */
// // //   private async loadActiveFemaleInventory(): Promise<void> {
// // //     try {
// // //       const res = await firstValueFrom(this.animalService.getAnimals({
// // //         filter: { farmId: this.farmId },
// // //         options: { limit: 250, offset: 0 }
// // //       }));
      
// // //       const rawItems = res?.items || [];
// // //       this.femaleInventory = rawItems.filter((cattle: any) => cattle?.sex === 'Female');
// // //       this.filteredFemaleInventory = [...this.femaleInventory];
// // //       this.cdr.detectChanges();
// // //     } catch (err) {
// // //       console.error("Error fetching female cattle assets for calving selection:", err);
// // //       this.femaleInventory = [];
// // //       this.filteredFemaleInventory = [];
// // //     }
// // //   }

// // //   /**
// // //    * Returns localized labels or placeholders for the UI button layout
// // //    */
// // //   getSelectedFemaleLabel(): string {
// // //     if (this.selectedFemaleCattle) {
// // //       const tag = this.selectedFemaleCattle.tagNo || '';
// // //       const name = this.selectedFemaleCattle.name ? ` • ${this.selectedFemaleCattle.name}` : '';
// // //       return `${tag}${name}`;
// // //     }
// // //     return 'Select Female Livestock *';
// // //   }

// // //   /**
// // //    * Filters selection arrays inline as text fields handle input events
// // //    */
// // //   handleFemaleSearch(event: any) {
// // //     const query = event.target.value?.toLowerCase().trim() || '';
// // //     if (!query) {
// // //       this.filteredFemaleInventory = [...this.femaleInventory];
// // //       return;
// // //     }
// // //     this.filteredFemaleInventory = this.femaleInventory.filter(
// // //       (cattle) =>
// // //         cattle.tagNo?.toLowerCase().includes(query) ||
// // //         (cattle.name && cattle.name.toLowerCase().includes(query)) ||
// // //         (cattle.breed && cattle.breed.toLowerCase().includes(query))
// // //     );
// // //   }

// // //   /**
// // //    * Assigns livestock entities and forcefully closes local popover overlays
// // //    */
// // //   selectFemaleCattle(cattle: any, popover: IonPopover) {
// // //     this.selectedFemaleCattle = cattle;
// // //     this.cdr.detectChanges();
// // //     popover.dismiss();
// // //   }

// // //   closeModal(role: string = 'cancel') {
// // //     this.modalCtrl.dismiss(null, role);
// // //   }

// // //   /**
// // //    * Handles Save / Update form submission processes
// // //    */
// // //   async onSubmit() {
// // //     if (this.calvingForm.invalid || this.submitting()) return;
// // //     if (this.type === 'create' && !this.selectedFemaleCattle) {
// // //       this.showToast('Please specify a target livestock profile record.', 'warning');
// // //       return;
// // //     }

// // //     this.submitting.set(true);
// // //     const formVals = this.calvingForm.value;

// // //     if (this.type === 'create') {
// // //       this.apollo.mutate<any>({
// // //         mutation: CREATE_CALVING,
// // //         variables: {
// // //           animalId: this.selectedFemaleCattle.id || this.selectedFemaleCattle._id,
// // //           occurredAt: formVals.occurredAt,
// // //           note: formVals.note
// // //         }
// // //       }).subscribe({
// // //         next: (res) => this.handleMutationResponse(res, 'createCalving'),
// // //         error: (err) => this.handleMutationError(err)
// // //       });
// // //     } else if (this.type === 'edit') {
// // //   // 🌟 Ensure we extract the lactation tracking ID from the incoming data object
// // //   const existingLactationId = this.calving.lactationId || this.calving.lactation?._id || this.calving.lactation?.id;

// // //   if (!existingLactationId) {
// // //     this.showToast('Missing required lactation reference for updating this record.', 'danger');
// // //     this.submitting.set(false);
// // //     return;
// // //   }

// // //   this.apollo.mutate<any>({
// // //     mutation: UPDATE_CALVING,
// // //     variables: {
// // //       calvingId: this.calving.id || this.calving._id,
// // //       input: {
// // //         occurredAt: formVals.occurredAt,
// // //         note: formVals.note
// // //       }
// // //     }
// // //   }).subscribe({
// // //     next: (res) => this.handleMutationResponse(res, 'updateCalving'),
// // //     error: (err) => this.handleMutationError(err)
// // //   });
// // // }
// // //   }

// // //   /**
// // //    * Destroys log records via the target mutation resolver mapping
// // //    */
// // //   async onDelete() {
// // //     if (this.submitting() || !this.calving) return;
// // //     this.submitting.set(true);

// // //     this.apollo.mutate<any>({
// // //       mutation: DELETE_CALVING,
// // //       variables: {
// // //         calvingId: this.calving.id || this.calving._id
// // //       }
// // //     }).subscribe({
// // //       next: (res) => this.handleMutationResponse(res, 'deleteCalving'),
// // //       error: (err) => this.handleMutationError(err)
// // //     });
// // //   }

// // //   /**
// // //    * Unified interface mapping parser to clean up response assertions
// // //    */
// // //   private handleMutationResponse(res: any, key: string) {
// // //     this.submitting.set(false);
// // //     const payload = res?.data?.[key];

// // //     if (payload?.success) {
// // //       this.showToast(payload.message || 'Operation executed successfully.', 'success');
// // //       this.closeModal('confirm');
// // //     } else {
// // //       this.showToast(payload?.message || 'Server declined operation state updates.', 'danger');
// // //     }
// // //   }

// // //   private handleMutationError(err: any) {
// // //     this.submitting.set(false);
// // //     console.error('GraphQL Mutation Failure:', err);
// // //     this.showToast(err?.message || 'Network structural dispatch failure encountered.', 'danger');
// // //   }

// // //   private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
// // //     const toast = await this.toastCtrl.create({
// // //       message,
// // //       duration: 3000,
// // //       color,
// // //       position: 'bottom'
// // //     });
// // //     await toast.present();
// // //   }
// // // }



// // import { Component, Input, OnInit, WritableSignal, signal, inject, ChangeDetectorRef } from '@angular/core';
// // import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// // import { IonPopover, ModalController, ToastController, IonItemGroup, IonItemDivider } from '@ionic/angular/standalone';
// // import { Apollo } from 'apollo-angular';
// // import { firstValueFrom } from 'rxjs';
// // import { CREATE_CALVING, UPDATE_CALVING, DELETE_CALVING, RESOLVE_PREGNANCY_SELECTION } from 'src/app/graphql/queries/event.queries';
// // import { AnimalService } from 'src/app/services/animal/animal.service';
// // import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
// // import { SharedImportsModule } from 'src/app/shared/shared-imports';
// // import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';

// // @Component({
// //   selector: 'app-calving-modal',
// //   templateUrl: './calving-modal.component.html',
// //   styleUrls: ['./calving-modal.component.scss'],
// //   standalone: true,
// //   imports: [SharedImportsModule, ReactiveFormsModule, IonItemGroup, IonItemDivider]
// // })
// // export class CalvingModalComponent implements OnInit {
// //   @Input() type: 'create' | 'edit' | 'delete' | 'confirm' | 'cancel' = 'create';
// //   @Input() calving: any; // Contains Calving record or base Pregnancy object depending on view context

// //   // Inject dependencies
// //   private fb = inject(FormBuilder);
// //   private modalCtrl = inject(ModalController);
// //   private apollo = inject(Apollo);
// //   private toastCtrl = inject(ToastController);
// //   private animalService = inject(AnimalService);
// //   private chmsService = inject(CattleMonitoringService);
// //   private eventUtil = inject(EventUtilityService);
// //   private cdr = inject(ChangeDetectorRef);

// //   calvingForm!: FormGroup;
// //   submitting: WritableSignal<boolean> = signal(false);

// //   // Preset tracking signals for Cancellation / Loss workflow
// //   public selectedPreset = signal<string | null>(null);
// //   public maxDate: string = new Date().toISOString().split('T')[0];

// //   // Structural Lookup Inventory State Arrays
// //   femaleInventory: any[] = [];
// //   filteredFemaleInventory: any[] = [];
// //   selectedFemaleCattle: any = null;
// //   private farmId: string = '';

// //   // Contextual Preset Reasons for Pregnancy Cancellation / Failure
// //   public readonly presetRemarks: string[] = [
// //     'Normal Term - Failed Delivery / Stillborn',
// //     'Spontaneous Abortion / Miscarriage',
// //     'Dystocia / Delivery Complications',
// //     'Uterine Infection / Severe Complication',
// //     'Suspected Early Embryonic Loss',
// //     'Maternal Health / High Risk Stress'
// //   ];

// //   // ngOnInit() {
// //   //   this.syncSavedFarmSelection();
// //   //   this.initForm();
// //   //   this.prepareInventoryContext();
// //   // }


// //   ngOnInit() {
// //     this.syncSavedFarmSelection();
// //     this.initForm();
// //   }

// //   ngAfterViewInit() {
// //     // Defeats NG0100 by deferring state evaluation to the next macro-task queue
// //     this.prepareInventoryContext();
// //     this.cdr.detectChanges();
// //   }

// //   public selectPreset(preset: string): void {
// //     const cancelGroup = this.calvingForm.get('cancellationInput');
// //     const remarksCtrl = cancelGroup?.get('remarks');
// //     const categoryCtrl = cancelGroup?.get('reasonCategory');
// //     const actionCtrl = cancelGroup?.get('nextAction');

// //     if (this.selectedPreset() === preset) {
// //       this.selectedPreset.set(null);
// //       remarksCtrl?.setValue('');
// //     } else {
// //       this.selectedPreset.set(preset);
// //       remarksCtrl?.setValue(preset);

// //       if (preset.includes('Abortion') || preset.includes('Miscarriage')) {
// //         categoryCtrl?.setValue('Misscarriage');
// //         actionCtrl?.setValue('RE_OPEN_HEAT');
// //       } else if (preset.includes('Stillborn') || preset.includes('Failed Delivery')) {
// //         categoryCtrl?.setValue('FailedConception');
// //         actionCtrl?.setValue('VET_REVIEW');
// //       } else if (preset.includes('Infection') || preset.includes('Complication')) {
// //         categoryCtrl?.setValue('UterineInfection');
// //         actionCtrl?.setValue('VET_REVIEW');
// //       } else {
// //         categoryCtrl?.setValue('EmbryonicLoss');
// //         actionCtrl?.setValue('RE_OPEN_HEAT');
// //       }
// //     }

// //     remarksCtrl?.markAsDirty();
// //     remarksCtrl?.updateValueAndValidity();
    
// //     // Explicitly trigger detector cycle after signal updates
// //     setTimeout(() => this.cdr.detectChanges(), 0);
// //   }

// //   /**
// //    * Extracts current active farm selection context
// //    */
// //   private syncSavedFarmSelection(): void {
// //     const selections = this.eventUtil.getSavedSelections();
// //     this.farmId = selections?.farmId || '';
// //   }

// //   /**
// //    * Initializes reactive form group structure dynamically based on transaction mode
// //    */
// //   private initForm(): void {
// //     const todayStr = new Date().toISOString().split('T')[0];

// //     // Standard CRUD default inputs
// //     let initialDate = todayStr;
// //     let initialNote = '';

// //     if ((this.type === 'edit' || this.type === 'delete') && this.calving) {
// //       if (this.calving.occurredAt) {
// //         initialDate = new Date(Number(this.calving.occurredAt) || this.calving.occurredAt)
// //           .toISOString()
// //           .split('T')[0];
// //       }
// //       initialNote = this.calving.note || '';
// //     }

// //     const animalId = this.calving?.animal?.id || this.calving?.animal?._id || this.calving?.animal || '';

// //     this.calvingForm = this.fb.group({
// //       animalId: [animalId, this.type === 'create' ? [Validators.required] : []],
// //       occurredAt: [initialDate, Validators.required],
// //       note: [initialNote],

// //       // Nested Transaction Resolution Groups
// //       confirmationInput: this.fb.group({
// //         checkedAt: [todayStr, this.type === 'confirm' ? [Validators.required] : []],
// //         calfGender: ['Female'],
// //         calfWeight: [null],
// //         calvingEase: ['Normal'], // Normal, Assisted, Dystocia, C-Section
// //         note: ['']
// //       }),

// //       cancellationInput: this.fb.group({
// //         reasonCategory: ['Misscarriage', this.type === 'cancel' ? [Validators.required] : []],
// //         nextAction: ['RE_OPEN_HEAT', this.type === 'cancel' ? [Validators.required] : []],
// //         remarks: ['', this.type === 'cancel' ? [Validators.required] : []]
// //       })
// //     });

// //     if (this.type === 'delete') {
// //       this.calvingForm.disable();
// //     }
// //   }

// //   /**
// //    * Builds context arrays based on whether the form is spawned standalone or linked to an active row
// //    */
// //   private async prepareInventoryContext() {
// //     if (this.calving && (this.calving.animal || this.calving.tagNo)) {
// //       const animalContext = this.calving.animal ? this.calving.animal : this.calving;
// //       this.selectedFemaleCattle = animalContext;
// //       this.femaleInventory = [animalContext];
// //       this.filteredFemaleInventory = [animalContext];
// //     } else {
// //       await this.loadActiveFemaleInventory();
// //     }
// //   }

// //   /**
// //    * Pulls female herd inventory via animalService
// //    */
// //   private async loadActiveFemaleInventory(): Promise<void> {
// //     try {
// //       const res = await firstValueFrom(this.animalService.getAnimals({
// //         filter: { farmId: this.farmId },
// //         options: { limit: 250, offset: 0 }
// //       }));
      
// //       const rawItems = res?.items || [];
// //       this.femaleInventory = rawItems.filter((cattle: any) => cattle?.sex === 'Female');
// //       this.filteredFemaleInventory = [...this.femaleInventory];
// //       this.cdr.detectChanges();
// //     } catch (err) {
// //       console.error("Error fetching female cattle assets for calving selection:", err);
// //       this.femaleInventory = [];
// //       this.filteredFemaleInventory = [];
// //     }
// //   }

// //   /**
// //    * Preset Selection Helper for Cancellation / Failure Modal
// //    */
// //   // public selectPreset(preset: string): void {
// //   //   const cancelGroup = this.calvingForm.get('cancellationInput');
// //   //   const remarksCtrl = cancelGroup?.get('remarks');
// //   //   const categoryCtrl = cancelGroup?.get('reasonCategory');
// //   //   const actionCtrl = cancelGroup?.get('nextAction');

// //   //   if (this.selectedPreset() === preset) {
// //   //     this.selectedPreset.set(null);
// //   //     remarksCtrl?.setValue('');
// //   //   } else {
// //   //     this.selectedPreset.set(preset);
// //   //     remarksCtrl?.setValue(preset);

// //   //     // Auto-categorize failure reasons
// //   //     if (preset.includes('Abortion') || preset.includes('Miscarriage')) {
// //   //       categoryCtrl?.setValue('Misscarriage');
// //   //       actionCtrl?.setValue('RE_OPEN_HEAT');
// //   //     } else if (preset.includes('Stillborn') || preset.includes('Failed Delivery')) {
// //   //       categoryCtrl?.setValue('FailedConception');
// //   //       actionCtrl?.setValue('VET_REVIEW');
// //   //     } else if (preset.includes('Infection') || preset.includes('Complication')) {
// //   //       categoryCtrl?.setValue('UterineInfection');
// //   //       actionCtrl?.setValue('VET_REVIEW');
// //   //     } else {
// //   //       categoryCtrl?.setValue('EmbryonicLoss');
// //   //       actionCtrl?.setValue('RE_OPEN_HEAT');
// //   //     }
// //   //   }

// //   //   remarksCtrl?.markAsDirty();
// //   //   remarksCtrl?.markAsTouched();
// //   //   this.cdr.detectChanges();
// //   // }

// //   public onManualRemarkInput(event: any): void {
// //     const val = event.detail?.value || event.target?.value;
// //     if (val !== this.selectedPreset()) {
// //       this.selectedPreset.set(null);
// //     }
// //   }

// //   /**
// //    * Form Submission Entry Point
// //    */
// //   async onSubmit() {
// //     if (this.calvingForm.invalid || this.submitting()) {
// //       this.calvingForm.markAllAsTouched();
// //       return;
// //     }

// //     // Direct transactional execution route
// //     if (this.type === 'confirm' || this.type === 'cancel') {
// //       this.handleTransactionalResolution();
// //       return;
// //     }

// //     if (this.type === 'create' && !this.selectedFemaleCattle) {
// //       this.showToast('Please specify a target livestock profile record.', 'warning');
// //       return;
// //     }

// //     this.submitting.set(true);
// //     const formVals = this.calvingForm.value;

// //     if (this.type === 'create') {
// //       this.apollo.mutate<any>({
// //         mutation: CREATE_CALVING,
// //         variables: {
// //           animalId: this.selectedFemaleCattle.id || this.selectedFemaleCattle._id,
// //           occurredAt: formVals.occurredAt,
// //           note: formVals.note
// //         }
// //       }).subscribe({
// //         next: (res) => this.handleMutationResponse(res, 'createCalving'),
// //         error: (err) => this.handleMutationError(err)
// //       });

// //     } else if (this.type === 'edit') {
// //       const existingLactationId = this.calving.lactationId || this.calving.lactation?._id || this.calving.lactation?.id;

// //       if (!existingLactationId) {
// //         this.showToast('Missing required lactation reference for updating this record.', 'danger');
// //         this.submitting.set(false);
// //         return;
// //       }

// //       this.apollo.mutate<any>({
// //         mutation: UPDATE_CALVING,
// //         variables: {
// //           calvingId: this.calving.id || this.calving._id,
// //           input: {
// //             occurredAt: formVals.occurredAt,
// //             note: formVals.note
// //           }
// //         }
// //       }).subscribe({
// //         next: (res) => this.handleMutationResponse(res, 'updateCalving'),
// //         error: (err) => this.handleMutationError(err)
// //       });
// //     }
// //   }

// //   /**
// //    * Handles transactional resolution (`confirm` calved vs `cancel` lost pregnancy)
// //    */
// //   private handleTransactionalResolution(): void {
// //     const pregnancyId = this.calving?.id || this.calving?._id;
// //     if (!pregnancyId) {
// //       this.showToast('Missing pregnancy reference context for this transaction.', 'danger');
// //       return;
// //     }

// //     this.submitting.set(true);
// //     const formVals = this.calvingForm.value;
// //     const hasCalved = this.type === 'confirm';

// //     let resolutionInput: any = {
// //       occurredAt: new Date(formVals.occurredAt || new Date()).toISOString()
// //     };

// //     if (hasCalved) {
// //       const c = formVals.confirmationInput;
// //       const combinedNote = [
// //         `Calf Gender: ${c.calfGender || 'N/A'}`,
// //         c.calfWeight ? `Weight: ${c.calfWeight}kg` : null,
// //         `Ease: ${c.calvingEase || 'Normal'}`,
// //         c.note?.trim()
// //       ].filter(Boolean).join(' | ');

// //       resolutionInput.note = combinedNote;

// //     } else {
// //       const cancel = formVals.cancellationInput;
// //       resolutionInput.cancellationInput = {
// //         reasonCategory: cancel.reasonCategory,
// //         nextAction: cancel.nextAction,
// //         remarks: cancel.remarks?.trim()
// //       };
// //       resolutionInput.failureReason = cancel.remarks?.trim();
// //     }

// //     this.apollo.mutate<any>({
// //       mutation: RESOLVE_PREGNANCY_SELECTION,
// //       variables: {
// //         pregnancyId,
// //         hasCalved,
// //         resolutionInput
// //       },
// //       refetchQueries: ['GetDashboardCounts', 'GetActivePregnancies', 'GetAnimalHistory']
// //     }).subscribe({
// //       next: (res) => this.handleMutationResponse(res, 'resolvePregnancySelection'),
// //       error: (err) => this.handleMutationError(err)
// //     });
// //   }

// //   /**
// //    * Delete Handler
// //    */
// //   async onDelete() {
// //     if (this.submitting() || !this.calving) return;
// //     this.submitting.set(true);

// //     this.apollo.mutate<any>({
// //       mutation: DELETE_CALVING,
// //       variables: {
// //         calvingId: this.calving.id || this.calving._id
// //       }
// //     }).subscribe({
// //       next: (res) => this.handleMutationResponse(res, 'deleteCalving'),
// //       error: (err) => this.handleMutationError(err)
// //     });
// //   }

// //   // --- UI Helpers & Search Mechanics ---

// //   getSelectedFemaleLabel(): string {
// //     if (this.selectedFemaleCattle) {
// //       const tag = this.selectedFemaleCattle.tagNo || '';
// //       const name = this.selectedFemaleCattle.name ? ` • ${this.selectedFemaleCattle.name}` : '';
// //       return `${tag}${name}`;
// //     }
// //     return 'Select Female Livestock *';
// //   }

// //   handleFemaleSearch(event: any) {
// //     const query = event.target.value?.toLowerCase().trim() || '';
// //     if (!query) {
// //       this.filteredFemaleInventory = [...this.femaleInventory];
// //       return;
// //     }
// //     this.filteredFemaleInventory = this.femaleInventory.filter(
// //       (cattle) =>
// //         cattle.tagNo?.toLowerCase().includes(query) ||
// //         (cattle.name && cattle.name.toLowerCase().includes(query)) ||
// //         (cattle.breed && cattle.breed.toLowerCase().includes(query))
// //     );
// //   }

// //   selectFemaleCattle(cattle: any, popover: IonPopover) {
// //     this.selectedFemaleCattle = cattle;
// //     this.calvingForm.patchValue({ animalId: cattle.id || cattle._id });
// //     this.cdr.detectChanges();
// //     popover.dismiss();
// //   }

// //   closeModal(role: string = 'cancel') {
// //     this.modalCtrl.dismiss(null, role);
// //   }

// //   private handleMutationResponse(res: any, key: string) {
// //     this.submitting.set(false);
// //     const payload = res?.data?.[key];

// //     if (payload?.success) {
// //       this.showToast(payload.message || 'Operation executed successfully.', 'success');
// //       this.closeModal('confirm');
// //     } else {
// //       this.showToast(payload?.message || 'Server declined operation state updates.', 'danger');
// //     }
// //   }

// //   private handleMutationError(err: any) {
// //     this.submitting.set(false);
// //     console.error('GraphQL Mutation Failure:', err);
// //     this.showToast(err?.message || 'Network structural dispatch failure encountered.', 'danger');
// //   }

// //   private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
// //     const toast = await this.toastCtrl.create({
// //       message,
// //       duration: 3000,
// //       color,
// //       position: 'bottom'
// //     });
// //     await toast.present();
// //   }
// // }



// import { Component, Input, OnInit, WritableSignal, signal, inject, ChangeDetectorRef, AfterViewInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
// import { 
//   IonPopover, ModalController, ToastController, IonItemGroup, IonItemDivider,
//   IonTextarea, IonSelect, IonSelectOption, IonInput, IonItem, IonList, IonLabel,
//   IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
//   IonFooter, IonSpinner, IonChip, IonSearchbar
// } from '@ionic/angular/standalone';
// import { Apollo } from 'apollo-angular';
// import { firstValueFrom } from 'rxjs';
// import { CREATE_CALVING, UPDATE_CALVING, DELETE_CALVING, RESOLVE_PREGNANCY_SELECTION } from 'src/app/graphql/queries/event.queries';
// import { AnimalService } from 'src/app/services/animal/animal.service';
// import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
// import { SharedImportsModule } from 'src/app/shared/shared-imports';
// import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';

// @Component({
//   selector: 'app-calving-modal',
//   templateUrl: './calving-modal.component.html',
//   styleUrls: ['./calving-modal.component.scss'],
//   standalone: true,
//   imports: [
//     SharedImportsModule,
//     ReactiveFormsModule,
//     FormsModule,
//     IonItemGroup,
//     IonItemDivider,
//     IonTextarea,
//     IonSelect,
//     IonSelectOption,
//     IonInput,
//     IonItem,
//     IonList,
//     IonLabel,
//     IonHeader,
//     IonToolbar,
//     IonTitle,
//     IonContent,
//     IonButtons,
//     IonButton,
//     IonIcon,
//     IonFooter,
//     IonSpinner,
//     IonChip,
//     IonSearchbar,
//     IonPopover
//   ]
// })
// export class CalvingModalComponent implements OnInit, AfterViewInit {
//   @Input() type: 'create' | 'edit' | 'delete' | 'confirm' | 'cancel' = 'create';
//   @Input() calving: any;

//   private fb = inject(FormBuilder);
//   private modalCtrl = inject(ModalController);
//   private apollo = inject(Apollo);
//   private toastCtrl = inject(ToastController);
//   private animalService = inject(AnimalService);
//   private chmsService = inject(CattleMonitoringService);
//   private eventUtil = inject(EventUtilityService);
//   private cdr = inject(ChangeDetectorRef);

//   calvingForm!: FormGroup;
//   submitting: WritableSignal<boolean> = signal(false);

//   public selectedPreset = signal<string | null>(null);
//   public maxDate: string = new Date().toISOString().split('T')[0];

//   femaleInventory: any[] = [];
//   filteredFemaleInventory: any[] = [];
//   selectedFemaleCattle: any = null;
//   private farmId: string = '';

//   public readonly presetRemarks: string[] = [
//     'Normal Term - Failed Delivery / Stillborn',
//     'Spontaneous Abortion / Miscarriage',
//     'Dystocia / Delivery Complications',
//     'Uterine Infection / Severe Complication',
//     'Suspected Early Embryonic Loss',
//     'Maternal Health / High Risk Stress'
//   ];

//   ngOnInit() {
//     this.syncSavedFarmSelection();
//     // Initialize empty form structure immediately
//     this.buildForm();
//   }

//   ngAfterViewInit() {
//     // Schedule async/microtask task execution to prevent NG0100 on form state attachment
//     queueMicrotask(() => {
//       this.prepareInventoryContext();
//       this.cdr.markForCheck();
//     });
//   }

//   private syncSavedFarmSelection(): void {
//     const selections = this.eventUtil.getSavedSelections();
//     this.farmId = selections?.farmId || '';
//   }

//   private buildForm(): void {
//     const todayStr = new Date().toISOString().split('T')[0];

//     let initialDate = todayStr;
//     let initialNote = '';

//     if ((this.type === 'edit' || this.type === 'delete') && this.calving) {
//       if (this.calving.occurredAt) {
//         initialDate = new Date(Number(this.calving.occurredAt) || this.calving.occurredAt)
//           .toISOString()
//           .split('T')[0];
//       }
//       initialNote = this.calving.note || '';
//     }

//     const animalId = this.calving?.animal?.id || this.calving?.animal?._id || this.calving?.animal || '';

//     this.calvingForm = this.fb.group({
//       animalId: [animalId, this.type === 'create' ? [Validators.required] : []],
//       occurredAt: [initialDate, Validators.required],
//       note: [initialNote],

//       confirmationInput: this.fb.group({
//         checkedAt: [todayStr, this.type === 'confirm' ? [Validators.required] : []],
//         calfGender: ['Female'],
//         calfWeight: [null],
//         calvingEase: ['Normal'],
//         note: ['']
//       }),

//       cancellationInput: this.fb.group({
//         reasonCategory: ['Misscarriage', this.type === 'cancel' ? [Validators.required] : []],
//         nextAction: ['RE_OPEN_HEAT', this.type === 'cancel' ? [Validators.required] : []],
//         remarks: ['', this.type === 'cancel' ? [Validators.required] : []]
//       })
//     });

//     if (this.type === 'delete') {
//       this.calvingForm.disable();
//     }
//   }

//   private async prepareInventoryContext() {
//     if (this.calving && (this.calving.animal || this.calving.tagNo)) {
//       const animalContext = this.calving.animal ? this.calving.animal : this.calving;
//       this.selectedFemaleCattle = animalContext;
//       this.femaleInventory = [animalContext];
//       this.filteredFemaleInventory = [animalContext];
//     } else {
//       await this.loadActiveFemaleInventory();
//     }
//   }

//   private async loadActiveFemaleInventory(): Promise<void> {
//     try {
//       const res = await firstValueFrom(this.animalService.getAnimals({
//         filter: { farmId: this.farmId },
//         options: { limit: 250, offset: 0 }
//       }));
      
//       const rawItems = res?.items || [];
//       this.femaleInventory = rawItems.filter((cattle: any) => cattle?.sex === 'Female');
//       this.filteredFemaleInventory = [...this.femaleInventory];
//       this.cdr.markForCheck();
//     } catch (err) {
//       console.error('Error fetching female cattle assets:', err);
//       this.femaleInventory = [];
//       this.filteredFemaleInventory = [];
//     }
//   }

//   public selectPreset(preset: string): void {
//     const cancelGroup = this.calvingForm.get('cancellationInput');
//     const remarksCtrl = cancelGroup?.get('remarks');
//     const categoryCtrl = cancelGroup?.get('reasonCategory');
//     const actionCtrl = cancelGroup?.get('nextAction');

//     if (this.selectedPreset() === preset) {
//       this.selectedPreset.set(null);
//       remarksCtrl?.setValue('');
//     } else {
//       this.selectedPreset.set(preset);
//       remarksCtrl?.setValue(preset);

//       if (preset.includes('Abortion') || preset.includes('Miscarriage')) {
//         categoryCtrl?.setValue('Misscarriage');
//         actionCtrl?.setValue('RE_OPEN_HEAT');
//       } else if (preset.includes('Stillborn') || preset.includes('Failed Delivery')) {
//         categoryCtrl?.setValue('FailedConception');
//         actionCtrl?.setValue('VET_REVIEW');
//       } else if (preset.includes('Infection') || preset.includes('Complication')) {
//         categoryCtrl?.setValue('UterineInfection');
//         actionCtrl?.setValue('VET_REVIEW');
//       } else {
//         categoryCtrl?.setValue('EmbryonicLoss');
//         actionCtrl?.setValue('RE_OPEN_HEAT');
//       }
//     }

//     remarksCtrl?.markAsDirty();
//     remarksCtrl?.updateValueAndValidity();
//     this.cdr.markForCheck();
//   }

//   public onManualRemarkInput(event: any): void {
//     const val = event.detail?.value || event.target?.value;
//     if (val !== this.selectedPreset()) {
//       this.selectedPreset.set(null);
//     }
//   }

//   async onSubmit() {
//     if (this.calvingForm.invalid || this.submitting()) {
//       this.calvingForm.markAllAsTouched();
//       return;
//     }

//     if (this.type === 'confirm' || this.type === 'cancel') {
//       this.handleTransactionalResolution();
//       return;
//     }

//     if (this.type === 'create' && !this.selectedFemaleCattle) {
//       this.showToast('Please specify a target livestock profile record.', 'warning');
//       return;
//     }

//     this.submitting.set(true);
//     const formVals = this.calvingForm.value;

//     if (this.type === 'create') {
//       this.apollo.mutate<any>({
//         mutation: CREATE_CALVING,
//         variables: {
//           animalId: this.selectedFemaleCattle.id || this.selectedFemaleCattle._id,
//           occurredAt: formVals.occurredAt,
//           note: formVals.note
//         }
//       }).subscribe({
//         next: (res) => this.handleMutationResponse(res, 'createCalving'),
//         error: (err) => this.handleMutationError(err)
//       });

//     } else if (this.type === 'edit') {
//       const existingLactationId = this.calving.lactationId || this.calving.lactation?._id || this.calving.lactation?.id;

//       if (!existingLactationId) {
//         this.showToast('Missing required lactation reference for updating this record.', 'danger');
//         this.submitting.set(false);
//         return;
//       }

//       this.apollo.mutate<any>({
//         mutation: UPDATE_CALVING,
//         variables: {
//           calvingId: this.calving.id || this.calving._id,
//           input: {
//             occurredAt: formVals.occurredAt,
//             note: formVals.note
//           }
//         }
//       }).subscribe({
//         next: (res) => this.handleMutationResponse(res, 'updateCalving'),
//         error: (err) => this.handleMutationError(err)
//       });
//     }
//   }

//   private handleTransactionalResolution(): void {
//     const pregnancyId = this.calving?.id || this.calving?._id;
//     if (!pregnancyId) {
//       this.showToast('Missing pregnancy reference context for this transaction.', 'danger');
//       return;
//     }

//     this.submitting.set(true);
//     const formVals = this.calvingForm.value;
//     const hasCalved = this.type === 'confirm';

//     let resolutionInput: any = {
//       occurredAt: new Date(formVals.occurredAt || new Date()).toISOString()
//     };

//     if (hasCalved) {
//       const c = formVals.confirmationInput;
//       const combinedNote = [
//         `Calf Gender: ${c.calfGender || 'N/A'}`,
//         c.calfWeight ? `Weight: ${c.calfWeight}kg` : null,
//         `Ease: ${c.calvingEase || 'Normal'}`,
//         c.note?.trim()
//       ].filter(Boolean).join(' | ');

//       resolutionInput.note = combinedNote;

//     } else {
//       const cancel = formVals.cancellationInput;
//       resolutionInput.cancellationInput = {
//         reasonCategory: cancel.reasonCategory,
//         nextAction: cancel.nextAction,
//         remarks: cancel.remarks?.trim()
//       };
//       resolutionInput.failureReason = cancel.remarks?.trim();
//     }

//     this.apollo.mutate<any>({
//       mutation: RESOLVE_PREGNANCY_SELECTION,
//       variables: {
//         pregnancyId,
//         hasCalved,
//         resolutionInput
//       },
//       refetchQueries: ['GetDashboardCounts', 'GetActivePregnancies', 'GetAnimalHistory']
//     }).subscribe({
//       next: (res) => this.handleMutationResponse(res, 'resolvePregnancySelection'),
//       error: (err) => this.handleMutationError(err)
//     });
//   }

//   async onDelete() {
//     if (this.submitting() || !this.calving) return;
//     this.submitting.set(true);

//     this.apollo.mutate<any>({
//       mutation: DELETE_CALVING,
//       variables: {
//         calvingId: this.calving.id || this.calving._id
//       }
//     }).subscribe({
//       next: (res) => this.handleMutationResponse(res, 'deleteCalving'),
//       error: (err) => this.handleMutationError(err)
//     });
//   }

//   getSelectedFemaleLabel(): string {
//     if (this.selectedFemaleCattle) {
//       const tag = this.selectedFemaleCattle.tagNo || '';
//       const name = this.selectedFemaleCattle.name ? ` • ${this.selectedFemaleCattle.name}` : '';
//       return `${tag}${name}`;
//     }
//     return 'Select Female Livestock *';
//   }

//   handleFemaleSearch(event: any) {
//     const query = event.target.value?.toLowerCase().trim() || '';
//     if (!query) {
//       this.filteredFemaleInventory = [...this.femaleInventory];
//       return;
//     }
//     this.filteredFemaleInventory = this.femaleInventory.filter(
//       (cattle) =>
//         cattle.tagNo?.toLowerCase().includes(query) ||
//         (cattle.name && cattle.name.toLowerCase().includes(query)) ||
//         (cattle.breed && cattle.breed.toLowerCase().includes(query))
//     );
//   }

//   selectFemaleCattle(cattle: any, popover: IonPopover) {
//     this.selectedFemaleCattle = cattle;
//     this.calvingForm.patchValue({ animalId: cattle.id || cattle._id });
//     this.cdr.markForCheck();
//     popover.dismiss();
//   }

//   closeModal(role: string = 'cancel') {
//     this.modalCtrl.dismiss(null, role);
//   }

//   private handleMutationResponse(res: any, key: string) {
//     this.submitting.set(false);
//     const payload = res?.data?.[key];

//     if (payload?.success) {
//       this.showToast(payload.message || 'Operation executed successfully.', 'success');
//       this.closeModal('confirm');
//     } else {
//       this.showToast(payload?.message || 'Server declined operation state updates.', 'danger');
//     }
//   }

//   private handleMutationError(err: any) {
//     this.submitting.set(false);
//     console.error('GraphQL Mutation Failure:', err);
//     this.showToast(err?.message || 'Network structural dispatch failure encountered.', 'danger');
//   }

//   private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
//     const toast = await this.toastCtrl.create({
//       message,
//       duration: 3000,
//       color,
//       position: 'bottom'
//     });
//     await toast.present();
//   }
// }


import { Component, Input, OnInit, WritableSignal, signal, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { 
  IonPopover, ModalController, ToastController, IonItemGroup, IonItemDivider,
  IonTextarea, IonSelect, IonSelectOption, IonInput, IonItem, IonList, IonLabel,
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonFooter, IonSpinner, IonChip, IonSearchbar
} from '@ionic/angular/standalone';
import { Apollo } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { CREATE_CALVING, UPDATE_CALVING, DELETE_CALVING, RESOLVE_CALVING_SELECTION } from 'src/app/graphql/queries/event.queries';
import { AnimalService } from 'src/app/services/animal/animal.service';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';

@Component({
  selector: 'app-calving-modal',
  templateUrl: './calving-modal.component.html',
  styleUrls: ['./calving-modal.component.scss'],
  standalone: true,
  imports: [
    SharedImportsModule,
    ReactiveFormsModule,
    FormsModule,
    IonItemGroup,
    IonItemDivider,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonItem,
    IonList,
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonFooter,
    IonSpinner,
    IonChip,
    IonSearchbar,
    IonPopover
  ]
})
export class CalvingModalComponent implements OnInit {
  @Input() type: 'create' | 'edit' | 'delete' | 'confirm' | 'cancel' = 'create';
  @Input() calving: any;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private apollo = inject(Apollo);
  private toastCtrl = inject(ToastController);
  private animalService = inject(AnimalService);
  private chmsService = inject(CattleMonitoringService);
  private eventUtil = inject(EventUtilityService);
  private cdr = inject(ChangeDetectorRef);

  calvingForm!: FormGroup;
  submitting: WritableSignal<boolean> = signal(false);

  public selectedPreset = signal<string | null>(null);
  public maxDate: string = new Date().toISOString().split('T')[0];

  femaleInventory: any[] = [];
  filteredFemaleInventory: any[] = [];
  selectedFemaleCattle: any = null;
  private farmId: string = '';

  public readonly presetRemarks: string[] = [
    'Normal Term - Failed Delivery / Stillborn',
    'Spontaneous Abortion / Miscarriage',
    'Dystocia / Delivery Complications',
    'Uterine Infection / Severe Complication',
    'Suspected Early Embryonic Loss',
    'Maternal Health / High Risk Stress'
  ];

  ngOnInit() {
    this.syncSavedFarmSelection();
    this.buildForm();
  }

  private syncSavedFarmSelection(): void {
    const selections = this.eventUtil.getSavedSelections();
    this.farmId = selections?.farmId || '';
  }

  private buildForm(): void {
    const todayStr = new Date().toISOString().split('T')[0];

    let initialDate = todayStr;
    let initialNote = '';

    if ((this.type === 'edit' || this.type === 'delete') && this.calving) {
      if (this.calving.occurredAt) {
        initialDate = new Date(Number(this.calving.occurredAt) || this.calving.occurredAt)
          .toISOString()
          .split('T')[0];
      }
      initialNote = this.calving.note || '';
    }

    const animalId = this.calving?.animal?.id || this.calving?.animal?._id || this.calving?.animal || '';

    this.calvingForm = this.fb.group({
      animalId: [animalId, this.type === 'create' ? [Validators.required] : []],
      occurredAt: [initialDate, Validators.required],
      note: [initialNote],

      confirmationInput: this.fb.group({
        checkedAt: [todayStr, this.type === 'confirm' ? [Validators.required] : []],
        calfGender: ['Female', this.type === 'confirm' ? [Validators.required] : []],
        calfWeight: [null],
        calvingEase: ['Normal'],
        note: ['']
      }),

      cancellationInput: this.fb.group({
        reasonCategory: ['Misscarriage', this.type === 'cancel' ? [Validators.required] : []],
        nextAction: ['RE_OPEN_HEAT', this.type === 'cancel' ? [Validators.required] : []],
        remarks: ['', this.type === 'cancel' ? [Validators.required] : []]
      })
    });

    if (this.type === 'delete') {
      this.calvingForm.disable();
    }
  }

  public selectPreset(preset: string): void {
    const cancelGroup = this.calvingForm.get('cancellationInput');
    const remarksCtrl = cancelGroup?.get('remarks');
    const categoryCtrl = cancelGroup?.get('reasonCategory');
    const actionCtrl = cancelGroup?.get('nextAction');

    if (this.selectedPreset() === preset) {
      this.selectedPreset.set(null);
      remarksCtrl?.setValue('');
    } else {
      this.selectedPreset.set(preset);
      remarksCtrl?.setValue(preset);

      if (preset.includes('Abortion') || preset.includes('Miscarriage')) {
        categoryCtrl?.setValue('Misscarriage');
        actionCtrl?.setValue('RE_OPEN_HEAT');
      } else if (preset.includes('Stillborn') || preset.includes('Failed Delivery')) {
        categoryCtrl?.setValue('FailedConception');
        actionCtrl?.setValue('VET_REVIEW');
      } else if (preset.includes('Infection') || preset.includes('Complication')) {
        categoryCtrl?.setValue('UterineInfection');
        actionCtrl?.setValue('VET_REVIEW');
      } else {
        categoryCtrl?.setValue('EmbryonicLoss');
        actionCtrl?.setValue('RE_OPEN_HEAT');
      }
    }

    remarksCtrl?.markAsDirty();
    remarksCtrl?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  public onManualRemarkInput(event: any): void {
    const val = event.detail?.value || event.target?.value;
    if (val !== this.selectedPreset()) {
      this.selectedPreset.set(null);
    }
  }

  async onSubmit() {
    if (this.calvingForm.invalid || this.submitting()) {
      this.calvingForm.markAllAsTouched();
      return;
    }

    if (this.type === 'confirm' || this.type === 'cancel') {
      this.handleTransactionalResolution();
      return;
    }

    this.submitting.set(true);
    const formVals = this.calvingForm.value;

    if (this.type === 'create') {
      this.apollo.mutate<any>({
        mutation: CREATE_CALVING,
        variables: {
          animalId: formVals.animalId,
          occurredAt: formVals.occurredAt,
          note: formVals.note
        }
      }).subscribe({
        next: (res) => this.handleMutationResponse(res, 'createCalving'),
        error: (err) => this.handleMutationError(err)
      });

    } else if (this.type === 'edit') {
      this.apollo.mutate<any>({
        mutation: UPDATE_CALVING,
        variables: {
          calvingId: this.calving.id || this.calving._id,
          input: {
            occurredAt: formVals.occurredAt,
            note: formVals.note
          }
        }
      }).subscribe({
        next: (res) => this.handleMutationResponse(res, 'updateCalving'),
        error: (err) => this.handleMutationError(err)
      });
    }
  }

  private handleTransactionalResolution(): void {
    const targetCalvingId = this.calving?.id || this.calving?._id;
    if (!targetCalvingId) {
      this.showToast('Missing calving event context.', 'danger');
      return;
    }

    this.submitting.set(true);
    const formVals = this.calvingForm.value;
    const hasCalved = this.type === 'confirm';

    let resolutionInput: any = {
      occurredAt: new Date(formVals.occurredAt || new Date()).toISOString()
    };

    if (hasCalved) {
      const c = formVals.confirmationInput;
      resolutionInput.confirmationInput = {
        checkedAt: c.checkedAt,
        calfGender: c.calfGender,
        calfWeight: c.calfWeight ? Number(c.calfWeight) : null,
        calvingEase: c.calvingEase,
        note: c.note?.trim()
      };
    } else {
      const cancel = formVals.cancellationInput;
      resolutionInput.cancellationInput = {
        reasonCategory: cancel.reasonCategory,
        nextAction: cancel.nextAction,
        remarks: cancel.remarks?.trim()
      };
    }

    this.apollo.mutate<any>({
      mutation: RESOLVE_CALVING_SELECTION,
      variables: {
        calvingId: targetCalvingId,
        hasCalved,
        resolutionInput
      },
      refetchQueries: ['GetDashboardCounts', 'GetActivePregnancies', 'GetAnimalHistory', 'GetCalvings']
    }).subscribe({
      next: (res) => this.handleMutationResponse(res, 'resolveCalvingSelection'),
      error: (err) => this.handleMutationError(err)
    });
  }

  closeModal(role: string = 'cancel') {
    this.modalCtrl.dismiss(null, role);
  }

  private handleMutationResponse(res: any, key: string) {
    this.submitting.set(false);
    const payload = res?.data?.[key];

    if (payload?.success) {
      this.showToast(payload.message || 'Operation executed successfully.', 'success');
      this.closeModal('confirm');
    } else {
      this.showToast(payload?.message || 'Server declined operation state updates.', 'danger');
    }
  }

  private handleMutationError(err: any) {
    this.submitting.set(false);
    console.error('GraphQL Mutation Failure:', err);
    this.showToast(err?.message || 'Network structural dispatch failure encountered.', 'danger');
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}