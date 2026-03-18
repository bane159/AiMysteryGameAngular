import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/authentification';
import { GameService } from '../../services/game.service';
import { GameListItem } from '../../interfaces/all-interfaces';
import { ToastService } from '../../services/toast.service';

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
  isDeleteModalOpen = false;
  isDeleting = false;
  selectedGameForDelete: GameListItem | null = null;

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private toastService: ToastService,
    private router: Router
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
          this.gameService.updateGames(response.games);
            
        
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading games:', error);
        this.isLoading = false;
      }
    });
  }

  openDeleteModal(game: GameListItem, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedGameForDelete = game;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) {
      return;
    }

    this.isDeleteModalOpen = false;
    this.selectedGameForDelete = null;
  }

  confirmDeleteGame(): void {
    if (!this.selectedGameForDelete || this.isDeleting) {
      return;
    }

    const gameId = this.selectedGameForDelete.id;
    this.isDeleting = true;

    this.gameService.deleteGame(gameId).subscribe({
      next: (response) => {
        this.isDeleting = false;
        this.games = this.games.filter(game => game.id !== gameId);
        this.gameService.updateGames(this.games);

        if (this.router.url === `/game/${gameId}`) {
          this.router.navigate(['/']);
        }

        this.toastService.success(response.message || `Game #${gameId} deleted.`);
        this.closeDeleteModal();
      },
      error: (error) => {
        this.isDeleting = false;
        const message = error?.error?.message || `Failed to delete game #${gameId}.`;
        this.toastService.error(message);
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
