import React from "react";

const COLORS = [
  "#000000", "#808080", "#c0c0c0", "#ffffff",
  "#ff0000", "#ff8000", "#ffff00", "#00ff00",
  "#00ffff", "#0000ff", "#8000ff", "#ff00ff",
  "#804000", "#ff8080", "#80ff80", "#8080ff",
  "#ff80ff", "#80ffff", "#ff8040", "#40ff80",
  "#8040ff", "#ff4080", "#804080", "#408040",
];

interface ColorPaletteProps {
  color: string;
  onColorChange: (color: string) => void;
}

export function ColorPalette({ color, onColorChange }: ColorPaletteProps) {
  return (
    <div className="flex flex-wrap gap-1 p-2 bg-white rounded-lg shadow-sm border border-gray-200">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onColorChange(c)}
          className={`w-7 h-7 rounded-md transition-transform hover:scale-110 ${
            color === c ? "ring-2 ring-blue-500 ring-offset-1 scale-110" : ""
          }`}
          style={{
            backgroundColor: c,
            border: c === "#ffffff" ? "1px solid #e5e7eb" : "none",
          }}
          title={c}
        />
      ))}
      {/* Custom color picker */}
      <label
        className="w-7 h-7 rounded-md cursor-pointer overflow-hidden border border-gray-300 hover:scale-110 transition-transform"
        title="自定义颜色"
      >
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="opacity-0 w-0 h-0"
        />
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-400 via-green-400 to-blue-400">
          <span className="text-white text-xs font-bold">+</span>
        </div>
      </label>
    </div>
  );
}
