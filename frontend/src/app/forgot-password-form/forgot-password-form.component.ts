import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-forgot-password-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './forgot-password-form.component.html',
  styleUrl: './forgot-password-form.component.css'
})
export class ForgotPasswordFormComponent {
  forgotPasswordForm: FormGroup;
  message: string = '';
  isError: boolean = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.http.post(`${environment.backendUrl}/api/auth/forgot-password`, this.forgotPasswordForm.value)
        .subscribe(
          (response: any) => {
            this.message = response.message || 'Password reset link sent to your email if it exists in our system.';
            this.isError = false;
          },
          (error) => {
            this.message = error.error?.message || 'An error occurred. Please try again.';
            this.isError = true;
            console.error('Forgot password failed', error);
          }
        );
    } else {
      this.message = 'Please enter a valid email address.';
      this.isError = true;
    }
  }
}