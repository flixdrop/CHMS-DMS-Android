import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { first, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { UtcToIstPipe } from 'src/app/utils/pipes/utc-to-ist/utc-to-ist-pipe';
import { CustomFooterComponent } from 'src/app/components/custom-footer/custom-footer.component';
import { CustomHeaderComponent } from 'src/app/components/custom-header/custom-header.component';
import { AuthService } from 'src/app/features/auth/auth.service';
import { DataService } from 'src/app/services/data/data.service';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonLabel,
  IonTextarea,
  IonToolbar,
  IonItem,
  IonChip,
  IonIcon,
  IonFooter,
  IonRadioGroup,
  IonRadio,
  IonList,
  IonModal,
   ActionSheetController,
  IonSearchbar,
  ModalController,
  NavController,
  ToastController,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-pregnant',
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
    IonTextarea,
  ],
  templateUrl: './pregnant.page.html',
  styleUrls: ['./pregnant.page.scss'],
})
export class PregnantPage implements OnInit, OnDestroy {
  @ViewChild('searchbar', { static: false }) searchbar: IonSearchbar | any;

  @ViewChild('childModal') childModal: IonModal;

  authUserSub: Subscription;
  fetchDataSub: Subscription;
  pregnancyEventSub: Subscription;
  reportCalvedSub: Subscription;
  reportMiscarriageSub: Subscription;

  miscarriageForm: FormGroup | any;

  isLoading: boolean = false;

  results: any[] = [];
  animals: any[] = [];
  inseminations: any[] = [];
  pregnancyEvents: any[] = [];

  selectedEvent: any;

  p: number = 1;

  pageSize: number = 10;
  totalCount: number = 0;
  searchTerm: string = '';
  userId: string = '';

  startDate: string = '';
  endDate: string = '';

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private modalControl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private toastController: ToastController,
    private navCtrl: NavController
  ) {}

  ngOnDestroy() {
    if (this.reportMiscarriageSub) {
      this.reportMiscarriageSub.unsubscribe();
    }
    if (this.reportCalvedSub) {
      this.reportCalvedSub.unsubscribe();
    }
    if (this.pregnancyEventSub) {
      this.pregnancyEventSub.unsubscribe();
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

  ngOnInit(): void {
    this.miscarriageForm = new FormGroup({
      note: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required],
      }),
    });

    this.authService.authenticatedUser$
      .pipe(
        // Filter out null/undefined users before proceeding
        first((user) => !!user)
      )
      .subscribe((user) => {
        console.log('Authenticated User Found:', user.id);
        this.userId = user.id;
        this.loadPregnancies();
      });
  }

  closeChildModal() {
    this.childModal.dismiss().then(() => {
      this.miscarriageForm.reset();
      this.selectedEvent = null;
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

  lastInsemination(animalId: string): Date | null {
    const filteredElements = this.inseminations.filter(
      (element) => element.animal.id === animalId
    );

    if (!filteredElements.length) {
      return null;
    }

    const latestElement = filteredElements.reduce((prev, current) =>
      Number(current.eventDateTime) > Number(prev.eventDateTime)
        ? current
        : prev
    );

    return new Date(Number(latestElement.eventDateTime));
  }

  onSelectOption(event: any, pregnancy_check: any) {
    const eventValue = event.detail.value;

    if (eventValue === 'yes') {
      this.confirmCalved(pregnancy_check);
    } else if (eventValue === 'no') {
      this.childModal.present().then(() => {
        this.selectedEvent = pregnancy_check;
      });
      this.childModal.onDidDismiss().then((result) => {
        this.refreshPage();
      });
    }
  }

  async confirmCalved(pregnancy_check: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `Has Cow No. ${pregnancy_check.animal.name} Calved ?`,
      subHeader: `click on "Confirm" only if cow no. ${pregnancy_check.animal.name} has Calved.`,
      backdropDismiss: true,
      buttons: [
        {
          text: 'Yes',
          handler: async () => {
            const data = {
              eventDateTime: new Date().toISOString(),
              pregnancy_check: pregnancy_check,
            };

            this.reportCalvedSub = this.dataService
              .confirmCalved(data)
              .subscribe((pregnancy_check) => {
                const toast = {
                  header: 'Confirm Calving',
                  msg: `Animal No. ${data.pregnancy_check.animal.collar.name} has calved.`,
                  color: 'success',
                };

                this.showToast(toast);

                console.log('Calved Confirmed: ', pregnancy_check);
              });
            this.refreshPage();
          },
        },
        {
          text: 'No',
          handler: async () => {
            this.refreshPage();
          },
        },
      ],
    });
    await actionSheet.present();

    const { role } = await actionSheet.onDidDismiss();
    console.log('Action sheet dismissed with role:', role);
    this.refreshPage();
  }

  async reportMiscarriage() {
    const data = {
      pregnancy_check: this.selectedEvent,
      miscarriageForm: this.miscarriageForm.value,
    };

    console.log('Miscarriage Form : ', this.miscarriageForm.value);

    this.reportMiscarriageSub = this.dataService
      .reportMiscarriage(data)
      .subscribe((pregnancy_check) => {
        const toast = {
          header: 'Report Miscarriage',
          msg: `Animal No. ${data.pregnancy_check.animal.collar.name} has Miscarried.`,
          color: 'warning',
        };

        this.showToast(toast);
        console.log('Reported Miscarriage: ', pregnancy_check);
      });

    this.modalControl.dismiss().then(() => {
      this.miscarriageForm.reset();
      this.selectedEvent = null;
    });
  }

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
      this.pregnancyEvents = null;
      this.results = null;
    }
  }

  refreshPage() {
    this.p = 1;
    return this.loadPregnancies();
  }

  loadPregnancies(): Promise<void> {
    if (!this.userId) {
      console.error('loadPregnancies aborted: userId is missing');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.isLoading = true;
      const offset = (this.p - 1) * this.pageSize;
      const defaultStart = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const defaultEnd = new Date().toISOString();

      this.fetchDataSub = this.dataService
        .getPregnancies(
          this.userId,
          this.pageSize,
          offset,
          this.searchTerm,
          this.startDate || defaultStart,
          this.endDate || defaultEnd
        )
        .pipe(first())
        .subscribe({
          next: (res: any) => {
            console.log('Res:', res);

            this.results = res?.items || [];
            this.totalCount = res?.totalCount || 0;
            this.pregnancyEvents = this.results;
            this.isLoading = false;
            resolve();
          },
          error: (err) => {
            console.error('Component loadPregnancies Error:', err);
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
    this.loadPregnancies();
  }

  onPageChange(page: number) {
    this.p = page;
    this.loadPregnancies();
  }
}
