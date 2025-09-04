import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortfolioService } from '../services/portfolio.service';
import { AuthService } from '../auth/auth.service';

export interface PopularPortfolio {
  id: number;
  name: string;
  email: string;
  jobTitle?: string;
  bio?: string;
  profileImageUrl?: string;
  portfolioViews: number;
  isPortfolioPublic?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  popularPortfolios: PopularPortfolio[] = [];
  loading: boolean = true;
  error: string = '';
  isLoggedIn: boolean = false;

  constructor(private portfolioService: PortfolioService, private authService: AuthService) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.loadPopularPortfolios();
  }

  loadPopularPortfolios() {
    this.loading = true;
    this.portfolioService.getPopularPortfolios(12).subscribe({
      next: (portfolios) => {
        this.popularPortfolios = portfolios;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load popular portfolios:', error);
        this.error = 'Failed to load portfolios';
        this.loading = false;
      }
    });
  }

  getProfileImageUrl(portfolio: PopularPortfolio): string {
    return portfolio.profileImageUrl || '/assets/default-avatar.png';
  }
}