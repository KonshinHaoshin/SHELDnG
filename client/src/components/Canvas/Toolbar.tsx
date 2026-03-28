import React from "react";
import { DrawTool } from "../../types";

interface ToolbarProps {
  tool: DrawTool;
  lineWidth: number;
  onToolChange: (tool: DrawTool) => void;
  onLineWidthChange: (width: number) => void;
  onClear: () => void;
  onUndo: () => void;
}

const LINE_WIDTHS = [2, 4, 8, 16];

const ToolIcon = {
  brush: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z" />
    </svg>
  ),
  eraser: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.77-.78 2.04 0 2.83L5.03 20H20v-2h-6.22l7.08-7.08c.78-.79.78-2.05 0-2.83l-4.31-4.31c-.4-.39-.9-.78-1.41-.78zM6.41 20l-3-3L14.73 5.68l3 3L6.41 20z" />
    </svg>
  ),
  fill: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15a1.49 1.49 0 000 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z" />
      <path d="M0 20h24v4H0z" opacity=".36" />
    </svg>
  ),
};

export function Toolbar({
  tool,
  lineWidth,
  onToolChange,
  onLineWidthChange,
  onClear,
  onUndo,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tools */}
      {(["brush", "eraser", "fill"] as DrawTool[]).map((t) => (
        <button
          key={t}
          onClick={() => onToolChange(t)}
          title={t === "brush" ? "画笔" : t === "eraser" ? "橡皮" : "填充"}
          className={`p-2 rounded-lg transition-colors ${
            tool === t
              ? "bg-blue-500 text-white shadow-inner"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          {ToolIcon[t]}
        </button>
      ))}

      <div className="w-px h-8 bg-gray-200 mx-1" />

      {/* Line widths */}
      {LINE_WIDTHS.map((w) => (
        <button
          key={w}
          onClick={() => onLineWidthChange(w)}
          title={`${w} 像素`}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
            lineWidth === w
              ? "bg-blue-500 shadow-inner"
              : "hover:bg-gray-100"
          }`}
        >
          <div
            className={`rounded-full bg-gray-800 transition-all ${lineWidth === w ? "bg-white" : ""}`}
            style={{ width: w + 4, height: w + 4 }}
          />
        </button>
      ))}

      <div className="w-px h-8 bg-gray-200 mx-1" />

      {/* Undo */}
      <button
        onClick={onUndo}
        title="撤销上一笔"
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
        </svg>
      </button>

      {/* Clear */}
      <button
        onClick={onClear}
        title="清空画布"
        className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  );
}
