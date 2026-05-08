import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Login form fields
  email: string = '';
  password: string = '';
  role: string = 'APPROVER';
  errorMessage: string = '';
  isLoading: boolean = false;

  // Forgot Password form fields
  showForgotPassword: boolean = false;
  forgotEmail: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  forgotRole: string = 'APPROVER';
  forgotErrorMessage: string = '';
  forgotSuccessMessage: string = '';
  isForgotLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit() {
    // Reset error message
    this.errorMessage = '';

    // Validation
    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required';
      return;
    }

    this.isLoading = true;

    const loginData: LoginRequest = {
      email: this.email,
      password: this.password,
      role: this.role as 'COMMITTEE' | 'APPROVER' | 'ADMIN'
    };

    this.authService.login(loginData).subscribe(
      (response) => {
        this.isLoading = false;
        if (response.role === 'COMMITTEE') {
          this.router.navigate(['/committee-dashboard']);
        } else if (response.role === 'ADMIN') {
          this.router.navigate(['/admin-dashboard']);
        } else if (response.role === 'APPROVER') {
          this.router.navigate(['/approver-dashboard']);
        }
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = 'Login failed. Please check your credentials.';
        console.error('Login error:', error);
      }
    );
  }

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
    this.forgotEmail = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';
  }

  onForgotPasswordSubmit() {
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';

    // Validation
    if (!this.forgotEmail || !this.newPassword || !this.confirmPassword) {
      this.forgotErrorMessage = 'All fields are required';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.forgotErrorMessage = 'Passwords do not match';
      return;
    }

    if (this.newPassword.length < 6) {
      this.forgotErrorMessage = 'Password must be at least 6 characters long';
      return;
    }

    this.isForgotLoading = true;

    const resetData = {
      email: this.forgotEmail,
      newPassword: this.newPassword,
      role: this.forgotRole as 'COMMITTEE' | 'APPROVER'
    };

    this.authService.resetPassword(resetData).subscribe(
      (response) => {
        this.isForgotLoading = false;
        this.forgotSuccessMessage = 'Password reset successfully! Please login with your new password.';
        
        // Clear the form and redirect after 2 seconds
        setTimeout(() => {
          this.showForgotPassword = false;
          this.email = this.forgotEmail;
          this.password = '';
          this.forgotEmail = '';
          this.newPassword = '';
          this.confirmPassword = '';
        }, 2000);
      },
      (error) => {
        this.isForgotLoading = false;
        this.forgotErrorMessage = error.error?.message || 'Failed to reset password. Please check your email and try again.';
        console.error('Reset password error:', error);
      }
    );
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}