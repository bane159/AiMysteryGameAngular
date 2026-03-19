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
  current_password?: string[];
  password_confirmation?: string[];
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

// Update profile payload
export interface UpdateProfileRequest {
  name: string;
  email: string;
}

// Response for profile update endpoint
export interface UpdateProfileResponse {
  success: boolean;
  message?: string;
  user?: User;
  errors?: ValidationErrors;
}

// Change password payload
export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

// Response for password update endpoint
export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
  errors?: ValidationErrors;
}

// ==================== GAME DOMAIN INTERFACES ====================

// Reference interfaces for minimal entity representations
export interface UserReference {
  id: number;
  name: string;
}

export interface CharacterReference {
  id: number;
  name: string;
}

// Core domain entities
export interface AIModel {
  id: number;
  name: string;
  provider: string;
}

export interface Character extends CharacterReference {
  personality_description: string;
  is_impostor?: boolean;
}

export interface Rule {
  id: number;
  rule_text: string;
}

export interface Action {
  id: number;
  action_text: string;
  is_violation: boolean;
}

export interface Room {
  id: number;
  name: string;
  description?: string;
  selected_rules?: Rule[];
}

// Scenario-related interfaces
export interface ScenarioStep {
  step_order: number;
  room: Room;
  rule: Rule;
  action: Action;
}

export interface CharacterScenario {
  character: Character;
  steps: ScenarioStep[];
}

// Chat and conversation interfaces
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

export interface GameCharacter extends Character {
  conversation: CharacterConversation;
}

// Room display interface (used in game detail)
export interface RoomWithRules {
  id: number;
  name: string;
  description: string;
  rules: Rule[];
}

// Game-related interfaces
export interface Game {
  id: number;
  created_at: string;
  user: UserReference;
  ai_model: AIModel;
  characters: Character[];
  rooms_with_rules: Room[];
  character_scenarios: CharacterScenario[];
}

export interface GameDetail {
  id: number;
  created_at: string;
  finished_at: string | null;
  is_finished: boolean;
  ai_model: AIModel;
  characters: GameCharacter[];
  rooms_with_rules: RoomWithRules[];
  impostor?: string | null;
  character_scenarios?: CharacterScenario[];
}

export interface GameListItem {
  id: number;
  created_at: string;
  finished_at: string | null;
  is_finished: boolean;
  impostor: CharacterReference | null;
  ai_model: AIModel;
}

// Game request/response interfaces
export interface GameStartRequest {
  ai_model_id?: number;
  difficulty?: string;
}

export interface GameStartResponse {
  success: boolean;
  message: string;
  game?: Game;
  error?: string;
}

export interface GameOptionItem {
  value: number | string;
  text: string;
}

export interface GameOptions {
  ai_models: GameOptionItem[];
  difficulties: GameOptionItem[];
}

export interface GameOptionsResponse {
  success: boolean;
  options: GameOptions;
}

export interface GamesListResponse {
  success: boolean;
  games: GameListItem[];
}

export interface DeleteGameResponse {
  success: boolean;
  message?: string;
}

export interface GameDetailResponse {
  success: boolean;
  message?: string;
  game?: GameDetail;
  impostor?: string;
  character_scenarios?: CharacterScenario[];
}

// Message-related interfaces
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

// Guess-related interfaces
export interface GuessRequest {
  character_id: number;
}

export interface GuessResult {
  is_correct: boolean;
  guessed_character: CharacterReference;
  actual_impostor: CharacterReference;
}

export interface GuessResponse {
  success: boolean;
  message: string;
  result?: GuessResult;
  game?: GuessGameData;
}

export interface GuessGameData {
  id: number;
  finished_at: string | null;
  character_scenarios: CharacterScenario[];
}