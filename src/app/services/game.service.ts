import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameStartRequest, GameStartResponse, GamesListResponse, GameDetailResponse, SendMessageRequest, SendMessageResponse, GuessRequest, GuessResponse, GameListItem, DeleteGameResponse } from '../interfaces/all-interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private apiUrl = environment.apiUrl;

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

  // Delete a game by ID
  deleteGame(gameId: number): Observable<DeleteGameResponse> {
    return this.http.delete<DeleteGameResponse>(`${this.apiUrl}/games/${gameId}`);
  }

  updateGames(games: GameListItem[]): void {
    this.gamesSubject.next(games);
  }

  // Start a new game
  startGame(aiModelId?: number): Observable<GameStartResponse> {
    const payload: GameStartRequest = {};
    
    if (aiModelId !== undefined) {
      payload.ai_model_id = aiModelId;
    }

    return this.http.post<GameStartResponse>(
      `${this.apiUrl}/games/start`, 
      payload
    );
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
}
