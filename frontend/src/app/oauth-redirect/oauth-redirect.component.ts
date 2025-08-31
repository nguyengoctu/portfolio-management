import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <div *ngIf="loading" class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">Processing login...</p>
          </div>

          <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <h3 class="text-lg font-medium">Login Failed</h3>
            <p class="mt-2">{{ error }}</p>
            <button 
              (click)="redirectToLogin()"
              class="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OAuthRedirectComponent implements OnInit {
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const error = params['error'];

      if (token) {
        // Store token and redirect to dashboard
        this.authService.login(token);
        this.router.navigate(['/dashboard']);
      } else if (error) {
        this.loading = false;
        this.error = error;
      } else {
        this.loading = false;
        this.error = 'No token or error information received';
      }
    });
  }

  redirectToLogin() {
    this.router.navigate(['/auth/login']);
  }
}