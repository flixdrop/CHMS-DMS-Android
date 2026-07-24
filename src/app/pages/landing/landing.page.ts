import { Component, ViewChild, AfterViewInit, OnDestroy, OnInit, computed } from '@angular/core';
import { BehaviorSubject, first, firstValueFrom, Observable, Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonItem, IonLabel, IonButton, IonContent, IonRouterOutlet, IonModal, IonMenu, IonRippleEffect, IonImg, IonList, IonSelect, IonSelectOption, IonMenuToggle, IonFooter, IonNote, LoadingController, MenuController, ToastController, NavController, IonChip, IonApp, IonTitle, IonText, IonInput, IonGrid, IonRow, IonCol, IonThumbnail } from "@ionic/angular/standalone";
import { AuthService } from 'src/app/services/auth/auth.service';
import { DASHBOARD_ITEMS } from 'src/app/graphql/queries/dashboard.queries';
import { Apollo } from 'apollo-angular';
import { SystemService } from 'src/app/services/system/system.service';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { SelectionComponent } from "src/app/components/selection/selection.component";
import { DomSanitizer } from '@angular/platform-browser';
import { Preferences } from '@capacitor/preferences';
import { FcmService } from 'src/app/services/fcm/fcm.service';

@Component({
  standalone: true,
  imports: [IonCol, IonRow, IonGrid, IonInput, IonText, IonTitle, CommonModule, FormsModule, TranslateModule, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonItem, IonLabel, IonButton, IonContent, IonRouterOutlet, IonMenu, IonRippleEffect, IonImg, IonList, IonSelect, IonSelectOption, IonMenuToggle, IonFooter, IonNote, IonModal, IonChip, RouterModule, RouterLink, IonMenuToggle, IonMenu, IonRouterOutlet, IonContent, IonList, IonItem, IonHeader, IonToolbar, RouterLinkActive, SelectionComponent, IonThumbnail],
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
// export class LandingPage implements OnInit,AfterViewInit, OnDestroy {

export class LandingPage {

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

  // High-performance computed signal to bypass security automatically on state change
  public readonly safeLogo = computed(() => {
    const logoUrl = this.user?.logo;
    return logoUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(logoUrl) : null;
  });

  private globalData$ = new BehaviorSubject<any>(null);
  globalCounts$: Observable<any> = this.globalData$.asObservable();

  private subs = new Subscription();

  // Standardized Parameters aligned with backend filters
  filter = {
    targetPath: '',
    farmId: '',
    search: '',
    startDate: '',
    endDate: '',
  };
  options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };

  constructor(
    private translateService: TranslateService,
    private loadingController: LoadingController,
    private authService: AuthService,
    private menuControl: MenuController,
    private toastController: ToastController,
    private router: Router,
    private navCtrl: NavController,
    private systemService: SystemService,
    private apollo: Apollo,
    private eventUtil: EventUtilityService,
    private sanitizer: DomSanitizer,
    private fcmService: FcmService
  ) {
    this.translateService.setDefaultLang('en');
    this.translateService.use(localStorage.getItem('language') || 'en');
    this.language = localStorage.getItem('language') || 'en';
  }

  ngOnInit() {
    this.initializeUser();
    this.syncSelections();
    this.setRange(0.066);
    this.initSyncs();
  }


  async initializeUser() {
    const { value } = await Preferences.get({
      key: 'chms-dms.mobile.user'
    });

    if (value) {
      this.user = JSON.parse(value);
      console.log('LandingPage Initialized with user:', this.user);
    } else {
      console.log('No user found in Capacitor Preferences.');
    }
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

    this.subs.unsubscribe();
  }

  setRange(months: number) {
    const range = this.eventUtil.calculateRange(months);
    this.filter.startDate = range.start;
    this.filter.endDate = range.end;
    this.refresh();
  }

  private initSyncs() {
    this.subs.add(this.systemService.selectionChanged$.subscribe(() => {
      this.syncSelections();
      this.refresh();
    }));
  }

  refresh() {
    this.loadGlobalCounts();
  }

  private syncSelections() {
    const selections = this.eventUtil.getSavedSelections();
    if (selections) {
      this.filter.targetPath = selections.targetPath || '';
      this.filter.farmId = selections.farmId || '';
    }
  }

  async loadGlobalCounts() {
    try {
      const res = await firstValueFrom(
        this.apollo.query<any>({
          query: DASHBOARD_ITEMS,
          variables: { filter: this.filter },
          fetchPolicy: 'network-only',
        })
      );
      if (res?.data?.getDashboardCounts) {
        this.globalData$.next(res.data.getDashboardCounts);
      }
    } catch (err) {
      console.error('Global Load Error:', err);
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

  // async onClickLogout(): Promise<void> {
  //   try {
  //     // Fetch device token safely if your fcm implementation supports it, otherwise fallback
  //     const deviceToken = localStorage.getItem('device_push_token') || 'web_browser_session';
  //     console.log('[UI] Initiating comprehensive application teardown sequence...');
  //     await this.authService.logout(deviceToken);
  //   } catch (error) {
  //     console.error('[UI] Critical intercept during logout lifecycle execution:', error);
  //     await this.authService.performClientSideLogout();
  //   }
  // }

    async onClickLogout(): Promise<void> {
  try {
    console.log('[UI] Initiating comprehensive application teardown sequence...');

    // 1. Fetch real token from FCM service or Preferences (or null if absent)
    const deviceToken = this.fcmService.getCurrentToken() || null;

    // 2. Execute auth service logout sequence
    await this.authService.logout(deviceToken);
  } catch (error) {
    console.error('[UI] Critical intercept during logout lifecycle execution:', error);
    
    // Safety fallback: Ensure user isn't stuck on screen if GraphQL fails
    await this.authService.performClientSideLogout();
  }
}

}
