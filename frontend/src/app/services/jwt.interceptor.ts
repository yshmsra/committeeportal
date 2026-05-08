import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the JWT token from sessionStorage (saved during login)
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    const userId = sessionStorage.getItem('userId');

    // Log for debugging
    console.log(`[JWT Interceptor] ${request.method} ${request.url}`);
    console.log(`[JWT Interceptor] Role: ${role}, UserId: ${userId}`);
    console.log(`[JWT Interceptor] Token exists: ${!!token}`);
    if (token) {
      console.log(`[JWT Interceptor] Token length: ${token.length}`);
      console.log(`[JWT Interceptor] Token preview: ${token.substring(0, 50)}...`);
    }

    // If token exists, add it to the Authorization header
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(`[JWT Interceptor] ✓ Authorization header added`);
      console.log(`[JWT Interceptor] Full URL: ${request.url}`);
    } else {
      console.warn(`[JWT Interceptor] ⚠ No token found in sessionStorage!`);
    }

    return next.handle(request);
  }
}
