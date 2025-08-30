import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { LoginSuccessComponent } from './login-success/login-success';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'login-success', component: LoginSuccessComponent }
];
