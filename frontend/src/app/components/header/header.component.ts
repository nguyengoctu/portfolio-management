import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { PortfolioService, UserProfile } from '../../services/portfolio.service';
import { filter } from 'rxjs/operators';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  showUserMenu: boolean = false;
  isLoggedIn: boolean = false;
  shouldShowHeader: boolean = true;
  private authCheckSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private portfolioService: PortfolioService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
    this.checkRouteForHeaderVisibility();

    // Subscribe to route changes to hide header on auth pages
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkRouteForHeaderVisibility();
        this.checkAuthStatus(); // Recheck auth status on route changes
      });

    // Periodically check auth status to handle token changes
    this.authCheckSubscription = interval(1000).subscribe(() => {
      const currentAuthState = this.authService.isLoggedIn();
      if (currentAuthState !== this.isLoggedIn) {
        this.checkAuthStatus();
      }
    });
  }

  ngOnDestroy() {
    if (this.authCheckSubscription) {
      this.authCheckSubscription.unsubscribe();
    }
  }

  checkAuthStatus() {
    const wasLoggedIn = this.isLoggedIn;
    this.isLoggedIn = this.authService.isLoggedIn();
    
    console.log('Header - Auth status check:', { 
      wasLoggedIn, 
      isLoggedIn: this.isLoggedIn, 
      token: localStorage.getItem('token') 
    });

    if (this.isLoggedIn && !this.userProfile) {
      this.loadUserProfile();
    } else if (!this.isLoggedIn && this.userProfile) {
      this.userProfile = null;
    }
  }

  loadUserProfile() {
    this.portfolioService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
      }
    });
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  navigateToProfileSettings() {
    this.router.navigate(['/profile-settings']);
    this.showUserMenu = false;
  }

  navigateToProjectSettings() {
    this.router.navigate(['/projects-settings']);
    this.showUserMenu = false;
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
    this.showUserMenu = false;
  }

  viewMyPortfolio() {
    if (this.userProfile) {
      this.router.navigate(['/portfolio', this.userProfile.id]);
    }
    this.showUserMenu = false;
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
    this.showUserMenu = false;
    this.isLoggedIn = false;
    this.userProfile = null;
  }

  checkRouteForHeaderVisibility() {
    const currentUrl = this.router.url;
    // Hide header on auth pages
    const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
    this.shouldShowHeader = !authRoutes.some(route => currentUrl.startsWith(route));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.user-menu-dropdown');
    const button = target.closest('.user-menu-button');
    
    // Close dropdown if clicking outside both the button and dropdown
    if (!dropdown && !button && this.showUserMenu) {
      this.showUserMenu = false;
    }
  }

  getProfileImageUrl(): string {
    return this.userProfile?.profileImageUrl || '/assets/default-avatar.png';
  }
}