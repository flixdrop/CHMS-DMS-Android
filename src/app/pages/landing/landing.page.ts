import { Component, ViewChild, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { first, Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/features/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonItem, IonLabel, IonButton, IonContent, IonRouterOutlet, IonModal, IonMenu, IonRippleEffect, IonImg, IonList, IonSelect, IonSelectOption, IonMenuToggle, IonFooter, IonNote, LoadingController, MenuController, ToastController, NavController, IonChip } from "@ionic/angular/standalone";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonItem, IonLabel, IonButton, IonContent, IonRouterOutlet, IonMenu, IonRippleEffect, IonImg, IonList, IonSelect, IonSelectOption, IonMenuToggle, IonFooter, IonNote, IonModal, IonChip],
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
export class LandingPage implements OnInit,AfterViewInit, OnDestroy {
  @ViewChild('leftmenu', { static: false }) leftmenu: IonMenu;
  @ViewChild('chatbot') chatbot: IonModal | any;

  authSub: Subscription;
  userDataSub: Subscription;
  fetchUserDataSub: Subscription;

  isLoading: boolean = false;
  isMenuOpen: boolean = false;
  isVisible: boolean = true;
  platform: any;

  language: string = 'en';
  user: any = {};
  farm: { farmId: string; farmName: string };
  isChatbotOpen = false;

  constructor(
    private translateService: TranslateService,
    private loadingController: LoadingController,
    private authService: AuthService,
    private menuControl: MenuController,
    private toastController: ToastController,
    private router: Router,
    private navCtrl: NavController
  ) {
    this.translateService.setDefaultLang('en');
    this.translateService.use(localStorage.getItem('language') || 'en');
    this.language = localStorage.getItem('language') || 'en';
  }

  ngOnInit(){
     this.authService.authenticatedUser$.pipe(
        first(user => !!user)
      ).subscribe(user => {
        console.log('User : ', user );
        this.user = user;
      });
  }

  ngAfterViewInit() {
    this.leftmenu.ionDidOpen.subscribe(() => (this.isMenuOpen = true));
    this.leftmenu.ionDidClose.subscribe(() => (this.isMenuOpen = false));
  }

  ngOnDestroy() {
    if (this.fetchUserDataSub) {
      this.fetchUserDataSub.unsubscribe();
    }
    if (this.userDataSub) {
      this.userDataSub.unsubscribe();
    }
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  toggleChatbot(isOpen: boolean) {
    this.isChatbotOpen = isOpen;
  }

  async onClickProfile() {
    await this.navCtrl.navigateForward("/profile");
  }

  closeSideMenu() {
    if (this.menuControl.isOpen('left-menu')) {
      this.menuControl.close('left-menu');
    }
  }

  changeLanguageTo(event: any) {
    const language: string = event.detail.value;

    this.loadingController
      .create({
        translucent: true,
        animated: true,
        spinner: 'dots',
        message: `Changing to ${language}`,
      })
      .then((loadingEL) => {
        loadingEL.present();

        localStorage.setItem('language', language);
        this.language = language;

        // Use TranslateService to change the language
        this.translateService.use(language);

        // Show toast after language change
        this.showToast(`Language changed to ${language}`);

        loadingEL.dismiss();
      });
  }

  async showToast(msg: any) {
    console.log('Toast triggered');
    const toast = await this.toastController.create({
      swipeGesture: 'vertical',
      message: msg,
      duration: 3000,
    });
    toast.present();
  }

  async onLogout() {
    const loadingEL = await this.loadingController.create({
      spinner: 'dots',
      message: 'Please Wait..',
    });

    await loadingEL.present();

    try {
      this.authService.authenticatedUser$.subscribe((user) => {
        if (user) {
          this.authService.logout();
          this.closeSideMenu();
          this.router.navigateByUrl('/login');
        }
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      loadingEL.dismiss();
    }
  }
}
