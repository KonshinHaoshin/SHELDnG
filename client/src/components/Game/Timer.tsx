import React from "react";

interface TimerProps {
  timeLeft: number;
  totalTime: number;
}

export function Timer({ timeLeft, totalTime }: TimerProps) {
  const pct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const color =
    pct > 50 ? "bg-green-500" : pct > 25 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`text-2xl font-bold tabular-nums ${
          timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-700"
        }`}
      >
        {timeLeft}
      </div>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-16">
        <div
          className={`h-full ${color} transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
