import React, { useEffect, useCallback } from "react";
import { DrawData, DrawTool } from "../../types";
import { useCanvas } from "../../hooks/useCanvas";

interface DrawingCanvasProps {
  isDrawer: boolean;
  drawingData: DrawData[];
  onDraw?: (data: DrawData) => void;
  tool: DrawTool;
  color: string;
  lineWidth: number;
  onClear?: () => void;
}

export function DrawingCanvas({
  isDrawer,
  drawingData,
  onDraw,
  tool,
  color,
  lineWidth,
  onClear,
}: DrawingCanvasProps) {
  const { canvasRef, toolRef, colorRef, lineWidthRef, clearCanvas, replayDrawing } =
    useCanvas({ onDraw, isDrawer, drawingData });

  // Sync tool/color/lineWidth refs
  useEffect(() => {
    toolRef.current = tool;
  }, [tool, toolRef]);

  useEffect(() => {
    colorRef.current = color;
  }, [color, colorRef]);

  useEffect(() => {
    lineWidthRef.current = lineWidth;
  }, [lineWidth, lineWidthRef]);

  // When drawingData changes and we're not the drawer, replay
  useEffect(() => {
    if (!isDrawer) {
      replayDrawing(drawingData);
    }
  }, [drawingData, isDrawer, replayDrawing]);

  return (
    <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full bg-white rounded-lg shadow-md"
        style={{
          cursor: isDrawer
            ? tool === "eraser"
              ? "cell"
              : tool === "fill"
              ? "crosshair"
              : "crosshair"
            : "default",
          touchAction: "none",
        }}
      />
      {!isDrawer && (
        <div className="absolute inset-0 pointer-events-none" />
      )}
    </div>
  );
}
