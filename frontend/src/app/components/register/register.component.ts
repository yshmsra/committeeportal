import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  // Email domain validation patterns
  readonly EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|net|edu|co\.uk|io)$/;
  readonly VALID_DOMAINS = ['@gmail.com', '@yahoo.com', '@outlook.com', '@college.edu', '@company.com', '.com', '.in', '.org', '.net'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {
    this.registerForm = this.formBuilder.group({
      role: ['ADMIN', Validators.required],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(this.EMAIL_PATTERN)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      confirmPassword: ['', Validators.required],
      name: ['', [
        Validators.required,
        Validators.minLength(3)
      ]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  get role() {
    return 'ADMIN';
  }

  // Getters for form fields
  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get name() {
    return this.registerForm.get('name');
  }

  // Check if email is valid
  isEmailInvalid(): boolean {
    const emailControl = this.email;
    return emailControl ? emailControl.invalid && emailControl.touched : false;
  }

  // Get email error message
  getEmailErrorMessage(): string {
    if (!this.email?.value) {
      return 'Email is required';
    }
    if (this.email?.hasError('email')) {
      return 'Invalid email format';
    }
    if (this.email?.hasError('pattern')) {
      return 'Email domain must end with: .com, .in, .org, .net, .edu, or .co.uk';
    }
    return '';
  }

  // Get password error message
  getPasswordErrorMessage(): string {
    if (!this.password?.value) {
      return 'Password is required';
    }
    if (this.password?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    // Check form validity
    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    this.isLoading = true;

    const registerData: RegisterRequest = {
      email: this.email?.value.trim(),
      password: this.password?.value,
      role: 'ADMIN',
      name: this.name?.value.trim()
    };

    this.authService.register(registerData).subscribe(
      (response) => {
        this.isLoading = false;
        this.successMessage = 'Admin registration successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Registration failed. Please try again.';
        console.error('Registration error:', error);
      }
    );
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
