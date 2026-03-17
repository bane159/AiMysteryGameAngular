// User interface with id, username (name), and email
export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

// Response for login endpoint
export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  errors?: ValidationErrors;
}

// Response for register endpoint
export interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  errors?: ValidationErrors;
}

// Response for logout endpoint
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// Response for me endpoint (get current user)
export interface MeResponse {
  success: boolean;
  user: User;
}

// Validation errors from Laravel
export interface ValidationErrors {
  name?: string[];
  email?: string[];
  password?: string[];
  [key: string]: string[] | undefined;
}

// Login request payload
export interface LoginRequest {
  email: string;
  password: string;
}

// Register request payload
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// Game-related interfaces
export interface GameStartRequest {
  ai_model_id?: number;
}

export interface AIModel {
  id: number;
  name: string;
  provider: string;
}

export interface Character {
  id: number;
  name: string;
  personality_description: string;
  is_impostor?: boolean;
}

export interface Rule {
  id: number;
  rule_text: string;
}

export interface Room {
  id: number;
  name: string;
  description?: string;
  selected_rules?: Rule[];
}

export interface Action {
  id: number;
  action_text: string;
  is_violation: boolean;
}

export interface ScenarioStep {
  step_order: number;
  room: {
    id: number;
    name: string;
  };
  rule: {
    id: number;
    rule_text: string;
  };
  action: {
    id: number;
    action_text: string;
    is_violation: boolean;
  };
}

export interface CharacterScenario {
  character: {
    id: number;
    name: string;
    is_impostor: boolean;
  };
  steps: ScenarioStep[];
}

export interface Game {
  id: number;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
  ai_model: AIModel;
  characters: Character[];
  rooms_with_rules: Room[];
  character_scenarios: CharacterScenario[];
 
}

export interface GameStartResponse {
  success: boolean;
  message: string;
  game?: Game;
  error?: string;
}

// Game list item (for sidebar/history)
export interface GameListItem {
  id: number;
  created_at: string;
  finished_at: string | null;
  is_finished: boolean;
  impostor: {
    id: number;
    name: string;
  } | null;
  ai_model: {
    id: number;
    name: string;
  };
}

// Response for games list endpoint
export interface GamesListResponse {
  success: boolean;
  games: GameListItem[];
}

// Single game detail interfaces
export interface ChatMessage {
  id: number;
  sender: 'user' | 'character';
  message_text: string;
  created_at: string | null;
}

export interface CharacterConversation {
  id: number | null;
  messages: ChatMessage[];
}

export interface GameCharacter {
  id: number;
  name: string;
  personality_description: string;
  conversation: CharacterConversation;
}

export interface RoomRule {
  id: number;
  rule_text: string;
}

export interface RoomWithRules {
  id: number;
  name: string;
  description: string;
  rules: RoomRule[];
}

export interface GameDetail {
  id: number;
  created_at: string;
  finished_at: string | null;
  is_finished: boolean;
  ai_model: AIModel;
  characters: GameCharacter[];
  rooms_with_rules: RoomWithRules[];
  impostor:string | null;
}

export interface GameDetailResponse {
  success: boolean;
  message?: string;
  game?: GameDetail;
}

// Send message interfaces
export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
  user_message?: ChatMessage;
  ai_response?: ChatMessage;
  messages_remaining?: number;
  error?: string;
}

// Guess interfaces
export interface GuessRequest {
  character_id: number;
}

export interface GuessResult {
  is_correct: boolean;
  guessed_character: {
    id: number;
    name: string;
  };
  actual_impostor: {
    id: number;
    name: string;
  };
}

export interface GuessResponse {
  success: boolean;
  message: string;
  result?: GuessResult;
  game?: {
    id: number;
    finished_at: string;
  };
}