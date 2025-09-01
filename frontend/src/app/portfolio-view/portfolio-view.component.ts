import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PortfolioService, UserProfile, Project } from '../services/portfolio.service';

@Component({
  selector: 'app-portfolio-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-view.component.html',
  styleUrl: './portfolio-view.component.css'
})
export class PortfolioViewComponent implements OnInit {
  userProfile: UserProfile | null = null;
  projects: Project[] = [];
  loading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portfolioService: PortfolioService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const userId = params.get('userId');
      if (userId) {
        this.loadPortfolio(+userId);
      } else {
        this.error = 'Invalid user ID';
        this.loading = false;
      }
    });
  }

  loadPortfolio(userId: number) {
    this.loading = true;
    this.error = '';
    
    this.portfolioService.getPublicPortfolio(userId).subscribe({
      next: (portfolio) => {
        this.userProfile = portfolio.profile;
        this.projects = portfolio.projects;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load portfolio:', error);
        this.error = 'Failed to load portfolio';
        this.loading = false;
      }
    });
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

  sendEmail() {
    if (this.userProfile?.email) {
      window.location.href = `mailto:${this.userProfile.email}`;
    }
  }
}