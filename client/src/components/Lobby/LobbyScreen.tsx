import React, { useState } from "react";
import { useRoom } from "../../context/RoomContext";
import { PlayerList } from "../Game/PlayerList";
import { RoomSettings } from "./RoomSettings";
import faviconImage from "../../assets/favicon01.png";

export function LobbyScreen() {
  const { room, myPlayerId, startGame, leaveRoom, connected } = useRoom();
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const isCreator = room.creator === myPlayerId;
  const canStart = room.players.length >= 2;
  const currentPlayer = room.players.find((player) => player.id === myPlayerId) ?? null;
  const totalTurns = room.settings.rounds * room.players.length;
  const estimatedMinutes = Math.max(
    1,
    Math.ceil((totalTurns * room.settings.drawTime) / 60)
  );

  const copyRoomId = () => {
    navigator.clipboard.writeText(room.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff9f4,#fff0e6)] p-4 md:p-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[32px] border border-[rgba(190,148,113,0.16)] bg-[rgba(255,250,246,0.88)] px-5 py-5 shadow-[0_24px_60px_rgba(129,96,66,0.1)] backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-7">
          <div className="flex items-center gap-4">
            <img
              src={faviconImage}
              alt="庇护所徽章"
              className="h-16 w-16 rounded-full border-4 border-[rgba(255,255,255,0.86)] object-cover shadow-[0_12px_28px_rgba(129,96,66,0.16)]"
            />
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-[#9b7d6b]">房间大厅</p>
              <h1 className="mt-1 text-3xl font-black text-[#5a4031]">庇护所你画我猜</h1>
              <p className="mt-1 text-sm text-[#8a6f5d]">
                {isCreator ? "调整设置后即可开始本局" : "等待房主确认设置并开始游戏"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-[rgba(255,244,236,0.95)] px-4 py-3">
              <p className="text-xs text-[#a07d67]">房间码</p>
              <p className="mt-1 text-xl font-black tracking-[0.18em] text-[#5a4031]">{room.roomId}</p>
            </div>
            <div className="rounded-2xl bg-[rgba(255,244,236,0.95)] px-4 py-3">
              <p className="text-xs text-[#a07d67]">当前人数</p>
              <p className="mt-1 text-xl font-black text-[#5a4031]">{room.players.length} / {room.settings.maxPlayers}</p>
            </div>
            <div className="rounded-2xl bg-[rgba(255,244,236,0.95)] px-4 py-3">
              <p className="text-xs text-[#a07d67]">预计时长</p>
              <p className="mt-1 text-xl font-black text-[#5a4031]">{estimatedMinutes} 分钟</p>
            </div>
            <div className="rounded-2xl bg-[rgba(255,244,236,0.95)] px-4 py-3">
              <p className="text-xs text-[#a07d67]">连接状态</p>
              <p className={`mt-1 text-sm font-bold ${connected ? "text-[#5f9362]" : "text-[#c96868]"}`}>
                {connected ? "已连接" : "连接中"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.08fr)_380px]">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="rounded-[28px] border border-[rgba(190,148,113,0.16)] bg-[rgba(255,252,248,0.94)] p-5 shadow-[0_22px_44px_rgba(129,96,66,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#8a6f5d]">分享房间</p>
                      <p className="mt-2 font-mono text-3xl font-black tracking-[0.18em] text-[#5a4031]">
                        {room.roomId}
                      </p>
                    </div>
                    <button
                      onClick={copyRoomId}
                      className="rounded-2xl bg-[rgba(91,152,214,0.12)] px-4 py-2 text-sm font-semibold text-[#4b76a7] transition hover:bg-[rgba(91,152,214,0.18)]"
                    >
                      {copied ? "已复制" : "复制"}
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#937865]">
                    把房间码发给朋友，对方在首页输入后即可加入。
                  </p>
                </div>

                <div className="rounded-[28px] border border-[rgba(190,148,113,0.16)] bg-[rgba(255,252,248,0.94)] p-5 shadow-[0_22px_44px_rgba(129,96,66,0.08)]">
                  <p className="text-sm font-medium text-[#8a6f5d]">你的状态</p>
                  <p className="mt-2 text-2xl font-black text-[#5a4031]">
                    {currentPlayer?.username ?? "未加入"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isCreator && (
                      <span className="rounded-full bg-[rgba(233,189,91,0.18)] px-3 py-1 text-xs font-semibold text-[#a9771f]">
                        房主
                      </span>
                    )}
                    <span className="rounded-full bg-[rgba(239,146,173,0.12)] px-3 py-1 text-xs font-semibold text-[#b45f82]">
                      {canStart ? "满足开局条件" : "至少还需 2 人开局"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {isCreator ? (
                      <button
                        onClick={startGame}
                        disabled={!canStart}
                        className="w-full rounded-[20px] bg-[linear-gradient(135deg,#eb91ad,#e6b060)] px-5 py-3 text-base font-bold text-white shadow-[0_16px_36px_rgba(215,135,111,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[linear-gradient(135deg,#d6cfc8,#c8c0b7)] disabled:shadow-none"
                      >
                        {canStart ? "开始游戏" : `等待玩家加入（${room.players.length}/2）`}
                      </button>
                    ) : (
                      <div className="rounded-[20px] bg-[rgba(240,236,231,0.95)] px-5 py-3 text-center text-sm font-medium text-[#8b7565]">
                        等待房主开始游戏
                      </div>
                    )}
                    <button
                      onClick={leaveRoom}
                      className="w-full rounded-[18px] px-4 py-2 text-sm font-medium text-[#b76464] transition hover:bg-[rgba(183,100,100,0.08)]"
                    >
                      离开房间
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-[rgba(190,148,113,0.16)] bg-[rgba(255,252,248,0.94)] p-4 shadow-[0_22px_44px_rgba(129,96,66,0.08)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-[#5a4031]">房间成员</h2>
                      <p className="mt-1 text-sm text-[#917665]">开始前可以在这里确认谁是房主、谁已准备好一起开局。</p>
                    </div>
                    <div className="rounded-full bg-[rgba(91,152,214,0.12)] px-3 py-1 text-xs font-semibold text-[#4b76a7]">
                      共 {room.players.length} 人
                    </div>
                  </div>

                  <PlayerList
                    players={room.players}
                    myPlayerId={myPlayerId}
                    creator={room.creator}
                    currentDrawer={null}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <RoomSettings settings={room.settings} isCreator={isCreator} />
          </div>
        </div>
      </div>
    </div>
  );
}
