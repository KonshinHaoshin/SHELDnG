import React, { useState, useCallback } from "react";
import { DrawingCanvas } from "../Canvas/DrawingCanvas";
import { Toolbar } from "../Canvas/Toolbar";
import { ColorPalette } from "../Canvas/ColorPalette";
import { PlayerList } from "./PlayerList";
import { Timer } from "./Timer";
import { ChatBox } from "../Chat/ChatBox";
import { WordSelector } from "./WordSelector";
import { Scoreboard } from "./Scoreboard";
import { useRoom } from "../../context/RoomContext";
import { DrawTool } from "../../types";

export function GameScreen() {
  const {
    room,
    myPlayerId,
    messages,
    wordChoices,
    myWord,
    sendDraw,
    sendClear,
    sendUndo,
    sendGuess,
    selectWord,
    leaveRoom,
    startGame,
  } = useRoom();

  const [tool, setTool] = useState<DrawTool>("brush");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(4);

  const isDrawer =
    !!room &&
    !!myPlayerId &&
    room.gameState.currentDrawer === myPlayerId;

  const isCreator = room?.creator === myPlayerId;
  const phase = room?.gameState.phase;

  const handleClear = useCallback(() => {
    sendClear();
  }, [sendClear]);

  const handleUndo = useCallback(() => {
    sendUndo();
  }, [sendUndo]);

  if (!room) return null;

  const { gameState, players, settings } = room;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf4,#fff1e8)] p-4">
      {/* Word choice overlay */}
      {wordChoices && phase === "choosingWord" && (
        <WordSelector
          words={wordChoices}
          onSelect={selectWord}
          timeLeft={15}
        />
      )}

      {/* Scoreboard overlay */}
      {phase === "gameEnd" && (
        <Scoreboard
          players={players}
          winner={[...players].sort((a, b) => b.score - a.score)[0]}
          onPlayAgain={isCreator ? startGame : undefined}
          onLeave={leaveRoom}
        />
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm px-4 py-3 border border-gray-200">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">庇护所你画我猜</h1>
            <span className="text-sm text-gray-500">
              房间码：<span className="font-mono font-bold">{room.roomId}</span>
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(room.roomId);
              }}
              className="text-xs text-blue-500 hover:underline"
              title="复制房间码"
            >
              复制
            </button>
          </div>

          <div className="flex items-center gap-4">
            {phase === "drawing" || phase === "choosingWord" ? (
              <Timer
                timeLeft={gameState.timeLeft || settings.drawTime}
                totalTime={
                  phase === "choosingWord" ? 15 : settings.drawTime
                }
              />
            ) : null}

            <div className="text-sm text-gray-500">
              第 {gameState.currentRound || 1} / {gameState.totalRounds || settings.rounds} 回合
            </div>

            <button
              onClick={leaveRoom}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              离开房间
            </button>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-[200px_1fr_280px] gap-4 h-[calc(100vh-140px)]">
        {/* Left: Player list */}
        <div className="overflow-auto">
          <PlayerList
            players={players}
            myPlayerId={myPlayerId}
            creator={room.creator}
            currentDrawer={gameState.currentDrawer}
          />
        </div>

        {/* Center: Canvas + toolbar */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Word hint / status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2 text-center">
            {phase === "drawing" && (
              <div>
                {isDrawer ? (
                  <span className="text-lg font-bold text-blue-600">
                    你的词语：<span className="text-gray-800">{myWord}</span>
                  </span>
                ) : (
                  <span className="text-lg font-mono tracking-widest text-gray-700">
                    {gameState.wordHint || "_ _ _ _"}
                  </span>
                )}
              </div>
            )}
            {phase === "choosingWord" && !isDrawer && (
              <span className="text-gray-500">
                {players.find((p) => p.id === gameState.currentDrawer)?.username} 正在选词…
              </span>
            )}
            {phase === "waiting" && (
              <div className="flex items-center justify-center gap-4">
                <span className="text-gray-500">等待玩家就位…</span>
                {isCreator && players.length >= 2 && (
                  <button
                    onClick={startGame}
                    className="px-4 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition-colors"
                  >
                    开始游戏
                  </button>
                )}
                {isCreator && players.length < 2 && (
                  <span className="text-sm text-gray-400">至少需要 2 名玩家</span>
                )}
              </div>
            )}
            {phase === "turnEnd" && (
              <span className="text-gray-600">下一轮即将开始…</span>
            )}
            {phase === "gameEnd" && (
              <span className="text-gray-600">本局已结束</span>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 min-h-0">
            <DrawingCanvas
              isDrawer={isDrawer && phase === "drawing"}
              drawingData={gameState.drawingData}
              onDraw={sendDraw}
              tool={tool}
              color={color}
              lineWidth={lineWidth}
            />
          </div>

          {/* Drawing tools (only for drawer) */}
          {isDrawer && phase === "drawing" && (
            <div className="space-y-2">
              <Toolbar
                tool={tool}
                lineWidth={lineWidth}
                onToolChange={setTool}
                onLineWidthChange={setLineWidth}
                onClear={handleClear}
                onUndo={handleUndo}
              />
              <ColorPalette color={color} onColorChange={setColor} />
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="min-h-0">
          <ChatBox
            messages={messages}
            onSend={sendGuess}
            disabled={isDrawer && phase === "drawing"}
            placeholder={
              isDrawer && phase === "drawing"
                ? "你正在作画，先专心画图"
                : "输入你的猜词"
            }
          />
        </div>
      </div>
    </div>
  );
}
