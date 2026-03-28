import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { RoomProvider } from "./context/RoomContext";
import { useRoom } from "./context/RoomContext";
import { HomePage } from "./pages/HomePage";
import { PublicLobbyPage } from "./pages/PublicLobbyPage";
import { LobbyScreen } from "./components/Lobby/LobbyScreen";
import { GameScreen } from "./components/Game/GameScreen";

function getPageFromPath() {
  return window.location.pathname === "/lobby" ? "lobby" : "home";
}

function AppContent() {
  const { room } = useRoom();
  const [page, setPage] = React.useState<"home" | "lobby">(getPageFromPath);

  React.useEffect(() => {
    const handlePopState = () => {
      setPage(getPageFromPath());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openLobby = () => {
    window.history.pushState({}, "", "/lobby");
    setPage("lobby");
  };

  const goHome = () => {
    window.history.pushState({}, "", "/");
    setPage("home");
  };

  if (!room) {
    if (page === "lobby") {
      return <PublicLobbyPage onBack={goHome} />;
    }

    return <HomePage onOpenLobby={openLobby} />;
  }

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
