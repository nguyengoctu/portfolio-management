import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserSkill } from '../models/skill.model';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  jobTitle?: string;
  bio?: string;
  profileImageUrl?: string;
  skills?: UserSkill[];
  showSkillLevel?: boolean;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  demoUrl?: string;
  repositoryUrl?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Portfolio {
  profile: UserProfile;
  projects: Project[];
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  private apiUrl = `${environment.userUrl}/api/portfolio`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Profile methods
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`, {
      headers: this.getAuthHeaders()
    });
  }

  updateProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profile, {
      headers: this.getAuthHeaders()
    });
  }

  uploadProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/profile/image`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  // Project methods
  getUserProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`, {
      headers: this.getAuthHeaders()
    });
  }

  createProject(project: Partial<Project>, imageFile?: File): Observable<Project> {
    const formData = new FormData();
    formData.append('name', project.name || '');
    if (project.description) formData.append('description', project.description);
    if (project.demoUrl) formData.append('demoUrl', project.demoUrl);
    if (project.repositoryUrl) formData.append('repositoryUrl', project.repositoryUrl);
    if (imageFile) formData.append('image', imageFile);

    return this.http.post<Project>(`${this.apiUrl}/projects`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  updateProject(projectId: number, project: Partial<Project>, imageFile?: File): Observable<Project> {
    const formData = new FormData();
    formData.append('name', project.name || '');
    if (project.description) formData.append('description', project.description);
    if (project.demoUrl) formData.append('demoUrl', project.demoUrl);
    if (project.repositoryUrl) formData.append('repositoryUrl', project.repositoryUrl);
    if (imageFile) formData.append('image', imageFile);

    return this.http.put<Project>(`${this.apiUrl}/projects/${projectId}`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  deleteProject(projectId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/projects/${projectId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Public portfolio
  getPublicPortfolio(userId: number): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.apiUrl}/public/${userId}`);
  }
}