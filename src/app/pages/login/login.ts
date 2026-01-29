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
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.isLoading = true;
    this.errors = null;
    this.successMessage = '';

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
            this.router.navigate(['/home']);
          }, 500);
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 422 && error.error?.errors) {
          this.errors = error.error.errors;
        } else if (error.status === 401) {
          this.errors = { general: ['Invalid email or password.'] };
        } else {
          this.errors = { general: ['An error occurred. Please try again.'] };
        }
      }
    });
  }
}
