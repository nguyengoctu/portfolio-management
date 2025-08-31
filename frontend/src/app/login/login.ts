import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service'; // Import AuthService
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService // Inject AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    if (this.loginForm.valid) {
      this.http.post<any>(`${environment.authUrl}/api/login`, this.loginForm.value)
        .subscribe(response => {
          console.log('Login successful. Backend response:', response);
          console.log('JWT from backend:', response.jwt);
          this.authService.login(response.jwt); // Store the JWT token
          console.log('Is logged in after setting token:', this.authService.isLoggedIn());
          this.router.navigate(['/dashboard']);
        }, error => {
          console.error('Login failed', error);
        });
    }
  }
}