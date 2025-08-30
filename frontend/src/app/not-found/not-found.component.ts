import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
      <h1 class="text-6xl font-bold text-red-600 mb-4">404</h1>
      <h2 class="text-3xl font-semibold mb-2">Page Not Found</h2>
      <p class="text-lg text-center mb-8">The page you are looking for does not exist.</p>
      <a routerLink="/" class="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
        Go to Home
      </a>
    </div>
  `,
  styles: []
})
export class NotFoundComponent { }
