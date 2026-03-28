import React from "react";
import { Player } from "../../types";

interface PlayerListProps {
  players: Player[];
  myPlayerId: string | null;
  creator: string;
  currentDrawer: string | null;
}

export function PlayerList({
  players,
  myPlayerId,
  creator,
  currentDrawer,
}: PlayerListProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-600">
          玩家列表（{players.length}）
        </h3>
      </div>
      <ul className="divide-y divide-gray-100">
        {sorted.map((player, i) => (
          <li
            key={player.id}
            className={`flex items-center gap-2 px-3 py-2 ${
              player.id === myPlayerId ? "bg-blue-50" : ""
            }`}
          >
            <span className="text-xs text-gray-400 w-4">{i + 1}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={player.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                player.username[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-800 truncate">
                  {player.username}
                </span>
                {player.id === myPlayerId && (
                  <span className="text-xs text-blue-500">（你）</span>
                )}
                {player.id === creator && (
                  <span title="房主">👑</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {player.isDrawing && (
                <span title="正在作画">✏️</span>
              )}
              {player.hasGuessed && !player.isDrawing && (
                <span title="已猜中">✅</span>
              )}
              <span className="text-sm font-bold text-gray-700 tabular-nums">
                {player.score}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
