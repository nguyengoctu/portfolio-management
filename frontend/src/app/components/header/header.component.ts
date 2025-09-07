import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { PortfolioService, UserProfile } from '../../services/portfolio.service';
import { OnlineUsersComponent } from '../online-users/online-users.component';
import { ChatWindowComponent } from '../chat-window/chat-window.component';
import { GameWindowComponent } from '../game-window/game-window.component';
import { GameInvitationComponent } from '../game-invitation/game-invitation.component';
import { WebSocketService, OnlineUser } from '../../services/websocket.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, OnlineUsersComponent, ChatWindowComponent, GameWindowComponent, GameInvitationComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  showUserMenu: boolean = false;
  isLoggedIn: boolean = false;
  shouldShowHeader: boolean = true;
  
  // Chat functionality
  openChatWindows: { user: OnlineUser, isMinimized: boolean }[] = [];
  
  private routeSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private portfolioService: PortfolioService,
    private router: Router,
    private websocketService: WebSocketService
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
    this.checkRouteForHeaderVisibility();

    // Subscribe to route changes to hide header on auth pages
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkRouteForHeaderVisibility();
        this.checkAuthStatus(); // Recheck auth status on route changes
      });
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  checkAuthStatus() {
    const wasLoggedIn = this.isLoggedIn;
    this.isLoggedIn = this.authService.isLoggedIn();
    
    console.log('Header - Auth status check:', { 
      wasLoggedIn, 
      isLoggedIn: this.isLoggedIn, 
      token: localStorage.getItem('accessToken') 
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
        // If JWT expired, the interceptor will handle logout and reload
        // But also check here to be safe
        if (error.error?.message?.includes('JWT expired')) {
          this.authService.logout().subscribe();
          this.isLoggedIn = false;
          this.userProfile = null;
          // The page will reload from interceptor, showing sign in/up buttons
        }
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
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
        this.showUserMenu = false;
        this.isLoggedIn = false;
        this.userProfile = null;
      },
      error: () => {
        // Even if logout fails on server, clear local state
        this.router.navigate(['/auth/login']);
        this.showUserMenu = false;
        this.isLoggedIn = false;
        this.userProfile = null;
      }
    });
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

  // Chat methods
  onStartChat(user: OnlineUser): void {
    // Check if chat window already exists
    const existingWindow = this.openChatWindows.find(w => w.user.id === user.id);
    if (existingWindow) {
      // If minimized, restore it
      existingWindow.isMinimized = false;
      return;
    }

    // Add new chat window (max 3 windows)
    if (this.openChatWindows.length >= 3) {
      this.openChatWindows.shift(); // Remove oldest window
    }
    
    this.openChatWindows.push({
      user: user,
      isMinimized: false
    });
  }

  onCloseChat(userId: number): void {
    this.openChatWindows = this.openChatWindows.filter(w => w.user.id !== userId);
  }

  onMinimizeChat(userId: number): void {
    const window = this.openChatWindows.find(w => w.user.id === userId);
    if (window) {
      window.isMinimized = !window.isMinimized;
    }
  }

  getChatWindowPosition(index: number): string {
    const baseRight = 20; // Base right position
    const windowWidth = 370; // Chat window width + margin
    return `${baseRight + (index * windowWidth)}px`;
  }
}