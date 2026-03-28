// Shared types - mirrors server/src/types/index.ts

export enum GameEvent {
  JOIN_ROOM = "joinRoom",
  LEAVE_ROOM = "leaveRoom",
  JOINED_ROOM = "joinedRoom",
  PLAYER_JOINED = "playerJoined",
  PLAYER_LEFT = "playerLeft",
  START_GAME = "startGame",
  GAME_STARTED = "gameStarted",
  GAME_ENDED = "gameEnded",
  CHOOSE_WORD = "chooseWord",
  CHOOSING_WORD = "choosingWord",
  WORD_SELECT = "wordSelect",
  WORD_CHOSEN = "wordChosen",
  TURN_END = "turnEnded",
  DRAW = "draw",
  DRAW_DATA = "drawData",
  DRAW_CLEAR = "clear",
  DRAW_UNDO = "undo",
  GUESS = "guess",
  GUESSED = "guessed",
  GUESS_HINT = "guessHint",
  CHAT_MESSAGE = "chatMessage",
  CHANGE_SETTING = "changeSettings",
  SETTINGS_CHANGED = "settingsChanged",
  LIST_PUBLIC_ROOMS = "listPublicRooms",
  PUBLIC_ROOM_LIST = "publicRoomList",
  VOTE_KICK = "voteKick",
  KICKED = "kicked",
  GAME_STATE = "gameState",
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
  id: string;
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
  end: boolean;
  tool: "brush" | "eraser" | "fill";
  fromX?: number;
  fromY?: number;
}

export interface Settings {
  maxPlayers: number;
  drawTime: number;
  rounds: number;
  language: "zh" | "en";
  wordCount: number;
  hints: number;
  customWords: string[];
}

export interface GameState {
  phase: GamePhase;
  currentDrawer: string | null;
  currentRound: number;
  totalRounds: number;
  wordHint: string | null;
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
  creator: string;
  players: Player[];
  gameState: GameState;
  settings: Settings;
  isPrivate: boolean;
}

export interface PublicRoomSummary {
  roomId: string;
  creator: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  roundCount: number;
  drawTime: number;
  wordCount: number;
  customWordCount: number;
  phase: GamePhase;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  text: string;
  type: "chat" | "guess" | "correct" | "system" | "close";
  timestamp: number;
}

export type DrawTool = "brush" | "eraser" | "fill";
