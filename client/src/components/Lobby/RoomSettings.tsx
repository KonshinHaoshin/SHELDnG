import React, { useState } from "react";
import { Settings } from "../../types";
import { useRoom } from "../../context/RoomContext";

interface RoomSettingsProps {
  settings: Settings;
  isCreator: boolean;
}

export function RoomSettings({ settings, isCreator }: RoomSettingsProps) {
  const { updateSettings } = useRoom();
  const [customWordInput, setCustomWordInput] = useState("");

  const field = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    updateSettings({ [key]: value } as Partial<Settings>);
  };

  const estimatedMinutes = Math.max(
    1,
    Math.ceil((settings.rounds * settings.maxPlayers * settings.drawTime) / 60)
  );

  const addCustomWord = () => {
    const nextWord = customWordInput.trim();
    if (!nextWord) return;
    if (settings.customWords.includes(nextWord)) {
      setCustomWordInput("");
      return;
    }
    field("customWords", [...settings.customWords, nextWord]);
    setCustomWordInput("");
  };

  return (
    <div className="rounded-[28px] border border-[rgba(190,148,113,0.16)] bg-[rgba(255,252,248,0.94)] p-5 shadow-[0_22px_44px_rgba(129,96,66,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#5d4334]">房间设置</h3>
          <p className="mt-1 text-sm text-[#8a6f5d]">
            {isCreator ? "修改后会立即同步到房间内所有玩家" : "仅房主可以修改设置"}
          </p>
        </div>
        <div className="rounded-2xl bg-[rgba(239,146,173,0.1)] px-3 py-2 text-right">
          <p className="text-xs text-[#a56d83]">预计时长</p>
          <p className="text-lg font-bold text-[#7a4e61]">{estimatedMinutes} 分钟</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-[rgba(255,244,236,0.9)] px-3 py-3">
          <p className="text-xs text-[#a07d67]">玩家上限</p>
          <p className="mt-1 text-lg font-bold text-[#5a4031]">{settings.maxPlayers} 人</p>
        </div>
        <div className="rounded-2xl bg-[rgba(255,244,236,0.9)] px-3 py-3">
          <p className="text-xs text-[#a07d67]">作画时长</p>
          <p className="mt-1 text-lg font-bold text-[#5a4031]">{settings.drawTime} 秒</p>
        </div>
        <div className="rounded-2xl bg-[rgba(255,244,236,0.9)] px-3 py-3">
          <p className="text-xs text-[#a07d67]">回合数</p>
          <p className="mt-1 text-lg font-bold text-[#5a4031]">{settings.rounds} 轮</p>
        </div>
        <div className="rounded-2xl bg-[rgba(255,244,236,0.9)] px-3 py-3">
          <p className="text-xs text-[#a07d67]">自定义词</p>
          <p className="mt-1 text-lg font-bold text-[#5a4031]">{settings.customWords.length} 条</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="rounded-2xl border border-[rgba(190,148,113,0.16)] bg-white/90 px-4 py-3">
            <span className="text-sm font-medium text-[#6b5140]">最多玩家</span>
            <select
              disabled={!isCreator}
              value={settings.maxPlayers}
              onChange={(e) => field("maxPlayers", parseInt(e.target.value))}
              className="mt-2 w-full rounded-xl border border-[rgba(190,148,113,0.18)] bg-[rgba(255,248,242,0.96)] px-3 py-2 text-sm text-[#5d4334] outline-none disabled:cursor-not-allowed disabled:bg-[#f0ebe6]"
            >
              {[2, 4, 6, 8, 10].map((n) => (
                <option key={n} value={n}>{n} 人</option>
              ))}
            </select>
          </label>

          <label className="rounded-2xl border border-[rgba(190,148,113,0.16)] bg-white/90 px-4 py-3">
            <span className="text-sm font-medium text-[#6b5140]">作画时长</span>
            <select
              disabled={!isCreator}
              value={settings.drawTime}
              onChange={(e) => field("drawTime", parseInt(e.target.value))}
              className="mt-2 w-full rounded-xl border border-[rgba(190,148,113,0.18)] bg-[rgba(255,248,242,0.96)] px-3 py-2 text-sm text-[#5d4334] outline-none disabled:cursor-not-allowed disabled:bg-[#f0ebe6]"
            >
              {[30, 45, 60, 90, 120].map((n) => (
                <option key={n} value={n}>{n} 秒</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="rounded-2xl border border-[rgba(190,148,113,0.16)] bg-white/90 px-4 py-3">
            <span className="text-sm font-medium text-[#6b5140]">回合数</span>
            <select
              disabled={!isCreator}
              value={settings.rounds}
              onChange={(e) => field("rounds", parseInt(e.target.value))}
              className="mt-2 w-full rounded-xl border border-[rgba(190,148,113,0.18)] bg-[rgba(255,248,242,0.96)] px-3 py-2 text-sm text-[#5d4334] outline-none disabled:cursor-not-allowed disabled:bg-[#f0ebe6]"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} 轮</option>
              ))}
            </select>
          </label>

          <label className="rounded-2xl border border-[rgba(190,148,113,0.16)] bg-white/90 px-4 py-3">
            <span className="text-sm font-medium text-[#6b5140]">备选词数量</span>
            <select
              disabled={!isCreator}
              value={settings.wordCount}
              onChange={(e) => field("wordCount", parseInt(e.target.value))}
              className="mt-2 w-full rounded-xl border border-[rgba(190,148,113,0.18)] bg-[rgba(255,248,242,0.96)] px-3 py-2 text-sm text-[#5d4334] outline-none disabled:cursor-not-allowed disabled:bg-[#f0ebe6]"
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} 个</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3">
          <label className="rounded-2xl border border-[rgba(190,148,113,0.16)] bg-white/90 px-4 py-3">
            <span className="text-sm font-medium text-[#6b5140]">提示次数</span>
            <select
              disabled={!isCreator}
              value={settings.hints}
              onChange={(e) => field("hints", parseInt(e.target.value))}
              className="mt-2 w-full rounded-xl border border-[rgba(190,148,113,0.18)] bg-[rgba(255,248,242,0.96)] px-3 py-2 text-sm text-[#5d4334] outline-none disabled:cursor-not-allowed disabled:bg-[#f0ebe6]"
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>{n} 次</option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-[28px] border border-[rgba(190,148,113,0.16)] bg-white/90 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#6b5140]">自定义词条</p>
              <p className="mt-1 text-xs text-[#9a7d69]">可用于熟人局或主题局，重复词会自动忽略</p>
            </div>
            <div className="rounded-full bg-[rgba(239,146,173,0.12)] px-3 py-1 text-xs font-semibold text-[#b45f82]">
              {settings.customWords.length} 条
            </div>
          </div>

          {isCreator ? (
            <>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={customWordInput}
                  onChange={(e) => setCustomWordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomWord();
                    }
                  }}
                  placeholder="输入词语"
                  className="flex-1 rounded-xl border border-[rgba(190,148,113,0.18)] bg-[rgba(255,248,242,0.96)] px-3 py-2 text-sm text-[#5d4334] outline-none focus:border-[#de8ca3]"
                />
                <button
                  type="button"
                  onClick={addCustomWord}
                  className="rounded-xl bg-[linear-gradient(135deg,#eb91ad,#e6b060)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(215,135,111,0.24)] transition hover:brightness-105"
                >
                  添加
                </button>
              </div>

              {settings.customWords.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {settings.customWords.map((w, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 rounded-full bg-[rgba(101,150,214,0.1)] px-3 py-1.5 text-xs font-medium text-[#496a9a]"
                    >
                      {w}
                      <button
                        onClick={() =>
                          field(
                            "customWords",
                            settings.customWords.filter((_, j) => j !== i)
                          )
                        }
                        className="text-[#8b5a6d] transition hover:text-red-500"
                        title="移除词条"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#a18979]">当前还没有自定义词条。</p>
              )}
            </>
          ) : (
            <div className="mt-3">
              {settings.customWords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {settings.customWords.map((w, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-[rgba(101,150,214,0.1)] px-3 py-1.5 text-xs font-medium text-[#496a9a]"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#a18979]">房主还没有添加自定义词条。</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
