import { Server, Socket } from "socket.io";
import { nanoid } from "nanoid";
import {
  Room,
  Player,
  Settings,
  GameState,
  DrawData,
  GameEvent,
} from "../types/index.js";
import { DEFAULT_SETTINGS, MAX_PLAYERS, MIN_PLAYERS } from "./constants.js";
import { setRoom, getRoom, deleteRoom } from "../utils/redis.js";

// In-process room map for fast access
const rooms = new Map<string, Room>();
// Map socketId -> roomId
const socketRoomMap = new Map<string, string>();

export function generateRoomId(): string {
  return nanoid(8).toUpperCase();
}

function defaultGameState(): GameState {
  return {
    phase: "waiting",
    currentDrawer: null,
    currentRound: 0,
    totalRounds: 3,
    wordHint: null,
    timeLeft: 0,
    drawingData: [],
    turnResults: [],
  };
}

export async function createRoom(
  io: Server,
  socket: Socket,
  player: Player,
  settings: Partial<Settings> = {}
): Promise<Room> {
  const roomId = generateRoomId();
  const room: Room = {
    roomId,
    creator: player.id,
    players: [player],
    gameState: defaultGameState(),
    settings: { ...DEFAULT_SETTINGS, ...settings },
    isPrivate: false,
  };
  rooms.set(roomId, room);
  socketRoomMap.set(socket.id, roomId);
  await setRoom(roomId, room);
  await socket.join(roomId);
  return room;
}

export async function joinRoom(
  io: Server,
  socket: Socket,
  player: Player,
  roomId: string
): Promise<{ success: boolean; room?: Room; error?: string }> {
  let room = rooms.get(roomId);
  if (!room) {
    const stored = await getRoom(roomId);
    if (stored) {
      room = stored as Room;
      rooms.set(roomId, room);
    }
  }
  if (!room) return { success: false, error: "房间不存在" };
  if (room.players.length >= room.settings.maxPlayers)
    return { success: false, error: "房间人数已满" };
  if (room.gameState.phase !== "waiting")
    return { success: false, error: "游戏已经开始" };

  // Check if player is already in room (reconnect)
  const existing = room.players.findIndex((p) => p.id === player.id);
  if (existing !== -1) {
    room.players[existing].socketId = socket.id;
  } else {
    room.players.push(player);
  }

  socketRoomMap.set(socket.id, roomId);
  await socket.join(roomId);
  await setRoom(roomId, room);
  return { success: true, room };
}

export async function leaveRoom(
  io: Server,
  socket: Socket
): Promise<void> {
  const roomId = socketRoomMap.get(socket.id);
  if (!roomId) return;
  socketRoomMap.delete(socket.id);

  const room = rooms.get(roomId);
  if (!room) return;

  const playerIdx = room.players.findIndex((p) => p.socketId === socket.id);
  if (playerIdx === -1) return;

  const [leavingPlayer] = room.players.splice(playerIdx, 1);

  io.to(roomId).emit(GameEvent.PLAYER_LEFT, {
    playerId: leavingPlayer.id,
    username: leavingPlayer.username,
  });

  if (room.players.length === 0) {
    rooms.delete(roomId);
    await deleteRoom(roomId);
    return;
  }

  // Transfer creator if creator left
  if (room.creator === leavingPlayer.id && room.players.length > 0) {
    room.creator = room.players[0].id;
    io.to(roomId).emit(GameEvent.GAME_STATE, sanitizeRoom(room));
  }

  await setRoom(roomId, room);
  socket.leave(roomId);
}

export function getRoomBySocket(socketId: string): Room | null {
  const roomId = socketRoomMap.get(socketId);
  if (!roomId) return null;
  return rooms.get(roomId) ?? null;
}

export function getRoomById(roomId: string): Room | null {
  return rooms.get(roomId) ?? null;
}

export function updateRoom(room: Room): void {
  rooms.set(room.roomId, room);
  setRoom(room.roomId, room).catch(console.error);
}

export function sanitizeRoom(room: Room) {
  return {
    roomId: room.roomId,
    creator: room.creator,
    players: room.players,
    settings: room.settings,
    gameState: {
      ...room.gameState,
      // Don't send the actual word, only hint
      _currentWord: undefined,
    },
    isPrivate: room.isPrivate,
  };
}
