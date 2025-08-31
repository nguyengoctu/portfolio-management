import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
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