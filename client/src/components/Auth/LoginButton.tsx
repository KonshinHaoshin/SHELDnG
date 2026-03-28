import React from "react";
import { useAuth } from "../../context/AuthContext";

export function LoginButton() {
  const { user, signIn, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.72)] bg-[rgba(255,252,248,0.82)] px-2 py-1.5 shadow-[0_14px_32px_rgba(117,81,49,0.08)] backdrop-blur-md">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#e78fae] to-[#e6b365] text-sm font-bold text-white">
          {user.fullName?.[0] ?? user.username?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "绘"}
        </div>
        <span className="text-sm font-medium text-[#63493a]">
          {user.fullName ?? user.username ?? user.email?.split("@")[0] ?? "玩家"}
        </span>
        <button
          onClick={signOut}
          className="text-xs text-[#9e8777] transition-colors hover:text-[#705243]"
        >
          退出登录
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#e88ea6,#e6b060)] px-4 py-2 text-sm font-medium text-white shadow-[0_14px_32px_rgba(217,138,110,0.24)] transition hover:brightness-105"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
      使用庇护所账号登录
    </button>
  );
}
