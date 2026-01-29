import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { 
  User, 
  LoginResponse, 
  RegisterResponse, 
  LogoutResponse, 
  MeResponse 
} from '../interfaces/all-interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private tokenKey = 'jwt_token';
  private userKey = 'user';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());

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
          console.log('User logged in:', response);
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
          console.log('User registered:', response);
        }
      })
    );
  }

  // Logout user
  logout(): Observable<LogoutResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<LogoutResponse>(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        this.clearSession();
        console.log('User logged out');
      })
    );
  }

  // Logout locally without API call
  logoutLocal(): void {
    this.clearSession();
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
      })
    );
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
