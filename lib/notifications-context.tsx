import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  NotificationType,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications-service";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // = created_at
  read: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refetch: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: () => {},
  markAllAsRead: () => {},
  refetch: () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await getUserNotifications(userId);
      setNotifications(
        rows.map((r) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          message: r.message,
          timestamp: r.created_at,
          read: r.read,
        }))
      );
    } catch (e: any) {
      console.warn("[notifications] load failed:", e?.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markNotificationRead(id).catch((e) => console.warn("[notifications] markAsRead failed:", e?.message));
  }, []);

  const markAllAsRead = useCallback(() => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead(userId).catch((e) => console.warn("[notifications] markAllAsRead failed:", e?.message));
  }, [userId]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
