import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PortfolioService, UserProfile, Project } from '../services/portfolio.service';

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
  
  // Dashboard-specific properties
  get skillsCount(): number {
    return this.userProfile?.skills?.length || 0;
  }
  
  get profileCompleteness(): number {
    if (!this.userProfile) return 0;
    
    let completedFields = 0;
    let totalFields = 7;
    
    if (this.userProfile.name) completedFields++;
    if (this.userProfile.bio) completedFields++;
    if (this.userProfile.profileImageUrl) completedFields++;
    if (this.userProfile.jobTitle) completedFields++;
    if (this.userProfile.email) completedFields++;
    if (this.userProfile.skills && this.userProfile.skills.length > 0) completedFields++;
    if (this.projects && this.projects.length > 0) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  }
  
  get recentProjects(): Project[] {
    return this.projects.slice(0, 3);
  }

  constructor(
    private portfolioService: PortfolioService,
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


  getProfileImageUrl(): string {
    return this.userProfile?.profileImageUrl || this.userProfile?.avatarUrl || '/assets/default-avatar.png';
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
  
  // Dashboard-specific methods
  trackByProjectId(index: number, project: Project): string {
    return project.id.toString();
  }
  
  navigateToProjectCreation() {
    this.router.navigate(['/projects-settings'], { queryParams: { action: 'create' } });
  }
  
  navigateToSkillsManagement() {
    this.router.navigate(['/profile-settings'], { fragment: 'skills' });
  }
}