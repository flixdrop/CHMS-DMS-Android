import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { IonDatetime, IonContent, IonSpinner, IonLabel, IonBadge, IonSearchbar, IonIcon, IonDatetimeButton, 
  IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonFooter, IonChip, IonInput, IonItem, 
  IonList, IonSelect, IonSelectOption, IonCheckbox, IonListHeader, IonPopover, 
  IonRadio,
  IonAvatar,
  IonRange,
  IonText,
  IonItemGroup,
  IonItemDivider,
  IonCol,
  IonRow,
  IonGrid,
  IonImg,
  IonThumbnail} from '@ionic/angular/standalone';
import { UtcToIstPipe } from '../utils/pipes/utc-to-ist/utc-to-ist-pipe';
import { DaysSincePipe } from '../utils/pipes/days-since/days-since-pipe';

const SharedImports = [
  CommonModule, RouterModule, FormsModule, ReactiveFormsModule, TranslateModule, NgxPaginationModule,
  IonModal, IonPopover, IonHeader, IonFooter, IonContent, IonSpinner, IonToolbar, IonItem, IonTitle,
  IonList, IonListHeader, IonInput, IonSelect, IonRadio, IonSelectOption, IonButtons, IonButton, IonLabel, IonIcon,
  IonBadge, IonChip, IonCheckbox, IonSearchbar, IonDatetime, IonDatetimeButton, IonAvatar,
  RouterLink,    
  RouterLinkActive,

  IonText, IonItemGroup, IonItemDivider, IonCol, IonRow, IonGrid, IonImg, IonRange, IonThumbnail,

  UtcToIstPipe,
  DaysSincePipe
];

@NgModule({
  imports: SharedImports,
  exports: SharedImports,
})
export class SharedImportsModule { }