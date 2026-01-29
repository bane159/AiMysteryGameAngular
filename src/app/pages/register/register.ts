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
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onRegister() {
    this.isLoading = true;
    this.errors = null;
    this.successMessage = '';

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
            this.router.navigate(['/home']);
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 422 && error.error?.errors) {
          this.errors = error.error.errors;
        } else {
          this.errors = { general: ['An error occurred. Please try again.'] };
        }
      }
    });
  }
}
