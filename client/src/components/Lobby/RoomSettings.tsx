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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-gray-700">房间设置</h3>

      <label className="flex items-center justify-between">
        <span className="text-sm text-gray-600">最多玩家</span>
        <select
          disabled={!isCreator}
          value={settings.maxPlayers}
          onChange={(e) => field("maxPlayers", parseInt(e.target.value))}
          className="text-sm border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100"
        >
          {[2, 4, 6, 8, 10].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm text-gray-600">作画时长</span>
        <select
          disabled={!isCreator}
          value={settings.drawTime}
          onChange={(e) => field("drawTime", parseInt(e.target.value))}
          className="text-sm border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100"
        >
          {[30, 45, 60, 90, 120].map((n) => (
            <option key={n} value={n}>{n} 秒</option>
          ))}
        </select>
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm text-gray-600">回合数</span>
        <select
          disabled={!isCreator}
          value={settings.rounds}
          onChange={(e) => field("rounds", parseInt(e.target.value))}
          className="text-sm border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">词库语言</span>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-600">仅中文</span>
      </div>

      <label className="flex items-center justify-between">
        <span className="text-sm text-gray-600">备选词数量</span>
        <select
          disabled={!isCreator}
          value={settings.wordCount}
          onChange={(e) => field("wordCount", parseInt(e.target.value))}
          className="text-sm border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100"
        >
          {[2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm text-gray-600">提示次数</span>
        <select
          disabled={!isCreator}
          value={settings.hints}
          onChange={(e) => field("hints", parseInt(e.target.value))}
          className="text-sm border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100"
        >
          {[0, 1, 2, 3].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>

      {isCreator && (
        <div>
          <p className="text-sm text-gray-600 mb-1">自定义词条</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customWordInput}
              onChange={(e) => setCustomWordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customWordInput.trim()) {
                  field("customWords", [
                    ...settings.customWords,
                    customWordInput.trim(),
                  ]);
                  setCustomWordInput("");
                }
              }}
              placeholder="输入词语后按回车添加"
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>
          {settings.customWords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {settings.customWords.map((w, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"
                >
                  {w}
                  <button
                    onClick={() =>
                      field(
                        "customWords",
                        settings.customWords.filter((_, j) => j !== i)
                      )
                    }
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
