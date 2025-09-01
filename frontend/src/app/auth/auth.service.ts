import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    console.log('AuthService - Token in localStorage:', token);
    return !!token;
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
