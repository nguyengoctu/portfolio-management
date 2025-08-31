import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { LoginSuccessComponent } from './login-success/login-success';
import { AuthGuard } from './auth/auth.guard';
import { NotFoundComponent } from './not-found/not-found.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { RegisterComponent } from './register/register.component';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { RegisterFormComponent } from './register-form/register-form.component';
import { ForgotPasswordFormComponent } from './forgot-password-form/forgot-password-form.component';
import { ResetPasswordFormComponent } from './reset-password-form/reset-password-form.component';
import { ApiTestComponent } from './components/api-test.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { OAuthRedirectComponent } from './oauth-redirect/oauth-redirect.component';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    
    // Auth routes with shared layout
    { 
        path: 'auth', 
        component: AuthLayoutComponent,
        children: [
            { path: '', redirectTo: 'login', pathMatch: 'full' },
            { path: 'login', component: LoginFormComponent },
            { path: 'register', component: RegisterFormComponent },
            { path: 'forgot-password', component: ForgotPasswordFormComponent },
            { path: 'reset-password', component: ResetPasswordFormComponent }
        ]
    },
    
    // Legacy routes - redirect to new auth routes
    { path: 'login', redirectTo: '/auth/login' },
    { path: 'register', redirectTo: '/auth/register' },
    { path: 'forgot-password', redirectTo: '/auth/forgot-password' },
    
    { path: 'dashboard', component: LoginSuccessComponent, canActivate: [AuthGuard], data: { animation: 'DashboardPage' } },
    { path: 'verify-email', component: VerifyEmailComponent, data: { animation: 'VerifyEmailPage' } },
    { path: 'auth/oauth2/redirect', component: OAuthRedirectComponent, data: { animation: 'OAuthRedirectPage' } },
    { path: 'api-test', component: ApiTestComponent, data: { animation: 'ApiTestPage' } }, // API proxy test page
    { path: '**', component: NotFoundComponent, data: { animation: 'NotFoundPage' } } // Wildcard route for 404
];
