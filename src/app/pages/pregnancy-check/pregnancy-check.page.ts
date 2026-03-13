import { CommonModule } from "@angular/common";
import { Component, OnDestroy, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { NgxPaginationModule } from "ngx-pagination";
import { first, Subscription } from "rxjs";
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";
import { AuthService } from "src/app/features/auth/auth.service";
import { DataService } from "src/app/services/data/data.service";
import { UtcToIstPipe } from "src/app/utils/pipes/utc-to-ist/utc-to-ist-pipe";
import {
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
    ActionSheetController,
  IonSearchbar,
  NavController,
  ToastController,
} from '@ionic/angular/standalone';

@Component({
  selector: "app-pregnancy-check",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    CustomHeaderComponent,
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
    IonRadio
],
  templateUrl: "./pregnancy-check.page.html",
  styleUrls: ["./pregnancy-check.page.scss"],
})
export class PregnancyCheckPage implements OnDestroy {
  @ViewChild("searchbar", { static: false }) searchbar: IonSearchbar | any;

  authUserSub: Subscription;
  fetchDataSub: Subscription;
  inseminationEventSub: Subscription;
  reportPregnancySub: Subscription;
  reportPregnancyFailureSub: Subscription;

  isLoading: boolean = false;

  results: any[] = [];
  animals: any[] = [];
  inseminations: any[] = [];
  pregnancyAwaitedAnimals: any[] = [];

  p: number = 1;

  pageSize: number = 10;
  totalCount: number = 0;
  searchTerm: string = "";
  userId: string = "";

  // Date filter properties
  startDate: string = "";
  endDate: string = "";

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private navCtrl: NavController,
    private actionSheetCtrl: ActionSheetController,
    private toastController: ToastController,
  ) {}

  ngOnDestroy() {
    if (this.reportPregnancyFailureSub) {
      this.reportPregnancyFailureSub.unsubscribe();
    }
    if (this.reportPregnancySub) {
      this.reportPregnancySub.unsubscribe();
    }
    if (this.inseminationEventSub) {
      this.inseminationEventSub.unsubscribe();
    }
    if (this.fetchDataSub) {
      this.fetchDataSub.unsubscribe();
    }
    if (this.authUserSub) {
      this.authUserSub.unsubscribe();
    }
  }

  ngOnInit(): void {
    // this.authService.authenticatedUser.pipe(first()).subscribe(user => {
    //   if (user) {
    //     this.userId = user.id;
    //     this.loadInseminations();
    //   }
    // });
    this.authService.authenticatedUser$
      .pipe(
        // Filter out null/undefined users before proceeding
        first((user) => !!user),
      )
      .subscribe((user) => {
        console.log("Authenticated User Found:", user.id);
        this.userId = user.id;
        this.loadInseminations();
      });
  }

  ionViewWillEnter() {
    this.refreshPage();
  }

  // refreshPage(): Promise<void> {
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
  //               this.inseminationEventSub = this.dataService.userData.subscribe(
  //                 (userData) => {
  //                   this.heats = userData["heatEvents"];
  //                   this.inseminations = userData["inseminations"]
  //                     .filter(
  //                       (insemination: any) => insemination.isActive === true
  //                     )
  //                     .sort(
  //                       (a: any, b: any) =>
  //                         new Date(b.eventDateTime).getTime() -
  //                         new Date(a.eventDateTime).getTime()
  //                     );
  //                 }
  //               );
  //             }
  //             resolve();
  //           });
  //       }
  //     );
  //   });
  // }

  goBack() {
    this.navCtrl.back();
  }

  async showToast(data: any) {
    const toast = await this.toastController.create({
      swipeGesture: "vertical",
      icon: "thumbs-up-sharp",
      header: data.header,
      message: data.msg,
      color: data.color,
      duration: 3000,
    });
    toast.present();
  }

  // daysSince(pastDate: any) {
  //   const pastDateObj: any = new Date(pastDate);
  //   const currentDateObj: any = new Date();
  //   const differenceMs = currentDateObj - pastDateObj;
  //   const daysDifference = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
  //   return daysDifference;
  // }

  daysSince(pastDate: any): string {
    if (!pastDate) {
      return "";
    }

    const pastDateObj = new Date(pastDate);
    const currentDateObj = new Date();

    const differenceMs = currentDateObj.getTime() - pastDateObj.getTime();

    const msInDay = 1000 * 60 * 60 * 24;

    const daysDifference = Math.floor(differenceMs / msInDay);

    const daysInYear = 365;
    if (daysDifference >= daysInYear) {
      const years = Math.floor(daysDifference / daysInYear);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }

    const daysInMonth = 30;
    if (daysDifference >= daysInMonth) {
      const months = Math.floor(daysDifference / daysInMonth);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    }

    if (daysDifference >= 1) {
      return `${daysDifference} day${daysDifference > 1 ? "s" : ""} ago`;
    }

    return "today";
  }

  onClickSubmit(event: any, insemination: any) {
    const eventValue = event.detail.value;
    if (eventValue === "yes") {
      this.confirmPregnancy(insemination);
    } else if (eventValue === "no") {
      this.reportPregnancyFailure(insemination);
    }
  }

  async confirmPregnancy(insemination: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `Is Cow No. ${insemination.animal.collar.name} Pregnant ?`,
      subHeader: `click on "Confirm" only if cow no. ${insemination.animal.collar.name} is pregnant.`,
      backdropDismiss: true,
      buttons: [
        {
          text: "Yes",
          handler: async () => {
            const data = {
              eventDateTime: new Date().toISOString(),
              insemination: insemination,
            };

            this.reportPregnancySub = this.dataService
              .confirmPregnancy(data)
              .subscribe((insemination) => {
                const toast = {
                  header: "Pregnancy Confirmed",
                  msg: `Animal No. ${data.insemination.animal.collar.name} is pregnant.`,
                  color: "success",
                };

                this.showToast(toast);
                console.log("Pregnancy Confirmed: ", insemination);
              });
            this.refreshPage();
          },
        },
        {
          text: "No",
          handler: async () => {
            this.refreshPage();
          },
        },
      ],
    });

    await actionSheet.present();

    const { role } = await actionSheet.onDidDismiss();
    console.log("Action sheet dismissed with role:", role);
    this.refreshPage();
  }

  async reportPregnancyFailure(insemination: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `Is Cow No. ${insemination.animal.collar.name} Not Pregnant ?`,
      subHeader: `click on "Confirm" only if cow no. ${insemination.animal.collar.name} is Not pregnant.`,
      backdropDismiss: true,
      buttons: [
        {
          text: "Yes",
          handler: async () => {
            const data = {
              eventDateTime: new Date().toISOString(),
              insemination: insemination,
            };

            this.reportPregnancyFailureSub = this.dataService
              .reportPregnancyFailure(data)
              .subscribe((insemination) => {
                const toast = {
                  header: "Report Delay In Pregnancy",
                  msg: `Animal No. ${data.insemination.animal.collar.name} is not pregnant.`,
                  color: "warning",
                };

                this.showToast(toast);

                console.log("Reported Pregnancy Failure: ", insemination);
              });
            this.refreshPage();
          },
        },
        {
          text: "No",
          handler: async () => {
            this.refreshPage();
          },
        },
      ],
    });

    await actionSheet.present();
    const { role } = await actionSheet.onDidDismiss();
    console.log("Action sheet dismissed with role:", role);
    this.refreshPage();
  }

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
      this.inseminations = null;
      this.results = null;
    }
  }

  refreshPage() {
    this.p = 1;
    return this.loadInseminations();
  }

  loadInseminations(): Promise<void> {
    if (!this.userId) {
      console.error("loadInseminations aborted: userId is missing");
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.isLoading = true;
      const offset = (this.p - 1) * this.pageSize;
      const defaultStart = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const defaultEnd = new Date().toISOString();

      this.fetchDataSub = this.dataService
        .getInseminations(
          this.userId,
          this.pageSize,
          offset,
          this.searchTerm,
          this.startDate || defaultStart,
          this.endDate || defaultEnd,
        )
        .pipe(first())
        .subscribe({
          next: (res: any) => {
            console.log("Res:", res);

            this.results = res?.items || [];
            this.totalCount = res?.totalCount || 0;
            this.inseminations = this.results;
            this.isLoading = false;
            resolve();
          },
          error: (err) => {
            console.error("Component loadInseminations Error:", err);
            this.isLoading = false;
            resolve();
          },
        });
    });
  }

  handleInput(event: any) {
    const val = event.detail.value;
    this.searchTerm = val ? val.trim() : "";
    this.p = 1;
    this.loadInseminations();
  }

  onPageChange(page: number) {
    this.p = page;
    this.loadInseminations();
  }
}
