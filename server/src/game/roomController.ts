import { Server, Socket } from "socket.io";
import {
  Room,
  Player,
  GameEvent,
  TurnResult,
  DrawData,
  GamePhase,
} from "../types/index.js";
import {
  WORD_CHOOSE_TIME,
  TURN_END_PAUSE,
  ROUND_END_PAUSE,
  SCORE_GUESSER_BASE,
  SCORE_GUESSER_MIN,
  SCORE_DRAWER_BASE,
  SCORE_DRAWER_PER_GUESS,
  CLOSE_GUESS_THRESHOLD,
} from "./constants.js";
import { getRandomWords, maskWord, revealLetter, editDistance } from "../utils/words.js";
import { updateRoom, sanitizeRoom } from "./gameController.js";

// Extended room state (not persisted in Room type, lives in memory)
interface RoomRuntimeState {
  currentWord: string;
  wordChoiceTimeout: ReturnType<typeof setTimeout> | null;
  drawTimeout: ReturnType<typeof setTimeout> | null;
  hintTimeouts: ReturnType<typeof setTimeout>[];
  turnStartTime: number;
  guessedPlayers: Map<string, number>; // playerId -> timeToGuess
  drawerQueue: string[]; // player IDs in draw order
}

const runtimeStates = new Map<string, RoomRuntimeState>();

function getRuntimeState(roomId: string): RoomRuntimeState {
  if (!runtimeStates.has(roomId)) {
    runtimeStates.set(roomId, {
      currentWord: "",
      wordChoiceTimeout: null,
      drawTimeout: null,
      hintTimeouts: [],
      turnStartTime: 0,
      guessedPlayers: new Map(),
      drawerQueue: [],
    });
  }
  return runtimeStates.get(roomId)!;
}

function clearRuntimeTimers(state: RoomRuntimeState) {
  if (state.wordChoiceTimeout) clearTimeout(state.wordChoiceTimeout);
  if (state.drawTimeout) clearTimeout(state.drawTimeout);
  state.hintTimeouts.forEach(clearTimeout);
  state.wordChoiceTimeout = null;
  state.drawTimeout = null;
  state.hintTimeouts = [];
}

export function startGame(io: Server, room: Room): void {
  const state = getRuntimeState(room.roomId);
  clearRuntimeTimers(state);

  // Build drawer queue: all players in order, cycling through rounds
  state.drawerQueue = room.players.map((p) => p.id);

  room.gameState.currentRound = 1;
  room.gameState.totalRounds = room.settings.rounds;
  room.gameState.phase = "drawing";
  room.gameState.drawingData = [];

  // Reset scores
  room.players.forEach((p) => {
    p.score = 0;
    p.hasGuessed = false;
    p.isDrawing = false;
  });

  updateRoom(room);
  io.to(room.roomId).emit(GameEvent.GAME_STARTED, sanitizeRoom(room));

  nextTurn(io, room);
}

function nextTurn(io: Server, room: Room): void {
  const state = getRuntimeState(room.roomId);
  clearRuntimeTimers(state);

  if (room.players.length < 2) {
    endGame(io, room);
    return;
  }

  // Get next drawer
  const queue = state.drawerQueue;
  if (queue.length === 0) {
    // All players in this round have drawn → next round
    room.gameState.currentRound += 1;
    if (room.gameState.currentRound > room.gameState.totalRounds) {
      endGame(io, room);
      return;
    }
    // Rebuild queue for next round
    state.drawerQueue = room.players.map((p) => p.id);
  }

  const drawerId = state.drawerQueue.shift()!;
  const drawer = room.players.find((p) => p.id === drawerId);
  if (!drawer) {
    nextTurn(io, room);
    return;
  }

  // Reset per-turn state
  state.guessedPlayers = new Map();
  room.players.forEach((p) => {
    p.hasGuessed = false;
    p.isDrawing = p.id === drawerId;
  });
  room.gameState.currentDrawer = drawerId;
  room.gameState.drawingData = [];
  room.gameState.wordHint = null;
  room.gameState.phase = "choosingWord";
  room.gameState.timeLeft = WORD_CHOOSE_TIME;

  updateRoom(room);

  // Generate word choices for the drawer
  const wordChoices = getRandomWords(
    room.settings.language,
    room.settings.wordCount,
    room.settings.customWords
  );

  // Tell everyone we're choosing
  io.to(room.roomId).emit(GameEvent.CHOOSING_WORD, {
    drawerId,
    drawerName: drawer.username,
    timeLeft: WORD_CHOOSE_TIME,
    gameState: sanitizeRoom(room).gameState,
  });

  // Tell drawer the word choices
  io.to(drawer.socketId).emit(GameEvent.WORD_SELECT, {
    words: wordChoices,
    timeLeft: WORD_CHOOSE_TIME,
  });

  // Auto-select word if drawer doesn't respond
  state.wordChoiceTimeout = setTimeout(() => {
    const autoWord = wordChoices[Math.floor(Math.random() * wordChoices.length)];
    wordSelected(io, room, drawer.socketId, autoWord);
  }, WORD_CHOOSE_TIME * 1000);
}

export function wordSelected(
  io: Server,
  room: Room,
  drawerSocketId: string,
  word: string
): void {
  const state = getRuntimeState(room.roomId);
  if (state.wordChoiceTimeout) {
    clearTimeout(state.wordChoiceTimeout);
    state.wordChoiceTimeout = null;
  }

  state.currentWord = word;
  state.turnStartTime = Date.now();

  const hint = maskWord(word);
  room.gameState.wordHint = hint;
  room.gameState.phase = "drawing";
  room.gameState.timeLeft = room.settings.drawTime;

  updateRoom(room);

  // Tell everyone the word has been chosen (but not the word itself)
  io.to(room.roomId).emit(GameEvent.WORD_CHOSEN, {
    drawerId: room.gameState.currentDrawer,
    hint,
    wordLength: word.length,
    timeLeft: room.settings.drawTime,
    gameState: sanitizeRoom(room).gameState,
  });

  // Tell drawer the actual word
  io.to(drawerSocketId).emit(GameEvent.CHOOSE_WORD, { word, hint });

  // Schedule hints
  scheduleHints(io, room, word, hint);

  // Schedule turn end
  state.drawTimeout = setTimeout(() => {
    endTurn(io, room, "timeout");
  }, room.settings.drawTime * 1000);
}

function scheduleHints(
  io: Server,
  room: Room,
  word: string,
  initialHint: string
): void {
  const state = getRuntimeState(room.roomId);
  state.hintTimeouts = [];
  let currentHint = initialHint;

  const drawTime = room.settings.drawTime * 1000;
  // Reveal at 50% time
  const firstHintTime = drawTime * 0.5;
  // Then every 10s after that
  const interval = 10000;

  let hintCount = 0;
  const maxHints = room.settings.hints;

  const scheduleNextHint = (delay: number) => {
    if (hintCount >= maxHints) return;
    const t = setTimeout(() => {
      hintCount++;
      const newHint = revealLetter(word, currentHint, 1);
      if (newHint !== currentHint) {
        currentHint = newHint;
        room.gameState.wordHint = currentHint;
        updateRoom(room);
        io.to(room.roomId).emit(GameEvent.GUESS_HINT, { hint: currentHint });
      }
      if (hintCount < maxHints) {
        scheduleNextHint(interval);
      }
    }, delay);
    state.hintTimeouts.push(t);
  };

  scheduleNextHint(firstHintTime);
}

export function handleGuess(
  io: Server,
  room: Room,
  player: Player,
  text: string
): void {
  const state = getRuntimeState(room.roomId);

  // Drawer can't guess
  if (player.id === room.gameState.currentDrawer) return;
  // Already guessed
  if (player.hasGuessed) return;
  // Not in drawing phase
  if (room.gameState.phase !== "drawing") return;

  const normalizedGuess = text.trim().toLowerCase();
  const normalizedWord = state.currentWord.trim().toLowerCase();

  if (normalizedGuess === normalizedWord) {
    // Correct guess!
    const timeElapsed = (Date.now() - state.turnStartTime) / 1000;
    const score = Math.max(
      SCORE_GUESSER_MIN,
      SCORE_GUESSER_BASE - Math.floor(timeElapsed)
    );
    player.hasGuessed = true;
    player.score += score;
    state.guessedPlayers.set(player.id, timeElapsed);

    // Private: notify guesser they got it
    io.to(room.roomId).emit(GameEvent.GUESSED, {
      playerId: player.id,
      username: player.username,
      score,
      totalScore: player.score,
    });

    // System message to all
    io.to(room.roomId).emit(GameEvent.CHAT_MESSAGE, {
      id: Date.now().toString(),
      playerId: "system",
      username: "系统",
      text: `${player.username} 猜中了答案！`,
      type: "correct",
      timestamp: Date.now(),
    });

    updateRoom(room);

    // Check if all non-drawers have guessed
    const nonDrawers = room.players.filter(
      (p) => p.id !== room.gameState.currentDrawer
    );
    if (nonDrawers.every((p) => p.hasGuessed)) {
      endTurn(io, room, "allGuessed");
    }
  } else {
    // Check closeness
    const distance = editDistance(normalizedGuess, normalizedWord);
    if (distance <= CLOSE_GUESS_THRESHOLD) {
      // Send private hint to guesser
      io.to(player.socketId).emit(GameEvent.CHAT_MESSAGE, {
        id: Date.now().toString(),
        playerId: "system",
        username: "系统",
        text: "已经非常接近了！",
        type: "system",
        timestamp: Date.now(),
      });
    }

    // Broadcast as chat message (don't reveal the guess to others if it's close)
    io.to(room.roomId).emit(GameEvent.CHAT_MESSAGE, {
      id: Date.now().toString(),
      playerId: player.id,
      username: player.username,
      text,
      type: "chat",
      timestamp: Date.now(),
    });
  }
}

function endTurn(
  io: Server,
  room: Room,
  reason: "timeout" | "allGuessed"
): void {
  const state = getRuntimeState(room.roomId);
  clearRuntimeTimers(state);

  // Calculate drawer score
  const guessCount = state.guessedPlayers.size;
  const drawerScore =
    guessCount > 0
      ? SCORE_DRAWER_BASE + guessCount * SCORE_DRAWER_PER_GUESS
      : 0;

  const drawer = room.players.find((p) => p.id === room.gameState.currentDrawer);
  if (drawer) drawer.score += drawerScore;

  const turnResult: TurnResult = {
    drawer: room.gameState.currentDrawer!,
    word: state.currentWord,
    guessers: Array.from(state.guessedPlayers.entries()).map(([id, time]) => {
      const p = room.players.find((pp) => pp.id === id);
      return { id, username: p?.username ?? "?", timeToGuess: time };
    }),
    drawerScore,
  };

  room.gameState.phase = "turnEnd";
  room.gameState.turnResults = [
    ...(room.gameState.turnResults ?? []),
    turnResult,
  ];

  updateRoom(room);

  io.to(room.roomId).emit(GameEvent.TURN_END, {
    reason,
    word: state.currentWord,
    turnResult,
    players: room.players,
  });

  // Pause then go to next turn
  setTimeout(() => {
    nextTurn(io, room);
  }, TURN_END_PAUSE * 1000);
}

function endGame(io: Server, room: Room): void {
  const state = getRuntimeState(room.roomId);
  clearRuntimeTimers(state);
  runtimeStates.delete(room.roomId);

  room.gameState.phase = "gameEnd";
  room.players.forEach((p) => (p.isDrawing = false));

  // Sort by score
  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  updateRoom(room);

  io.to(room.roomId).emit(GameEvent.GAME_ENDED, {
    players: sorted,
    winner: sorted[0],
  });

  // Reset room state for next game
  setTimeout(() => {
    room.gameState = {
      phase: "waiting",
      currentDrawer: null,
      currentRound: 0,
      totalRounds: room.settings.rounds,
      wordHint: null,
      timeLeft: 0,
      drawingData: [],
      turnResults: [],
    };
    room.players.forEach((p) => {
      p.score = 0;
      p.hasGuessed = false;
      p.isDrawing = false;
    });
    updateRoom(room);
    io.to(room.roomId).emit(GameEvent.GAME_STATE, sanitizeRoom(room));
  }, ROUND_END_PAUSE * 1000);
}
