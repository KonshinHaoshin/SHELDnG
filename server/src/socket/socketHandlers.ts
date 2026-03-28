import { Server, Socket } from "socket.io";
import { Player, Settings, DrawData, GameEvent } from "../types/index.js";
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomBySocket,
  getRoomById,
  updateRoom,
  sanitizeRoom,
  getPublicRoomSummaries,
} from "../game/gameController.js";
import {
  startGame,
  wordSelected,
  handleGuess,
} from "../game/roomController.js";

export function registerSocketHandlers(io: Server, socket: Socket): void {
  const user = (socket as any).user as {
    id: string;
    username: string;
    avatar: string;
  } | null;

  function emitPublicRoomList(target: Socket | Server = io) {
    target.emit(GameEvent.PUBLIC_ROOM_LIST, getPublicRoomSummaries());
  }

  function makePlayer(): Player {
    return {
      id: user?.id ?? socket.id,
      socketId: socket.id,
      username: user?.username ?? `游客_${socket.id.slice(0, 4)}`,
      avatar: user?.avatar ?? "",
      score: 0,
      hasGuessed: false,
      isDrawing: false,
    };
  }

  // --- Room events ---
  socket.on(GameEvent.JOIN_ROOM, async (data: { roomId?: string; settings?: Partial<Settings> }) => {
    const player = makePlayer();

    if (!data.roomId) {
      // Create new room
      const room = await createRoom(io, socket, player, data.settings);
      socket.emit(GameEvent.JOINED_ROOM, { room: sanitizeRoom(room), playerId: player.id });
      io.to(room.roomId).emit(GameEvent.PLAYER_JOINED, { player });
      emitPublicRoomList();
    } else {
      const result = await joinRoom(io, socket, player, data.roomId.toUpperCase());
      if (!result.success || !result.room) {
        socket.emit(GameEvent.ERROR, { message: result.error ?? "加入房间失败" });
        return;
      }
      socket.emit(GameEvent.JOINED_ROOM, { room: sanitizeRoom(result.room), playerId: player.id });
      socket.to(result.room.roomId).emit(GameEvent.PLAYER_JOINED, { player });
      // Send current drawing state to late joiners
      if (result.room.gameState.drawingData.length > 0) {
        socket.emit(GameEvent.DRAW_DATA, { batch: result.room.gameState.drawingData });
      }
      emitPublicRoomList();
    }
  });

  socket.on(GameEvent.LEAVE_ROOM, async () => {
    await leaveRoom(io, socket);
    emitPublicRoomList();
  });

  socket.on("disconnect", async () => {
    await leaveRoom(io, socket);
    emitPublicRoomList();
  });

  // --- Game events ---
  socket.on(GameEvent.START_GAME, () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    if (room.creator !== (user?.id ?? socket.id)) {
      socket.emit(GameEvent.ERROR, { message: "只有房主可以开始游戏" });
      return;
    }
    if (room.players.length < 2) {
      socket.emit(GameEvent.ERROR, { message: "至少需要 2 名玩家才能开始" });
      return;
    }
    startGame(io, room);
    emitPublicRoomList();
  });

  socket.on(GameEvent.WORD_SELECT, (data: { word: string }) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    if (room.gameState.phase !== "choosingWord") return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.id !== room.gameState.currentDrawer) return;
    wordSelected(io, room, socket.id, data.word);
  });

  // --- Drawing events ---
  socket.on(GameEvent.DRAW, (drawData: DrawData) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.id !== room.gameState.currentDrawer) return;
    if (room.gameState.phase !== "drawing") return;

    // Store drawing data for late joiners
    room.gameState.drawingData.push(drawData);
    updateRoom(room);

    // Broadcast to others
    socket.to(room.roomId).emit(GameEvent.DRAW_DATA, drawData);
  });

  socket.on(GameEvent.DRAW_CLEAR, () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.id !== room.gameState.currentDrawer) return;

    room.gameState.drawingData = [];
    updateRoom(room);
    socket.to(room.roomId).emit(GameEvent.DRAW_CLEAR);
  });

  socket.on(GameEvent.DRAW_UNDO, () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.id !== room.gameState.currentDrawer) return;

    // Remove last stroke (from last end:true to current)
    const data = room.gameState.drawingData;
    let i = data.length - 1;
    while (i >= 0 && !data[i].end) i--;
    // Remove from the previous end marker
    let j = i - 1;
    while (j >= 0 && !data[j].end) j--;
    room.gameState.drawingData = data.slice(0, j + 1);
    updateRoom(room);

    socket.to(room.roomId).emit(GameEvent.DRAW_UNDO, {
      drawingData: room.gameState.drawingData,
    });
  });

  // --- Guess/chat ---
  socket.on(GameEvent.GUESS, (data: { text: string }) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    handleGuess(io, room, player, data.text);
  });

  socket.on(GameEvent.CHAT_MESSAGE, (data: { text: string }) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    // Plain chat (not a guess attempt - only during non-drawing phase or from drawer)
    if (
      room.gameState.phase === "drawing" &&
      player.id !== room.gameState.currentDrawer
    ) {
      handleGuess(io, room, player, data.text);
    } else {
      io.to(room.roomId).emit(GameEvent.CHAT_MESSAGE, {
        id: Date.now().toString(),
        playerId: player.id,
        username: player.username,
        text: data.text,
        type: "chat",
        timestamp: Date.now(),
      });
    }
  });

  // --- Settings ---
  socket.on(GameEvent.CHANGE_SETTING, (data: Partial<Settings>) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    if (room.creator !== (user?.id ?? socket.id)) return;
    if (room.gameState.phase !== "waiting") return;
    Object.assign(room.settings, data);
    updateRoom(room);
    io.to(room.roomId).emit(GameEvent.SETTINGS_CHANGED, room.settings);
    emitPublicRoomList();
  });

  socket.on(GameEvent.LIST_PUBLIC_ROOMS, () => {
    emitPublicRoomList(socket);
  });

  // --- Game state sync ---
  socket.on(GameEvent.GAME_STATE, () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    socket.emit(GameEvent.GAME_STATE, sanitizeRoom(room));
  });
}
