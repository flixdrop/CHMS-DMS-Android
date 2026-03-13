import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { first, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { NgxPaginationModule } from 'ngx-pagination';
import { UtcToIstPipe } from 'src/app/utils/pipes/utc-to-ist/utc-to-ist-pipe';
import { CustomFooterComponent } from 'src/app/components/custom-footer/custom-footer.component';
import { CustomHeaderComponent } from 'src/app/components/custom-header/custom-header.component';
import { DataService } from 'src/app/services/data/data.service';
import { AuthService } from 'src/app/features/auth/auth.service';
import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, IonTextarea, IonToolbar, IonItem, IonInput, IonChip, IonIcon, IonFooter, IonRadioGroup, IonRadio, IonList, IonModal, IonButtons, IonButton, IonTitle, IonDatetimeButton, IonDatetime, IonSelect, IonSelectOption, IonImg, ActionSheetController,
  IonSearchbar,
  ModalController,
  NavController,
  ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    ReactiveFormsModule,
    CustomHeaderComponent,
    CustomFooterComponent,
    NgxPaginationModule,
    UtcToIstPipe,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonLabel,
    IonToolbar,
    IonItem,
    IonChip,
    IonIcon,
    IonFooter,
    IonRadioGroup,
    IonRadio,
    IonList,
    IonModal,
    IonInput,
    IonTextarea,
    IonButtons,
    IonButton,
    IonTitle,
    IonDatetimeButton,
    IonDatetime,
    IonSelect,
    IonSelectOption,
    IonImg
],
  templateUrl: './health.page.html',
  styleUrls: ['./health.page.scss'],
})
export class HealthPage implements OnInit, OnDestroy {
  @ViewChild('searchbar', { static: false }) searchbar: IonSearchbar | any;
  @ViewChild('childModal') childModal: IonModal;
  @ViewChild(IonModal) filterModal!: IonModal;

  treatmentForm: FormGroup;

  authUserSub: Subscription;
  fetchDataSub: Subscription;
  healthEventSub: Subscription;
  reportTreatmentSub: Subscription;

  isLoading: boolean = false;

  results: any[] = [];
  animals: any[] = [];
  healths: any[] = [];

  formType: string;
  selectedEvent: any;
  selectedFile: any;

  p: number = 1;

  pageSize: number = 10;
  totalCount: number = 0;
  searchTerm: string = '';
  userId: string = '';

  startDate: string = '';
  endDate: string = '';

  fromDate: string;
  toDate: string;
  maxDate: string;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private modalControl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private toastController: ToastController,
    private navCtrl: NavController,
  ) {
    const now = new Date();
    this.maxDate = now.toISOString();
    this.toDate = now.toISOString();
    const rolling24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000)); 
    this.fromDate = rolling24Hours.toISOString();
  }

  ngOnDestroy() {
    if (this.healthEventSub) {
      this.healthEventSub.unsubscribe();
    }
    if (this.fetchDataSub) {
      this.fetchDataSub.unsubscribe();
    }
    if (this.authUserSub) {
      this.authUserSub.unsubscribe();
    }
  }

  ionViewWillEnter() {
    this.refreshPage();
  }

  // ngOnInit() {
  //   this.treatmentForm = this.createForm("confirm");
  // }

  // refreshPage(): Promise<void> {
  //   const currentTime = new Date().getTime();

  //   return new Promise<void>((resolve) => {
  //     this.isLoading = true;
  //     this.authUserSub = this.authService.authenticatedUser.subscribe(
  //       (user) => {
  //         this.fetchDataSub = this.dataService
  //           .fetchOrganizationDocuments(user["id"])
  //           .subscribe((data) => {
  //             this.isLoading = false;
  //             this.results = [];
  //             this.animals = [];
  //             const farm = JSON.parse(localStorage.getItem("farm"));
  //             if (farm) {
  //               this.healthEventSub = this.dataService.userData.subscribe(
  //                 (userData) => {
  //                   // this.healths = userData["healthEvents"]
  //                   //   .filter((healthEvent) => {
  //                   //     const startedAtTime = new Date(parseInt(healthEvent?.detectedAt)).getTime();
  //                   //     return currentTime - startedAtTime < 24 * 60 * 60 * 1000 && healthEvent?.isActive === true;
  //                   //   })
  //                   //   .sort(
  //                   //     (a: any, b: any) =>
  //                   //       new Date(parseInt(b.detectedAt)).getTime() -
  //                   //       new Date(parseInt(a.detectedAt)).getTime()
  //                   //   );

  //                     this.healths = userData["healthEvents"]
  //                     .filter((healthEvent) => {
  //                       return healthEvent?.isActive === true;
  //                     })
  //                     .sort(
  //                       (a: any, b: any) =>
  //                         new Date(parseInt(b.detectedAt)).getTime() -
  //                         new Date(parseInt(a.detectedAt)).getTime()
  //                     );
  //                 }
  //               );
  //               this.results = this.healths;
  //             }
  //             resolve();
  //           });
  //       }
  //     );
  //   });
  // }

  ngOnInit(): void {
    this.authService.authenticatedUser$
      .pipe(first((user) => !!user))
      .subscribe((user) => {
        console.log('Authenticated User Found:', user.id);
        this.userId = user.id;
        this.loadHealths();
      });
  }

  closeChildModal() {
    this.childModal.dismiss().then(() => {
      this.treatmentForm.reset();
    });
  }

  goBack() {
    this.navCtrl.back();
  }

  async showToast(data: any) {
    const toast = await this.toastController.create({
      swipeGesture: 'vertical',
      icon: 'thumbs-up-sharp',
      header: data.header,
      message: data.msg,
      color: data.color,
      duration: 3000,
    });
    toast.present();
  }

  createForm(type: string): FormGroup {
    // if (type === "yes") {
    //   return new FormGroup({
    //     treatmentType: new FormControl("", {
    //       validators: [Validators.required],
    //     }),
    //     medicine: new FormControl("", {
    //       updateOn: "blur",
    //       validators: [Validators.required],
    //     }),
    //     nutrition: new FormControl("", {
    //       updateOn: "blur",
    //       validators: [Validators.required],
    //     }),
    //     prescriptionRef: new FormControl(null),
    //     note: new FormControl("", {
    //       updateOn: "blur",
    //       validators: [Validators.required],
    //     }),
    //   });
    // } else {
    //   return new FormGroup({
    //     note: new FormControl(null, {
    //       updateOn: "blur",
    //       validators: [Validators.required],
    //     }),
    //   });
    // }

    return new FormGroup({
      treatmentType: new FormControl(null),
      medicine: new FormControl(null),
      nutrition: new FormControl(null),
      prescriptionRef: new FormControl(null),
      note: new FormControl(null), // For 'cancel'
    });
  }

  onSelectOption(event: any, health: any) {
    const eventValue = event.detail.value;
    this.childModal.present().then(() => {
      this.selectedEvent = health;
      this.formType = eventValue;
      this.treatmentForm = this.createForm(eventValue);
    });
    this.childModal.onDidDismiss().then(() => {
      this.refreshPage();
    });
  }

  async takePhoto() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera, // Camera, Photos or Prompt!
    });

    if (image) {
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const base64 = (await this.convertBlobToBase64(blob)) as string;
      this.selectedFile = base64;
      this.treatmentForm.controls['prescriptionRef'].setValue(base64);
    }
  }

  async uploadPhoto() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos, // Camera, Photos or Prompt!
    });

    if (image) {
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const base64 = (await this.convertBlobToBase64(blob)) as string;
      this.selectedFile = base64;
      this.treatmentForm.controls['prescriptionRef'].setValue(base64);
    }
  }

  convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  async uploadPrescription() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `Upload Prescription`,
      backdropDismiss: true,
      buttons: [
        {
          icon: 'camera',
          text: 'Take Photo',
          handler: async () => {
            this.takePhoto();
          },
        },
        {
          icon: 'folder',
          text: 'Choose Photo',
          handler: async () => {
            this.uploadPhoto();
          },
        },
      ],
    });

    await actionSheet.present();
  }

  onSelectTypeOfTreatment(event: any) {
    this.treatmentForm.controls['treatmentType'].setValue(event.detail.value);
  }

  reportTreatment() {
    console.log('Treatment Form : ', this.treatmentForm.value);

    const data = {
      eventDateTime: new Date().toISOString(),
      treatment_form: this.treatmentForm.value,
      health: this.selectedEvent,
    };

    this.reportTreatmentSub =
      this.formType === 'yes'
        ? this.dataService.reportTreatment(data).subscribe((health) => {
            const toast = {
              header: 'Treatment Started',
              msg: `Animal No. ${data.health.animal.collar.name} is under treatment.`,
              color: 'success',
            };

            this.showToast(toast);
            console.log('Reported Treatment: ', health);
          })
        : this.dataService.reportTreatmentFailure(data).subscribe((health) => {
            const toast = {
              header: 'Not Treated',
              msg: `No treatment given to Animal No. ${data.health.animal.collar.name}.`,
              color: 'warning',
            };

            this.showToast(toast);
            console.log('Reported Treatment Failure: ', health);
          });

    this.modalControl.dismiss().then(() => {
      this.treatmentForm.reset();
      this.refreshPage();
      this.selectedEvent = null;
      this.formType = null;
      this.selectedFile = null;
    });
  }

  // handleInput(event: any) {
  //   this.isLoading = true;
  //   setTimeout(() => {
  //     this.isLoading = false;
  //   }, 2500);
  //   const query = event.target.value.toLowerCase();

  //   if (!this.healths || this.healths.length === 0) {
  //     this.results = [];
  //     return;
  //   }

  //   this.results = this.healths.filter((animal) => {
  //     return this.deepSearch(animal, query);
  //   });
  // }

  // deepSearch(obj: any, query: string): boolean {
  //   if (typeof obj === "string") {
  //     return obj.toLowerCase().includes(query);
  //   } else if (typeof obj === "object") {
  //     for (const key in obj) {
  //       if (this.deepSearch(obj[key], query)) {
  //         return true;
  //       }
  //     }
  //   }
  //   return false;
  // }

  // onBlurSearchBar() {
  //   console.log("Modal Dismissed");
  //   if (this.searchbar) {
  //     this.searchbar.value = null;
  //     this.healths = null;
  //     this.results = null;
  //   }
  // }

  deepSearch(obj: any, query: string): boolean {
    if (typeof obj === 'string') {
      return obj.toLowerCase().includes(query);
    } else if (typeof obj === 'object') {
      for (const key in obj) {
        if (this.deepSearch(obj[key], query)) {
          return true;
        }
      }
    }
    return false;
  }

  onBlurSearchBar() {
    console.log('Modal Dismissed');
    if (this.searchbar) {
      this.searchbar.value = null;
      this.healths = null;
      this.results = null;
    }
  }

  refreshPage() {
    this.p = 1;
    return this.loadHealths();
  }

     private getFormattedDate(
  dateStr: string,
  isEndOfDay: boolean | null = null, // Change to nullable
): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  // Only override hours if isEndOfDay is explicitly true or false
  if (isEndOfDay === true) {
    date.setHours(23, 59, 59, 999);
  } else if (isEndOfDay === false) {
    date.setHours(0, 0, 0, 0);
  }
  // If null, it keeps the original time (e.g. 14:30:00)

  return date.toISOString();
}

  loadHealths(): Promise<void> {
    if (!this.userId) {
      console.error('loadHealths aborted: userId is missing');
      return Promise.resolve();
    }

    return new Promise((resolve) => {  
    this.isLoading = true;

    const offset = (this.p - 1) * this.pageSize;
    const start = this.getFormattedDate(this.fromDate, null); 
    const end = this.getFormattedDate(this.toDate, null);

      this.fetchDataSub = this.dataService
        .getHealths(
          this.userId,
          this.pageSize,
          offset,
          this.searchTerm,
          start,
          end,
        )
        .pipe(first())
        .subscribe({
          next: (res: any) => {
            console.log('Res:', res);

            this.results = res?.items || [];
            this.totalCount = res?.totalCount || 0;
            this.healths = this.results;
            this.isLoading = false;
            resolve();
          },
          error: (err) => {
            console.error('Component loadHealths Error:', err);
            this.isLoading = false;
            resolve();
          },
        });
    });
  }

  handleInput(event: any) {
    const val = event.detail.value;
    this.searchTerm = val ? val.trim() : '';
    this.p = 1;
    this.loadHealths();
  }

  onPageChange(page: number) {
    this.p = page;
    this.loadHealths();
  }

   onCloseFilter() {
    this.filterModal.dismiss(null, 'cancel');
  }

  onDateChange() {
    console.log('Date range changed:', this.fromDate, 'to', this.toDate);
    this.p = 1;
    // this.isFilterActive = true;
    this.loadHealths();
  }

  onApplyFilter() {
    console.log('Apply button clicked'); // Diagnostic
    this.p = 1;
    this.loadHealths();
    this.filterModal.dismiss();
  }
}
