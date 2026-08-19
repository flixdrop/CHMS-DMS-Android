

import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { AlertController, LoadingController, NavController, ToastController, IonToolbar, IonContent, IonItem, IonIcon, IonInput, IonCheckbox, IonButton, IonLabel, IonFooter, IonChip, IonFab, IonFabButton, IonThumbnail, IonImg } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from 'src/app/services/auth/auth.service';
import { SharedImportsModule } from 'src/app/shared/shared-imports';

export type AuthenticationViewMode = 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'RESET';
const KEEP_LOGGED_IN_KEY = 'chms-dms.mobile.keep_me_logged_in';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonImg, IonFabButton, IonFab,
    CommonModule,
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
    IonChip, IonThumbnail, SharedImportsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly authService = inject(AuthService);
  private readonly navControl = inject(NavController);
  private readonly alertCtrl = inject(AlertController);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly toastCtrl = inject(ToastController);

  private readonly subscriptions: Subscription[] = [];

  // Reactive Signals for UI state
  readonly authMode = signal<AuthenticationViewMode>('LOGIN');
  readonly passwordVisible = signal<boolean>(false);
  readonly keepMeLoggedIn = signal<boolean>(false);

  // Strongly-typed Form Architectures
  readonly loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  readonly signupForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    contact: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly forgotForm = this.fb.group({
    identifier: ['', [Validators.required]],
  });

  readonly resetForm = this.fb.group({
    token: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  async ngOnInit(): Promise<void> {
    await this.loadPreferences();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub?.unsubscribe());
  }

private async loadPreferences(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: KEEP_LOGGED_IN_KEY });
      
      // Safely convert the string "true" or "false" to a real boolean
      if (value !== null) {
        this.keepMeLoggedIn.set(value === 'true');
      } else {
        // First time user: Default to false
        this.keepMeLoggedIn.set(false);
      }
    } catch (e) {
      console.warn('[LOGIN] Failed to restore keep-logged-in preference:', e);
      // Failsafe if storage crashes
      this.keepMeLoggedIn.set(false); 
    }
  }

  /**
   * Switches the visible auth flow context and resets dirty states
   */
  switchMode(targetMode: AuthenticationViewMode): void {
    this.authMode.set(targetMode);
    
    // Clear validation states on mode switches
    this.loginForm.reset();
    this.signupForm.reset();
    this.forgotForm.reset();
    this.resetForm.reset();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }

  async onClickRememberMe(event: CustomEvent): Promise<void> {
    const checked = event.detail.checked;
    this.keepMeLoggedIn.set(checked);
    await Preferences.set({
      key: KEEP_LOGGED_IN_KEY,
      value: JSON.stringify(checked),
    });
  }

  async displayAlertMessage(heading: string, detailedMessage: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: heading,
      message: detailedMessage,
      buttons: ['Acknowledge']
    });
    await alert.present();
  }

  async showToast(data: { header: string; msg: string }): Promise<void> {
    const toast = await this.toastCtrl.create({
      swipeGesture: 'vertical',
      icon: 'lock-open-outline',
      header: data.header,
      message: data.msg,
      duration: 3000,
    });
    await toast.present();
  }

  showPassword() {
  this.passwordVisible.update(visible => !visible);
}

 async onClickLogin() {
    if (this.loginForm.invalid) return;
    const { username, password } = this.loginForm.value;

    const loadingEL = await this.loadingCtrl.create({
      spinner: 'crescent',
      message: 'Verifying Session Context...',
    });
    await loadingEL.present();

    try {

      const shouldKeep = this.keepMeLoggedIn(); // <-- Adjust based on your TS file
      
      await Preferences.set({
        key: 'chms-dms.mobile.keep_me_logged_in',
        value: shouldKeep ? 'true' : 'false'
      });

      // 1. Strictly await backend sign-in and storage persistence
      await this.authService.signIn(username, password);

      this.showToast({
        header: 'Access Granted',
        msg: `Welcome back to your workspace.`,
      });

      // 2. Check if the user has completed onboarding safely from storage
      const { value } = await Preferences.get({ key: 'chms_onboarding_completed' });

      if (value === 'true') {
        // Returning user -> go directly to home tabs
        await this.navControl.navigateRoot('/landing/tabs/home');
      } else {
        // First time after install -> go to onboarding
        await this.navControl.navigateRoot('/onboarding');
      }
    } catch (err: any) {
      this.displayAlertMessage(
        'Authentication Barrier', 
        err?.message || 'Access denied. Verify your credentials and try again.'
      );
    } finally {
      await loadingEL.dismiss();
    }
  }


  async onClickSignup(): Promise<void> {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      spinner: 'crescent',
      message: 'Provisioning account profile...',
    });
    await loading.present();

    const sub = this.authService.createUser(this.signupForm.getRawValue())
      .pipe(finalize(() => loading.dismiss()))
      .subscribe({
        next: () => {
          this.displayAlertMessage('Registration Successful', 'Your account has been created. You may now log in.');
          this.switchMode('LOGIN');
        },
        error: (err) => {
          this.displayAlertMessage('Registration Interrupted', err?.message || 'Failed to complete registration.');
        }
      });

    this.subscriptions.push(sub);
  }

  async onClickForgot(): Promise<void> {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const { identifier } = this.forgotForm.getRawValue();
    const loading = await this.loadingCtrl.create({
      spinner: 'crescent',
      message: 'Sending password reset request...',
    });
    await loading.present();

    const sub = this.authService.forgotPassword(identifier)
      .pipe(finalize(() => loading.dismiss()))
      .subscribe({
        next: () => {
          this.displayAlertMessage(
            'Token Dispatched',
            'If an account exists for that identifier, a reset token has been generated.'
          );
          this.switchMode('RESET');
        },
        error: (err) => {
          this.displayAlertMessage('Request Failed', err?.message || 'Could not process password recovery.');
        }
      });

    this.subscriptions.push(sub);
  }

  async onClickReset(): Promise<void> {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { token, newPassword } = this.resetForm.getRawValue();
    const loading = await this.loadingCtrl.create({
      spinner: 'crescent',
      message: 'Updating security credentials...',
    });
    await loading.present();

    const sub = this.authService.resetPassword(token, newPassword)
      .pipe(finalize(() => loading.dismiss()))
      .subscribe({
        next: () => {
          this.displayAlertMessage('Password Updated', 'Your credentials have been updated successfully. Please log in.');
          this.switchMode('LOGIN');
        },
        error: (err) => {
          this.displayAlertMessage('Update Interrupted', err?.message || 'Token validation failed.');
        }
      });

    this.subscriptions.push(sub);
  }
}