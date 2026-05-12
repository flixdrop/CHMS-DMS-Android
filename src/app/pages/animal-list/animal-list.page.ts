import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { NgxPaginationModule } from "ngx-pagination";
import { firstValueFrom } from "rxjs";
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";
import { AuthService } from "src/app/features/auth/auth.service";
import { DataService } from "src/app/services/data/data.service";
import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, IonToolbar, IonItem, IonChip, IonIcon, IonFooter, IonImg, IonNote, IonSearchbar, NavController } from '@ionic/angular/standalone';

@Component({
  selector: "app-animal-list",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomHeaderComponent,
    TranslateModule,
    NgxPaginationModule,
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
    IonImg,
    IonNote,
],
  templateUrl: "./animal-list.page.html",
  styleUrls: ["./animal-list.page.scss"],
})
export class AnimalListPage implements OnInit {
  @ViewChild("searchbar", { static: false }) searchbar!: IonSearchbar;

  private authService = inject(AuthService);
  private dataService = inject(DataService);
  private navCtrl = inject(NavController);

  results: any[] = [];
  isLoading: boolean = false;
  userId: string = "";

  p: number = 1; // current page
  totalCount: number = 0;
  pageSize: number = 10;
  searchTerm: string = "";

  constructor() {}

  async ngOnInit() {
  try {
    // const user = await firstValueFrom(this.authService.authenticatedUser$);
    // console.log('User at Animal List Page: ', user);

    // if (user?.id) {
    //   this.userId = user.id;
      await this.loadAnimals();
    // }
  } catch (err) {
    console.error('Failed to get authenticated user:', err);
  }
}

  goBack() {
    this.navCtrl.back();
  }

//   async loadAnimals() {
//   // if (!this.userId) return;

//   this.isLoading = true;
//   const offset = (this.p - 1) * this.pageSize;

//   try {
//     const res: any = await firstValueFrom(
//       this.dataService.getAnimals(this.pageSize, offset, this.searchTerm)
//     );

//     this.results = res?.items || [];
//     this.totalCount = res?.totalCount || 0;
//   } catch (err) {
//     console.error("Error loading animals:", err);
//     this.results = [];
//     this.totalCount = 0;
//   } finally {
//     this.isLoading = false;
//   }
// }

async loadAnimals() {
  this.isLoading = true;
  const offset = (this.p - 1) * this.pageSize;

  try {
    const res: any = await firstValueFrom(
      this.dataService.getAnimals(this.pageSize, offset, this.searchTerm)
    );

    // Update results and totalCount together to prevent UI flickering
    this.results = res?.items || [];
    this.totalCount = res?.totalCount || 0;
  } catch (err) {
    console.error("Error loading animals:", err);
  } finally {
    this.isLoading = false;
  }
}


  // 🔹 Handle search input
  async onSearch(event: any) {
    const value = event.detail.value?.trim() || "";
    if (value !== this.searchTerm) {
      this.results = []; // clear results on new search
    }
    this.searchTerm = value;
    this.p = 1; // reset page
    await this.loadAnimals();
  }

  // 🔹 Handle pagination
  async onPageChange(pageNumber: number) {
    this.p = pageNumber;
    await this.loadAnimals();
  }

  // 🔹 Clear search results when search bar loses focus
  onBlurSearchBar() {
    if (this.searchbar) {
      this.searchbar.value = "";
      this.results = [];
      this.totalCount = 0;
    }
  }

  // 🔹 Optional: unify key input handling
  async handleInput(event: any) {
    await this.onSearch(event);
  }
}
