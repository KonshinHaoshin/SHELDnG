import { useEffect, useRef, useCallback } from "react";
import rough from "roughjs";
import { DrawData, DrawTool } from "../types";

interface UseCanvasOptions {
  onDraw?: (data: DrawData) => void;
  isDrawer: boolean;
  drawingData: DrawData[];
}

export function useCanvas({ onDraw, isDrawer, drawingData }: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentStrokeRef = useRef<DrawData[]>([]);
  const toolRef = useRef<DrawTool>("brush");
  const colorRef = useRef("#000000");
  const lineWidthRef = useRef(4);

  // Replay all drawing data on canvas
  const replayDrawing = useCallback((data: DrawData[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let currentStroke: DrawData[] = [];

    for (const pt of data) {
      currentStroke.push(pt);

      if (!pt.end) {
        // Draw preview line
        if (currentStroke.length > 1) {
          const prev = currentStroke[currentStroke.length - 2];
          ctx.beginPath();
          ctx.strokeStyle = pt.tool === "eraser" ? "#ffffff" : pt.color;
          ctx.lineWidth = pt.lineWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.globalCompositeOperation =
            pt.tool === "eraser" ? "destination-out" : "source-over";
          ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
          ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
          ctx.stroke();
        }
      } else {
        // Stroke ended - draw with rough.js for hand-drawn feel
        if (currentStroke.length > 1) {
          const rc = rough.canvas(canvas);
          const points: [number, number][] = currentStroke.map((p) => [
            p.x * canvas.width,
            p.y * canvas.height,
          ]);

          if (pt.tool === "eraser") {
            // For eraser, just use plain canvas
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.lineWidth = pt.lineWidth;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.moveTo(points[0][0], points[0][1]);
            points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
            ctx.stroke();
            ctx.globalCompositeOperation = "source-over";
          } else if (currentStroke.length === 1 || pt.tool === "fill") {
            // Single point or fill - draw a dot
            ctx.globalCompositeOperation = "source-over";
            ctx.beginPath();
            ctx.fillStyle = pt.color;
            ctx.arc(
              points[0][0],
              points[0][1],
              pt.lineWidth / 2,
              0,
              Math.PI * 2
            );
            ctx.fill();
          } else {
            // Multi-point stroke with rough.js
            ctx.globalCompositeOperation = "source-over";
            rc.linearPath(points, {
              stroke: pt.color,
              strokeWidth: pt.lineWidth,
              roughness: 0.5,
              bowing: 0.5,
            });
          }
        }
        currentStroke = [];
      }
    }
  }, []);

  // Replay whenever drawingData changes (for non-drawer)
  useEffect(() => {
    if (!isDrawer) {
      replayDrawing(drawingData);
    }
  }, [drawingData, isDrawer, replayDrawing]);

  const getCanvasPoint = useCallback(
    (e: PointerEvent): { x: number; y: number } => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    },
    []
  );

  const drawPreviewLine = useCallback(
    (
      from: { x: number; y: number },
      to: { x: number; y: number },
      color: string,
      width: number,
      tool: DrawTool
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;

      ctx.beginPath();
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";
      ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
      ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    },
    []
  );

  const floodFill = useCallback(
    (px: number, py: number, fillColor: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const x = Math.round(px * canvas.width);
      const y = Math.round(py * canvas.height);
      const idx = (y * canvas.width + x) * 4;

      const targetR = data[idx];
      const targetG = data[idx + 1];
      const targetB = data[idx + 2];
      const targetA = data[idx + 3];

      // Parse fill color
      const fillCtx = document.createElement("canvas").getContext("2d")!;
      fillCtx.fillStyle = fillColor;
      fillCtx.fillRect(0, 0, 1, 1);
      const fillData = fillCtx.getImageData(0, 0, 1, 1).data;
      const [fillR, fillG, fillB, fillA] = fillData;

      if (
        targetR === fillR &&
        targetG === fillG &&
        targetB === fillB &&
        targetA === fillA
      )
        return;

      const colorMatch = (i: number) =>
        Math.abs(data[i] - targetR) < 20 &&
        Math.abs(data[i + 1] - targetG) < 20 &&
        Math.abs(data[i + 2] - targetB) < 20 &&
        Math.abs(data[i + 3] - targetA) < 20;

      const stack = [idx];
      const visited = new Uint8Array(data.length / 4);

      while (stack.length > 0) {
        const i = stack.pop()!;
        const pixelIdx = i / 4;
        if (visited[pixelIdx]) continue;
        visited[pixelIdx] = 1;

        if (!colorMatch(i)) continue;

        data[i] = fillR;
        data[i + 1] = fillG;
        data[i + 2] = fillB;
        data[i + 3] = fillA;

        const row = Math.floor(pixelIdx / canvas.width);
        const col = pixelIdx % canvas.width;

        if (col > 0) stack.push(i - 4);
        if (col < canvas.width - 1) stack.push(i + 4);
        if (row > 0) stack.push(i - canvas.width * 4);
        if (row < canvas.height - 1) stack.push(i + canvas.width * 4);
      }

      ctx.putImageData(imageData, 0, 0);
    },
    []
  );

  const setupDrawingHandlers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawer) return;

    let rafId: number | null = null;
    let pendingPoint: DrawData | null = null;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      currentStrokeRef.current = [];

      const pt = getCanvasPoint(e);

      if (toolRef.current === "fill") {
        floodFill(pt.x, pt.y, colorRef.current);
        const data: DrawData = {
          x: pt.x,
          y: pt.y,
          color: colorRef.current,
          lineWidth: lineWidthRef.current,
          end: true,
          tool: "fill",
        };
        onDraw?.(data);
        isDrawingRef.current = false;
        return;
      }

      lastPointRef.current = pt;
      const data: DrawData = {
        x: pt.x,
        y: pt.y,
        color: colorRef.current,
        lineWidth: lineWidthRef.current,
        end: false,
        tool: toolRef.current,
      };
      currentStrokeRef.current.push(data);
      onDraw?.(data);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();

      const pt = getCanvasPoint(e);
      const last = lastPointRef.current;
      if (!last) return;

      // Draw preview immediately
      drawPreviewLine(last, pt, colorRef.current, lineWidthRef.current, toolRef.current);
      lastPointRef.current = pt;

      const data: DrawData = {
        x: pt.x,
        y: pt.y,
        color: colorRef.current,
        lineWidth: lineWidthRef.current,
        end: false,
        tool: toolRef.current,
      };
      currentStrokeRef.current.push(data);

      // Throttle sends with RAF
      pendingPoint = data;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (pendingPoint) {
            onDraw?.(pendingPoint);
            pendingPoint = null;
          }
          rafId = null;
        });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      isDrawingRef.current = false;

      const pt = getCanvasPoint(e);
      const data: DrawData = {
        x: pt.x,
        y: pt.y,
        color: colorRef.current,
        lineWidth: lineWidthRef.current,
        end: true,
        tool: toolRef.current,
      };
      currentStrokeRef.current.push(data);
      onDraw?.(data);

      // Redraw the completed stroke with rough.js
      const allData = currentStrokeRef.current;
      const canvas = canvasRef.current;
      if (canvas && allData.length > 1 && toolRef.current !== "eraser") {
        const rc = rough.canvas(canvas);
        const points: [number, number][] = allData.map((p) => [
          p.x * canvas.width,
          p.y * canvas.height,
        ]);
        // Re-draw the stroke over the preview with rough.js
        rc.linearPath(points, {
          stroke: colorRef.current,
          strokeWidth: lineWidthRef.current,
          roughness: 0.5,
          bowing: 0.5,
        });
      }

      currentStrokeRef.current = [];
      lastPointRef.current = null;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isDrawer, onDraw, getCanvasPoint, drawPreviewLine, floodFill]);

  useEffect(() => {
    const cleanup = setupDrawingHandlers();
    return cleanup;
  }, [setupDrawingHandlers]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return {
    canvasRef,
    toolRef,
    colorRef,
    lineWidthRef,
    clearCanvas,
    replayDrawing,
  };
}
