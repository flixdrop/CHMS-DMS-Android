import { Component, OnDestroy, ViewChild } from "@angular/core";
import { first, Subscription } from "rxjs";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { NgxPaginationModule } from "ngx-pagination";
import { UtcToIstPipe } from "src/app/utils/pipes/utc-to-ist/utc-to-ist-pipe";
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";
import { AuthService } from "src/app/features/auth/auth.service";
import { DataService } from "src/app/services/data/data.service";
import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, IonToolbar, IonItem, IonChip, IonIcon, IonFooter, IonSearchbar, NavController } from '@ionic/angular/standalone';

@Component({
  selector: "app-dairy",
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
    IonFooter
  ],
  templateUrl: "./dairy.page.html",
  styleUrls: ["./dairy.page.scss"],
})
export class DairyPage implements OnDestroy {
  @ViewChild("searchbar", { static: false }) searchbar: IonSearchbar | any;

  authUserSub: Subscription;
  fetchDataSub: Subscription;
  milkingEventSub: Subscription;

  isLoading: boolean = false;

  results: any[] = [];
  animals: any[] = [];
  milkingEvents: any[] = [];

  p: number = 1;

  pageSize: number = 10;
  totalCount: number = 0;
  searchTerm: string = "";
  userId: string = "";

  // Date filter properties
  startDate: string = "";
  endDate: string = "";

  fromDate: string;
  toDate: string;
  maxDate: string;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private navCtrl: NavController,
  ) {}

  ngOnInit(): void {
    this.authService.authenticatedUser$
      .pipe(first((user) => !!user))
      .subscribe((user) => {
        console.log("Authenticated User Found:", user.id);
        this.userId = user.id;
        this.loadMilkEntries();
      });
  }

  ngOnDestroy() {
    if (this.milkingEventSub) {
      this.milkingEventSub.unsubscribe();
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
      this.milkingEvents = null;
      this.results = null;
    }
  }

  refreshPage() {
    this.p = 1;
    return this.loadMilkEntries();
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

  loadMilkEntries(): Promise<void> {
    if (!this.userId) {
      console.error("loadMilkEntries aborted: userId is missing");
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.isLoading = true;
      const offset = (this.p - 1) * this.pageSize;

      // const defaultStart = new Date(
      //   Date.now() - 30 * 24 * 60 * 60 * 1000,
      // ).toISOString();
      // const defaultEnd = new Date().toISOString();


          // Pass null to keep the specific time calculated in the constructor
    const start = this.getFormattedDate(this.fromDate, null); 
    const end = this.getFormattedDate(this.toDate, null);

      this.fetchDataSub = this.dataService
        .getMilkEntries(
          this.userId,
          this.pageSize,
          offset,
          this.searchTerm,
          start, 
          end
        )
        .pipe(first())
        .subscribe({
          next: (res: any) => {
            console.log("Res:", res);

            this.results = res?.items || [];
            this.totalCount = res?.totalCount || 0;
            this.milkingEvents = this.results;
            this.isLoading = false;
            resolve();
          },
          error: (err) => {
            console.error("Component loadMilkEntries Error:", err);
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
    this.loadMilkEntries();
  }

  onPageChange(page: number) {
    this.p = page;
    this.loadMilkEntries();
  }
}
