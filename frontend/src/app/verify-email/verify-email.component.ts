import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div *ngIf="loading" class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">Verifying email...</p>
          </div>

          <div *ngIf="!loading && success" class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="mt-2 text-lg font-medium text-gray-900">Verification Successful!</h3>
            <p class="mt-1 text-sm text-gray-500">Your email has been successfully verified.</p>
            <div class="mt-6">
              <button 
                (click)="goToLogin()"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Login Now
              </button>
            </div>
          </div>

          <div *ngIf="!loading && !success" class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 class="mt-2 text-lg font-medium text-gray-900">Verification Failed</h3>
            <p class="mt-1 text-sm text-gray-500">{{ errorMessage }}</p>
            <div class="mt-6 space-y-3">
              <button 
                (click)="resendEmail()"
                [disabled]="resendLoading"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
                <span *ngIf="!resendLoading">Resend Verification Email</span>
                <span *ngIf="resendLoading" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              </button>
              <button 
                (click)="goToLogin()"
                class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  success = false;
  errorMessage = '';
  resendLoading = false;
  token: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.verifyEmail();
      } else {
        this.loading = false;
        this.errorMessage = 'Invalid verification token';
      }
    });
  }

  verifyEmail() {
    if (!this.token) return;

    this.apiService.verifyEmail(this.token).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
      },
      error: (error) => {
        this.loading = false;
        this.success = false;
        this.errorMessage = error.error?.message || 'An error occurred while verifying email';
      }
    });
  }

  resendEmail() {
    // In a real app, you'd need to store the user's email somehow
    // For now, we'll just redirect to login where they can request resend
    this.router.navigate(['/login'], { 
      queryParams: { message: 'Please login to resend verification email' } 
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}