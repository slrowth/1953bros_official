"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOrderStatusLabel, getOrderStatusMeta } from "@/constants/orderStatus";

const NotificationContext = createContext(null);
const STORAGE_KEY = "admin-order-notifications";
const MAX_NOTIFICATIONS = 150;

function buildNotificationPayload(base) {
  return {
    id: `${base.orderId}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...base,
  };
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [connectionState, setConnectionState] = useState("IDLE");
  const toastTimers = useRef(new Map());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        }
      }
    } catch (error) {
      console.error("알림 로컬 저장소 조회 실패:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error("알림 로컬 저장소 저장 실패:", error);
    }
  }, [notifications]);

  const appendNotification = useCallback((notification) => {
    setNotifications((prev) => {
      const next = [notification, ...prev];
      if (next.length > MAX_NOTIFICATIONS) {
        return next.slice(0, MAX_NOTIFICATIONS);
      }
      return next;
    });

    setToasts((prev) => [...prev, notification]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== notification.id));
      toastTimers.current.delete(notification.id);
    }, 6500);

    toastTimers.current.set(notification.id, timer);
  }, []);

  useEffect(() => {
    let channel;
    const supabase = createClient();

    function handlePayload(payload) {
      const { eventType, new: newRow, old: oldRow } = payload;
      if (!newRow) {
        return;
      }

      if (eventType === "INSERT") {
        const statusLabel = getOrderStatusLabel(newRow.status);
        const orderCode = newRow.order_code || newRow.id;
        const notification = buildNotificationPayload({
          type: "ORDER_CREATED",
          orderId: newRow.id,
          orderCode,
          status: newRow.status,
          title: "새 주문 접수",
          message: `주문 #${orderCode}이(가) ${statusLabel} 상태로 접수되었습니다.`,
          storeId: newRow.store_id,
          totalAmount: newRow.total_amount,
        });
        appendNotification(notification);
      } else if (eventType === "UPDATE" && newRow.status !== oldRow?.status) {
        const statusMeta = getOrderStatusMeta(newRow.status);
        const orderCode = newRow.order_code || newRow.id;
        const notification = buildNotificationPayload({
          type: "ORDER_STATUS_CHANGED",
          orderId: newRow.id,
          orderCode,
          status: newRow.status,
          previousStatus: oldRow?.status,
          title: "주문 상태 변경",
          message: `주문 #${orderCode} 상태가 ${statusMeta.label}(으)로 변경되었습니다.`,
          storeId: newRow.store_id,
          totalAmount: newRow.total_amount,
        });
        appendNotification(notification);
      }
    }

    setConnectionState("CONNECTING");
    channel = supabase
      .channel("admin-order-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        handlePayload
      )
      .subscribe((status) => {
        setConnectionState(status === "SUBSCRIBED" ? "READY" : status);
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      toastTimers.current.forEach((timer) => clearTimeout(timer));
      toastTimers.current.clear();
    };
  }, [appendNotification]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setToasts([]);
    toastTimers.current.forEach((timer) => clearTimeout(timer));
    toastTimers.current.clear();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      toasts,
      unreadCount,
      connectionState,
      markAsRead,
      markAllRead,
      clearNotifications,
    }),
    [notifications, toasts, unreadCount, connectionState, markAsRead, markAllRead, clearNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications 훅은 NotificationProvider 내에서만 사용할 수 있습니다.");
  }
  return context;
}





