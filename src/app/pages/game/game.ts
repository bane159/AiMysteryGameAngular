import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/authentification';
import { GameService } from '../../services/game.service';
import { ToastService } from '../../services/toast.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { GameDetail, GameCharacter, RoomWithRules, GuessResult, CharacterScenario, ChatMessage, Progress } from '../../interfaces/all-interfaces';

@Component({
  selector: 'app-game',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './game.html',
  styleUrl: './game.sass',
})
export class Game implements OnInit {
  isLoggedIn$: Observable<boolean>;
  private destroy$ = new Subject<void>();

  // Game data
  gameId: number | null = null;
  game: GameDetail | null = null;
  loading = false;
  error: string | null = null;

  // UI State
  selectedRoom: RoomWithRules | null = null;
  selectedCharacter: GameCharacter | null = null;
  chatMessage = '';
  sendingMessage = false;
  chatError: string | null = null;
  messagesRemaining: number | null = null;

  // Guess State
  characterToGuess: GameCharacter | null = null;
  guessing = false;
  guessResult: GuessResult | null = null;
  guessMessage: string | null = null;
  guessScenarios: CharacterScenario[] = [];

  // XP animation state
  guessXpGained = 0;
  guessBonusXp = 0;
  xpBarPct = 0;
  xpBarTransitionDuration = '0ms';
  xpDisplayLevel = 0;
  xpLeveledUp = false;
  xpMaxLevel = false;

  // Notes state
  gameNotes = '';
  notesSaving = false;

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$();
  }
  
  ngOnInit(): void {
    // Subscribe to route params to get game ID
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.gameId = +id;
        this.loadGame();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGame(): void {
    if (!this.gameId) return;

    this.loading = true;
    this.error = null;

    this.gameService.getGame(this.gameId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.game) {
            const responseScenarios = response.character_scenarios ?? response.game.character_scenarios ?? [];

            this.game = {
              ...response.game,
              impostor: response.impostor ?? response.game.impostor ?? null,
              character_scenarios: responseScenarios,
            };

            // Auto-select first room if available
            if (this.game.rooms_with_rules?.length > 0) {
              this.selectedRoom = this.game.rooms_with_rules[0];
            }

            this.loadNotesForCurrentGame();
          } else {
            this.error = response.message || 'Failed to load game';
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to load game';
        }
      });
  }

  selectRoom(room: RoomWithRules): void {
    this.selectedRoom = room;
  }

  selectCharacter(character: GameCharacter): void {
    this.selectedCharacter = character;
    this.chatError = null;
    this.messagesRemaining = null;
  }

  closeChat(): void {
    this.selectedCharacter = null;
    this.chatError = null;
    this.messagesRemaining = null;
  }

  sendMessage(): void {
    if (!this.chatMessage.trim() || !this.selectedCharacter || !this.gameId || this.sendingMessage) return;
    
    const messageText = this.chatMessage.trim();
    const character = this.selectedCharacter;

    this.chatMessage = '';
    this.sendingMessage = true;
    this.chatError = null;


    const tempUserMessage: ChatMessage = {
      id: -Date.now(),
      sender: 'user',
      message_text: messageText,
      created_at: new Date().toISOString(),
    };
    character.conversation.messages.push(tempUserMessage);

    this.gameService.sendMessage(this.gameId, character.id, messageText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sendingMessage = false;
          if (response.success && response.user_message && response.ai_response) {
           
            const idx = character.conversation.messages.indexOf(tempUserMessage);
            if (idx !== -1) {
              character.conversation.messages[idx] = response.user_message;
            }
            
            character.conversation.messages.push(response.ai_response);

            if (this.selectedCharacter?.id === character.id) {
              this.messagesRemaining = response.messages_remaining ?? null;
            }
          } else {
            
            const idx = character.conversation.messages.indexOf(tempUserMessage);
            if (idx !== -1) character.conversation.messages.splice(idx, 1);
            if (this.selectedCharacter?.id === character.id) {
              this.chatError = response.message || 'Failed to send message';
            }
          }
        },
        error: (err) => {
          this.sendingMessage = false;
          const idx = character.conversation.messages.indexOf(tempUserMessage);
          if (idx !== -1) character.conversation.messages.splice(idx, 1);
          if (this.selectedCharacter?.id === character.id) {
            this.chatError = err.error?.message || 'Failed to send message';
          }
        }
      });
  }

  // Guess methods
  openGuessConfirm(character: GameCharacter): void {
    this.characterToGuess = character;
  }

  closeGuessConfirm(): void {
    this.characterToGuess = null;
  }

  confirmGuess(): void {
    if (!this.characterToGuess || !this.gameId || this.guessing) return;

    this.guessing = true;
    const progressBefore = this.authService.getCurrentProgress();

    this.gameService.guessImpostor(this.gameId, this.characterToGuess.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.guessing = false;
          this.characterToGuess = null;
          
          if (response.success && response.result) {
            this.guessResult = response.result;
            this.guessMessage = response.message;
            // Update game state to finished
            if (this.game && response.game) {
              this.game.is_finished = true;
              this.game.finished_at = response.game.finished_at;
              this.game.character_scenarios = response.game.character_scenarios;
              this.guessScenarios = response.game.character_scenarios;
            }
            // Sync finished status into the shared games list (aside)
            if (this.gameId && response.game) {
              this.gameService.getGames().subscribe({
                next: (gamesResponse) => {
                  if (gamesResponse.success && gamesResponse.games) {
                    this.gameService.updateGames(gamesResponse.games);
                  }
                }
              });
            }
            // Start XP animation
            this.startXpAnimation(
              progressBefore,
              response.progress ?? null,
              response.xp_gained ?? 0,
              response.bonus_xp ?? 0
            );
          }
        },
        error: (err) => {
          this.guessing = false;
          this.guessMessage = err.error?.message || 'Failed to submit guess';
        }
      });
  }

  closeGuessResult(): void {
    this.guessResult = null;
    this.guessMessage = null;
    this.guessScenarios = [];
    this.guessXpGained = 0;
    this.guessBonusXp = 0;
    this.xpLeveledUp = false;
  }

  updateNotes(): void {
    if (!this.gameId || this.notesSaving) {
      return;
    }

    const userId = this.getCurrentUserId();
    if (!userId) {
      this.toastService.error('You must be logged in to save notes.');
      return;
    }

    this.notesSaving = true;
    const savedLocal = this.gameService.saveGameNotes(userId, this.gameId, this.gameNotes);
    this.notesSaving = false;

    if (savedLocal) {
      this.toastService.success('Notes updated and saved locally for this game.');
      return;
    }

    this.toastService.error('Failed to save notes locally.');
  }

  get finishedGameScenarios(): CharacterScenario[] {
    return this.game?.character_scenarios ?? [];
  }

  getScenarioMomentLabel(index: number, totalSteps: number): string {
    if (index === 0) {
      return 'At the beginning';
    }

    if (index === totalSteps - 1) {
      return 'Finally';
    }

    if (index === 1) {
      return 'Then';
    }

    return 'After that';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) {
      return 'Just now';
    }
    return new Date(dateString).toLocaleString();
  }

  private startXpAnimation(progressBefore: Progress | null, progressAfter: Progress | null, xpGained: number, bonusXp: number): void {
    this.guessXpGained = xpGained;
    this.guessBonusXp = bonusXp;

    if (!progressAfter) return;

    this.xpMaxLevel = progressAfter.is_max_level;
    const fromPct = progressBefore?.xp_percentage ?? 0;
    const fromLevel = progressBefore?.level ?? progressAfter.level;
    const leveledUp = progressAfter.level > fromLevel;

    // Set initial state (no transition)
    this.xpBarTransitionDuration = '0ms';
    this.xpBarPct = fromPct;
    this.xpDisplayLevel = fromLevel;
    this.xpLeveledUp = false;

    if (!leveledUp) {
      // Simple fill to new percentage
      setTimeout(() => {
        this.xpBarTransitionDuration = '1200ms';
        this.xpBarPct = progressAfter.xp_percentage;
      }, 400);
    } else {
      // Phase 1: fill bar to 100%
      setTimeout(() => {
        this.xpBarTransitionDuration = '1000ms';
        this.xpBarPct = 100;
      }, 400);

      // Phase 2: level up flash, reset bar, fill to new percentage
      setTimeout(() => {
        this.xpBarTransitionDuration = '0ms';
        this.xpBarPct = 0;
        this.xpDisplayLevel = progressAfter.level;
        this.xpLeveledUp = true;
        setTimeout(() => {
          this.xpBarTransitionDuration = '1000ms';
          this.xpBarPct = progressAfter.xp_percentage;
        }, 150);
      }, 400 + 1000 + 400);
    }
  }

  private loadNotesForCurrentGame(): void {
    if (!this.gameId) {
      this.gameNotes = '';
      return;
    }

    const userId = this.getCurrentUserId();
    this.gameNotes = this.gameService.getGameNotes(userId, this.gameId);
  }

  private getCurrentUserId(): number | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }
  
}