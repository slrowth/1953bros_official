"use client";

import { Bell, Inbox, Trash2 } from "lucide-react";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { getOrderStatusMeta } from "@/constants/orderStatus";

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminNotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllRead, clearNotifications, connectionState } = useNotifications();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#967d5a]">실시간 주문 알림</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">알림 센터</h1>
          <p className="mt-1 text-sm text-slate-500">
            새 주문 접수와 주문 상태 변경을 실시간으로 확인하세요. 표시되는 데이터는 브라우저에 안전하게 보관됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className={`flex items-center gap-1 rounded-full border px-3 py-1 ${connectionState === "READY" ? "border-emerald-200 text-emerald-600" : "border-amber-200 text-amber-600"}`}>
            <span className={`h-2 w-2 rounded-full ${connectionState === "READY" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
            {connectionState === "READY" ? "연결됨" : "연결 중"}
          </span>
          <span className="rounded-full border border-neutral-200 px-3 py-1 text-slate-600">
            총 {notifications.length}건 · 미확인 {unreadCount}건
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={markAllRead}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#967d5a] hover:text-[#967d5a]"
        >
          <Bell className="h-4 w-4" />
          모두 읽음 처리
        </button>
        <button
          type="button"
          onClick={clearNotifications}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-400 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
          알림 비우기
        </button>
      </div>

      <div className="mt-8 space-y-4">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white/80 p-12 text-center text-slate-500">
            <Inbox className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-800">표시할 알림이 없습니다.</p>
            <p className="mt-1 text-sm text-slate-500">새 주문 또는 상태 변경이 발생하면 실시간으로 알림이 표시됩니다.</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const meta = getOrderStatusMeta(notification.status);
            return (
              <div
                key={notification.id}
                className={`rounded-2xl border px-5 py-4 shadow-sm transition ${
                  notification.read ? "border-neutral-200 bg-white" : "border-amber-200 bg-amber-50/70"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{notification.title}</span>
                      <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                        meta.tone === "success"
                          ? "bg-emerald-100 text-emerald-700"
                          : meta.tone === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-sky-100 text-sky-700"
                      }`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                    <div className="mt-2 text-xs text-slate-400">
                      주문 #{notification.orderId} · {formatDate(notification.createdAt)}
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      className="inline-flex items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#967d5a] hover:text-[#967d5a]"
                    >
                      읽음 처리
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


