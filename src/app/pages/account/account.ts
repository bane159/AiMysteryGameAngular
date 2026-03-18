import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/authentification';
import { ToastService } from '../../services/toast.service';
import { User, ValidationErrors } from '../../interfaces/all-interfaces';

@Component({
  selector: 'app-account',
  imports: [CommonModule, FormsModule],
  templateUrl: './account.html',
  styleUrl: './account.sass',
})
export class Account implements OnInit {
  currentUser: User | null = null;

  profileFormData = {
    name: '',
    email: ''
  };

  originalProfileData = {
    name: '',
    email: ''
  };

  passwordFormData = {
    current_password: '',
    password: '',
    password_confirmation: ''
  };

  profileErrors: ValidationErrors | null = null;
  passwordErrors: ValidationErrors | null = null;

  profileGeneralError = '';
  passwordGeneralError = '';
  profileSuccessMessage = '';
  passwordSuccessMessage = '';

  isProfileLoading = false;
  isPasswordLoading = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const localUser = this.authService.getCurrentUser();
    if (localUser) {
      this.setCurrentUser(localUser);
    }

    this.authService.me().subscribe({
      next: (response) => {
        if (response.success && response.user) {
          this.setCurrentUser(response.user);
        }
      },
      error: () => {
        this.profileGeneralError = 'Unable to load your latest account details.';
      }
    });
  }

  onUpdateProfile(): void {
    this.profileErrors = null;
    this.profileGeneralError = '';
    this.profileSuccessMessage = '';

    const validationErrors: ValidationErrors = {};

    if (!this.profileFormData.name.trim()) {
      validationErrors.name = ['The username field is required.'];
    }

    if (!this.profileFormData.email.trim()) {
      validationErrors.email = ['The email field is required.'];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.profileFormData.email)) {
      validationErrors.email = ['The email field must be a valid email address.'];
    }

    if (Object.keys(validationErrors).length > 0) {
      this.profileErrors = validationErrors;
      return;
    }

    const normalizedName = this.profileFormData.name.trim();
    const normalizedEmail = this.profileFormData.email.trim();

    if (
      normalizedName === this.originalProfileData.name &&
      normalizedEmail === this.originalProfileData.email
    ) {
      this.profileSuccessMessage = 'No changes detected.';
      this.toastService.info('No profile changes to save.');
      return;
    }

    this.isProfileLoading = true;

    this.authService.updateProfile(normalizedName, normalizedEmail).subscribe({
      next: (response) => {
        this.isProfileLoading = false;
        if (response.success) {
          if (response.user) {
            this.setCurrentUser(response.user);
          } else {
            this.originalProfileData.name = normalizedName;
            this.originalProfileData.email = normalizedEmail;
          }
          this.profileSuccessMessage = response.message || 'Profile updated successfully.';
          this.toastService.success(this.profileSuccessMessage);
        }
      },
      error: (error) => {
        this.isProfileLoading = false;
        if (error.status === 422 && error.error?.errors) {
          this.profileErrors = error.error.errors;
        } else {
          this.profileGeneralError = error.error?.message || 'An error occurred while updating profile.';
          this.toastService.error(this.profileGeneralError);
        }
      }
    });
  }

  onChangePassword(): void {
    this.passwordErrors = null;
    this.passwordGeneralError = '';
    this.passwordSuccessMessage = '';

    const validationErrors: ValidationErrors = {};

    if (!this.passwordFormData.current_password) {
      validationErrors.current_password = ['The current password field is required.'];
    }

    if (!this.passwordFormData.password) {
      validationErrors.password = ['The password field is required.'];
    } else if (this.passwordFormData.password.length < 8) {
      validationErrors.password = ['The password must be at least 8 characters.'];
    }

    if (!this.passwordFormData.password_confirmation) {
      validationErrors.password_confirmation = ['The password confirmation field is required.'];
    } else if (this.passwordFormData.password !== this.passwordFormData.password_confirmation) {
      validationErrors.password_confirmation = ['The password confirmation does not match.'];
    }

    if (Object.keys(validationErrors).length > 0) {
      this.passwordErrors = validationErrors;
      return;
    }

    this.isPasswordLoading = true;

    this.authService.changePassword(
      this.passwordFormData.current_password,
      this.passwordFormData.password,
      this.passwordFormData.password_confirmation
    ).subscribe({
      next: (response) => {
        this.isPasswordLoading = false;
        if (response.success) {
          this.passwordSuccessMessage = response.message || 'Password updated successfully.';
          this.passwordFormData.current_password = '';
          this.passwordFormData.password = '';
          this.passwordFormData.password_confirmation = '';
          this.toastService.success(this.passwordSuccessMessage);
        }
      },
      error: (error) => {
        this.isPasswordLoading = false;
        if (error.status === 422 && error.error?.errors) {
          this.passwordErrors = error.error.errors;
        } else {
          this.passwordGeneralError = error.error?.message || 'An error occurred while updating password.';
          this.toastService.error(this.passwordGeneralError);
        }
      }
    });
  }

  private setCurrentUser(user: User): void {
    this.currentUser = user;
    const normalizedName = user.name.trim();
    const normalizedEmail = user.email.trim();

    this.profileFormData.name = normalizedName;
    this.profileFormData.email = normalizedEmail;
    this.originalProfileData.name = normalizedName;
    this.originalProfileData.email = normalizedEmail;
  }

}
