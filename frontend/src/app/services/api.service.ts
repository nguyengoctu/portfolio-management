import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return new HttpHeaders(headers);
  }

  // Auth service endpoints
  login(credentials: any): Observable<any> {
    return this.http.post('/api/auth/login', credentials, { 
      headers: this.getHeaders() 
    });
  }

  register(userData: any): Observable<any> {
    return this.http.post('/api/auth/register', userData, { 
      headers: this.getHeaders() 
    });
  }

  getAuthHealth(): Observable<any> {
    return this.http.get('/api/auth/actuator/health');
  }

  // User service endpoints  
  getProfile(): Observable<any> {
    return this.http.get('/api/user/profile', { 
      headers: this.getHeaders() 
    });
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put('/api/user/profile', profileData, { 
      headers: this.getHeaders() 
    });
  }

  getAllUsers(): Observable<any> {
    return this.http.get('/api/user/users', { 
      headers: this.getHeaders() 
    });
  }

  getUserHealth(): Observable<any> {
    return this.http.get('/api/user/actuator/health');
  }

  // Email service endpoints
  sendEmail(emailData: any): Observable<any> {
    return this.http.post('/api/email/send', emailData, { 
      headers: this.getHeaders() 
    });
  }

  getEmailHealth(): Observable<any> {
    return this.http.get('/api/email/health');
  }

  // Email verification endpoints
  verifyEmail(token: string): Observable<any> {
    return this.http.get(`/api/auth/verify-email?token=${token}`);
  }

  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`/api/auth/resend-verification?email=${email}`, {}, { 
      headers: this.getHeaders() 
    });
  }

  // Skills API endpoints
  getAllSkills(): Observable<any> {
    return this.http.get(`${environment.userUrl}/api/skills`, { headers: this.getHeaders() });
  }

  getSkillCategories(): Observable<any> {
    return this.http.get(`${environment.userUrl}/api/skills/categories`, { headers: this.getHeaders() });
  }

  getUserSkills(userId: number): Observable<any> {
    return this.http.get(`${environment.userUrl}/api/skills/users/${userId}`, { headers: this.getHeaders() });
  }

  addSkillToUser(userId: number, skillData: any): Observable<any> {
    const url = `${environment.userUrl}/api/skills/users/${userId}`;
    const headers = this.getHeaders();
    
    console.log('=== API Service Debug ===');
    console.log('URL:', url);
    console.log('User ID:', userId);
    console.log('Skill Data:', skillData);
    console.log('Headers:', headers);
    console.log('Authorization header:', headers.get('Authorization'));
    console.log('=== End API Debug ===');
    
    return this.http.post(url, skillData, { headers });
  }

  updateUserSkill(userId: number, skillId: number, proficiencyLevel: string): Observable<any> {
    return this.http.put(`${environment.userUrl}/api/skills/users/${userId}/skills/${skillId}`, 
      { proficiencyLevel }, { headers: this.getHeaders() });
  }

  removeSkillFromUser(userId: number, skillId: number): Observable<any> {
    return this.http.delete(`${environment.userUrl}/api/skills/users/${userId}/skills/${skillId}`, { headers: this.getHeaders() });
  }

  // Contact message endpoints
  sendContactMessage(contactData: any): Observable<any> {
    return this.http.post('/api/portfolio/contact', contactData, { 
      headers: this.getHeaders() 
    });
  }

  // Generic API method for custom endpoints
  get(endpoint: string): Observable<any> {
    return this.http.get(endpoint, { headers: this.getHeaders() });
  }

  post(endpoint: string, data: any): Observable<any> {
    return this.http.post(endpoint, data, { headers: this.getHeaders() });
  }

  put(endpoint: string, data: any): Observable<any> {
    return this.http.put(endpoint, data, { headers: this.getHeaders() });
  }

  delete(endpoint: string): Observable<any> {
    return this.http.delete(endpoint, { headers: this.getHeaders() });
  }
}