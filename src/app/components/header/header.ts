import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { AuthService } from '../../services/authentification';
import { GameService } from '../../services/game.service';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';

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
    private router: Router,
    private toastService: ToastService
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

          // Get the updated list of games and emit to subs
          this.gameService.getGames().subscribe({
            next: (gamesResponse) => {
              if (gamesResponse.success && gamesResponse.games) {
                this.gameService.updateGames(gamesResponse.games);
              }
            }
          });

          this.router.navigate(['/game', response.game.id]);

        }
      },
      error: (error) => {
        console.error('Failed to start game - Full error:', error);
        this.toastService.error('Failed to start game. Please try again later.', 6000);
      }
    });
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: (response) => {
       
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        
        this.authService.logoutLocal(); 
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
