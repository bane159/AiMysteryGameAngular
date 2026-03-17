import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/authentification';
import { ValidationErrors } from '../../interfaces/all-interfaces';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.sass',
})
export class Login {
  formData = {
    email: '',
    password: ''
  };

  errors: ValidationErrors | null = null;
  generalError: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.errors = null;
    this.generalError = '';
    this.successMessage = '';

    const validationErrors: ValidationErrors = {};

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

    if (Object.keys(validationErrors).length > 0) {
      this.errors = validationErrors;
      return;
    }

    this.isLoading = true;

    this.authService.login(
      this.formData.email,
      this.formData.password
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = response.message || 'Login successful!';

          // Redirect to home after a brief moment
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 500);
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 422 && error.error?.errors) {
          this.errors = error.error.errors;
        } else if (error.status === 406) {
          this.generalError = 'Invalid email or password.';
        } else {
          this.generalError = 'An error occurred. Please try again.';
        }
      }
    });
  }
}
