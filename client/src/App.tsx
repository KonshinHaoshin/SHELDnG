import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { RoomProvider } from "./context/RoomContext";
import { useRoom } from "./context/RoomContext";
import { HomePage } from "./pages/HomePage";
import { LobbyScreen } from "./components/Lobby/LobbyScreen";
import { GameScreen } from "./components/Game/GameScreen";

function AppContent() {
  const { room } = useRoom();

  if (!room) return <HomePage />;

  const phase = room.gameState.phase;

  if (phase === "waiting") return <LobbyScreen />;

  return <GameScreen />;
}

export function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <AppContent />
      </RoomProvider>
    </AuthProvider>
  );
}
