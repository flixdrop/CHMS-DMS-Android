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
import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, IonToolbar, IonItem, IonChip, IonIcon, IonFooter,  IonSearchbar, NavController} from '@ionic/angular/standalone';

@Component({
  selector: "app-calving",
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
  ],
  templateUrl: "./calving.page.html",
  styleUrls: ["./calving.page.scss"],
})
export class CalvingPage implements OnDestroy {
  @ViewChild("searchbar", { static: false }) searchbar: IonSearchbar | any;

  isLoading: boolean = false;
  authUserSub: Subscription;
  fetchDataSub: Subscription;
  calvedEventSub: Subscription;

  results: any[] = [];
  animals: any[] = [];
  calvedAnimals: any[] = [];

  p: number = 1;

  pageSize: number = 10;
  totalCount: number = 0;
  searchTerm: string = "";
  userId: string = "";

  startDate: string = "";
  endDate: string = "";

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private navCtrl: NavController
  ) {}

  ngOnDestroy() {
    if (this.calvedEventSub) {
      this.calvedEventSub.unsubscribe();
    }
    if (this.fetchDataSub) {
      this.fetchDataSub.unsubscribe();
    }
    if (this.authUserSub) {
      this.authUserSub.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.authService.authenticatedUser$
      .pipe(
        // Filter out null/undefined users before proceeding
        first((user) => !!user),
      )
      .subscribe((user) => {
        console.log("Authenticated User Found:", user.id);
        this.userId = user.id;
        this.loadCalvings();
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
  //               this.calvedEventSub = this.dataService.userData.subscribe(
  //                 (userData) => {
  //                   this.calvedAnimals = userData["calvedEvents"]
  //                     .filter((calvedAnimal) => calvedAnimal.isActive === true)
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

   goBack(){
    this.navCtrl.back();
  }

  dismissToast(ev) {
    const { role } = ev.detail;
    console.log(`Dismissed with role: ${role}`);
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
      this.calvedAnimals = null;
      this.results = null;
    }
  }

  refreshPage() {
    this.p = 1;
    return this.loadCalvings();
  }

  loadCalvings(): Promise<void> {
    if (!this.userId) {
      console.error("loadCalvings aborted: userId is missing");
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
        .getCalvings(
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
            this.calvedAnimals = this.results;
            this.isLoading = false;
            resolve();
          },
          error: (err) => {
            console.error("Component loadCalvings Error:", err);
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
    this.loadCalvings();
  }

  onPageChange(page: number) {
    this.p = page;
    this.loadCalvings();
  }
}
