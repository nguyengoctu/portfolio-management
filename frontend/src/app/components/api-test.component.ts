import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-api-test',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="container mx-auto p-4">
      <h2 class="text-2xl font-bold mb-4">API Proxy Test</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Auth Service -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-blue-600">Auth Service</h3>
          <button 
            (click)="testAuthHealth()" 
            class="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600">
            Test Health
          </button>
          <button 
            (click)="testLogin()" 
            class="bg-blue-500 text-white px-4 py-2 rounded mt-2 ml-2 hover:bg-blue-600">
            Test Login
          </button>
          <div class="mt-2 text-sm">
            <strong>Status:</strong> 
            <span [class]="authStatus.includes('Success') ? 'text-green-600' : 'text-red-600'">
              {{ authStatus }}
            </span>
          </div>
          <pre class="bg-gray-100 p-2 text-xs mt-2 rounded">{{ authResponse | json }}</pre>
        </div>

        <!-- User Service -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-green-600">User Service</h3>
          <button 
            (click)="testUserHealth()" 
            class="bg-green-500 text-white px-4 py-2 rounded mt-2 hover:bg-green-600">
            Test Health
          </button>
          <button 
            (click)="testGetUsers()" 
            class="bg-green-500 text-white px-4 py-2 rounded mt-2 ml-2 hover:bg-green-600">
            Get Users
          </button>
          <div class="mt-2 text-sm">
            <strong>Status:</strong> 
            <span [class]="userStatus.includes('Success') ? 'text-green-600' : 'text-red-600'">
              {{ userStatus }}
            </span>
          </div>
          <pre class="bg-gray-100 p-2 text-xs mt-2 rounded">{{ userResponse | json }}</pre>
        </div>

        <!-- Email Service -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-purple-600">Email Service</h3>
          <button 
            (click)="testEmailHealth()" 
            class="bg-purple-500 text-white px-4 py-2 rounded mt-2 hover:bg-purple-600">
            Test Health
          </button>
          <button 
            (click)="testSendEmail()" 
            class="bg-purple-500 text-white px-4 py-2 rounded mt-2 ml-2 hover:bg-purple-600">
            Send Email
          </button>
          <div class="mt-2 text-sm">
            <strong>Status:</strong> 
            <span [class]="emailStatus.includes('Success') ? 'text-green-600' : 'text-red-600'">
              {{ emailStatus }}
            </span>
          </div>
          <pre class="bg-gray-100 p-2 text-xs mt-2 rounded">{{ emailResponse | json }}</pre>
        </div>
      </div>

      <!-- Network Info -->
      <div class="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 class="text-lg font-semibold">Proxy Configuration</h3>
        <ul class="list-disc list-inside mt-2 text-sm">
          <li><code>/api/auth/*</code> → <strong>auth-service:8082</strong></li>
          <li><code>/api/user/*</code> → <strong>user-service:8083</strong></li>
          <li><code>/api/email/*</code> → <strong>email-service:8081</strong></li>
        </ul>
      </div>
    </div>
  `
})
export class ApiTestComponent {
  authStatus = 'Ready';
  userStatus = 'Ready';
  emailStatus = 'Ready';
  
  authResponse: any = {};
  userResponse: any = {};
  emailResponse: any = {};

  constructor(private apiService: ApiService) {}

  testAuthHealth() {
    this.authStatus = 'Testing...';
    this.apiService.getAuthHealth().subscribe({
      next: (response) => {
        this.authStatus = 'Success';
        this.authResponse = response;
      },
      error: (error) => {
        this.authStatus = `Error: ${error.status} ${error.statusText}`;
        this.authResponse = error;
      }
    });
  }

  testLogin() {
    this.authStatus = 'Testing login...';
    const credentials = { username: 'test', password: 'test123' };
    
    this.apiService.login(credentials).subscribe({
      next: (response) => {
        this.authStatus = 'Login Success';
        this.authResponse = response;
      },
      error: (error) => {
        this.authStatus = `Login Error: ${error.status} ${error.statusText}`;
        this.authResponse = error;
      }
    });
  }

  testUserHealth() {
    this.userStatus = 'Testing...';
    this.apiService.getUserHealth().subscribe({
      next: (response) => {
        this.userStatus = 'Success';
        this.userResponse = response;
      },
      error: (error) => {
        this.userStatus = `Error: ${error.status} ${error.statusText}`;
        this.userResponse = error;
      }
    });
  }

  testGetUsers() {
    this.userStatus = 'Testing get users...';
    this.apiService.getAllUsers().subscribe({
      next: (response) => {
        this.userStatus = 'Get Users Success';
        this.userResponse = response;
      },
      error: (error) => {
        this.userStatus = `Get Users Error: ${error.status} ${error.statusText}`;
        this.userResponse = error;
      }
    });
  }

  testEmailHealth() {
    this.emailStatus = 'Testing...';
    this.apiService.getEmailHealth().subscribe({
      next: (response) => {
        this.emailStatus = 'Success';
        this.emailResponse = response;
      },
      error: (error) => {
        this.emailStatus = `Error: ${error.status} ${error.statusText}`;
        this.emailResponse = error;
      }
    });
  }

  testSendEmail() {
    this.emailStatus = 'Testing send email...';
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email',
      body: 'This is a test email from the proxy'
    };
    
    this.apiService.sendEmail(emailData).subscribe({
      next: (response) => {
        this.emailStatus = 'Send Email Success';
        this.emailResponse = response;
      },
      error: (error) => {
        this.emailStatus = `Send Email Error: ${error.status} ${error.statusText}`;
        this.emailResponse = error;
      }
    });
  }
}