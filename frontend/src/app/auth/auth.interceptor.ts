import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add Authorization header if token exists
    const token = this.authService.getToken();
    console.log('Interceptor - Request URL:', request.url);
    console.log('Interceptor - Token:', token?.substring(0, 20) + '...');
    
    if (token && !this.authService.isTokenExpired(token)) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Interceptor - Added Authorization header');
    } else {
      console.log('Interceptor - No valid token or token expired');
      // Don't add Authorization header if no valid token
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle JWT expiration with automatic refresh
        if (error.status === 401 || error.status === 400 ||
            (error.error?.message && (
              error.error.message.includes('JWT expired') || 
              error.error.message.includes('expired') ||
              error.error.message.includes('invalid token')
            ))) {
          console.log('Token expired error detected:', error.error?.message);
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authService.getRefreshToken();
      if (refreshToken && !this.authService.isTokenExpired(refreshToken)) {
        return this.authService.refreshToken().pipe(
          switchMap((tokenResponse: any) => {
            this.isRefreshing = false;
            this.authService.login(tokenResponse.accessToken, tokenResponse.refreshToken);
            this.refreshTokenSubject.next(tokenResponse.accessToken);
            
            // Retry the original request with new token
            return next.handle(this.addTokenToRequest(request, tokenResponse.accessToken));
          }),
          catchError((error) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next('REFRESH_FAILED');
            this.authService.logout().subscribe();
            window.location.href = '/auth/login';
            return throwError(() => error);
          })
        );
      } else {
        // No valid refresh token, redirect to login
        this.isRefreshing = false;
        this.authService.logout().subscribe();
        window.location.href = '/auth/login';
        return throwError(() => new Error('No valid refresh token'));
      }
    }

    // If we're already refreshing, wait for the new token
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        if (token === 'REFRESH_FAILED') {
          // Refresh failed, redirect to login
          this.authService.logout().subscribe();
          window.location.href = '/auth/login';
          return throwError(() => new Error('Token refresh failed'));
        }
        return next.handle(this.addTokenToRequest(request, token));
      })
    );
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    if (!token || token === 'null' || token === 'REFRESH_FAILED') {
      return request; // Return original request without Authorization header
    }
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}