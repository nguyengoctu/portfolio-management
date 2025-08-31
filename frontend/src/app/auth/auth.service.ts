import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('authToken');
    console.log('AuthService - Token in localStorage:', token);
    return !!token;
  }

  // You might also add login/logout methods here
  login(token: string) {
    localStorage.setItem('authToken', token);
  }

  logout() {
    localStorage.removeItem('authToken');
  }

  // Decode JWT token to get user information
  getCurrentUser(): any {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }

    try {
      // Decode JWT token (simple base64 decode - in production use proper JWT library)
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const userInfo = JSON.parse(decodedPayload);
      
      return {
        email: userInfo.sub,
        name: userInfo.name,
        emailVerified: userInfo.emailVerified || false
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Check if current user's email is verified
  isEmailVerified(): boolean {
    const user = this.getCurrentUser();
    return user ? user.emailVerified : false;
  }
}
