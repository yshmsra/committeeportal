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
      role: ['COMMITTEE', Validators.required],
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
      // Committee-specific fields
      committeeName: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],
      facultyInChargeName: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],
      // Approver-specific fields
      name: ['', [
        Validators.minLength(3)
      ]]
    }, { validators: this.passwordMatchValidator });
    
    // Apply dynamic validators based on role
    this.updateValidators();
    
    // Update validators whenever role changes
    this.registerForm.get('role')?.valueChanges.subscribe(() => {
      this.updateValidators();
    });
  }

  private updateValidators() {
    const roleControl = this.registerForm.get('role');
    const committeeNameControl = this.registerForm.get('committeeName');
    const facultyInChargeControl = this.registerForm.get('facultyInChargeName');
    const nameControl = this.registerForm.get('name');

    if (roleControl?.value === 'COMMITTEE') {
      // Require committee-specific fields
      committeeNameControl?.setValidators([
        Validators.required,
        Validators.minLength(3)
      ]);
      facultyInChargeControl?.setValidators([
        Validators.required,
        Validators.minLength(3)
      ]);
      // Clear validators for approver name
      nameControl?.setValidators([Validators.minLength(3)]);
    } else if (roleControl?.value === 'APPROVER' || roleControl?.value === 'ADMIN') {
      // Clear validators for committee fields
      committeeNameControl?.setValidators([]);
      facultyInChargeControl?.setValidators([]);
      // Require approver/admin name
      nameControl?.setValidators([
        Validators.required,
        Validators.minLength(3)
      ]);
    }

    committeeNameControl?.updateValueAndValidity({ emitEvent: false });
    facultyInChargeControl?.updateValueAndValidity({ emitEvent: false });
    nameControl?.updateValueAndValidity({ emitEvent: false });
    this.registerForm.updateValueAndValidity();
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
    return this.registerForm.get('role')?.value;
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

  get committeeName() {
    return this.registerForm.get('committeeName');
  }

  get facultyInChargeName() {
    return this.registerForm.get('facultyInChargeName');
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

    // Additional validation for role-specific fields
    if (this.role === 'COMMITTEE') {
      if (!this.committeeName?.value || !this.facultyInChargeName?.value) {
        this.errorMessage = 'Committee name and faculty in charge name are required';
        return;
      }
    }

    if (this.role === 'APPROVER' || this.role === 'ADMIN') {
      if (!this.name?.value) {
        this.errorMessage = `Name is required for ${this.role} role`;
        return;
      }
    }

    this.isLoading = true;

    const registerData: RegisterRequest = {
      email: this.email?.value.trim(),
      password: this.password?.value,
      role: this.role
    };

    if (this.role === 'COMMITTEE') {
      registerData.committeeName = this.committeeName?.value.trim();
      registerData.facultyInChargeName = this.facultyInChargeName?.value.trim();
    } else if (this.role === 'APPROVER' || this.role === 'ADMIN') {
      registerData.name = this.name?.value.trim();
    }

    this.authService.register(registerData).subscribe(
      (response) => {
        this.isLoading = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
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

  onRoleChange() {
    // Validators are now updated automatically via the valueChanges subscription
    // This method is kept for backward compatibility but the actual logic is in updateValidators()
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
