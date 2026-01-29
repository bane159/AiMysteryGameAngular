import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { AuthService } from '../../services/authentification';
import { GameService } from '../../services/game.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.sass',
})
export class Header implements OnInit, OnDestroy {
  public isLoggedIn: boolean = false;
  private authSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private router: Router
  ) {}




  onStartGame() {
    this.gameService.startGame().subscribe({
      next: (response) => {
        console.log('Game started successfully - Full response:', response);
        if (response.success && response.game) {
          console.log('Game ID:', response.game.id);
          console.log('User:', response.game.user);
          console.log('AI Model:', response.game.ai_model);
          console.log('Characters:', response.game.characters);
          console.log('Rooms with Rules:', response.game.rooms_with_rules);
          console.log('Character Scenarios:', response.game.character_scenarios);
          console.log('Created At:', response.game.created_at);
        }
      },
      error: (error) => {
        console.error('Failed to start game - Full error:', error);
        alert('Failed to start game. Please try again.');
      }
    });
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Logout successful:', response.message);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Clear session even if API call fails
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit() {
    // Subscribe to auth state changes
    this.authSubscription = this.authService.isLoggedIn$().subscribe(
      (loggedIn) => {
        this.isLoggedIn = loggedIn;
        console.log('Auth state changed:', loggedIn);
      }
    );
  }

  ngOnDestroy() {
    // Clean up subscription
    this.authSubscription?.unsubscribe();
  }

 
  
}
