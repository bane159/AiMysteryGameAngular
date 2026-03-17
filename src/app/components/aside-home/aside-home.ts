import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/authentification';
import { GameService } from '../../services/game.service';
import { GameListItem } from '../../interfaces/all-interfaces';

@Component({
  selector: 'app-aside-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './aside-home.html',
  styleUrl: './aside-home.sass',
})
export class AsideHome implements OnInit {
  games: GameListItem[] = [];
  isLoggedIn = false;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      if (loggedIn) {
        this.loadGames();

        
        this.gameService.games$.subscribe(games => {
        this.games = games;
      });


      } else {
        this.games = [];
      }

      


    });
  }

  loadGames(): void {
    this.isLoading = true;
    this.gameService.getGames().subscribe({
      next: (response) => {
        if (response.success) {
          this.games = response.games;
            
        
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading games:', error);
        this.isLoading = false;
      }
    });
  }



  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
