"use client";

import { AlertTriangle, Bell, CheckCircle } from "lucide-react";
import { useNotifications } from "./NotificationProvider";
import { getOrderStatusMeta } from "@/constants/orderStatus";

const toneIconMap = {
  warning: AlertTriangle,
  success: CheckCircle,
  info: Bell,
};

export default function NotificationToaster() {
  const { toasts } = useNotifications();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3 md:right-8 md:top-8">
      {toasts.map((toast) => {
        const meta = getOrderStatusMeta(toast.status);
        const ToneIcon = toneIconMap[meta.tone] || Bell;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-2xl shadow-black/10 backdrop-blur-md transition hover:border-[#967d5a]"
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-[#967d5a]/10 text-[#967d5a]`}>
                <ToneIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
                <p className="mt-2 text-xs text-slate-400">주문 #{toast.orderId} • {meta.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}








