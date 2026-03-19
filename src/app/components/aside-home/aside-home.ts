import { Component, ElementRef, QueryList, ViewChildren, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/authentification';
import { GameService, GameSortOrder, GameStatusFilter } from '../../services/game.service';
import { GameListItem } from '../../interfaces/all-interfaces';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-aside-home',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './aside-home.html',
  styleUrl: './aside-home.sass',
})
export class AsideHome implements OnInit {
  @ViewChildren('gameCardRef') gameCardRefs!: QueryList<ElementRef<HTMLElement>>;

  games: GameListItem[] = [];
  searchQuery = '';
  statusFilter: GameStatusFilter = 'all';
  sortOrder: GameSortOrder = 'newest';
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
    this.gameService.games$.subscribe(games => {
      this.games = games;
    });

    this.authService.isLoggedIn$().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;

      if (loggedIn) {
        const currentUser = this.authService.getCurrentUser();
        this.gameService.initializeUserFavorites(currentUser?.id ?? null);
        this.loadGames();
      } else {
        this.games = [];
        this.gameService.updateGames([]);
        this.gameService.clearUserFavorites();
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
        this.gameService.removeGameFromState(gameId);

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

  get displayedGames(): GameListItem[] {
    return this.gameService.getDisplayedGames(this.games, {
      searchQuery: this.searchQuery,
      statusFilter: this.statusFilter,
      sortOrder: this.sortOrder
    });
  }

  isFavorite(gameId: number): boolean {
    return this.gameService.isFavorite(gameId);
  }

  toggleFavorite(gameId: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const previousPositions = this.captureCardPositions();

    const isFavoriteNow = this.gameService.toggleFavorite(gameId);

    if (isFavoriteNow) {
      this.toastService.success(`Game #${gameId} added to favorites.`);
    } else {
      this.toastService.info(`Game #${gameId} removed from favorites.`);
    }

    // Wait until Angular applies the reordered list, then animate cards to new spots.
    requestAnimationFrame(() => {
      this.animateCardReorder(previousPositions);
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




  
  private captureCardPositions(): Map<number, DOMRect> {
    const positions = new Map<number, DOMRect>();

    if (!this.gameCardRefs) {
      return positions;
    }

    for (const ref of this.gameCardRefs.toArray()) {
      const element = ref.nativeElement;
      const idValue = element.getAttribute('data-game-id');

      if (!idValue) {
        continue;
      }

      const gameId = Number(idValue);
      if (Number.isNaN(gameId)) {
        continue;
      }

      positions.set(gameId, element.getBoundingClientRect());
    }

    return positions;
  }

  private animateCardReorder(previousPositions: Map<number, DOMRect>): void {
    if (!previousPositions.size || !this.gameCardRefs) {
      return;
    }

    for (const ref of this.gameCardRefs.toArray()) {
      const element = ref.nativeElement;
      const idValue = element.getAttribute('data-game-id');

      if (!idValue) {
        continue;
      }

      const gameId = Number(idValue);
      const previousRect = previousPositions.get(gameId);
      if (!previousRect) {
        continue;
      }

      const currentRect = element.getBoundingClientRect();
      const deltaX = previousRect.left - currentRect.left;
      const deltaY = previousRect.top - currentRect.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        continue;
      }

      element.style.transition = 'none';
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      // Force layout so browser applies the starting transform before we animate back.
      void element.offsetHeight;

      element.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
      element.style.transform = '';

      const clearInlineStyles = () => {
        element.style.transition = '';
        element.style.transform = '';
        element.removeEventListener('transitionend', clearInlineStyles);
      };

      element.addEventListener('transitionend', clearInlineStyles);
    }
  }
}
