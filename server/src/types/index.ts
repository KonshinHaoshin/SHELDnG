// Shared types for server and client

export enum GameEvent {
  // Connection
  JOIN_ROOM = "joinRoom",
  LEAVE_ROOM = "leaveRoom",
  JOINED_ROOM = "joinedRoom",
  PLAYER_JOINED = "playerJoined",
  PLAYER_LEFT = "playerLeft",
  // Game control
  START_GAME = "startGame",
  GAME_STARTED = "gameStarted",
  GAME_ENDED = "gameEnded",
  // Round
  CHOOSE_WORD = "chooseWord",
  CHOOSING_WORD = "choosingWord",
  WORD_SELECT = "wordSelect",
  WORD_CHOSEN = "wordChosen",
  TURN_END = "turnEnded",
  // Drawing
  DRAW = "draw",
  DRAW_DATA = "drawData",
  DRAW_CLEAR = "clear",
  DRAW_UNDO = "undo",
  // Guess/chat
  GUESS = "guess",
  GUESSED = "guessed",
  GUESS_HINT = "guessHint",
  CHAT_MESSAGE = "chatMessage",
  // Settings
  CHANGE_SETTING = "changeSettings",
  SETTINGS_CHANGED = "settingsChanged",
  // Admin
  VOTE_KICK = "voteKick",
  KICKED = "kicked",
  GAME_STATE = "gameState",
  // Error
  ERROR = "error",
}

export type GamePhase =
  | "waiting"
  | "choosingWord"
  | "drawing"
  | "turnEnd"
  | "roundEnd"
  | "gameEnd";

export interface Player {
  id: string; // supabase user id
  socketId: string;
  username: string;
  avatar: string;
  score: number;
  hasGuessed: boolean;
  isDrawing: boolean;
}

export interface DrawData {
  x: number;
  y: number;
  color: string;
  lineWidth: number;
  end: boolean; // marks stroke end
  tool: "brush" | "eraser" | "fill";
  fromX?: number;
  fromY?: number;
}

export interface Settings {
  maxPlayers: number; // default 8
  drawTime: number; // default 60s
  rounds: number; // default 3
  language: "zh" | "en";
  wordCount: number; // default 3
  hints: number; // default 2
  customWords: string[];
}

export interface GameState {
  phase: GamePhase;
  currentDrawer: string | null; // player id
  currentRound: number;
  totalRounds: number;
  wordHint: string | null; // masked word like "_ _ _ _"
  timeLeft: number;
  drawingData: DrawData[];
  turnResults?: TurnResult[];
}

export interface TurnResult {
  drawer: string;
  word: string;
  guessers: Array<{ id: string; username: string; timeToGuess: number }>;
  drawerScore: number;
}

export interface Room {
  roomId: string;
  creator: string; // player id
  players: Player[];
  gameState: GameState;
  settings: Settings;
  isPrivate: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  text: string;
  type: "chat" | "guess" | "correct" | "system" | "close";
  timestamp: number;
}
