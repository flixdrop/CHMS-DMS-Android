import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  filter,
  first,
  map,
  Observable,
  startWith,
  Subscription,
  tap,
} from 'rxjs';

import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import 'chartjs-adapter-date-fns';
import Chart from 'chart.js/auto';

import { Apollo, QueryRef } from 'apollo-angular';
import {
  GET_DASHBOARD_ITEMS,
  GET_MILK_ENTRIES,
} from 'src/app/graphql/data.queries';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from 'src/app/features/auth/auth.service';
import { FcmService } from 'src/app/features/fcm/fcm.service';
import { DataService } from 'src/app/services/data/data.service';
import { TranslateModule } from '@ngx-translate/core';
import { CountUpPipe } from 'src/app/utils/pipes/count-up/count-up-pipe';
import {
  IonContent,
  IonRefresher,
  IonProgressBar,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonToolbar,
  IonItem,
  IonImg,
  IonLabel,
  IonRippleEffect,
  IonButton,
  IonModal,
  IonHeader,
  IonButtons,
  IonIcon,
  IonTitle,
  IonList,
  IonDatetimeButton,
  IonDatetime,
  IonInput,
  IonChip,
  IonFooter,
  IonAvatar,
  NavController,
  ScrollDetail,
  ToastController,
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from '@ionic/angular/standalone';
import { CustomFooterComponent } from 'src/app/components/custom-footer/custom-footer.component';
import { LoadingController } from '@ionic/angular';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    CountUpPipe,
    IonContent,
    IonRefresher,
    IonProgressBar,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonToolbar,
    IonItem,
    IonImg,
    IonLabel,
    IonRippleEffect,
    IonButton,
    IonModal,
    IonHeader,
    IonButtons,
    IonIcon,
    IonTitle,
    IonList,
    IonDatetimeButton,
    IonDatetime,
    IonInput,
    IonChip,
    IonFooter,
    IonAvatar,
    IonSelect,
    IonSelectOption,
    CustomFooterComponent,
    IonSpinner,
  ],
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  providers: [DatePipe],
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('myChart', { static: false }) myChart!: ElementRef;
  @ViewChild('modal') modal: IonModal;

  chart!: Chart;

  getAllAnimalsSub: Subscription;
  authSub: Subscription;

  dashboardQueryRef: QueryRef<any>;
  milkQueryRef: QueryRef<any>;
  counts$: Observable<any>;

  milkEntryForm: FormGroup;
  selectedCattle: string = '';

  isVisible: boolean = true;
  isLoading: boolean = false;
  language: string;

  searchToggle: boolean = false;
  toggleSearch = () => (this.searchToggle = !this.searchToggle);

  results: any[] = [];
  animals: any[] = [];

  milkData$: Observable<any>;
  milk_target = { totalMilk: 0, numCows: 0, avgMilkPerCow: 0, efficiency: 0 };
  totalMilkVolume$: any;
  milkingEvents: any[] = [];
  groupedEvents: any[] = [];

  maxDate = new Date().toISOString();

  p: number = 1;
  pageSize: number = 10;
  userId: string = '';

  @ViewChild('registercattleform') registercattleform: IonModal;

  breed_options = [
    'Gir',
    'Red Sindhi',
    'Sahiwal',
    'Jersey',
    'HF',
    'Hallikar',
    'Amritmahal',
    'Khillari',
    'Tharparkar',
    'Hariana',
    'Kankrej',
    'Ongole',
    'Krishna Valley',
    'Deoni',
    'Cross Breed',
  ];

  cattleGender: string = '';
  // cattleAge: number | null = null;
  cattleBirthDate: string = '';

  cattleAgeDisplay: string = ''; // For showing "2 Years, 5 Months"
  cattleAge: number | null = null; // For your category logic (e.g., 2.41)

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private fcmService: FcmService,
    private toastController: ToastController,
    private apollo: Apollo,
    private datePipe: DatePipe,
    private navCtrl: NavController,
    private loadingController: LoadingController
  ) {}

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
    if (this.getAllAnimalsSub) this.getAllAnimalsSub.unsubscribe();
  }

  ngOnInit() {
    this.fcmService.initPush();
    this.initMilkForm();
    this.setupAuthSubscription();
  }

  // This function triggers whenever the date changes
  // onDateChange(event: any) {
  //   const selectedDate = new Date(event.detail.value);
  //   const today = new Date();

  //   let age = today.getFullYear() - selectedDate.getFullYear();
  //   const monthDiff = today.getMonth() - selectedDate.getMonth();

  //   // Adjust age if the birthday hasn't occurred yet this year
  //   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
  //     age--;
  //   }

  //   // Set the age (you can also use decimals if you want more precision)
  //   this.cattleAge = age < 0 ? 0 : age;
  // }

  // onDateChange(event: any) {
  //   const dateValue = event.detail.value;

  //   if (dateValue) {
  //     const birthDate = new Date(dateValue);
  //     const today = new Date();

  //     let age = today.getFullYear() - birthDate.getFullYear();
  //     const monthDiff = today.getMonth() - birthDate.getMonth();

  //     // Refine age calculation based on month/day
  //     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
  //       age--;
  //     }

  //     // Update the cattleAge variable used by your category logic
  //     this.cattleAge = age < 0 ? 0 : age;
  //   }
  // }

  onDateChange(event: any) {
    const dateValue = event.detail.value;
    if (!dateValue) return;

    const birthDate = new Date(dateValue);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    // Adjust if the current month is before the birth month
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }

    // Calculate remaining days roughly to adjust months if necessary
    if (today.getDate() < birthDate.getDate()) {
      months--;
      if (months < 0) {
        months = 11;
        // years is already adjusted above
      }
    }

    // 1. Update the numeric age for your category logic (using decimals)
    // Example: 2 years and 6 months becomes 2.5
    this.cattleAge = years + months / 12;

    // 2. Update the display string
    if (years === 0) {
      this.cattleAgeDisplay = `${months} Months`;
    } else {
      this.cattleAgeDisplay = `${years} Years, ${months} Months`;
    }
  }

  getCattleCategory(): string {
    const gender = this.cattleGender.toLowerCase().trim();
    const age = Number(this.cattleAge);

    if (age < 1) {
      return 'Calf (Young)';
    }

    if (gender === 'female' || gender === 'f') {
      if (age >= 1 && age < 2.5) return 'Heifer (Juvenile)';
      if (age >= 2.5 && age < 10) return 'Cow (Adult)';
      return 'Senior Cow (Old)';
    }

    if (gender === 'male' || gender === 'm') {
      if (age >= 1 && age < 10) return 'Bull (Adult)';
      return 'Senior Bull (Old)';
    }

    return 'Unknown Category';
  }

  async registerCattle() {
    const loadingEL = await this.loadingController.create({
      animated: true,
      translucent: true,
      spinner: 'crescent',
      message: 'Registering Cattle..',
    });

    await loadingEL.present();

    setTimeout(() => {
      const toast = {
        header: 'Registeration Successfull !',
        msg: `Cattle has been regisred successfully.`,
        color: 'success',
      };

      this.showToast(toast);

      this.registercattleform.dismiss();
      loadingEL.dismiss();
    }, 3000);
  }

  private setupAuthSubscription() {
    this.authSub = this.authService.authenticatedUser$.subscribe((user) => {
      if (user && user.id) {
        this.userId = user.id;
        this.initDashboard(user.id);
        this.initMilkProductionGraph(user.id);
      }
    });
  }

  private initMilkForm() {
    const date: any = new Date().toISOString();
    this.milkEntryForm = new FormGroup({
      eventDateTime: new FormControl(date),
      animalId: new FormControl('', {
        updateOn: 'blur',
        validators: [Validators.required],
      }),
      morningVolume: new FormControl(0),
      noonVolume: new FormControl(0),
      eveningVolume: new FormControl(0),
    });

    this.totalMilkVolume$ = this.milkEntryForm.valueChanges.pipe(
      map((values) => {
        return (
          (values.morningVolume || 0) +
          (values.noonVolume || 0) +
          (values.eveningVolume || 0)
        );
      })
    );
  }

  ionViewWillEnter() {
    if (this.dashboardQueryRef) {
      this.dashboardQueryRef.refetch();
    }
  }

  initDashboard(userId: string) {
    this.dashboardQueryRef = this.apollo.watchQuery({
      query: GET_DASHBOARD_ITEMS,
      variables: { userId: userId },
      pollInterval: 30000,
      fetchPolicy: 'cache-and-network',
    });

    // this.counts$ = this.dashboardQueryRef.valueChanges.pipe(
    //   map((res) => res.data["getDashboardCounts"]),
    // );
    // this.counts$ = this.dashboardQueryRef.valueChanges.pipe(
    //   filter(res => !!res.data),
    //   map((res) => res.data['getDashboardCounts']),
    // );

    this.counts$ = this.dashboardQueryRef.valueChanges.pipe(
      filter((res) => !!res.data),
      map((res) => res.data['getDashboardCounts']),
      // Provide the 0 values here:
      startWith({
        totalHeats: 0,
        totalHealths: 0,
        totalAnimals: 0,
        totalRecoveries: 0,
        totalInseminations: 0,
        totalPregnancies: 0,
        totalDryoffEvents: 0,
        totalCalvings: 0,
      })
    );
  }

  initMilkProductionGraph(userId: string) {
    this.milkQueryRef = this.apollo.watchQuery({
      query: GET_MILK_ENTRIES,
      variables: {
        userId: userId,
        limit: 10,
        offset: 0,
        search: '',
      },
      pollInterval: 30000,
      fetchPolicy: 'cache-and-network',
    });

    // this.milkData$ = this.milkQueryRef.valueChanges.pipe(
    //   map((res) => {
    //     const data = res.data["getMilkEntries"];
    //     return data?.items || [];
    //   }),
    //   tap((entries) => {
    //     this.milkingEvents = entries;
    //     this.calculateMilkMetrics();
    //     this.plotLineChart();
    //   }),
    // );

    this.milkData$ = this.milkQueryRef.valueChanges.pipe(
      filter((res) => !!res.data),
      map((res) => {
        const data = res.data['getMilkEntries'];
        return data?.items || [];
      }),
      tap((entries) => {
        this.milkingEvents = entries;
        this.calculateMilkMetrics();
        this.plotLineChart();
      })
    );

    this.milkData$.subscribe();
  }

  calculateMilkMetrics() {
    if (!this.milkingEvents || this.milkingEvents.length === 0) return;

    const totalMilk = this.milkingEvents.reduce(
      (sum, entry) => sum + (entry.totalMilk || 0),
      0
    );

    const uniqueCows = new Set(this.milkingEvents.map((e) => e.animal?.id))
      .size;

    const avgMilkPerCow = uniqueCows > 0 ? totalMilk / uniqueCows : 0;
    const efficiency = (totalMilk / (uniqueCows * 20)) * 100;

    this.milk_target = {
      totalMilk,
      numCows: uniqueCows,
      avgMilkPerCow: parseFloat(avgMilkPerCow.toFixed(2)),
      efficiency: parseFloat(efficiency.toFixed(1)),
    };

    const groups = {};
    this.milkingEvents.forEach((entry) => {
      const date = this.datePipe.transform(
        parseInt(entry.eventDateTime),
        'yyyy-MM-dd'
      );
      if (!groups[date]) groups[date] = { date, entries: [] };
      groups[date].entries.push(entry);
    });

    this.groupedEvents = Object.values(groups).sort((a: any, b: any) =>
      b.date.localeCompare(a.date)
    );
  }

  handleRefresh(event?: any) {
    const p1 = this.dashboardQueryRef?.refetch();
    const p2 = this.milkQueryRef?.refetch();

    Promise.all([p1, p2]).then(() => {
      if (event) event.target.complete();
    });
  }

  handleScrollStart() {
    this.isVisible = false;
  }

  handleScrollEnd() {}

  handleScroll(ev: CustomEvent<ScrollDetail>) {
    if (ev.detail.scrollTop >= 100) {
      this.isVisible = false;
    } else if (ev.detail.scrollTop === 0) {
      this.isVisible = true;
    }
  }

  async onClickAnimals() {
    await this.navCtrl.navigateForward('/animal-list');
  }

  async onClickHealth() {
    await this.navCtrl.navigateForward('/health');
  }

  async onClickRecovery() {
    await this.navCtrl.navigateForward('/recovery');
  }

  async onClickEvent() {
    await this.navCtrl.navigateForward('/event');
  }

  async onClickHeat() {
    await this.navCtrl.navigateForward('/heat');
  }

  async onClickPregnancyCheck() {
    await this.navCtrl.navigateForward('/pregnancy-check');
  }

  async onClickPregnant() {
    await this.navCtrl.navigateForward('/pregnant');
  }

  async onClickCalving() {
    await this.navCtrl.navigateForward('/calving');
  }

  async onClickDryoff() {
    await this.navCtrl.navigateForward('/dryoff');
  }

  async onClickDairy() {
    await this.navCtrl.navigateForward('/dairy');
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

  onSubmitMilkEntry() {
    console.log('Milk Entry Form: ', this.milkEntryForm.value);
    this.dataService
      .submitMilkEntry(this.milkEntryForm.value)
      .subscribe((data) => {
        if (data) {
          const totalMilk = data['data']['createMilkEntry']['totalMilk'];
          if (totalMilk > 0) {
            const toast = {
              header: 'Flixdrop Dairy Management System',
              msg: `Animal No.${
                this.selectedCattle['collar']['collarId']
              } Produced Total ${+data['data']['createMilkEntry'][
                'totalMilk'
              ]} Ltrs of Milk.`,
              color: 'primary',
            };

            this.showToast(toast);

            this.modal.dismiss().then(() => {
              this.results = [];
              this.selectedCattle = '';
              this.milkEntryForm.reset();
              this.handleRefresh();
            });
          }
        }
      });
  }

  clearEntries() {
    this.results = [];
    this.selectedCattle = '';
    this.milkEntryForm.reset();
  }

  selectOption(animal: string) {
    this.selectedCattle = animal;
    this.milkEntryForm.controls['animalId'].setValue(animal['id']);
    this.results = [];
  }

  handleMilkEntryInput(event: any) {
    this.results = [];
    this.animals = [];
    const query = event.target.value.toLowerCase();

    const offset = (this.p - 1) * this.pageSize;

    // this.dataService
    //       .getAnimals(this.userId, this.pageSize, offset, query)
    //       .pipe(first())
    //       .subscribe({
    //         next: (res: any) => {
    //           if (res) {
    //             console.log('Res: ', res);
    //             this.animals = res.items;
    //             this.results =  this.animals || [];
    //           }
    //           this.isLoading = false;
    //         },
    //         error: (err) => {
    //           console.error("Error loading animals:", err);
    //           this.results = [];
    //           this.isLoading = false;
    //         },
    //       });

    this.dataService
      .getAnimals(this.pageSize, offset, query)
      .pipe(first()) // Automatically unsubscribes after first result
      .subscribe({
        next: (res: any) => {
          // Since our service returns 'data.getAnimals' directly now:
          this.animals = res.items || [];
          this.results = this.animals;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading animals:', err);
          this.results = [];
          this.isLoading = false;
        },
      });

    if (query.length == 0) {
      this.animals = [];
      this.results = [];
    } else if (!this.animals || this.animals.length === 0) {
      this.results = [];
      return;
    }

    this.results = this.animals.filter((item) => {
      return Object.values(item).some((value: any) => {
        if (value && typeof value === 'string') {
          return value.toLowerCase().includes(query);
        } else if (value && typeof value === 'object') {
          return Object.values(value).some((nestedValue: any) => {
            if (nestedValue && typeof nestedValue === 'string') {
              return nestedValue.toLowerCase().includes(query);
            }
            return false;
          });
        }
        return false;
      });
    });
  }

  onSelectMilkingDate(event) {
    const eventValue = event.detail.value;
    this.milkEntryForm.controls['eventDateTime'].setValue(eventValue);
  }

  async plotLineChart() {
    if (!this.milkingEvents || this.milkingEvents.length === 0) return;

    const chartDataMap = new Map();
    this.milkingEvents.forEach((event) => {
      const date = this.datePipe.transform(
        parseInt(event.eventDateTime),
        'yyyy-MM-dd'
      );
      const currentTotal = chartDataMap.get(date) || 0;
      chartDataMap.set(date, currentTotal + event.totalMilk);
    });

    const sortedDates = Array.from(chartDataMap.keys()).sort();
    const dataPoints = sortedDates.map((date) => chartDataMap.get(date));

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.myChart.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Milk Production'],
        datasets: [
          {
            label: 'Total Milk',
            data: [+this.milk_target.totalMilk],
            backgroundColor: ['#00B4DB'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'No. of Cows',
            data: [+this.milk_target.numCows],
            backgroundColor: ['#FDFC47'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Avg Milk',
            data: [this.milk_target.avgMilkPerCow],
            backgroundColor: ['#a17fe0'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Efficiency',
            data: [+this.milk_target.efficiency],
            backgroundColor: ['#00F260'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: true,
        elements: {
          point: {
            radius: 0,
          },
        },

        scales: {
          x: {
            offset: true,
            border: {
              display: true,
            },
            grid: {
              display: false,
            },
            ticks: {
              autoSkip: true,
            },
          },
          y: {
            border: {
              display: true,
            },
            grid: {
              display: false,
            },
            ticks: {
              autoSkip: true,
              font: {
                size: 10,
              },
              backdropColor: 'rgba(255, 255, 255)',
              showLabelBackdrop: true,
            },
            title: {
              display: true,
              text: 'Production (Liters)',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              padding: 10,
              textAlign: 'right',
              font: {
                weight: 'bolder',
              },
              usePointStyle: true,
              pointStyle: 'rect',
            },
            reverse: false,
          },
          title: {
            padding: 10,
            align: 'start',
            position: 'top',
            display: true,
            font: {
              weight: 'bolder',
            },
          },
          tooltip: {
            position: 'average',
          },
        },
      },
    });
  }
}
