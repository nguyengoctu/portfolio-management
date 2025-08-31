import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css'
})
export class LoginFormComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  login() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.http.post<any>(`${environment.authUrl}/api/login`, this.loginForm.value)
        .subscribe({
          next: (response) => {
            console.log('Login successful. Backend response:', response);
            console.log('JWT from backend:', response.jwt);
            this.authService.login(response.jwt);
            console.log('Is logged in after setting token:', this.authService.isLoggedIn());
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Login failed', error);
            
            // Handle different error cases
            if (error.status === 401) {
              this.errorMessage = 'Invalid username or password. Please try again.';
            } else if (error.status === 0) {
              this.errorMessage = 'Unable to connect to server. Please try again later.';
            } else {
              this.errorMessage = error.error?.message || 'An error occurred. Please try again.';
            }
          }
        });
    } else {
      this.errorMessage = 'Please fill in all required fields.';
    }
  }
}