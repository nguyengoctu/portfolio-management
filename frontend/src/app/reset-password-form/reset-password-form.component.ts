import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-reset-password-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './reset-password-form.component.html',
  styleUrl: './reset-password-form.component.css'
})
export class ResetPasswordFormComponent implements OnInit {
  resetPasswordForm: FormGroup;
  message: string = '';
  isError: boolean = false;
  isLoading: boolean = false;
  token: string = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    if (!this.token) {
      this.message = 'Invalid reset link';
      this.isError = true;
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.resetPasswordForm.valid && this.token) {
      this.isLoading = true;
      const formData = {
        newPassword: this.resetPasswordForm.value.newPassword
      };

      this.http.post(`${environment.authUrl}/api/auth/reset-password?token=${this.token}`, formData)
        .subscribe({
          next: (response: any) => {
            this.message = 'Password reset successfully! You can now login with your new password.';
            this.isError = false;
            this.isLoading = false;
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 3000);
          },
          error: (error) => {
            this.message = error.error?.message || 'Failed to reset password. Please try again.';
            this.isError = true;
            this.isLoading = false;
          }
        });
    } else {
      this.message = 'Please fill in all required fields correctly.';
      this.isError = true;
    }
  }
}