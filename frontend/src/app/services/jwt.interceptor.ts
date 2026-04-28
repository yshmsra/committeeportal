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

    // Log for debugging
    console.log(`[JWT Interceptor] ${request.method} ${request.url}`);
    console.log(`[JWT Interceptor] Token exists: ${!!token}`);
    if (token) {
      console.log(`[JWT Interceptor] Token length: ${token.length}`);
    }

    // If token exists, add it to the Authorization header
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(`[JWT Interceptor] Added Authorization header for ${request.method} ${request.url}`);
    }

    return next.handle(request);
  }
}
