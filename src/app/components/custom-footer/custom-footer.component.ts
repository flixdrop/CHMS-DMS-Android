import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { IonToolbar, IonButtons, IonButton, IonLabel, IonIcon } from "@ionic/angular/standalone";

@Component({
  standalone: true,
  selector: "app-custom-footer",
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, IonToolbar, IonButtons, IonButton, IonLabel, IonIcon],
  inputs: ["title"],
  templateUrl: "./custom-footer.component.html",
  styleUrls: ["./custom-footer.component.scss"],
})
export class CustomFooterComponent {
  @Input() customForm: FormGroup;
  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  @Output() submit: EventEmitter<void> = new EventEmitter<void>();

  constructor() {}

  onClickClose() {
    this.close.emit();
  }

  onClickSubmit() {
    this.submit.emit();
  }
}
