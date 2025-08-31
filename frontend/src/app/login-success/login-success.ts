import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { EmailVerificationBannerComponent } from '../email-verification-banner/email-verification-banner.component';

@Component({
  selector: 'app-login-success',
  imports: [EmailVerificationBannerComponent],
  templateUrl: './login-success.html',
  styleUrl: './login-success.css'
})
export class LoginSuccessComponent {

  constructor(private authService: AuthService, private router: Router) { }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
