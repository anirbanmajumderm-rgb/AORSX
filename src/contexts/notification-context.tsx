"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface NotificationContextType {
  unreadCount: number;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refetch: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications?filter=unread");
      const json = await res.json();
      if (json.success) {
        const data = json.data || json;
        setUnreadCount(data.unreadCount ?? data.notifications?.length ?? 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refetch: fetchCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
