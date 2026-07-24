// import { Component, input, output } from '@angular/core';
// import { SharedImportsModule } from 'src/app/shared/shared-imports';
// import { IonProgressBar, IonBackButton } from "@ionic/angular/standalone";

// @Component({
//   selector: "app-custom-header",
//   imports: [IonBackButton, IonProgressBar,  SharedImportsModule],
//   templateUrl: "./custom-header.component.html",
//   styleUrls: ["./custom-header.component.scss"],
//   standalone: true,
// })
// export class CustomHeaderComponent {
//   // @ViewChild("searchbar", { static: false }) searchbar: IonSearchbar | any;

//   // @Input() isLoading: boolean;
//   // @Input() title: string;
//   // @Input() searchTerm: string;
//   // @Input() count: string;

//   // @Output() close = new EventEmitter();
//   // @Output() clear = new EventEmitter();
//   // @Output() search = new EventEmitter();

//   // isSearchbarVisible = false;

//   // searchToggle: boolean;

//   // constructor() {}

//   // goBack() {
//   //   this.close.emit();
//   // }

//   // clearInput() {
//   //   this.clear.emit();
//   // }

//   // searchItem() {
//   //   this.search.emit();
//   // }

//   // toggleSearch() {
//   //   this.searchToggle = !this.searchToggle;
//   // }

//   //   onClickSearchIcon(){
//   //   if(this.isSearchbarVisible === false){
//   //     this.isSearchbarVisible = true;
//   //   }
//   // }

//   // onCloseSearchbar(){
//   //   if(this.isSearchbarVisible === true){
//   //     this.isSearchbarVisible = false;
//   //   }
//   // }


//   // --- Inputs ---
//   title = input<string>('Animals');
//   isSearchbarVisible = input<boolean>(false);
//   isLoading = input<boolean>(false);
//   searchPlaceholder = input<string>('Search Animals');
  
//   // Pass an object with the search filter if your parent needs an initial value, otherwise this can be minimal
//   searchValue = input<string>(''); 
  
//   // --- Outputs ---
//   searchClose = output<void>();
//   searchOpen = output<void>();
  
//   // Emit the CustomEvent from ionInput directly to the parent page
//   searchEvent = output<CustomEvent>();

//   // --- Methods ---
//   onClickSearchIcon() {
//     this.searchOpen.emit();
//   }

//   onCloseSearchbar() {
//     this.searchClose.emit();
//   }

//   handleInput(event: any) {
//     this.searchEvent.emit(event);
//   }

// }



import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-custom-header',
  templateUrl: './custom-header.component.html',
  styleUrls: ['./custom-header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class CustomHeaderComponent {
  // --- Inputs ---
  title = input<string>('Animals');
  isLoading = input<boolean>(false);
  searchPlaceholder = input<string>('Search Animals');
  searchValue = input<string>(''); 
  
  // --- Outputs (Only the search event bubbles up to the specific page API) ---
  searchEvent = output<CustomEvent>();

  // --- Internal Component State ---
  isSearchbarVisible = signal<boolean>(false);
  private navCtrl = inject(NavController);

  goBack() {
    // Navigates back while letting Ionic fire ionViewWillEnter on the target view
    this.navCtrl.back(); 
  }

  // --- Methods managed entirely by this reusable component ---
  onClickSearchIcon() {
    this.isSearchbarVisible.set(true);
  }

  onCloseSearchbar() {
    this.isSearchbarVisible.set(false);
    // Optionally clear out the search string when closing
    this.searchEvent.emit({ detail: { value: '' } } as CustomEvent);
  }

  handleInput(event: any) {
    this.searchEvent.emit(event);
  }
}