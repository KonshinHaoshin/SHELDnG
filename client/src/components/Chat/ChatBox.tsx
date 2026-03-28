import React, { useEffect, useRef } from "react";
import { ChatMessage } from "../../types";

interface ChatBoxProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MESSAGE_COLORS: Record<ChatMessage["type"], string> = {
  chat: "text-gray-800",
  guess: "text-gray-800",
  correct: "text-green-600 font-bold",
  system: "text-gray-400 italic text-sm",
  close: "text-yellow-600",
};

const USERNAME_COLORS = [
  "text-blue-600",
  "text-purple-600",
  "text-pink-600",
  "text-orange-600",
  "text-teal-600",
  "text-indigo-600",
];

function getUsernameColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USERNAME_COLORS[Math.abs(hash) % USERNAME_COLORS.length];
}

export function ChatBox({ messages, onSend, disabled, placeholder }: ChatBoxProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    onSend(text);
    input.value = "";
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-4">
            聊天和系统提示会显示在这里
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={MESSAGE_COLORS[msg.type]}>
            {msg.type === "system" || msg.playerId === "system" ? (
              <span>{msg.text}</span>
            ) : (
              <span>
                <span className={`font-semibold ${getUsernameColor(msg.username)}`}>
                  {msg.username}:{" "}
                </span>
                {msg.text}
              </span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            placeholder={placeholder || "请输入你的猜测"}
            maxLength={100}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={disabled}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  );
}
