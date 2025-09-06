import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add Authorization header if token exists
    const token = this.authService.getToken();
    if (token && !this.authService.isTokenExpired(token)) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle JWT expiration
        if (error.status === 401 || 
            (error.error?.message && error.error.message.includes('JWT expired'))) {
          console.log('JWT expired, logging out user');
          this.authService.logout();
          // Redirect to login or reload to show sign in/up buttons
          window.location.reload();
        }
        return throwError(() => error);
      })
    );
  }
}