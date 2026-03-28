import { Settings } from "../types/index.js";

export const DEFAULT_SETTINGS: Settings = {
  maxPlayers: 8,
  drawTime: 60,
  rounds: 3,
  language: "zh",
  wordCount: 3,
  hints: 2,
  customWords: [],
};

export const WORD_CHOOSE_TIME = 15; // seconds to choose a word
export const TURN_END_PAUSE = 5; // seconds between turns
export const ROUND_END_PAUSE = 8; // seconds between rounds

export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 2;

export const SCORE_GUESSER_BASE = 200;
export const SCORE_GUESSER_MIN = 50;
export const SCORE_DRAWER_BASE = 50;
export const SCORE_DRAWER_PER_GUESS = 10;

// Edit distance threshold for "close" guesses
export const CLOSE_GUESS_THRESHOLD = 1;
