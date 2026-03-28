import React, { useState } from "react";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";
import { PlayerList } from "../Game/PlayerList";
import { RoomSettings } from "./RoomSettings";

export function LobbyScreen() {
  const { room, myPlayerId, startGame, leaveRoom, connected } = useRoom();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const isCreator = room.creator === myPlayerId;
  const canStart = room.players.length >= 2;

  const copyRoomId = () => {
    navigator.clipboard.writeText(room.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff9f4,#fff0e6)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-1">庇护所你画我猜</h1>
          <p className="text-gray-500">房主确认设置后即可开始本局</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Room info + players */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500">房间码</p>
                  <p className="text-3xl font-mono font-bold text-gray-800 tracking-wider">
                    {room.roomId}
                  </p>
                </div>
                <button
                  onClick={copyRoomId}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? "已复制" : "复制房间码"}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                把房间码发给朋友，对方输入后就能进房
              </p>
            </div>

            <PlayerList
              players={room.players}
              myPlayerId={myPlayerId}
              creator={room.creator}
              currentDrawer={null}
            />

            {/* Start button */}
            <div className="space-y-2">
              {isCreator ? (
                <button
                  onClick={startGame}
                  disabled={!canStart}
                  className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-colors shadow-md"
                >
                  {canStart ? "开始游戏" : `等待玩家加入（${room.players.length}/2）`}
                </button>
              ) : (
                <div className="w-full py-4 bg-gray-100 text-gray-500 text-center rounded-xl">
                  等待房主开始游戏…
                </div>
              )}
              <button
                onClick={leaveRoom}
                className="w-full py-2 text-red-500 hover:text-red-700 text-sm transition-colors"
              >
                离开房间
              </button>
            </div>
          </div>

          {/* Right: Settings */}
          <div>
            <RoomSettings settings={room.settings} isCreator={isCreator} />
          </div>
        </div>
      </div>
    </div>
  );
}
