import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

// 1. Standardize ALL Ionic imports to /standalone
import { 
  NavController, ToastController, ModalController, // Services
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, 
  IonToolbar, IonItem, IonInput, IonChip, IonIcon, IonFooter, 
  IonRadioGroup, IonRadio, IonList, IonModal, IonButtons, 
  IonButton, IonTitle, IonDatetimeButton, IonDatetime, 
  IonSelect, IonSelectOption, IonSearchbar 
} from '@ionic/angular/standalone';

// 2. Third party and Custom
import { TranslateModule } from "@ngx-translate/core";
import { NgxPaginationModule } from 'ngx-pagination';
import { UtcToIstPipe } from "src/app/utils/pipes/utc-to-ist/utc-to-ist-pipe";
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";
import { CustomFooterComponent } from "src/app/components/custom-footer/custom-footer.component";
import { Subscription, first } from "rxjs";
import { AuthService } from "src/app/features/auth/auth.service";
import { DataService } from "src/app/services/data/data.service";

@Component({
  selector: "app-heat",
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
    IonButtons,
    IonButton,
    IonTitle,
    IonDatetimeButton,
    IonDatetime,
    IonSelect,
    IonSelectOption
],
  templateUrl: "./heat.page.html",
  styleUrls: ["./heat.page.scss"],
})
export class HeatPage implements OnInit, OnDestroy {
  @ViewChild("childModal") childModal: IonModal;
  @ViewChild("searchbar", { static: false }) searchbar: IonSearchbar | any;
  // Add ViewChild for the RadioGroup to reset UI
@ViewChild('radioGroup') radioGroup: any; 
  @ViewChild(IonModal) filterModal!: IonModal;

  authUserSub: Subscription;
  fetchDataSub: Subscription;
  heatEventSub: Subscription;
  reportInseminationSub: Subscription;

  breed_options = [
    "Gir",
    "Red Sindhi",
    "Sahiwal",
    "Jersey",
    "HF",
    "Hallikar",
    "Amritmahal",
    "Khillari",
    "Tharparkar",
    "Hariana",
    "Kankrej",
    "Ongole",
    "Krishna Valley",
    "Deoni",
    "Cross Breed",
  ];

  selectedEvent: any;
  inseminationForm: FormGroup | any;
  formType: string;

  results: any[] = [];
  heats: any[] = [];

  isLoading: boolean = false;

  p: number = 1;

  pageSize: number = 10;
  totalCount: number = 0;
  searchTerm: string = "";
  userId: string = "";

  startDate: string = "";
  endDate: string = "";

  fromDate: string;
  toDate: string;
  maxDate: string;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private modalControl: ModalController,
    private toastController: ToastController,
    private navCtrl: NavController
  ) {
    const now = new Date();
    this.maxDate = now.toISOString();
    this.toDate = now.toISOString();
   
    // const todayStart = new Date();
    // todayStart.setHours(0, 0, 0, 0);
    // this.fromDate = todayStart.toISOString();

    // subtract 24 hours from the current moment
  const rolling24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000)); 
  this.fromDate = rolling24Hours.toISOString();
   }

  ngOnInit(): void {
    this.inseminationForm = this.createForm("confirm");
    this.authService.authenticatedUser$.pipe(
      first(user => !!user)
    ).subscribe(user => {
      console.log("Authenticated User Found:", user.id);
      this.userId = user.id;
      this.loadHeats();
    });
  }

  ngOnDestroy() {
    if (this.reportInseminationSub) {
      this.reportInseminationSub.unsubscribe();
    }
    if (this.heatEventSub) {
      this.heatEventSub.unsubscribe();
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

  goBack(){
    this.navCtrl.back();
  }

  closeChildModal() {
    this.childModal.dismiss().then(() => {
      this.inseminationForm.reset();
    });
  }

  async showToast(data: any) {
    const toast = await this.toastController.create({
      swipeGesture: "vertical",
      icon: "thumbs-up-sharp",
      header: data.header,
      message: data.msg,
      color: data.color,
      duration: 3000
    });
    toast.present();
  }

  createForm(type: string): FormGroup {
  return new FormGroup({
    insemination_date: new FormControl(new Date().toISOString(), [Validators.required]),
    process: new FormControl(null), // Required for 'confirm'
    bull_name: new FormControl(null),
    semen_type: new FormControl(null),
    semen_company: new FormControl(null),
    semen_breed: new FormControl(null),
    note: new FormControl(null) // For 'cancel'
  });
  }

  onSelectOption(event: any, heat: any) {
    const eventValue = event.detail.value;
  this.inseminationForm.reset();
  this.inseminationForm.patchValue({
    insemination_date: new Date().toISOString()
  });

    this.childModal.present().then(() => {

      this.selectedEvent = heat;
      this.formType = eventValue;
      this.inseminationForm = this.createForm(eventValue);
    });


    this.childModal.onDidDismiss().then((result) => {
      this.refreshPage();
    });
  }

  onSelectInseminationProcessType(event) {
    this.inseminationForm.controls.process.setValue(event.detail.value);

    const process = event.detail.value;
  this.inseminationForm.controls.process.setValue(process);

  this.inseminationForm.get('bull_name').clearValidators();
  this.inseminationForm.get('semen_type').clearValidators();

  if (process === 'natural') {
    this.inseminationForm.get('bull_name').setValidators([Validators.required]);
  } else if (process === 'artificial') {
    this.inseminationForm.get('semen_type').setValidators([Validators.required]);
  }
  
  this.inseminationForm.get('bull_name').updateValueAndValidity();
  this.inseminationForm.get('semen_type').updateValueAndValidity();
  }

  onSelectInseminationDate(event) {
    const eventValue = event.detail.value;
    this.inseminationForm.controls.insemination_date.setValue(eventValue);
  }

  onSelectSemenBreed(event) {
    const eventValue = event.detail.value;
    this.inseminationForm.controls.semen_breed.setValue(eventValue);
  }

  onSelectSemenType(event) {
    const eventValue = event.detail.value;
    this.inseminationForm.controls.semen_type.setValue(eventValue);
  }

  handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    console.log('Current value:', JSON.stringify(target.value));
    this.inseminationForm.controls.note.setValue(JSON.stringify(target.value));
  }

  // reportInsemination() {
  //   console.log("Insemination Form : ", this.inseminationForm);

  //   const data = {
  //     heat: this.selectedEvent,
  //     insemination_form: this.inseminationForm.value,
  //   };

  //   this.reportInseminationSub =
  //     this.formType === "confirm"
  //       ? this.dataService.confirmInsemination(data).subscribe((heat) => {
  //         const toast = {
  //           header: "Insemination Done",
  //           msg: `Animal No. ${data.heat.animal.collar.name} has been inseminated.`,
  //           color: "success"
  //         };

  //         this.showToast(toast);

  //         console.log("Reported Insemination: ", heat);
  //       })
  //       : this.dataService.reportInseminationFailure(data).subscribe((heat) => {

  //         const toast = {
  //           header: "Reported Insemination Failure",
  //           msg: `Animal No. ${data.heat.animal.collar.name} was not inseminated on ${data.insemination_form.insemination_date}.`,
  //           color: "warning"
  //         };

  //         this.showToast(toast);
  //         console.log("Reported Insemination Failure: ", heat);
  //       });

  //   this.modalControl.dismiss().then(() => {
  //     this.inseminationForm.reset();
  //     this.selectedEvent = null;
  //     this.formType = null;
  //   });
  // }


//   reportInsemination() {
//   const data = {
//     heat: this.selectedEvent,
//     insemination_form: this.inseminationForm.value,
//   };

//   const request$ = this.formType === "confirm" 
//     ? this.dataService.confirmInsemination(data)
//     : this.dataService.reportInseminationFailure(data);

//   this.reportInseminationSub = request$.subscribe({
//     next: (heat) => {
//       // 1. Success Message
//       const toastData = this.formType === "confirm" 
//         ? { header: "Insemination Done", msg: `Animal No. ${data.heat.animal.collar.name} has been inseminated.`, color: "success" }
//         : { header: "Reported Failure", msg: `Animal No. ${data.heat.animal.collar.name} was not inseminated.`, color: "warning" };
      
//       this.showToast(toastData);

//       // 2. Refresh the list ONLY after successful DB update
//       this.refreshPage(); 

//       // 3. Dismiss the modal
//       this.modalControl.dismiss();
      
//       // 4. Cleanup local state
//       this.inseminationForm.reset();
//       this.selectedEvent = null;
//     },
//     error: (err) => {
//       console.error("Submission error:", err);
//       this.showToast({ header: "Error", msg: "Could not save data.", color: "danger" });
//     }
//   });
// }

  deepSearch(obj: any, query: string): boolean {
    if (typeof obj === "string") {
      return obj.toLowerCase().includes(query);
    } else if (typeof obj === "object") {
      for (const key in obj) {
        if (this.deepSearch(obj[key], query)) {
          return true;
        }
      }
    }
    return false;
  }

  onBlurSearchBar() {
    console.log("Modal Dismissed");
    if (this.searchbar) {
      this.searchbar.value = null;
      this.heats = null;
      this.results = null;
    }
  }


  refreshPage() {
    this.p = 1;
    return this.loadHeats();
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

reportInsemination() {
  if (!this.selectedEvent) return;

  const data = {
    heat: this.selectedEvent,
    insemination_form: this.inseminationForm.value,
  };

  const request$ = this.formType === "confirm" 
    ? this.dataService.confirmInsemination(data)
    : this.dataService.reportInseminationFailure(data);

  this.isLoading = true; // Show loader while processing

  this.reportInseminationSub = request$.pipe(first()).subscribe({
    next: (res) => {
      const toastData = this.formType === "confirm" 
        ? { header: "Success", msg: "Inseminated successfully.", color: "success" }
        : { header: "Insemination Failure", msg: `Insemination not done, Thanks for reporting.`, color: "warning" };
      
      this.showToast(toastData);

      // 1. Reset the Radio UI so it doesn't look selected on refresh
      if (this.radioGroup) {
        this.radioGroup.value = null;
      }

      // 2. Clear local selection state
      this.selectedEvent = null;

      // 3. Close the modal first
      this.childModal.dismiss().then(() => {
        // 4. Trigger the refresh after the modal is gone
        this.refreshPage();
      });
    },
    error: (err) => {
      this.isLoading = false;
      console.error("Submission error:", err);
      this.showToast({ header: "Error", msg: "Could not save.", color: "danger" });
    }
  });
}

// Ensure loadHeats uses a fresh promise and spread operator
loadHeats(): Promise<void> {
  if (!this.userId) return Promise.resolve();

  return new Promise((resolve) => {
    this.isLoading = true;
  
    const offset = (this.p - 1) * this.pageSize;
    
    // Pass null to keep the specific time calculated in the constructor
    const start = this.getFormattedDate(this.fromDate, null); 
    const end = this.getFormattedDate(this.toDate, null);

    this.fetchDataSub = this.dataService.getHeats(
      this.userId, this.pageSize, offset, this.searchTerm, start, end
    ).pipe(first()).subscribe({
      next: (res: any) => {
        this.results = [...(res?.items || [])];
        this.heats = this.results;
        this.totalCount = res?.totalCount || 0;
        this.isLoading = false;
        resolve();
      },
      error: () => {
        this.isLoading = false;
        resolve();
      }
    });
  });
}

  handleInput(event: any) {
    const val = event.detail.value;
    this.searchTerm = val ? val.trim() : "";
    this.p = 1;
    this.loadHeats();
  }

  onPageChange(page: number) {
    this.p = page;
    this.loadHeats();
  }

  onCloseFilter() {
    this.filterModal.dismiss(null, 'cancel');
  }

  onDateChange() {
    console.log('Date range changed:', this.fromDate, 'to', this.toDate);
    this.p = 1;
    // this.isFilterActive = true;
    this.loadHeats();
  }

  onApplyFilter() {
    console.log('Apply button clicked'); // Diagnostic
    this.p = 1;
    this.loadHeats();
    this.filterModal.dismiss();
  }

}
