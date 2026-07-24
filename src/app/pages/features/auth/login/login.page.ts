import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, IonButton, IonCheckbox, IonContent, IonFooter, IonIcon, IonInput, IonItem, IonLabel, IonToolbar, LoadingController, NavController, ToastController, IonChip, IonFab, IonHeader, IonList, IonGrid, IonAvatar, IonRow, IonCol, Platform } from '@ionic/angular/standalone';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { AuthService } from 'src/app/services/auth/auth.service';
import { RouterModule, RouterLink } from '@angular/router';
import { StatusBar } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';

export type AuthenticationViewMode = 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'RESET';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonCol, IonRow, IonGrid,
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    IonToolbar,
    IonContent,
    IonItem,
    IonIcon,
    IonInput,
    IonCheckbox,
    IonButton,
    IonLabel,
    IonFooter,
    IonChip,
    IonList,
    IonAvatar, IonHeader, SharedImportsModule, 
    RouterModule, RouterLink
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  // Collection pipeline managing system allocations safely 
  private subscriptions: Subscription[] = [];

  // Reactive State Parameters
  authMode: AuthenticationViewMode = 'LOGIN';
  passwordVisible: boolean = false;
  keepMeLoggedIn: boolean = false;

  // View Form Groups mapping interface targets completely
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  forgotForm!: FormGroup;
  resetForm!: FormGroup;

  constructor(
    private toastController: ToastController,
    public loadingController: LoadingController,
    private navControl: NavController,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private platform: Platform,
  ) { }

  ngOnInit() {

       this.platform.ready().then(() => {
      StatusBar.setOverlaysWebView({ overlay: false }).catch((error) => {
        console.log(
          "%c Status Bar works only on native android and ios devices",
          "color: silver; font-size: 10px;"
        );
      });
      StatusBar.setBackgroundColor({ color: "#ffffff" }).catch((error) => {
        console.log(
          "%c Status Bar works only on native android and ios devices",
          "color: silver; font-size: 10px;"
        );
      });
    });

    this.initializeFormArchitectures();
  }

  ngOnDestroy() {
    // Structural termination cleaning every single listener down the block on exit
    this.subscriptions.forEach(sub => sub && sub.unsubscribe());
  }

  /**
   * Constructs all form validation rule scopes internally matching schema boundaries
   */
  private initializeFormArchitectures() {
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });

    this.signupForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(2)]),
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      contact: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });

    this.forgotForm = new FormGroup({
      identifier: new FormControl('', [Validators.required])
    });

    this.resetForm = new FormGroup({
      token: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  /**
   * Changes the visible context module instantly while clearing dirty cache validations
   */
  switchMode(targetMode: AuthenticationViewMode) {
    this.authMode = targetMode;
  }

  showPassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  onClickRememberMe(event: any) {
    this.keepMeLoggedIn = event.detail.checked;
    localStorage.setItem('chms-dms.mobile.keep_me_logged_in', JSON.stringify(this.keepMeLoggedIn));
  }

  async displayAlertMessage(heading: string, detailedMessage: string) {
    const alert = await this.alertCtrl.create({
      header: heading,
      message: detailedMessage,
      buttons: ['Acknowledge']
    });
    await alert.present();
  }

  async showToast(data: { header: string, msg: string }) {
    const toast = await this.toastController.create({
      swipeGesture: 'vertical',
      icon: 'lock-open-outline',
      header: data.header,
      message: data.msg,
      duration: 3000,
    });
    toast.present();
  }

  // async onClickLogin() {
  //   if (this.loginForm.invalid) return;
  //   const { username, password } = this.loginForm.value;

  //   const loadingEL = await this.loadingController.create({
  //     spinner: 'crescent',
  //     message: 'Verifying Session Context...',
  //   });
  //   await loadingEL.present();

  //   const sub = this.authService.signIn(username, password)
  //     .pipe(finalize(() => loadingEL.dismiss()))
  //     .subscribe({
  //       next: (res) => {
  //         this.showToast({
  //           header: 'Access Granted',
  //           msg: `Welcome back to your workspace.`,
  //         });
  //         // this.navControl.navigateRoot('/home');
  //                   this.navControl.navigateRoot('/landing/tabs/home');

  //       },
  //       error: (err) => {
  //         this.displayAlertMessage('Authentication Barrier', err?.message || 'Access denied. Verify your credentials and try again.');
  //       }
  //     });

  //   this.subscriptions.push(sub);
  // }


  async onClickLogin() {
    if (this.loginForm.invalid) return;
    const { username, password } = this.loginForm.value;

    const loadingEL = await this.loadingController.create({
      spinner: 'crescent',
      message: 'Verifying Session Context...',
    });
    await loadingEL.present();

    const sub = this.authService.signIn(username, password)
      .pipe(finalize(() => loadingEL.dismiss()))
      .subscribe({
        next: async (res) => {
          this.showToast({
            header: 'Access Granted',
            msg: `Welcome back to your workspace.`,
          });

          // Check if the user has completed onboarding
          const { value } = await Preferences.get({ key: 'chms_onboarding_completed' });

          if (value === 'true') {
            // Returning user -> go directly to home tabs
            this.navControl.navigateRoot('/landing/tabs/home');
          } else {
            // First time after install -> go to onboarding
            this.navControl.navigateRoot('/onboarding');
          }
        },
        error: (err) => {
          this.displayAlertMessage(
            'Authentication Barrier', 
            err?.message || 'Access denied. Verify your credentials and try again.'
          );
        }
      });

    this.subscriptions.push(sub);
  }

  async onClickSignup() {
    if (this.signupForm.invalid) return;

    const loadingEL = await this.loadingController.create({
      spinner: 'crescent',
      message: 'Provisioning Account Profile...',
    });
    await loadingEL.present();

    // Invokes your backend createUser query signature pattern directly
    const sub = this.authService.createUser(this.signupForm.value)
      .pipe(finalize(() => loadingEL.dismiss()))
      .subscribe({
        next: (res) => {
          this.displayAlertMessage('Registration Success', 'Your account pipeline was built successfully. You can now authenticate.');
          this.signupForm.reset();
          this.switchMode('LOGIN');
        },
        error: (err) => {
          this.displayAlertMessage('Registration Interrupted', err?.message || 'Failed to submit initialization payload profiles.');
        }
      });

    this.subscriptions.push(sub);
  }

  async onClickForgot() {
    if (this.forgotForm.invalid) return;
    const { identifier } = this.forgotForm.value;

    const loadingEL = await this.loadingController.create({
      spinner: 'crescent',
      message: 'Routing Reset Token Request...',
    });
    await loadingEL.present();

    const sub = this.authService.forgotPassword(identifier)
      .pipe(finalize(() => loadingEL.dismiss()))
      .subscribe({
        next: (res) => {
          this.displayAlertMessage('Dispatched Secure Token', 'If an alignment exists inside the ledger array profiles, a token string was pushed out.');
          this.forgotForm.reset();
          this.switchMode('RESET'); // Automatically advance the form state machine to token intake
        },
        error: (err) => {
          this.displayAlertMessage('Transmission Blocked', err?.message || 'Failed to route recovery requirements.');
        }
      });

    this.subscriptions.push(sub);
  }

  async onClickReset() {
    if (this.resetForm.invalid) return;
    const { token, newPassword } = this.resetForm.value;

    const loadingEL = await this.loadingController.create({
      spinner: 'crescent',
      message: 'Applying Structural Passwords...',
    });
    await loadingEL.present();

    const sub = this.authService.resetPassword(token, newPassword)
      .pipe(finalize(() => loadingEL.dismiss()))
      .subscribe({
        next: (res) => {
          this.displayAlertMessage('Profile Mutated Cleanly', 'Your security keys have updated successfully. Please log back in using your new credentials.');
          this.resetForm.reset();
          this.switchMode('LOGIN');
        },
        error: (err) => {
          this.displayAlertMessage('Mutation Interrupted', err?.message || 'Token matching failed validation limits.');
        }
      });

    this.subscriptions.push(sub);
  }
}