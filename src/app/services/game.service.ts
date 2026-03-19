import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameStartRequest, GameStartResponse, GamesListResponse, GameDetailResponse, SendMessageRequest, SendMessageResponse, GuessRequest, GuessResponse, GameListItem, DeleteGameResponse, GameOptionsResponse } from '../interfaces/all-interfaces';
import { environment } from '../../environments/environment';

export type GameStatusFilter = 'all' | 'in-progress' | 'finished' | 'favorites';
export type GameSortOrder = 'newest' | 'oldest';

export interface GameListViewOptions {
  searchQuery: string;
  statusFilter: GameStatusFilter;
  sortOrder: GameSortOrder;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private apiUrl = environment.apiUrl;
  private currentUserId: number | null = null;
  private favoriteGameIds = new Set<number>();

  constructor(private http: HttpClient) {}


  private gamesSubject = new BehaviorSubject<GameListItem[]>([]);
  games$ = this.gamesSubject.asObservable();


  // Get all games for the current user
  getGames(): Observable<GamesListResponse> {
    return this.http.get<GamesListResponse>(`${this.apiUrl}/games`);
  }

  // Get a specific game by ID
  getGame(gameId: number): Observable<GameDetailResponse> {
    return this.http.get<GameDetailResponse>(`${this.apiUrl}/games/${gameId}`);
  }


  deleteGame(gameId: number): Observable<DeleteGameResponse> {
    return this.http.delete<DeleteGameResponse>(`${this.apiUrl}/games/${gameId}`);
  }

  updateGames(games: GameListItem[]): void {
    this.gamesSubject.next(games);
  }

  removeGameFromState(gameId: number): void {
    const updatedGames = this.gamesSubject.value.filter((game) => game.id !== gameId);
    this.gamesSubject.next(updatedGames);
    this.removeFavorite(gameId);
  }

  initializeUserFavorites(userId: number | null): void {
    this.currentUserId = userId;

    if (!userId) {
      this.favoriteGameIds.clear();
      return;
    }

    this.loadFavorites();
  }

  clearUserFavorites(): void {
    this.currentUserId = null;
    this.favoriteGameIds.clear();
  }

  isFavorite(gameId: number): boolean {
    return this.favoriteGameIds.has(gameId);
  }

  toggleFavorite(gameId: number): boolean {
    if (this.favoriteGameIds.has(gameId)) {
      this.favoriteGameIds.delete(gameId);
      this.persistFavorites();
      return false;
    }

    this.favoriteGameIds.add(gameId);
    this.persistFavorites();
    return true;
  }

  removeFavorite(gameId: number): void {
    if (!this.favoriteGameIds.has(gameId)) {
      return;
    }

    this.favoriteGameIds.delete(gameId);
    this.persistFavorites();
  }

  getDisplayedGames(games: GameListItem[], options: GameListViewOptions): GameListItem[] {
    const query = options.searchQuery.trim().toLowerCase();

    const filtered = games.filter((game) => {
      if (options.statusFilter === 'finished' && !game.is_finished) {
        return false;
      }

      if (options.statusFilter === 'in-progress' && game.is_finished) {
        return false;
      }

      if (options.statusFilter === 'favorites' && !this.isFavorite(game.id)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const impostorName = game.impostor?.name?.toLowerCase() || 'unknown';
      return (`${game.id}`.includes(query) || impostorName.includes(query));
    });

    return filtered.sort((a, b) => {
      const aFavorite = this.isFavorite(a.id);
      const bFavorite = this.isFavorite(b.id);

      if (aFavorite !== bFavorite) {
        return aFavorite ? -1 : 1;
      }

      const first = new Date(a.created_at).getTime();
      const second = new Date(b.created_at).getTime();
      return options.sortOrder === 'newest' ? second - first : first - second;
    });
  }

  // Start a new game
  startGame(aiModelId?: number, difficulty?: string): Observable<GameStartResponse> {
    const payload: GameStartRequest = {};
    
    if (aiModelId !== undefined) {
      payload.ai_model_id = aiModelId;
    }

    if (difficulty) {
      payload.difficulty = difficulty;
    }

    return this.http.post<GameStartResponse>(
      `${this.apiUrl}/games/start`, 
      payload
    );
  }

  getGameOptions(): Observable<GameOptionsResponse> {
    return this.http.get<GameOptionsResponse>(`${this.apiUrl}/games/options`);
  }

  // Send a message to a character in a game
  sendMessage(gameId: number, characterId: number, message: string): Observable<SendMessageResponse> {
    const payload: SendMessageRequest = { message };
    return this.http.post<SendMessageResponse>(
      `${this.apiUrl}/games/${gameId}/characters/${characterId}/message`,
      payload
    );
  }

  // Guess the impostor
  guessImpostor(gameId: number, characterId: number): Observable<GuessResponse> {
    const payload: GuessRequest = { character_id: characterId };
    return this.http.post<GuessResponse>(
      `${this.apiUrl}/games/${gameId}/guess`,
      payload
    );
  }

  getGameNotes(userId: number | null, gameId: number): string {
    const key = this.getGameNotesStorageKey(userId, gameId);
    if (!key) {
      return '';
    }

    return localStorage.getItem(key) ?? '';
  }

  saveGameNotes(userId: number | null, gameId: number, notes: string): boolean {
    const key = this.getGameNotesStorageKey(userId, gameId);
    if (!key) {
      return false;
    }

    try {
      if (notes.trim()) {
        localStorage.setItem(key, notes);
      } else {
        localStorage.removeItem(key);
      }

      return true;
    } catch {
      return false;
    }
  }

  private loadFavorites(): void {
    this.favoriteGameIds.clear();

    const key = this.getFavoritesStorageKey();
    if (!key) {
      return;
    }

    const favorites = localStorage.getItem(key);
    if (!favorites) {
      return;
    }

    try {
      const parsed = JSON.parse(favorites) as number[];
      this.favoriteGameIds = new Set(parsed.filter((id) => Number.isInteger(id)));
    } catch {
      this.favoriteGameIds = new Set<number>();
    }
  }

  private persistFavorites(): void {
    const key = this.getFavoritesStorageKey();
    if (!key) {
      return;
    }

    localStorage.setItem(key, JSON.stringify(Array.from(this.favoriteGameIds)));
  }

  private getFavoritesStorageKey(): string | null {
    if (!this.currentUserId) {
      return null;
    }

    return `favorite_games_user_${this.currentUserId}`;
  }

  private getGameNotesStorageKey(userId: number | null, gameId: number): string | null {
    if (!userId || !gameId) {
      return null;
    }

    return `game_notes_user_${userId}_game_${gameId}`;
  }
}
