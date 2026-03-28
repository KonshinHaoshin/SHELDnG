import React from "react";
import { Player } from "../../types";

interface ScoreboardProps {
  players: Player[];
  winner?: Player;
  onPlayAgain?: () => void;
  onLeave?: () => void;
}

export function Scoreboard({ players, winner, onPlayAgain, onLeave }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          本局结算
        </h2>
        {winner && (
          <p className="text-center text-lg text-yellow-600 font-semibold mb-6">
            🏆 {winner.username} 获得第一名
          </p>
        )}

        <ul className="space-y-3 mb-8">
          {sorted.map((player, i) => (
            <li
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                i === 0 ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"
              }`}
            >
              <span className="text-2xl">{medals[i] ?? `${i + 1}.`}</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {player.avatar ? (
                  <img src={player.avatar} alt="" className="w-full h-full rounded-full" />
                ) : (
                  player.username[0]?.toUpperCase()
                )}
              </div>
              <span className="flex-1 font-semibold text-gray-800">
                {player.username}
              </span>
              <span className="text-xl font-bold text-gray-700 tabular-nums">
                {player.score}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
            className="flex-1 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
          >
            再来一局
          </button>
        )}
          {onLeave && (
            <button
              onClick={onLeave}
            className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            离开房间
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
