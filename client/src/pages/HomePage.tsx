import React from "react";
import { useRoom } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import { LoginButton } from "../components/Auth/LoginButton";
import faviconImage from "../assets/favicon01.png";
import backgroundMain from "../assets/background01.webp";
import backgroundSub from "../assets/background02.webp";

interface HomePageProps {
  onOpenLobby: () => void;
}

export function HomePage({ onOpenLobby }: HomePageProps) {
  const { createRoom, connected } = useRoom();
  const { error } = useAuth();

  const handleCreate = () => {
    createRoom();
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,250,245,0.22), rgba(255,244,235,0.92)), url(${backgroundMain})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.78),rgba(255,255,255,0.08)_28%,transparent_50%),linear-gradient(135deg,rgba(255,250,244,0.84),rgba(255,239,226,0.74))]">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-8">
          <div className="fade-rise flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[rgba(255,255,255,0.75)] blur-xl" />
              <img
                src={faviconImage}
                alt="庇护所徽章"
                className="relative h-16 w-16 rounded-full border-4 border-[rgba(255,255,255,0.85)] object-cover shadow-[0_16px_36px_rgba(87,67,43,0.22)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-[#8f725f]">同好联机画猜派对</p>
              <h1 className="mt-1 text-2xl font-black text-[#5d4334] md:text-3xl">庇护所你画我猜</h1>
            </div>
          </div>
          <div className="fade-rise">
            <LoginButton />
          </div>
        </header>

        <main className="mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-7xl gap-8 px-4 pb-10 pt-2 md:px-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center">
          <section className="fade-rise relative">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(222,179,118,0.38)] bg-[rgba(255,248,240,0.82)] px-4 py-2 text-sm text-[#7d5f4f] backdrop-blur-md">
                <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-[#7eb980]" : "bg-[#d16b6b]"}`} />
                {connected ? "已连接到对局服务器" : "正在连接对局服务器"}
              </div>

              <div className="space-y-5">
                <div className="space-y-4">
                  <h2 className="max-w-2xl text-5xl font-black leading-[1.08] text-[#52362d] md:text-7xl">
                    庇护所你画我猜
                  </h2>
                  <p className="max-w-2xl text-lg leading-8 text-[#6d5545] md:text-xl">
                    创建房间，或直接进入公开大厅找人开局。
                  </p>
                </div>
              </div>
            </div>

            <div className="soft-float pointer-events-none absolute -left-3 top-16 hidden h-24 w-24 rounded-full border border-[rgba(255,255,255,0.72)] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,220,198,0.72))] shadow-[0_18px_46px_rgba(118,87,61,0.14)] lg:block" />
          </section>

          <section className="fade-rise relative">
            <div className="home-hero-panel overflow-hidden rounded-[36px] border border-[rgba(255,255,255,0.76)] bg-[rgba(255,249,244,0.86)]">
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[240px] overflow-hidden">
                  <img
                    src={backgroundSub}
                    alt="同好们围坐画猜的封面插图"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,239,0.02),rgba(96,59,34,0.32))]" />

                </div>

                <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
                  <div className="space-y-4">
                    <div className="inline-flex rounded-full bg-[rgba(239,146,173,0.12)] px-3 py-1 text-sm font-semibold text-[#b75f7f]">
                      公开房间
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-[#53372d]">快速开始</h3>

                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={handleCreate}
                      disabled={!connected}
                      className="w-full rounded-[22px] bg-[linear-gradient(135deg,#eb91ad,#e6b060)] px-6 py-4 text-lg font-bold text-white shadow-[0_16px_36px_rgba(215,135,111,0.32)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[linear-gradient(135deg,#d6cfc8,#c8c0b7)] disabled:shadow-none"
                    >
                      创建房间
                    </button>

                    <button
                      onClick={onOpenLobby}
                      disabled={!connected}
                      className="w-full rounded-[22px] border border-[rgba(181,129,88,0.2)] bg-[rgba(255,255,255,0.82)] px-6 py-4 text-lg font-bold text-[#654938] transition duration-300 hover:-translate-y-0.5 hover:bg-[rgba(255,251,248,0.95)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[rgba(239,236,231,0.92)] disabled:text-[#a6978a]"
                    >
                      进入大厅
                    </button>
                    {error && (
                      <p className="text-sm text-[#cc5f66]">{error}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
