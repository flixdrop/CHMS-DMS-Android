import { ChangeDetectorRef, Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, AlertController, IonNote } from '@ionic/angular/standalone';
import { Apollo } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { 
  CREATE_DEVICE, 
  UPDATE_DEVICE, 
  DELETE_DEVICE, 
  GET_UNASSIGNED_ANIMALS
} from 'src/app/graphql/queries/device.queries';
import { MANAGED_FARMS_LIST } from 'src/app/graphql/queries/system.queries';
import { SharedImportsModule } from 'src/app/shared/shared-imports';

@Component({
  selector: 'app-device-modal',
  templateUrl: './device-modal.component.html',
  styleUrls: ['./device-modal.component.scss'],
  standalone: true,
  imports: [SharedImportsModule, ReactiveFormsModule, IonNote]
})
export class DeviceModalComponent implements OnInit {
  @Input() type: 'create' | 'edit' | 'delete' = 'create';
  @Input() device?: any; 

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private apollo = inject(Apollo);
  private cdr = inject(ChangeDetectorRef);

  public deviceForm!: FormGroup;
  public submitting = signal(false);

  // Structural Lookup Matrix
  public managedFarms: any[] = [];
  public filteredFarms: any[] = [];
  public availableAnimals: any[] = [];
  public filteredAnimals: any[] = [];

  ngOnInit() {
    this.initializeForm();
    if (this.type !== 'delete') {
      this.loadSelectionContexts();
    }
  }

  private initializeForm(): void {
    this.deviceForm = this.fb.group({
      deviceNo: [this.device?.deviceNo || '', [Validators.required, Validators.minLength(2)]],
      manufacturer: [this.device?.manufacturer || 'DATAMARS'],
      type: [this.device?.type || 'COLLAR', [Validators.required]],
      farmId: [this.device?.farm?.id || this.device?.farmId || '', [Validators.required]],
      animalId: [this.device?.animal?.id || this.device?.animalId || '']
    });

    if (this.type === 'delete') {
      this.deviceForm.disable();
    } else if (this.type === 'edit') {
      this.deviceForm.get('deviceNo')?.disable();
      this.deviceForm.get('farmId')?.disable();
    }
  }

  private async loadSelectionContexts(): Promise<void> {
    try {
      const farmPromise = firstValueFrom(this.apollo.query<any>({
        query: MANAGED_FARMS_LIST,
        variables: { targetPath: '' },
        fetchPolicy: 'network-only'
      }));

      const animalPromise = firstValueFrom(this.apollo.query<any>({
        query: GET_UNASSIGNED_ANIMALS,
        fetchPolicy: 'network-only'
      }));

      const [farmsRes, animalsRes] = await Promise.all([farmPromise, animalPromise]);

      if (farmsRes?.data) {
        this.managedFarms = farmsRes.data.getManagedFarms || [];
        this.filteredFarms = [...this.managedFarms];
      }

      if (animalsRes?.data?.getUnassignedAnimals) {
        this.availableAnimals = animalsRes.data.getUnassignedAnimals.items || [];
        this.filteredAnimals = [...this.availableAnimals];
      }

      this.cdr.detectChanges();
    } catch (err: any) {
      console.error('Failed loading lookup options safely:', err);
    }
  }

  public handleFarmSearch(event: any): void {
    const query = event.target.value?.toLowerCase().trim() || '';
    this.filteredFarms = query 
      ? this.managedFarms.filter(f => f.name.toLowerCase().includes(query))
      : [...this.managedFarms];
  }

  public handleAnimalSearch(event: any): void {
    const query = event.target.value?.toLowerCase().trim() || '';
    this.filteredAnimals = query 
      ? this.availableAnimals.filter(a => a.tagNo.toLowerCase().includes(query) || (a.name && a.name.toLowerCase().includes(query)))
      : [...this.availableAnimals];
  }

  public selectFarm(farm: any, popover: any): void {
    this.deviceForm.get('farmId')?.setValue(farm.id);
    this.deviceForm.get('farmId')?.markAsDirty();
    popover.dismiss();
  }

  public getSelectedFarmLabel(): string {
    const currentId = this.deviceForm.get('farmId')?.value;
    if (!currentId) return 'Select Target Structural Farm';
    const match = this.managedFarms.find(f => f.id === currentId);
    return match ? match.name : 'Select Target Structural Farm';
  }

  public selectAnimal(animal: any, popover: any): void {
    this.deviceForm.get('animalId')?.setValue(animal.id);
    this.deviceForm.get('animalId')?.markAsDirty();
    popover.dismiss();
  }

  public getSelectedAnimalLabel(): string {
    const currentId = this.deviceForm.get('animalId')?.value;
    if (!currentId) return 'No Animal Hosted (Unassigned)';
    const match = this.availableAnimals.find(a => a.id === currentId);
    return match ? `Tag: ${match.tagNo} (${match.name || 'Unnamed'})` : 'Animal Attached';
  }
  
  public clearAnimalSelection(event: Event): void {
    event.stopPropagation(); 
    this.deviceForm.get('animalId')?.setValue('');
    this.deviceForm.get('animalId')?.markAsDirty();
  }

  // ========================================================================
  // 📋 DISPATCH METHODS: DEVICE ACTIONS PROTOCOLS
  // ========================================================================

  async onSubmit(): Promise<void> {
    if (this.deviceForm.invalid) {
      this.deviceForm.markAllAsTouched();
      return;
    }

    const formPayload = this.deviceForm.getRawValue();
    this.submitting.set(true);

    if (this.type === 'create') {
      this.apollo.mutate<any>({
        mutation: CREATE_DEVICE,
        variables: { input: formPayload }
      }).subscribe({
        next: (res) => {
          if (res.data?.createDevice?.success) {
            this.handleSuccessMsg(res.data.createDevice.message);
          } else {
            this.handleFailureMsg({ message: res.data?.createDevice?.message });
          }
        },
        error: (err) => this.handleFailureMsg(err)
      });

    } else if (this.type === 'edit') {
      const { deviceNo, farmId, ...updateFields } = formPayload;
      this.apollo.mutate<any>({
        mutation: UPDATE_DEVICE,
        variables: { id: this.device.id, input: updateFields }
      }).subscribe({
        next: (res) => {
          if (res.data?.updateDevice?.success) {
            this.handleSuccessMsg(res.data.updateDevice.message);
          } else {
            this.handleFailureMsg({ message: res.data?.updateDevice?.message });
          }
        },
        error: (err) => this.handleFailureMsg(err)
      });
    }
  }

  async onDelete(): Promise<void> {
    if (!this.device?.id) return;
    const currentSerial = this.deviceForm.get('deviceNo')?.value || 'this hardware asset';

    await this.showAlert({
      header: 'Decommission Device?',
      subHeader: `Are you sure you want to completely clear and drop nodes for hardware node: ${currentSerial}?`,
      isConfirmDialog: true,
      confirmButtonText: 'Decommission',
      role: 'error',
      onConfirmAction: () => this.executeHardwarePurge(this.device.id)
    });
  }

  private executeHardwarePurge(deviceId: string): void {
    this.submitting.set(true);
    this.apollo.mutate<any>({
      mutation: DELETE_DEVICE,
      variables: { id: deviceId }
    }).subscribe({
      next: (res) => {
        if (res.data?.deleteDevice?.success) {
          this.handleSuccessMsg(res.data.deleteDevice.message || 'Hardware successfully decommissioned.');
        } else {
          this.handleFailureMsg({ message: res.data?.deleteDevice?.message });
        }
      },
      error: (err) => this.handleFailureMsg(err)
    });
  }

  // ========================================================================
  // 🎛️ SYSTEM INFRASTRUCTURE DIALOG DICTIONARIES
  // ========================================================================

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
      header: 'Operation Refused',
      subHeader: err?.message || 'The application server rejected hardware parameters.',
      role: 'error'
    });
  }

  closeModal(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}