import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/authentification';
import { GameService } from '../../services/game.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { GameDetail, GameCharacter, RoomWithRules, GuessResult, CharacterScenario } from '../../interfaces/all-interfaces';

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

  constructor(
    private authService: AuthService,
    private gameService: GameService,
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

            console.log(responseScenarios);
            // Auto-select first room if available
            if (this.game.rooms_with_rules?.length > 0) {
              this.selectedRoom = this.game.rooms_with_rules[0];
            }
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
    this.chatMessage = '';
    this.sendingMessage = true;
    this.chatError = null;

    this.gameService.sendMessage(this.gameId, this.selectedCharacter.id, messageText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sendingMessage = false;
          if (response.success && response.user_message && response.ai_response) {
            // Add both messages to the conversation
            if (this.selectedCharacter) {
              this.selectedCharacter.conversation.messages.push(response.user_message);
              this.selectedCharacter.conversation.messages.push(response.ai_response);
            }
            this.messagesRemaining = response.messages_remaining ?? null;
          } else {
            this.chatError = response.message || 'Failed to send message';
          }
        },
        error: (err) => {
          this.sendingMessage = false;
          this.chatError = err.error?.message || 'Failed to send message';
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
  }

  get finishedGameScenarios(): CharacterScenario[] {
    return this.game?.character_scenarios ?? [];
  }

  formatDate(dateString: string | null): string {
    if (!dateString) {
      return 'Just now';
    }
    return new Date(dateString).toLocaleString();
  }
  
}