import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-email-verification-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="!isEmailVerified && showBanner" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-yellow-800">
            Email Not Verified
          </h3>
          <div class="mt-2 text-sm text-yellow-700">
            <p>
              Your account email has not been verified. Please check your inbox and click the verification link.
            </p>
          </div>
          <div class="mt-4">
            <div class="-mx-2 -my-1.5 flex">
              <button 
                (click)="resendVerificationEmail()"
                [disabled]="resendLoading"
                class="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600 disabled:opacity-50">
                <span *ngIf="!resendLoading">Resend Email</span>
                <span *ngIf="resendLoading">Sending...</span>
              </button>
              <button 
                (click)="dismissBanner()"
                class="ml-3 bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600">
                Close
              </button>
            </div>
          </div>
          
          <!-- Success message -->
          <div *ngIf="resendSuccess" class="mt-3 text-sm text-green-700">
            ✓ Verification email sent successfully!
          </div>
          
          <!-- Error message -->
          <div *ngIf="resendError" class="mt-3 text-sm text-red-700">
            {{ resendError }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class EmailVerificationBannerComponent implements OnInit {
  isEmailVerified = true;
  showBanner = true;
  resendLoading = false;
  resendSuccess = false;
  resendError = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    // Check if user's email is verified from JWT token
    this.checkEmailVerificationStatus();
  }

  checkEmailVerificationStatus() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.isEmailVerified = user.emailVerified || false;
    }
  }

  resendVerificationEmail() {
    const user = this.authService.getCurrentUser();
    if (!user || !user.email) {
      this.resendError = 'Unable to determine user email';
      return;
    }

    this.resendLoading = true;
    this.resendSuccess = false;
    this.resendError = '';

    this.apiService.resendVerificationEmail(user.email).subscribe({
      next: (response) => {
        this.resendLoading = false;
        this.resendSuccess = true;
        setTimeout(() => {
          this.resendSuccess = false;
        }, 5000);
      },
      error: (error) => {
        this.resendLoading = false;
        this.resendError = error.error?.message || 'An error occurred while sending email';
        setTimeout(() => {
          this.resendError = '';
        }, 5000);
      }
    });
  }

  dismissBanner() {
    this.showBanner = false;
    // Store in localStorage so it doesn't show again in this session
    localStorage.setItem('emailVerificationBannerDismissed', 'true');
  }
}