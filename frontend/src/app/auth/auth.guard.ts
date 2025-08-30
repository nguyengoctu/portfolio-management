import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const tokenInLocalStorage = localStorage.getItem('authToken');
    console.log('AuthGuard - Token directly from localStorage:', tokenInLocalStorage);

    const loggedIn = this.authService.isLoggedIn(); // This will also log from AuthService
    console.log('AuthGuard - is logged in (from AuthService):', loggedIn);

    if (loggedIn) {
      return true;
    } else {
      console.log('AuthGuard - Not logged in, redirecting to /login');
      return this.router.createUrlTree(['/login']);
    }
  }
}
