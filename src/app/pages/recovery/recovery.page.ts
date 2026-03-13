import { CommonModule } from "@angular/common";
import { Component, OnDestroy, ViewChild } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { Photo } from "@capacitor/camera";
import { TranslateModule } from "@ngx-translate/core";
import { NgxPaginationModule } from "ngx-pagination";
import { first, Subscription } from "rxjs";
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";
import { AuthService } from "src/app/features/auth/auth.service";
import { DataService } from "src/app/services/data/data.service";
import { UtcToIstPipe } from "src/app/utils/pipes/utc-to-ist/utc-to-ist-pipe";
import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, IonToolbar, IonItem, IonChip, IonIcon, IonFooter, IonSearchbar, NavController  } from "@ionic/angular/standalone";

@Component({
  selector: "app-recovery",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    CustomHeaderComponent,
    ReactiveFormsModule,
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
    IonFooter
],
  templateUrl: "./recovery.page.html",
  styleUrls: ["./recovery.page.scss"],
})
export class RecoveryPage implements OnDestroy {
  @ViewChild("searchbar", { static: false }) searchbar: IonSearchbar | any;

  authUserSub: Subscription;
  fetchDataSub: Subscription;
  treatmentEventSub: Subscription;

  isLoading: boolean = false;

  results: any[] = [];
  animals: any[] = [];
  treatmentEvents: any[] = [];

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
  ) {}

  ngOnDestroy() {
    if (this.treatmentEventSub) {
      this.treatmentEventSub.unsubscribe();
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
    //     this.loadHealths();
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
        this.loadRecoveredAnimals();
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
  //               this.treatmentEventSub = this.dataService.userData.subscribe(
  //                 (userData) => {
  //                   this.treatmentEvents = userData["healthEvents"]
  //                     .filter(
  //                       (healthEvent) => healthEvent.treatmentDetails && healthEvent?.isActive === false
  //                     )
  //                     .sort(
  //                       (a: any, b: any) =>
  //                         new Date(parseInt(b.detectedAt)).getTime() -
  //                         new Date(parseInt(a.detectedAt)).getTime()
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

goBack(){
    this.navCtrl.back();
  }

  private async readAsBase64(photo: Photo) {
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    return (await this.convertBlobToBase64(blob)) as string;
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
      this.treatmentEvents = null;
      this.results = null;
    }
  }

  refreshPage() {
    this.p = 1;
    return this.loadRecoveredAnimals();
  }

  loadRecoveredAnimals(): Promise<void> {
    if (!this.userId) {
      console.error("loadRecoveredAnimals aborted: userId is missing");
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.isLoading = true;
      const offset = (this.p - 1) * this.pageSize;
      const defaultStart = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 30 days
      const defaultEnd = new Date().toISOString();

      this.fetchDataSub = this.dataService
        .getRecoveries(
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
            this.treatmentEvents = this.results;
            this.isLoading = false;
            resolve();
          },
          error: (err) => {
            console.error("Component loadRecoveredAnimals Error:", err);
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
    this.loadRecoveredAnimals();
  }

  onPageChange(page: number) {
    this.p = page;
    this.loadRecoveredAnimals();
  }
}
