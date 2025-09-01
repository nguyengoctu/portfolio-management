import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PortfolioService, UserProfile, Project } from '../services/portfolio.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-portfolio-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './portfolio-dashboard.component.html',
  styleUrl: './portfolio-dashboard.component.css'
})
export class PortfolioDashboardComponent implements OnInit {
  userProfile: UserProfile | null = null;
  projects: Project[] = [];
  loading: boolean = true;
  showUserMenu: boolean = false;

  constructor(
    private portfolioService: PortfolioService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.loading = true;
    
    // Load profile and projects in parallel
    Promise.all([
      this.portfolioService.getUserProfile().toPromise(),
      this.portfolioService.getUserProjects().toPromise()
    ])
    .then(([profile, projects]) => {
      this.userProfile = profile || null;
      this.projects = projects || [];
      this.loading = false;
    })
    .catch(error => {
      console.error('Failed to load user data:', error);
      this.loading = false;
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

  viewMyPortfolio() {
    if (this.userProfile) {
      this.router.navigate(['/portfolio', this.userProfile.id]);
    }
    this.showUserMenu = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
    this.showUserMenu = false;
  }

  getProfileImageUrl(): string {
    return this.userProfile?.profileImageUrl || '/assets/default-avatar.png';
  }

  getProjectImageUrl(project: Project): string {
    return project.imageUrl || '/assets/default-project.png';
  }

  openDemoUrl(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  openRepositoryUrl(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}