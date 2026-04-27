import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, timeout } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
  role?: 'COMMITTEE' | 'APPROVER';
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'COMMITTEE' | 'APPROVER';
  committeeName?: string;
  facultyInChargeName?: string;
  name?: string;
}

export interface LoginResponse {
  role: 'COMMITTEE' | 'APPROVER';
  userId: number;
  userName: string;
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  role: 'COMMITTEE' | 'APPROVER';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  login(data: LoginRequest): Observable<LoginResponse> {
    const committeeLoginData = {
      email: data.email,
      password: data.password
    };

    const approverLoginData = {
      email: data.email,
      password: data.password
    };

    // Respect the selected role - no fallback
    if (data.role === 'COMMITTEE') {
      return this.http.post<any>(`${this.apiUrl}/api/committees/login`, committeeLoginData).pipe(
        map(response => {
          const loginResponse: LoginResponse = { 
            role: 'COMMITTEE', 
            userId: response.userId,
            userName: response.userName || 'Committee'
          };
          this.saveSession(loginResponse, response.token);
          return loginResponse;
        })
      );
    } else if (data.role === 'APPROVER') {
      return this.http.post<any>(`${this.apiUrl}/api/approvers/login`, approverLoginData).pipe(
        map(response => {
          const loginResponse: LoginResponse = { 
            role: 'APPROVER', 
            userId: response.userId,
            userName: response.userName || 'Approver'
          };
          this.saveSession(loginResponse, response.token);
          return loginResponse;
        })
      );
    }

    // Default fallback (try approver first)
    return this.http.post<any>(`${this.apiUrl}/api/approvers/login`, approverLoginData).pipe(
      map(response => {
        const loginResponse: LoginResponse = { 
          role: 'APPROVER', 
          userId: response.userId,
          userName: response.userName || 'Approver'
        };
        this.saveSession(loginResponse, response.token);
        return loginResponse;
      })
    );
  }

  private saveSession(data: LoginResponse, token?: string): void {
    localStorage.setItem('role', data.role);
    localStorage.setItem('userId', data.userId.toString());
    localStorage.setItem('userName', data.userName);
    // Save token if provided
    if (token) {
      localStorage.setItem('token', token);
    }
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getApproverId(): number {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : 0;
  }

  getCommitteeId(): number {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : 0;
  }

  getUserName(): string {
    return localStorage.getItem('userName') || 'User';
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    return !!token && !!userId && this.isTokenValid(token);
  }

  /**
   * Validate JWT token expiry (basic check)
   */
  private isTokenValid(token: string): boolean {
    try {
      if (!token || typeof token !== 'string') {
        return false;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid JWT format: does not have 3 parts');
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      
      if (!payload.exp) {
        console.warn('Token does not have expiry claim');
        return false;
      }

      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const isValid = Date.now() < expiryTime;
      
      if (!isValid) {
        console.warn('Token has expired');
      }
      
      return isValid;
    } catch (e) {
      console.error('Error validating token format:', e);
      // If we can't parse it, assume it's invalid
      return false;
    }
  }

  /**
   * Validate authentication on app initialization/refresh
   * More lenient approach: only reject if token is locally expired
   * Server-side validation is attempted but failures are not fatal
   */
  validateAuthOnInit(): Observable<boolean> {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');

    // If no session data at all, user is not authenticated
    if (!token || !userId || !role) {
      console.warn('No session data found');
      this.logout();
      return of(false);
    }

    // If token is locally expired, reject
    if (!this.isTokenValid(token)) {
      console.warn('Token has expired locally');
      this.logout();
      return of(false);
    }

    // Try to verify token with server, but don't fail hard if it doesn't work
    console.info('Performing server-side token validation');
    return this.http.get<any>(`${this.apiUrl}/api/auth/validate`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(
      timeout(5000), // 5 second timeout
      map(response => {
        if (response && response.valid) {
          console.info('Token validation successful on server');
          return true;
        } else {
          console.warn('Server validation returned invalid response');
          this.logout();
          return false;
        }
      }),
      catchError(err => {
        // If server validation fails, but local token is valid, allow it
        // The API calls will fail if the token is truly invalid
        console.warn('Server validation failed, but local token is valid. Allowing access:', err.message);
        return of(true);
      })
    );
  }

  register(data: RegisterRequest): Observable<any> {
    if (data.role === 'COMMITTEE') {
      // For committee registration, send to /api/committees/register
      const committeeData = {
        committeeName: data.committeeName,
        contactEmail: data.email,
        password: data.password,
        headOfCommittee: data.facultyInChargeName
      };
      return this.http.post<any>(`${this.apiUrl}/api/committees/register`, committeeData);
    } else if (data.role === 'APPROVER') {
      // For approver registration, send to /api/approvers/register
      const approverData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'APPROVER'
      };
      return this.http.post<any>(`${this.apiUrl}/api/approvers/register`, approverData);
    }
    throw new Error('Invalid role');
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    if (data.role === 'COMMITTEE') {
      return this.http.post<any>(`${this.apiUrl}/api/committees/reset-password`, {
        email: data.email,
        newPassword: data.newPassword
      });
    } else if (data.role === 'APPROVER') {
      return this.http.post<any>(`${this.apiUrl}/api/approvers/reset-password`, {
        email: data.email,
        newPassword: data.newPassword
      });
    }
    throw new Error('Invalid role');
  }
}