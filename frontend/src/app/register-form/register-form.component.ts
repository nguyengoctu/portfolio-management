import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.css'
})
export class RegisterFormComponent {
  registerForm: FormGroup;
  message: string = '';
  isError: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.http.post(`${environment.authUrl}/api/auth/register`, this.registerForm.value)
        .subscribe(
          (response: any) => {
            this.message = 'Registration successful! You can now login.';
            this.isError = false;
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          },
          (error) => {
            this.message = error.error?.message || 'Registration failed. Please try again.';
            this.isError = true;
            console.error('Registration failed', error);
          }
        );
    } else {
      this.message = 'Please fill in all required fields correctly.';
      this.isError = true;
    }
  }
}