import { Component, OnDestroy, OnInit } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { AuthService } from 'src/app/features/auth/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonContent, IonItem, IonIcon, IonSelect, IonSelectOption, IonGrid, IonRow, IonCol, IonAvatar, IonList, IonInput, IonCheckbox, IonButton, IonLabel, IonFooter,  AlertButton,
  AlertController,
  AlertInput,
  LoadingController,
  NavController,
  ToastController, } from "@ionic/angular/standalone";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonItem,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonGrid,
    IonRow,
    IonCol,
    IonAvatar,
    IonList,
    IonInput,
    IonCheckbox,
    IonButton,
    IonLabel,
    IonFooter
],
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  authSub: Subscription;
  userDataSub: Subscription;

  loginForm: FormGroup;

  passwordVisible: boolean = false;
  rememberUser: boolean = false;
  language: string = 'en';

  public forgotPasswordAlertInputs: AlertInput[] = [
    {
      name: 'identifier',
      type: 'text',
      label: 'Username / Email',
      placeholder: 'Enter your Username or Email Address.',
    },
  ];

  public forgotPassworddAlertButtons: AlertButton[] = [
    {
      text: 'Verify Account',
      role: 'confirm',
      handler: async (data: { identifier?: string }) => {
        const identifier = data.identifier?.trim();
        if (!identifier) return false;

        try {
          const res = await this.authService.onForgotPassword(identifier);
          console.log('forgot password response:', res);

          // this.showToast({ header: "Check your email", msg: res });

          return true;
        } catch (err: any) {
          console.error(err);
          this.showToast({
            header: 'Error',
            msg: err.message || 'Something went wrong',
          });

          return false;
        }
      },
    },
  ];

  constructor(
    private authService: AuthService,
    private navControl: NavController,
    private toastController: ToastController,
    public loadingController: LoadingController,
    private alertCtrl: AlertController,
    private translateService: TranslateService,
    private router: Router,
  ) {
    this.translateService.setDefaultLang('en');
    this.translateService.use(localStorage.getItem('language') || 'en');
    this.language = localStorage.getItem('language') || 'en';
  }

  ngOnDestroy() {
    if (this.userDataSub) {
      this.userDataSub.unsubscribe();
    }
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  ionViewWillEnter() {
    this.initializeApp();
  }

  ngOnInit() {
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', Validators.required),
    });
  }

  initializeApp() {
    if (Capacitor.getPlatform() !== 'web') {
      StatusBar.hide();
      StatusBar.setOverlaysWebView({ overlay: false });
      StatusBar.setBackgroundColor({ color: '#FFFFFF' }).catch((error) =>
        console.log('Set Status Bar in Login Page'),
      );
      StatusBar.setStyle({ style: Style.Light }).catch((error) =>
        console.log('Set Status Bar in Login Page'),
      );
    }
  }

  async showToast(data: any) {
    const toast = await this.toastController.create({
      swipeGesture: 'vertical',
      icon: 'lock-open-outline',
      header: data.header,
      message: data.msg,
      duration: 3000,
    });
    toast.present();
  }

  showPassword() {
    let x = <HTMLInputElement>document.getElementById('password');
    if (x.type === 'password') {
      x.type = 'text';
      this.passwordVisible = true;
    } else {
      x.type = 'password';
      this.passwordVisible = false;
    }
  }

  onClickRememberMe(event) {
    this.rememberUser = !this.rememberUser;
    const isSignedIn = event.detail.checked;
    localStorage.setItem('isSignedIn', JSON.stringify(isSignedIn));
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

  // Inside your component
  async onClickSubmit() {
    const username = this.loginForm.value.username;
    const password = this.loginForm.value.password;

    if (this.loginForm.invalid) {
      console.log('Form is invalid');
      return;
    }

    const loadingEL = await this.loadingController.create({
      animated: true,
      translucent: true,
      spinner: 'crescent',
      message: 'Signing In',
    });

    await loadingEL.present();
    this.authSub = this.authService
      .signIn(username, password)
      .pipe(finalize(() => loadingEL.dismiss()))
      .subscribe(
        (user) => {
          if (!user) {
            this.showToast({
              header: 'Sign-In Failed',
              msg: 'Unexpected response',
            });
            return;
          }

          console.log('User :', user);

          this.showToast({
            header: 'Signed In',
            msg: `Welcome ${user.data['signIn']['username']}`,
          });

          this.navControl.navigateForward('/landing');


          this.loginForm.reset();
          this.passwordVisible = false;
          this.rememberUser = false;
        },
        (error) => {
          console.error('Error at Sign-In:', error);
          const errorMessage =
            error?.message || 'Make sure your credentials are correct.';
          this.alertCtrl
            .create({
              header: 'Authentication Failed',
              subHeader: 'Sign-In Error',
              message: errorMessage,
              buttons: ['OK'],
            })
            .then((alertEl) => alertEl.present());
        },
      );
  }

  async presentForgotPasswordAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Forgot Password',
      inputs: this.forgotPasswordAlertInputs,
      buttons: [
        {
          text: 'Verify Account',
          role: 'confirm',
          handler: async (data: { identifier?: string }) => {
            const identifier = data.identifier?.trim();
            if (!identifier) return false;

            try {
              const res = await this.authService.onForgotPassword(identifier);
              console.log('forgot password response:', res);

              // 👇 wait for alert to close, then open the next one
              setTimeout(() => {
                this.presentResetPasswordAlert(res);
              }, 300);

              return true; // allows alert to dismiss
            } catch (err: any) {
              this.showToast({
                header: 'Error',
                msg: err.message || 'Something went wrong',
              });
              return false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async presentResetPasswordAlert(token: string) {
    const alert = await this.alertCtrl.create({
      header: 'Reset Password',
      subHeader: 'We have verified you as our user.',
      inputs: [
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Enter your new password',
        },
      ],
      buttons: [
        {
          text: 'Reset Password',
          role: 'confirm',
          handler: async (data: { newPassword?: string }) => {
            const newPassword = data.newPassword?.trim();
            if (!newPassword) return false;

            try {
              await this.authService.onResetPassword(token, newPassword);
              return true;
            } catch (err: any) {
              this.showToast({
                header: 'Error',
                msg: err.message || 'Something went wrong',
              });
              return false;
            }
          },
        },
      ],
    });

    await alert.present();
  }
}
