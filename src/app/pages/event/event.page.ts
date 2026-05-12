import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { first, Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { UtcToIstPipe } from 'src/app/utils/pipes/utc-to-ist/utc-to-ist-pipe';
import { CustomHeaderComponent } from 'src/app/components/custom-header/custom-header.component';
import { AuthService } from 'src/app/features/auth/auth.service';
import { DataService } from 'src/app/services/data/data.service';
import { CustomFooterComponent } from 'src/app/components/custom-footer/custom-footer.component';
import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, IonToolbar, IonItem, IonChip, IonIcon, IonFooter,IonModal, IonButtons, IonButton, IonTitle, IonDatetimeButton, IonDatetime, IonSelect,IonSelectOption ,  IonSearchbar,
  NavController,
  ToastController,} from '@ionic/angular/standalone';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    ReactiveFormsModule,
    CustomHeaderComponent,
    NgxPaginationModule,
    UtcToIstPipe,
    CustomFooterComponent,
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
    IonModal,
    IonButtons,
    IonButton,
    IonTitle,
    IonDatetimeButton,
    IonDatetime,
    IonSelect,
    IonSelectOption
  ],
  templateUrl: './event.page.html',
  styleUrls: ['./event.page.scss'],
})
export class EventPage implements OnInit, OnDestroy {
  @ViewChild('childModal') childModal: IonModal;
  @ViewChild('searchbar', { static: false }) searchbar: IonSearchbar | any;
  @ViewChild(IonModal) filterModal!: IonModal;

  authUserSub: Subscription;
  fetchDataSub: Subscription;
  heatEventSub: Subscription;
  reportInseminationSub: Subscription;
  fetchUserDataSub: Subscription | undefined;

  p: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;

  searchTerm: string = '';
  selectedEvent: string = 'ALL';
  inseminationForm: FormGroup | any;
  formType: string;

  results: any[] = [];
  animals: any[] = [];

  heatEvents: any[] = [];
  healthEvents: any[] = [];
  allEvents: any[] = [];

  sortOrders = {};

  fromDate: string;
  toDate: string;
  maxDate: string;

  isLoading: boolean = false;

  isFilterActive: boolean = false;

  userId: string = '';

  startDate: string = '';
  endDate: string = '';

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private navCtrl: NavController,
    private toastController: ToastController,
  ) {
    const now = new Date();
    this.maxDate = now.toISOString();
    this.toDate = now.toISOString();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    this.fromDate = thirtyDaysAgo.toISOString();
  }

  ngOnInit(): void {
    this.inseminationForm = this.createForm('confirm');
    this.authService.authenticatedUser$
      .pipe(first((user) => !!user))
      .subscribe((user) => {
        console.log('Authenticated User Found:', user.id);
        this.userId = user.id;
        this.loadAllEvents();
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
    // Add this at the top of loadAllEvents()
    if (this.fetchDataSub) {
      this.fetchDataSub.unsubscribe();
    }
  }

  ionViewWillEnter() {
    this.refreshPage();
  }

  closeChildModal() {
    this.childModal.dismiss().then(() => {
      this.inseminationForm.reset();
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
    if (type === 'confirm') {
      const date = new Date().toISOString();

      return new FormGroup({
        insemination_date: new FormControl(date, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        process: new FormControl(null, { validators: [Validators.required] }),
        bull_name: new FormControl(null, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        semen_type: new FormControl(null, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        semen_company: new FormControl(null, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        semen_breed: new FormControl(null, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
      });
    } else {
      return new FormGroup({
        note: new FormControl(null, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
      });
    }
  }

  onSelectInseminationProcessType(event) {
    this.inseminationForm.controls.process.setValue(event.detail.value);
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
      this.allEvents = null;
      this.results = null;
    }
  }

  refreshPage() {
    this.p = 1;
    return this.loadAllEvents();
  }

  getEventColor(eventType: string): string {
    switch (eventType) {
      case 'HEAT':
        return 'var(--ion-color-success)';
      case 'HEALTH':
        return 'var(--ion-color-danger)';
      default:
        return 'var(--ion-color-primary)';
    }
  }

  filterEvents() {
    this.isFilterActive = true;
    this.p = 1;
    this.loadAllEvents();
  }

  loadAllEvents(): Promise<void> {
    if (!this.userId) return Promise.resolve();

    return new Promise((resolve) => {
      this.isLoading = true;
      const offset = (this.p - 1) * this.pageSize;

      const start = this.getFormattedDate(this.fromDate, false);
      const end = this.getFormattedDate(this.toDate, true);

      // const eventType = this.selectedEvent === 'ALL' ? 'ALL' : this.selectedEvent;

      console.log('Selected Event Type: ', this.selectedEvent);
      // console.log('Event Type: ', eventType);

      this.fetchDataSub = this.dataService
        .getAllEvents(
          this.userId,
          this.pageSize,
          offset,
          this.searchTerm,
          start,
          end,
          // eventType // <--- Pass this to your backend
        )
        .pipe(first())
        .subscribe({
          next: (res: any) => {
            let items = res?.items || [];

            if (
              this.selectedEvent !== 'ALL'
            ) {
              const filterMap = {
                Heat: 'HEAT',
                Health: 'HEALTH',
              };
              const targetType = filterMap[this.selectedEvent] || this.selectedEvent;
              items = items.filter((item) => item.eventType === targetType);

              // Inside loadAllEvents subscription
              items = items.filter((item) => item.eventType === targetType);
            }

            this.results = items;
            this.totalCount = res?.totalCount || 0;
            this.isLoading = false;
            resolve();
          },
          error: (err) => {
            console.error('loadAllEvents Error:', err);
            this.isLoading = false;
            resolve();
          },
        });
    });
  }

  onSelectEvents(event: any) {
    this.selectedEvent = event.detail.value;
    this.p = 1;
    this.isFilterActive = true;
    this.loadAllEvents();
  }

  private getFormattedDate(
    dateStr: string,
    isEndOfDay: boolean = false,
  ): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    if (isEndOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return date.toISOString();
  }

  onDateChange() {
    console.log('Date range changed:', this.fromDate, 'to', this.toDate);
    this.p = 1;
    this.isFilterActive = true;
    this.loadAllEvents();
  }

  handleInput(event: any) {
    this.searchTerm = event.detail.value ? event.detail.value.trim() : '';
    this.p = 1;
    this.loadAllEvents();
  }

  onPageChange(page: number) {
    this.p = page;
    this.loadAllEvents();
  }

  clearFilter() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.fromDate = thirtyDaysAgo.toISOString();
    this.toDate = new Date().toISOString();
    this.selectedEvent = 'ALL';
    this.searchTerm = '';
    this.isFilterActive = false;
    this.p = 1;
    this.loadAllEvents();
  }

  onCloseFilter() {
    this.filterModal.dismiss(null, 'cancel');
  }

  onApplyFilter() {
    console.log('Apply button clicked'); // Diagnostic
    this.p = 1;
    this.loadAllEvents();
    this.filterModal.dismiss();
  }

  onWillDismissFilter(event: CustomEvent) {
    if (event.detail.role === 'confirm') {
    }
  }
}
