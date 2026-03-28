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
    <div className="overflow-hidden rounded-[28px] border border-[rgba(190,148,113,0.16)] bg-[rgba(255,252,248,0.94)] shadow-[0_22px_44px_rgba(129,96,66,0.08)]">
      <div className="border-b border-[rgba(190,148,113,0.12)] bg-[rgba(255,247,241,0.96)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#6f5544]">
          玩家列表（{players.length}）
        </h3>
      </div>
      <ul className="divide-y divide-[rgba(190,148,113,0.1)]">
        {sorted.map((player, i) => (
          <li
            key={player.id}
            className={`flex items-center gap-3 px-4 py-3 ${
              player.id === myPlayerId ? "bg-[rgba(91,152,214,0.08)]" : ""
            }`}
          >
            <div className="flex w-8 items-center justify-center text-xs font-bold text-[#b78f74]">
              {i + 1}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e690ad] to-[#e7b464] text-sm font-bold text-white shadow-[0_10px_18px_rgba(199,140,103,0.2)]">
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
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-[#5a4031]">
                  {player.username}
                </span>
                {player.id === myPlayerId && (
                  <span className="rounded-full bg-[rgba(91,152,214,0.12)] px-2 py-0.5 text-[11px] font-medium text-[#4b76a7]">你</span>
                )}
                {player.id === creator && (
                  <span
                    title="房主"
                    className="rounded-full bg-[rgba(233,189,91,0.18)] px-2 py-0.5 text-[11px] font-medium text-[#a9771f]"
                  >
                    房主
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#9d8370]">
                {player.id === currentDrawer && (
                  <span className="rounded-full bg-[rgba(232,143,173,0.12)] px-2 py-0.5 text-[#b35a7e]">
                    本轮作画
                  </span>
                )}
                {player.hasGuessed && !player.isDrawing && (
                  <span className="rounded-full bg-[rgba(120,181,126,0.12)] px-2 py-0.5 text-[#5d9362]">
                    已猜中
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="block text-lg font-bold tabular-nums text-[#5a4031]">
                {player.score}
              </span>
              <span className="text-[11px] text-[#a48a77]">积分</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
