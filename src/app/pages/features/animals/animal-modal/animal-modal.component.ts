import { ChangeDetectorRef, Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, AlertController, IonNote } from '@ionic/angular/standalone';
import { Apollo } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { 
  CREATE_ANIMAL, 
  UPDATE_ANIMAL, 
  DELETE_ANIMAL, 
  ASSIGN_DEVICE, 
  GET_UNASSIGNED_DEVICES
} from 'src/app/graphql/queries/animal.queries';
import { MANAGED_FARMS_LIST } from 'src/app/graphql/queries/system.queries';
import { SharedImportsModule } from 'src/app/shared/shared-imports';

@Component({
  selector: 'app-animal-modal',
  templateUrl: './animal-modal.component.html',
  styleUrls: ['./animal-modal.component.scss'],
  standalone: true,
  imports: [SharedImportsModule, ReactiveFormsModule, IonNote]
})
export class AnimalModalComponent implements OnInit {
  @Input() type: 'create' | 'edit' | 'delete' | 'assign-collar' = 'create';
  @Input() animal?: any; 

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private apollo = inject(Apollo);
  private cdr = inject(ChangeDetectorRef);

  public animalForm!: FormGroup;
  public submitting = signal(false);
  public maxDate = new Date().toISOString();

  // Selection Lookups Array Nodes
  public managedFarms: any[] = [];
  public filteredFarms: any[] = [];
  public availableDevices: any[] = [];
  public filteredDevices: any[] = [];

  ngOnInit() {
    if (this.type !== 'assign-collar') {
      this.initializeForm();
    }
    if (this.type !== 'delete') {
      this.loadSelectionContexts();
    }
  }

  private initializeForm(): void {
    let initialGender = 'Female';
    if (this.animal?.gender || this.animal?.sex) {
      const g = this.animal.gender || this.animal.sex;
      initialGender = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
    }

    let initialStatus = this.animal?.status || 'Active';
    if (initialStatus === 'HEALTHY' || initialStatus === 'Active') initialStatus = 'Active';
    if (initialStatus === 'SICK' || initialStatus === 'QUARANTINED' || initialStatus === 'Quarantine') initialStatus = 'Quarantine';

    this.animalForm = this.fb.group({
      tagNo: [this.animal?.tagNo || '', [Validators.required, Validators.minLength(2)]],
      name: [this.animal?.name || ''],
      breed: [this.animal?.breed || '', [Validators.required]],
      gender: [initialGender, [Validators.required]],
      dob: [
        this.animal?.dob || this.animal?.dateOfBirth
          ? new Date(this.animal.dob || this.animal.dateOfBirth).toISOString().split('T')[0] 
          : '', 
        [Validators.required]
      ],
      farmId: [this.animal?.farm?.id || this.animal?.farmId || '', [Validators.required]],
      status: [initialStatus, [Validators.required]],
      deviceId: [this.animal?.activeTag?.id || this.animal?.deviceId || '']
    });

    if (this.type === 'delete') {
      this.animalForm.disable();
    } else if (this.type === 'edit') {
      this.animalForm.get('tagNo')?.disable();
      this.animalForm.get('farmId')?.disable();
    }
  }

  private async loadSelectionContexts(): Promise<void> {
    try {
      const farmPromise = this.type !== 'assign-collar' 
        ? firstValueFrom(this.apollo.query<any>({
            query: MANAGED_FARMS_LIST,
            variables: { targetPath: '' },
            fetchPolicy: 'network-only'
          }))
        : Promise.resolve(null);

      const devicePromise = firstValueFrom(this.apollo.query<any>({
        query: GET_UNASSIGNED_DEVICES,
        fetchPolicy: 'network-only'
      }));

      const [farmsRes, devicesRes] = await Promise.all([farmPromise, devicePromise]);

      if (farmsRes && farmsRes.data) {
        this.managedFarms = farmsRes.data.getManagedFarms || [];
        this.filteredFarms = [...this.managedFarms];
      }

      if (devicesRes && devicesRes.data?.getUnassignedDevices) {
        this.availableDevices = devicesRes.data.getUnassignedDevices.items || [];
        this.filteredDevices = [...this.availableDevices];
        console.log('Mapped Device Nodes for UI Array:', this.filteredDevices);
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

  public handleDeviceSearch(event: any): void {
    const query = event.target.value?.toLowerCase().trim() || '';
    this.filteredDevices = query 
      ? this.availableDevices.filter(d => d.deviceNo.toLowerCase().includes(query) || (d.name && d.name.toLowerCase().includes(query)))
      : [...this.availableDevices];
  }

  public selectFarm(farm: any, popover: any): void {
    this.animalForm.get('farmId')?.setValue(farm.id);
    this.animalForm.get('farmId')?.markAsDirty();
    popover.dismiss();
  }

  public getSelectedFarmLabel(): string {
    const currentId = this.animalForm.get('farmId')?.value;
    if (!currentId) return 'Select Targeted Farm';
    const match = this.managedFarms.find(f => f.id === currentId);
    return match ? match.name : 'Select Targeted Farm';
  }

  public selectDevice(device: any, popover: any): void {
    this.animalForm.get('deviceId')?.setValue(device.id);
    this.animalForm.get('deviceId')?.markAsDirty();
    popover.dismiss();
  }

  public getSelectedDeviceLabel(): string {
    const currentId = this.animalForm.get('deviceId')?.value;
    if (!currentId) return 'No Device Attached (Optional)';
    const match = this.availableDevices.find(d => d.id === currentId);
    return match ? `Serial: ${match.deviceNo}` : 'Device Attached';
  }
  
  public clearDeviceSelection(event: Event): void {
    event.stopPropagation(); 
    this.animalForm.get('deviceId')?.setValue('');
    this.animalForm.get('deviceId')?.markAsDirty();
  }

  // ========================================================================
  // 🛰️ DISPATCH METHODS: ASSIGN COLLAR LOGIC EXECUTORS
  // ========================================================================

  public async selectAndEnforceDevicePairing(deviceId: string): Promise<void> {
    if (!this.animal?.id || !deviceId) return;
    
    this.submitting.set(true);
    this.apollo.mutate<any>({
      mutation: ASSIGN_DEVICE,
      variables: {
        animalId: this.animal.id,
        deviceId: deviceId
      }
    }).subscribe({
      next: (res) => {
        if (res.data?.assignDevice?.success) {
          this.handleSuccessMsg(res.data.assignDevice.message || 'Collar successfully attached.');
        } else {
          this.handleFailureMsg({ message: res.data?.assignDevice?.message });
        }
      },
      error: (err) => this.handleFailureMsg(err)
    });
  }

  public async unassignActiveCollar(): Promise<void> {
    if (!this.animal?.id) return;

    await this.showAlert({
      header: 'Unassign Collar?',
      subHeader: `Are you sure you want to remove collar serial number ${this.animal.activeTag.deviceNo} from this profile?`,
      isConfirmDialog: true,
      confirmButtonText: 'Unassign',
      role: 'warning',
      onConfirmAction: () => {
        this.submitting.set(true);
        this.apollo.mutate<any>({
          mutation: ASSIGN_DEVICE,
          variables: {
            animalId: this.animal.id,
            deviceId: null 
          }
        }).subscribe({
          next: (res) => {
            if (res.data?.assignDevice?.success) {
              this.handleSuccessMsg(res.data.assignDevice.message || 'Collar unlinked successfully.');
            } else {
              this.handleFailureMsg({ message: res.data?.assignDevice?.message });
            }
          },
          error: (err) => this.handleFailureMsg(err)
        });
      }
    });
  }

  // ========================================================================
  // 📋 DISPATCH METHODS: PROFILE FORM EXECUTORS
  // ========================================================================

  async onSubmit(): Promise<void> {
    if (this.animalForm.invalid) {
      this.animalForm.markAllAsTouched();
      return;
    }

    const formPayload = this.animalForm.getRawValue();
    this.submitting.set(true);

    if (this.type === 'create') {
      this.apollo.mutate<any>({
        mutation: CREATE_ANIMAL,
        variables: { input: formPayload }
      }).subscribe({
        next: (res) => {
          if (res.data?.createAnimal?.success) {
            this.handleSuccessMsg(res.data.createAnimal.message);
          } else {
            this.handleFailureMsg({ message: res.data?.createAnimal?.message });
          }
        },
        error: (err) => this.handleFailureMsg(err)
      });

    } else if (this.type === 'edit') {
      const { tagNo, farmId, ...updateFields } = formPayload;
      this.apollo.mutate<any>({
        mutation: UPDATE_ANIMAL,
        variables: { id: this.animal.id, input: updateFields }
      }).subscribe({
        next: (res) => {
          if (res.data?.updateAnimal?.success) {
            this.handleSuccessMsg(res.data.updateAnimal.message);
          } else {
            this.handleFailureMsg({ message: res.data?.updateAnimal?.message });
          }
        },
        error: (err) => this.handleFailureMsg(err)
      });
    }
  }

  async onDelete(): Promise<void> {
    if (!this.animal?.id) return;
    const currentTag = this.animalForm.get('tagNo')?.value || 'this record';

    await this.showAlert({
      header: 'Delete Profile?',
      subHeader: `Are you sure you want to delete ${currentTag}'s Profile`,
      isConfirmDialog: true,
      confirmButtonText: 'Confirm',
      role: 'error',
      onConfirmAction: () => this.deleteAnimalProfile(this.animal.id)
    });
  }

  private deleteAnimalProfile(animalId: string): void {
    this.submitting.set(true);
    this.apollo.mutate<any>({
      mutation: DELETE_ANIMAL,
      variables: { id: animalId }
    }).subscribe({
      next: (res) => {
        if (res.data?.deleteAnimal?.success) {
          this.handleSuccessMsg(res.data.deleteAnimal.message || 'Profile removed.');
        } else {
          this.handleFailureMsg({ message: res.data?.deleteAnimal?.message });
        }
      },
      error: (err) => this.handleFailureMsg(err)
    });
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
      header: 'Operation Refused',
      subHeader: err?.message || 'The application server rejected execution parameters.',
      role: 'error'
    });
  }

  closeModal(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}