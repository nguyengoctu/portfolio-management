import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css' // Assuming a CSS file will be created
})
export class ForgotPasswordComponent {
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
      this.http.post('http://localhost:8082/api/auth/forgot-password', this.forgotPasswordForm.value)
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
