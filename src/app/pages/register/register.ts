import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/authentification';
import { ValidationErrors } from '../../interfaces/all-interfaces';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.sass',
})
export class Register {
  formData = {
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  };

  errors: ValidationErrors | null = null;
  generalError: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onRegister() {
    this.errors = null;
    this.generalError = '';
    this.successMessage = '';

    const validationErrors: ValidationErrors = {};

    if (!this.formData.name.trim()) {
      validationErrors.name = ['The name field is required.'];
    }

    if (!this.formData.email.trim()) {
      validationErrors.email = ['The email field is required.'];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
      validationErrors.email = ['The email field must be a valid email address.'];
    }

    if (!this.formData.password) {
      validationErrors.password = ['The password field is required.'];
    } else if (this.formData.password.length < 8) {
      validationErrors.password = ['The password must be at least 8 characters.'];
    }

    if (this.formData.password && this.formData.password !== this.formData.password_confirmation) {
      validationErrors['password_confirmation'] = ['The password confirmation does not match.'];
    }

    if (Object.keys(validationErrors).length > 0) {
      this.errors = validationErrors;
      return;
    }

    this.isLoading = true;

    this.authService.register(
      this.formData.name,
      this.formData.email,
      this.formData.password,
      this.formData.password_confirmation
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = response.message || 'Registration successful!';

          // Redirect to home after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 422 && error.error?.errors) {
          this.errors = error.error.errors;
        } else {
          this.generalError = 'An error occurred. Please try again.';
        }
      }
    });
  }
}
