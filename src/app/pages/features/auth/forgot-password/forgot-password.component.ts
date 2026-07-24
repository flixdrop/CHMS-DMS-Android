import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  public processing = false;
  
  // Single-form data properties
  public identifier = '';
  public newPassword = '';
  public confirmPassword = '';

  /**
   * Fires a single direct password override instruction to the backend
   */
  onDirectPasswordReset() {
    if (!this.identifier.trim() || !this.newPassword.trim()) {
      this.displayToast('Please complete all form requirements.', true);
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.displayToast('Password configurations do not match.', true);
      return;
    }

    this.processing = true;

    // We pass the raw identifier directly into the token slot to fulfill the schema signature
    this.authService.resetPassword(this.identifier, this.newPassword).subscribe({
      next: (res) => {
        this.processing = false;
        if (res?.data?.resetPassword?.success) {
          this.displayToast('Password updated! Redirecting to login...');
          
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        }
      },
      error: (err) => {
        this.processing = false;
        this.displayToast(err?.message || 'Failed to apply new credentials.', true);
      }
    });
  }

  private displayToast(msg: string, isError = false) {
    console.log(`[ALERT] ${isError ? 'CRITICAL:' : 'SUCCESS:'} ${msg}`);
  }
}