import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonButton,
  IonContent,
  IonRouterOutlet,
  IonModal,
  IonMenu,
  IonRippleEffect,
  IonImg,
  IonList,
  IonSelect,
  IonSelectOption,
  IonMenuToggle,
  IonFooter,
  IonNote,
  LoadingController,
  MenuController,
  ToastController,
  NavController,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonThumbnail, IonInput } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DASHBOARD_ITEMS } from 'src/app/graphql/queries/dashboard.queries';
import { Apollo } from 'apollo-angular';
import { SystemService } from 'src/app/services/system/system.service';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { SelectionComponent } from 'src/app/components/selection/selection.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Preferences } from '@capacitor/preferences';
import { FcmService } from 'src/app/services/fcm/fcm.service';

export interface DashboardFilter {
  targetPath: string;
  farmId: string;
  search: string;
  startDate: string;
  endDate: string;
}

@Component({
  standalone: true,
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  imports: [IonInput, 
    CommonModule,
    FormsModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    SelectionComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonButton,
    IonContent,
    IonRouterOutlet,
    IonMenu,
    IonRippleEffect,
    IonImg,
    IonList,
    IonSelect,
    IonSelectOption,
    IonMenuToggle,
    IonFooter,
    IonNote,
    IonModal,
    IonChip,
    IonGrid,
    IonRow,
    IonCol,
    IonThumbnail,
  ],
})
export class LandingPage implements OnInit {
  // Service Injections (Modern Angular inject API)
  private readonly translateService = inject(TranslateService);
  private readonly loadingController = inject(LoadingController);
  private readonly authService = inject(AuthService);
  private readonly menuControl = inject(MenuController);
  private readonly toastController = inject(ToastController);
  private readonly navCtrl = inject(NavController);
  private readonly systemService = inject(SystemService);
  private readonly apollo = inject(Apollo);
  private readonly eventUtil = inject(EventUtilityService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly fcmService = inject(FcmService);

  // Reactive State Signals
  readonly user = signal<any>({});
  readonly isLoading = signal<boolean>(false);
  readonly isMenuOpen = signal<boolean>(false);
  readonly isChatbotOpen = signal<boolean>(false);
  readonly language = signal<string>(localStorage.getItem('language') || 'en');
  readonly globalCounts = signal<any>(null);

  readonly filter = signal<DashboardFilter>({
    targetPath: '',
    farmId: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  // Derived Computed Signals
  readonly safeLogo = computed<SafeResourceUrl | null>(() => {
    const logoUrl = this.user()?.logo;
    return logoUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(logoUrl) : null;
  });

  constructor() {
    this.translateService.setDefaultLang('en');
    this.translateService.use(this.language());

    // Listen to selection changes reactively and auto-cleanup using takeUntilDestroyed
    this.systemService.selectionChanged$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.syncSelections();
        this.refresh();
      });
  }

  ngOnInit(): void {
    this.initializeUser();
    this.syncSelections();
    this.setRange(0.066);
  }

  async initializeUser(): Promise<void> {
    const { value } = await Preferences.get({ key: 'chms-dms.mobile.user' });
    if (value) {
      try {
        this.user.set(JSON.parse(value));
      } catch (err) {
        console.error('Failed to parse user session:', err);
      }
    }
  }

  onMenuToggle(isOpen: boolean): void {
    this.isMenuOpen.set(isOpen);
  }

  setRange(months: number): void {
    const range = this.eventUtil.calculateRange(months);
    this.filter.update((prev) => ({
      ...prev,
      startDate: range.start,
      endDate: range.end,
    }));
    this.refresh();
  }

  refresh(): void {
    this.loadGlobalCounts();
  }

  private syncSelections(): void {
    const selections = this.eventUtil.getSavedSelections();
    if (selections) {
      this.filter.update((prev) => ({
        ...prev,
        targetPath: selections.targetPath || '',
        farmId: selections.farmId || '',
      }));
    }
  }

  async loadGlobalCounts(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.apollo.query<any>({
          query: DASHBOARD_ITEMS,
          variables: { filter: this.filter() },
          fetchPolicy: 'network-only',
        })
      );
      if (res?.data?.getDashboardCounts) {
        this.globalCounts.set(res.data.getDashboardCounts);
      }
    } catch (err) {
      console.error('Global Load Error:', err);
    }
  }

  toggleChatbot(isOpen: boolean): void {
    this.isChatbotOpen.set(isOpen);
  }

  async onClickProfile(): Promise<void> {
    await this.navCtrl.navigateForward('/profile');
  }

  async closeSideMenu(): Promise<void> {
    if (await this.menuControl.isOpen('left-menu')) {
      await this.menuControl.close('left-menu');
    }
  }

  async changeLanguageTo(event: CustomEvent): Promise<void> {
    const newLang: string = event.detail.value;

    const loading = await this.loadingController.create({
      translucent: true,
      animated: true,
      spinner: 'dots',
      message: `Changing to ${newLang}`,
    });
    await loading.present();

    localStorage.setItem('language', newLang);
    this.language.set(newLang);
    this.translateService.use(newLang);

    await this.showToast(`Language changed to ${newLang}`);
    await loading.dismiss();
  }

  async showToast(msg: string): Promise<void> {
    const toast = await this.toastController.create({
      swipeGesture: 'vertical',
      message: msg,
      duration: 3000,
    });
    await toast.present();
  }

  // async onClickLogout(): Promise<void> {
  //   try {
  //     const deviceToken = this.fcmService.getCurrentToken() || null;
  //     await this.authService.logout(deviceToken);
  //   } catch (error) {
  //     console.error('[UI] Error during logout sequence:', error);
  //     await this.authService.performClientSideLogout();
  //   }
  // }

  async onClickLogout(): Promise<void> {
  try {
    const deviceToken = this.fcmService.getCurrentToken() || null;
    await this.authService.logout(deviceToken);
  } catch (error) {
    console.error('[UI] Error during logout sequence:', error);
    
    // Ensure native FCM state is reset even on unhandled exception
    await this.fcmService.deleteToken();
    await this.authService.performClientSideLogout();
  }
}
}