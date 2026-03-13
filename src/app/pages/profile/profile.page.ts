import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/features/auth/auth.service';
import { DataService } from 'src/app/services/data/data.service';
import { IonContent, IonLabel, IonToolbar, IonButtons, IonBackButton, IonTitle, IonSpinner, IonGrid, IonRow, IonCol, IonIcon, IonList, IonItem, IonButton, IonProgressBar, IonHeader, NavController, IonChip, IonNote, IonFooter, LoadingController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { first } from 'rxjs';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NgxPaginationModule,
    IonContent,
    IonLabel,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonList,
    IonItem,
    IonButton,
    IonProgressBar,
    IonHeader,
    IonChip,
    IonNote,
    IonFooter
],
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  isLoading: boolean = false;
  user: any = {};

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(){
   this.authService.authenticatedUser$.pipe(
          first(user => !!user)
        ).subscribe(user => {
          console.log('User : ', user );
          this.user = user;
        });
  }

  goBack(){
    this.navCtrl.navigateBack('/home');
  }

   async onLogout() {
    const loadingEL = await this.loadingCtrl.create({
      spinner: 'dots',
      message: 'Please Wait..',
    });

    await loadingEL.present();

    try {
      this.authService.authenticatedUser$.subscribe((user) => {
        if (user) {
          this.authService.logout();
          this.navCtrl.navigateBack('/login');
        }
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      loadingEL.dismiss();
    }
  }

}
