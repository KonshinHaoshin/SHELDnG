import React, { useEffect, useState } from "react";
import { useRoom } from "../context/RoomContext";
import faviconImage from "../assets/favicon01.png";
import backgroundMain from "../assets/background01.webp";
import backgroundSub from "../assets/background02.webp";

interface PublicLobbyPageProps {
  onBack: () => void;
}

export function PublicLobbyPage({ onBack }: PublicLobbyPageProps) {
  const { joinRoom, connected, publicRooms, refreshPublicRooms } = useRoom();
  const [roomIdInput, setRoomIdInput] = useState("");

  useEffect(() => {
    refreshPublicRooms();
  }, [refreshPublicRooms]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIdInput.trim().length >= 4) {
      joinRoom(roomIdInput.trim().toUpperCase());
    }
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,250,245,0.22), rgba(255,244,235,0.94)), url(${backgroundMain})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),rgba(255,255,255,0.08)_28%,transparent_52%),linear-gradient(135deg,rgba(255,250,244,0.88),rgba(255,239,226,0.78))]">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-8">
          <div className="flex items-center gap-4">
            <img
              src={faviconImage}
              alt="庇护所徽章"
              className="h-14 w-14 rounded-full border-4 border-[rgba(255,255,255,0.85)] object-cover shadow-[0_16px_36px_rgba(87,67,43,0.18)]"
            />
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-[#8f725f]">公开房间大厅</p>
              <h1 className="mt-1 text-2xl font-black text-[#5d4334] md:text-3xl">找一间房，直接开画</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-[rgba(181,129,88,0.2)] bg-[rgba(255,255,255,0.86)] px-5 py-2.5 text-sm font-semibold text-[#6a4b39] transition hover:bg-white"
          >
            返回首页
          </button>
        </header>

        <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-10 pt-2 md:px-8 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <section className="overflow-hidden rounded-[36px] border border-[rgba(255,255,255,0.76)] bg-[rgba(255,249,244,0.88)] shadow-[0_30px_60px_rgba(125,91,61,0.12)]">
            <div className="relative h-44 overflow-hidden">
              <img
                src={backgroundSub}
                alt="大厅封面"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,239,0.04),rgba(96,59,34,0.36))]" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 px-6 py-5">
                <div>
                  <p className="text-sm font-semibold text-[rgba(255,244,237,0.88)]">
                    {connected ? "已连接" : "连接中"}
                  </p>
                  <h2 className="mt-1 text-3xl font-black text-white">当前公开房间</h2>
                </div>
                <button
                  type="button"
                  onClick={refreshPublicRooms}
                  className="rounded-full bg-[rgba(255,255,255,0.2)] px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-[rgba(255,255,255,0.28)]"
                >
                  刷新列表
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {publicRooms.length > 0 ? (
                  publicRooms.map((publicRoom) => (
                    <button
                      key={publicRoom.roomId}
                      type="button"
                      onClick={() => joinRoom(publicRoom.roomId)}
                      className="w-full rounded-[24px] border border-[rgba(190,148,113,0.16)] bg-[rgba(255,255,255,0.92)] px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-[rgba(222,140,163,0.34)] hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs tracking-[0.18em] text-[#ad8a75]">房间码</p>
                          <p className="mt-1 font-mono text-2xl font-black tracking-[0.18em] text-[#5d4334]">
                            {publicRoom.roomId}
                          </p>
                        </div>
                        <div className="rounded-full bg-[rgba(239,146,173,0.12)] px-3 py-1 text-xs font-semibold text-[#b45f82]">
                          {publicRoom.playerCount}/{publicRoom.maxPlayers} 人
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#7e6453] md:grid-cols-4">
                        <span>房主：{publicRoom.hostName}</span>
                        <span>回合：{publicRoom.roundCount}</span>
                        <span>时长：{publicRoom.drawTime} 秒</span>
                        <span>备选词：{publicRoom.wordCount} 个</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[24px] bg-[rgba(255,246,239,0.92)] px-4 py-10 text-center text-sm text-[#8d735f]">
                    当前没有可加入的公开房间。
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="rounded-[32px] border border-[rgba(255,255,255,0.76)] bg-[rgba(255,249,244,0.9)] p-5 shadow-[0_24px_50px_rgba(125,91,61,0.1)]">
            <h3 className="text-2xl font-black text-[#53372d]">按房间码加入</h3>
            <p className="mt-2 text-sm text-[#8b6f5d]">如果朋友给了房间码，也可以直接输入。</p>

            <form onSubmit={handleJoin} className="mt-5 space-y-3">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder="请输入房间码"
                maxLength={8}
                className="w-full rounded-[20px] border border-[rgba(189,145,111,0.2)] bg-[rgba(255,255,255,0.92)] px-4 py-4 text-center text-2xl font-black tracking-[0.36em] text-[#5f4334] outline-none transition focus:border-[#de8ca3] focus:shadow-[0_0_0_4px_rgba(238,140,171,0.12)]"
              />
              <button
                type="submit"
                disabled={!connected || roomIdInput.trim().length < 4}
                className="w-full rounded-[20px] bg-[linear-gradient(135deg,#eb91ad,#e6b060)] px-4 py-4 text-base font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[linear-gradient(135deg,#d6cfc8,#c8c0b7)]"
              >
                加入房间
              </button>
            </form>

            <button
              type="button"
              onClick={onBack}
              className="mt-4 w-full rounded-[18px] border border-[rgba(181,129,88,0.18)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm font-semibold text-[#6a4b39] transition hover:bg-white"
            >
              返回首页
            </button>
          </aside>
        </main>
      </div>
    </div>
  );
}
