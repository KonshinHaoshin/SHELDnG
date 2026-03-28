import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Socket } from "socket.io-client";
import {
  Room,
  Player,
  Settings,
  DrawData,
  GameEvent,
  ChatMessage,
  TurnResult,
  PublicRoomSummary,
} from "../types";
import { getSocket } from "../lib/socket";
import { useAuth } from "./AuthContext";

interface RoomContextValue {
  socket: Socket | null;
  room: Room | null;
  myPlayerId: string | null;
  messages: ChatMessage[];
  publicRooms: PublicRoomSummary[];
  wordChoices: string[] | null;
  myWord: string | null; // the word if I'm drawing
  connected: boolean;
  // Actions
  createRoom: (settings?: Partial<Settings>) => void;
  joinRoom: (roomId: string) => void;
  refreshPublicRooms: () => void;
  leaveRoom: () => void;
  startGame: () => void;
  selectWord: (word: string) => void;
  sendDraw: (data: DrawData) => void;
  sendClear: () => void;
  sendUndo: () => void;
  sendGuess: (text: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

const RoomContext = createContext<RoomContextValue>({
  socket: null,
  room: null,
  myPlayerId: null,
  messages: [],
  publicRooms: [],
  wordChoices: null,
  myWord: null,
  connected: false,
  createRoom: () => {},
  joinRoom: () => {},
  refreshPublicRooms: () => {},
  leaveRoom: () => {},
  startGame: () => {},
  selectWord: () => {},
  sendDraw: () => {},
  sendClear: () => {},
  sendUndo: () => {},
  sendGuess: () => {},
  updateSettings: () => {},
});

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [wordChoices, setWordChoices] = useState<string[] | null>(null);
  const [myWord, setMyWord] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev.slice(-199), msg]);
  }, []);

  useEffect(() => {
    const token = session?.access_token;
    const s = getSocket(token);
    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    s.on(GameEvent.JOINED_ROOM, ({ room, playerId }: { room: Room; playerId: string }) => {
      setRoom(room);
      setMyPlayerId(playerId);
      setMessages([]);
      setWordChoices(null);
      setMyWord(null);
    });

    s.on(GameEvent.PUBLIC_ROOM_LIST, (rooms: PublicRoomSummary[]) => {
      setPublicRooms(rooms);
    });

    s.on(GameEvent.PLAYER_JOINED, ({ player }: { player: Player }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.players.find((p) => p.id === player.id);
        if (exists) return prev;
        return { ...prev, players: [...prev.players, player] };
      });
      addMessage({
        id: Date.now().toString(),
        playerId: "system",
        username: "系统",
        text: `${player.username} 加入了房间`,
        type: "system",
        timestamp: Date.now(),
      });
    });

    s.on(GameEvent.PLAYER_LEFT, ({ playerId, username }: { playerId: string; username: string }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, players: prev.players.filter((p) => p.id !== playerId) };
      });
      addMessage({
        id: Date.now().toString(),
        playerId: "system",
        username: "系统",
        text: `${username} 离开了房间`,
        type: "system",
        timestamp: Date.now(),
      });
    });

    s.on(GameEvent.GAME_STARTED, (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setMessages([]);
    });

    s.on(GameEvent.CHOOSING_WORD, (data: { drawerId: string; drawerName: string; timeLeft: number; gameState: any }) => {
      setRoom((prev) => prev ? { ...prev, gameState: { ...prev.gameState, ...data.gameState } } : prev);
      setWordChoices(null);
      setMyWord(null);
    });

    s.on(GameEvent.WORD_SELECT, ({ words }: { words: string[] }) => {
      setWordChoices(words);
    });

    s.on(GameEvent.CHOOSE_WORD, ({ word }: { word: string }) => {
      setMyWord(word);
      setWordChoices(null);
    });

    s.on(GameEvent.WORD_CHOSEN, (data: { hint: string; timeLeft: number; gameState: any }) => {
      setRoom((prev) => prev ? { ...prev, gameState: { ...prev.gameState, ...data.gameState } } : prev);
    });

    s.on(GameEvent.DRAW_DATA, (data: DrawData | { batch: DrawData[] }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const newData = "batch" in data ? data.batch : [data];
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            drawingData: [...prev.gameState.drawingData, ...newData],
          },
        };
      });
    });

    s.on(GameEvent.DRAW_CLEAR, () => {
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, gameState: { ...prev.gameState, drawingData: [] } };
      });
    });

    s.on(GameEvent.DRAW_UNDO, ({ drawingData }: { drawingData: DrawData[] }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, gameState: { ...prev.gameState, drawingData } };
      });
    });

    s.on(GameEvent.CHAT_MESSAGE, (msg: ChatMessage) => {
      addMessage(msg);
    });

    s.on(GameEvent.GUESSED, (data: { playerId: string; username: string; score: number; totalScore: number }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === data.playerId
              ? { ...p, hasGuessed: true, score: data.totalScore }
              : p
          ),
        };
      });
    });

    s.on(GameEvent.GUESS_HINT, ({ hint }: { hint: string }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, gameState: { ...prev.gameState, wordHint: hint } };
      });
    });

    s.on(GameEvent.TURN_END, (data: { word: string; turnResult: TurnResult; players: Player[] }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: data.players,
          gameState: {
            ...prev.gameState,
            phase: "turnEnd",
            drawingData: [],
          },
        };
      });
      setMyWord(null);
      setWordChoices(null);
      addMessage({
        id: Date.now().toString(),
        playerId: "system",
        username: "系统",
        text: `本轮答案：${data.word}`,
        type: "system",
        timestamp: Date.now(),
      });
    });

    s.on(GameEvent.GAME_ENDED, (data: { players: Player[]; winner: Player }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: data.players,
          gameState: { ...prev.gameState, phase: "gameEnd" },
        };
      });
      addMessage({
        id: Date.now().toString(),
        playerId: "system",
        username: "系统",
        text: `本局结束，第一名是 ${data.winner?.username}`,
        type: "system",
        timestamp: Date.now(),
      });
    });

    s.on(GameEvent.GAME_STATE, (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    s.on(GameEvent.SETTINGS_CHANGED, (settings: Settings) => {
      setRoom((prev) => prev ? { ...prev, settings } : prev);
    });

    s.on(GameEvent.ERROR, ({ message }: { message: string }) => {
      addMessage({
        id: Date.now().toString(),
        playerId: "system",
        username: "提示",
        text: message,
        type: "system",
        timestamp: Date.now(),
      });
    });

    s.connect();
    s.emit(GameEvent.LIST_PUBLIC_ROOMS);

    return () => {
      s.off("connect");
      s.off("disconnect");
      Object.values(GameEvent).forEach((ev) => s.off(ev));
    };
  }, [session?.access_token, addMessage]);

  const createRoom = useCallback((settings?: Partial<Settings>) => {
    socketRef.current?.emit(GameEvent.JOIN_ROOM, { settings });
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit(GameEvent.JOIN_ROOM, { roomId });
  }, []);

  const refreshPublicRooms = useCallback(() => {
    socketRef.current?.emit(GameEvent.LIST_PUBLIC_ROOMS);
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit(GameEvent.LEAVE_ROOM);
    setRoom(null);
    setMyPlayerId(null);
    setMessages([]);
    setWordChoices(null);
    setMyWord(null);
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit(GameEvent.START_GAME);
  }, []);

  const selectWord = useCallback((word: string) => {
    socketRef.current?.emit(GameEvent.WORD_SELECT, { word });
    setWordChoices(null);
  }, []);

  const sendDraw = useCallback((data: DrawData) => {
    socketRef.current?.emit(GameEvent.DRAW, data);
  }, []);

  const sendClear = useCallback(() => {
    socketRef.current?.emit(GameEvent.DRAW_CLEAR);
    setRoom((prev) => {
      if (!prev) return prev;
      return { ...prev, gameState: { ...prev.gameState, drawingData: [] } };
    });
  }, []);

  const sendUndo = useCallback(() => {
    socketRef.current?.emit(GameEvent.DRAW_UNDO);
  }, []);

  const sendGuess = useCallback((text: string) => {
    socketRef.current?.emit(GameEvent.GUESS, { text });
  }, []);

  const updateSettings = useCallback((settings: Partial<Settings>) => {
    socketRef.current?.emit(GameEvent.CHANGE_SETTING, settings);
  }, []);

  return (
    <RoomContext.Provider
      value={{
        socket,
        room,
        myPlayerId,
        messages,
        publicRooms,
        wordChoices,
        myWord,
        connected,
        createRoom,
        joinRoom,
        refreshPublicRooms,
        leaveRoom,
        startGame,
        selectWord,
        sendDraw,
        sendClear,
        sendUndo,
        sendGuess,
        updateSettings,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  return useContext(RoomContext);
}
