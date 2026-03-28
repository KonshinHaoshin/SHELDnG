import React from "react";

interface WordSelectorProps {
  words: string[];
  onSelect: (word: string) => void;
  timeLeft: number;
}

export function WordSelector({ words, onSelect, timeLeft }: WordSelectorProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">请选择要画的词语</h2>
        <p className="text-gray-500 mb-6">
          请在 <span className="font-bold text-red-500">{timeLeft} 秒</span> 内完成选择
        </p>
        <div className="flex flex-col gap-3">
          {words.map((word) => (
            <button
              key={word}
              onClick={() => onSelect(word)}
              className="py-4 px-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl text-lg font-semibold text-blue-700 transition-all hover:scale-105"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
