"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "./NotificationProvider";

export default function NotificationBell() {
  const { unreadCount, connectionState } = useNotifications();
  const isConnected = connectionState === "READY";

  return (
    <Link
      href="/admin/notifications"
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-slate-500 transition hover:border-[#967d5a] hover:text-[#967d5a]"
      title={isConnected ? "실시간 알림 확인" : "알림 연결 중..."}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-[#d97706] px-1 text-xs font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
      {!isConnected && (
        <span className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden />
      )}
    </Link>
  );
}

