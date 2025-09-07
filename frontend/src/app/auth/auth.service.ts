import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.authUrl;

  constructor(private http: HttpClient) { }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('accessToken');
    console.log('AuthService - Token in localStorage:', token);
    
    if (!token) {
      return false;
    }
    
    // Just check if token exists for basic logged-in status
    // Token validation and refresh will be handled by the interceptor
    return true;
  }

  // Async version for components that can wait
  async isLoggedInAsync(): Promise<boolean> {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      return false;
    }
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.log('AuthService - Token is expired, attempting refresh');
      try {
        const response = await new Promise((resolve, reject) => {
          this.refreshToken().subscribe({
            next: resolve,
            error: reject
          });
        });
        console.log('Token refreshed successfully', response);
        this.login((response as any).accessToken, (response as any).refreshToken);
        return true;
      } catch (error) {
        console.log('Token refresh failed, logging out', error);
        this.logout().subscribe();
        return false;
      }
    }
    
    return true;
  }

  // Check if JWT token is expired
  isTokenExpired(token?: string): boolean {
    const authToken = token || this.getToken();
    if (!authToken) {
      return true;
    }

    try {
      const payload = authToken.split('.')[1];
      const decodedPayload = atob(payload);
      const tokenData = JSON.parse(decodedPayload);
      
      // JWT exp is in seconds, Date.now() is in milliseconds
      const currentTime = Math.floor(Date.now() / 1000);
      
      return !tokenData.exp || tokenData.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // Login method to store both tokens
  login(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // Logout method that blacklists refresh token
  logout(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Clear tokens from storage first
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // If we have a refresh token, blacklist it on server
    if (refreshToken) {
      return this.http.post(`${this.baseUrl}/logout`, { refreshToken });
    }
    
    // Return empty observable if no refresh token
    return new Observable(observer => {
      observer.next(null);
      observer.complete();
    });
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Refresh token method
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    return this.http.post(`${this.baseUrl}/refresh-token`, { refreshToken });
  }

  // Decode JWT token to get user information
  getCurrentUser(): any {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return null;
    }

    try {
      // Decode JWT token (simple base64 decode - in production use proper JWT library)
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const userInfo = JSON.parse(decodedPayload);
      
      return {
        id: userInfo.userId || userInfo.id,
        email: userInfo.sub,
        name: userInfo.name,
        emailVerified: userInfo.emailVerified || false
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Get current user ID
  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  // Check if current user's email is verified
  isEmailVerified(): boolean {
    const user = this.getCurrentUser();
    return user ? user.emailVerified : false;
  }
}
