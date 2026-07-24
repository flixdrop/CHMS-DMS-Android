import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, AlertController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Apollo } from 'apollo-angular';
import { DELETE_USER_MUTATION } from 'src/app/graphql/queries/auth.queries';
import { SharedImportsModule } from 'src/app/shared/shared-imports';

@Component({
  selector: 'app-user-modal',
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.scss'],
  standalone: true,
  imports: [SharedImportsModule]
})
export class UserModalComponent implements OnInit {
  @Input() type: 'create' | 'edit' | 'delete' = 'create';
  @Input() user?: any;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private authService = inject(AuthService);
  private apollo = inject(Apollo);

  public userForm!: FormGroup;
  public submitting = signal(false);
  public processingPhoto = signal(false);

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.userForm = this.fb.group({
      name: [this.user?.name || this.user?.username || '', [Validators.required, Validators.minLength(2)]],
      username: [this.user?.username || '', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      password: ['', this.type === 'create' ? [Validators.required, Validators.minLength(6)] : []],
      accessLevel: [this.user?.accessLevel || 'STAFF', [Validators.required]],
      accountTier: [this.user?.accountTier ?? null],
      parent: [this.user?.parent || ''],
      email: [this.user?.email || '', [Validators.email]],
      contact: [this.user?.contact || '', [Validators.pattern(/^[0-9+\-\s]+$/)]],
      logo: [this.user?.businessProfile?.logo || '']
    });

    if (this.type === 'delete') {
      this.userForm.disable();
    }
  }

  public onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) return;

    const nativeFile = fileInput.files[0];
    if (!nativeFile.type.startsWith('image/')) {
      this.showAlert({ header: 'Invalid File', message: 'Please pick an image profile file.', role: 'error' });
      return;
    }

    this.processingPhoto.set(true);

    const fileReader = new FileReader();
    fileReader.onload = (e: any) => {
      const sourceImg = new Image();
      sourceImg.onload = () => {
        // 🌟 RUN CLIENT-SIDE AUTOMATED CANVAS 400x400 GRACEFUL RESIZING
        const finalBase64String = this.resizeToFixedLayout(sourceImg, 400, 400);

        // Feed base64 string directly into form payload data group model
        this.userForm.patchValue({ logo: finalBase64String });
        this.userForm.get('logo')?.markAsDirty();
        this.processingPhoto.set(false);
      };
      sourceImg.onerror = () => {
        this.processingPhoto.set(false);
        this.showAlert({ header: 'Error', message: 'Failed to process selected file template.', role: 'error' });
      };
      sourceImg.src = e.target.result;
    };
    fileReader.readAsDataURL(nativeFile);
  }

  // 🌟 Core browser canvas rendering engine to force fit target resolution limits
  private resizeToFixedLayout(img: HTMLImageElement, targetWidth: number, targetHeight: number): string {
    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = targetWidth;
    hiddenCanvas.height = targetHeight;
    const ctx = hiddenCanvas.getContext('2d');

    if (!ctx) return '';

    // Calculate crop parameters for object centering behavior
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = img.width;
    let sourceHeight = img.height;

    const sourceAspectRatio = img.width / img.height;
    const targetAspectRatio = targetWidth / targetHeight;

    if (sourceAspectRatio > targetAspectRatio) {
      sourceWidth = img.height * targetAspectRatio;
      sourceX = (img.width - sourceWidth) / 2;
    } else {
      sourceHeight = img.width / targetAspectRatio;
      sourceY = (img.height - sourceHeight) / 2;
    }

    // Render scaled and centered crop to canvas surface frame
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight, // Source bounding geometry parameters
      0, 0, targetWidth, targetHeight               // Destination canvas viewport maps
    );

    // Export cleanly to medium footprint optimized raw jpeg layout
    return hiddenCanvas.toDataURL('image/jpeg', 0.85);
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
        {
          text: 'Cancel',
          role: 'cancel'
        },
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
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      await this.showAlert({
        header: 'Validation Failure',
        subHeader: 'Please review all mandatory fields for proper constraint alignment.',
        role: 'error'
      });
      return;
    }

    const formPayload = this.userForm.value;
    this.submitting.set(true);

    if (this.type === 'create') {
      this.authService.createUser(formPayload).subscribe({
        next: () => this.handleSuccessMsg(`${formPayload.name}'s account successfully registered!`),
        error: (err) => this.handleFailureMsg(err)
      });
    } else if (this.type === 'edit') {
      this.authService.updateUser(this.user.id, formPayload).subscribe({
        next: () => this.handleSuccessMsg(`${formPayload.name}'s account successfully updated.`),
        error: (err) => this.handleFailureMsg(err)
      });
    }
  }

  async onDelete(): Promise<void> {
    if (!this.user?.id) return;
    const currentName = this.userForm.get('name')?.value || 'this user';

    await this.showAlert({
      header: 'Delete Profile ?',
      subHeader: `Are you sure want to delete ${currentName}'s Profile`,
      isConfirmDialog: true,
      confirmButtonText: 'Confirm',
      role: 'error',
      onConfirmAction: () => this.deleteUserProfile(this.user.id)
    });
  }

  private deleteUserProfile(userId: string): void {
    this.submitting.set(true);
    this.apollo.mutate<any>({
      mutation: DELETE_USER_MUTATION,
      variables: { id: userId }
    }).subscribe({
      next: (response) => this.handleSuccessMsg(response?.data?.deleteUser?.message || 'Profile successfully removed.'),
      error: (err) => this.handleFailureMsg(err)
    });
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