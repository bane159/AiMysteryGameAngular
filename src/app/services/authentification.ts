import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  User,
  Progress,
  LoginResponse,
  RegisterResponse,
  LogoutResponse,
  MeResponse,
  UpdateProfileResponse,
  ChangePasswordResponse,
  UpdateProfileRequest,
  ChangePasswordRequest
} from '../interfaces/all-interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'jwt_token';
  private userKey = 'user';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private progressSubject = new BehaviorSubject<Progress | null>(null);
  progress$ = this.progressSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Login user
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { 
      email, 
      password 
    }).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setSession(response.token, response.user);
          if (response.progress) {
            this.progressSubject.next(response.progress);
          }
        }
      })
    );
  }

  // Register user
  register(name: string, email: string, password: string, password_confirmation: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, {
      name,
      email,
      password,
      password_confirmation
    }).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setSession(response.token, response.user);
          if (response.progress) {
            this.progressSubject.next(response.progress);
          }
        }
      })
    );
  }

  // Logout user
  logout(): Observable<LogoutResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<LogoutResponse>(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        this.logoutLocal();
      })
    );
  }

  // Logout locally without API call
  logoutLocal(): void {
    this.clearSession();
    this.progressSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Get current user from API
  me(): Observable<MeResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<MeResponse>(`${this.apiUrl}/me`, { headers }).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.updateCurrentUser(response.user);
        }
        if (response.progress) {
          this.progressSubject.next(response.progress);
        }
      })
    );
  }

  // Update username and email for current user
  updateProfile(name: string, email: string): Observable<UpdateProfileResponse> {
    const headers = this.getAuthHeaders();
    const payload: UpdateProfileRequest = {
      name,
      email
    };

    return this.http.put<UpdateProfileResponse>(`${this.apiUrl}/me`, payload, { headers }).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.updateCurrentUser(response.user);
        }
      })
    );
  }

  // Change current user password
  changePassword(
    current_password: string,
    password: string,
    password_confirmation: string
  ): Observable<ChangePasswordResponse> {
    const headers = this.getAuthHeaders();
    const payload: ChangePasswordRequest = {
      current_password,
      password,
      password_confirmation
    };

    return this.http.put<ChangePasswordResponse>(`${this.apiUrl}/me/password`, payload, { headers });
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.hasToken();
  }

  // Observable for login state
  isLoggedIn$(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  // Update progress subject from any response
  updateProgress(progress: Progress | undefined | null): void {
    if (progress) {
      this.progressSubject.next(progress);
    }
  }

  // Get current progress snapshot
  getCurrentProgress(): Progress | null {
    return this.progressSubject.getValue();
  }

  // Update stored user
  updateCurrentUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    console.log('Current user updated:', user);
  }

  // Get auth headers for protected routes
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Set session data
  private setSession(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.isLoggedInSubject.next(true);
  }

  // Clear session data
  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isLoggedInSubject.next(false);
  }

  // Check if token exists
  private hasToken(): boolean {
    return !!this.getToken();
  }
}
