import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    console.log('AuthService - Token in localStorage:', token);
    
    if (!token) {
      return false;
    }
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.log('AuthService - Token is expired, logging out');
      this.logout();
      return false;
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

  // You might also add login/logout methods here
  login(token: string) {
    localStorage.setItem('token', token);
  }

  logout() {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Decode JWT token to get user information
  getCurrentUser(): any {
    const token = localStorage.getItem('token');
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
