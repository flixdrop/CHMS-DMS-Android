import { CommonModule } from "@angular/common";
import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewChild,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { IonHeader, IonToolbar, IonProgressBar, IonButtons, IonButton, IonIcon, IonTitle, IonItem, IonSearchbar } from "@ionic/angular/standalone";

@Component({
  standalone: true,
  selector: "app-custom-header",
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonProgressBar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonItem,
    IonSearchbar
],
  inputs: ["title", "searchTerm", "searchToggle"],
  templateUrl: "./custom-header.component.html",
  styleUrls: ["./custom-header.component.scss"],
})
export class CustomHeaderComponent {
  @ViewChild("searchbar", { static: false }) searchbar: IonSearchbar | any;

  @Input() isLoading: boolean;
  @Input() title: string;
  @Input() searchTerm: string;
  @Input() count: string;

  @Output() close = new EventEmitter();
  @Output() clear = new EventEmitter();
  @Output() search = new EventEmitter();

  searchToggle: boolean;

  constructor() {}

  goBack() {
    this.close.emit();
  }

  clearInput() {
    this.clear.emit();
  }

  searchItem() {
    this.search.emit();
  }

  toggleSearch() {
    this.searchToggle = !this.searchToggle;
  }
}
