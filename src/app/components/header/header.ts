import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/authentification';
import { GameService } from '../../services/game.service';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { GameOptionItem, Progress } from '../../interfaces/all-interfaces';

@Component({
  selector: 'app-header',
  imports: [RouterLink, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.sass',
})
export class Header implements OnInit, OnDestroy {
  public isLoggedIn: boolean = false;
  private authSubscription?: Subscription;
  private progressSubscription?: Subscription;
  progress: Progress | null = null;

  isStartGameModalOpen = false;
  loadingGameOptions = false;
  startingGame = false;
  startGameError: string | null = null;

  aiModelOptions: GameOptionItem[] = [];
  difficultyOptions: GameOptionItem[] = [];

  selectedAiModel: number | null = null;
  selectedDifficulty = '';

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private router: Router,
    private toastService: ToastService
  ) {}




  openStartGameModal() {
    if(this.isLoggedIn) {
      this.isStartGameModalOpen = true;
      this.startGameError = null;
      this.fetchGameOptions();
    }
  }

  closeStartGameModal() {
    if (this.startingGame) {
      return;
    }

    this.isStartGameModalOpen = false;
    this.startGameError = null;
  }

  startGameFromModal() {
    if (this.startingGame || this.selectedAiModel === null || !this.selectedDifficulty) {
      return;
    }

    this.startingGame = true;
    this.startGameError = null;

    this.gameService.startGame(this.selectedAiModel, this.selectedDifficulty).subscribe({
      next: (response) => {
        this.startingGame = false;

        if (response.success && response.game) {
          this.isStartGameModalOpen = false;

          // Get the updated list of games and emit to subs
          this.gameService.getGames().subscribe({
            next: (gamesResponse) => {
              if (gamesResponse.success && gamesResponse.games) {
                this.gameService.updateGames(gamesResponse.games);
              }
            }
          });

          this.router.navigate(['/game', response.game.id]);

          return;

        }

        this.startGameError = response.message || 'Unable to start game with selected options.';
      },
      error: (error) => {
        this.startingGame = false;
        this.startGameError = error.error?.message || 'Failed to start game. Please try again later.';
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

    // Subscribe to progress changes
    this.progressSubscription = this.authService.progress$.subscribe(
      (progress) => {
        this.progress = progress;
      }
    );
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.progressSubscription?.unsubscribe();
  }

  private fetchGameOptions() {
    this.loadingGameOptions = true;
    this.startGameError = null;

    this.gameService.getGameOptions().subscribe({
      next: (response) => {
        this.loadingGameOptions = false;

        if (!response.success || !response.options) {
          this.startGameError = 'Could not load game options.';
          return;
        }

        this.aiModelOptions = response.options.ai_models || [];
        this.difficultyOptions = response.options.difficulties || [];

        if (this.aiModelOptions.length > 0) {
          const firstModelValue = this.aiModelOptions[0].value;
          this.selectedAiModel = typeof firstModelValue === 'number'
            ? firstModelValue
            : Number(firstModelValue);
        }

        if (this.difficultyOptions.length > 0) {
          this.selectedDifficulty = String(this.difficultyOptions[0].value);
        }
      },
      error: () => {
        this.loadingGameOptions = false;
        this.startGameError = 'Could not load game options.';
      }
    });
  }

 
  
}
