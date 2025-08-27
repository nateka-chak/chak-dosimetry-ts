'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import Notification from './Notification';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within a NotificationProvider");
  return context;
};

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<
    { id: number; message: string; type: NotificationType; duration?: number }[]
  >([]);

  const showNotification = (message: string, type: NotificationType = 'info', duration = 5000) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.map((n) => (
        <Notification
          key={n.id}
          message={n.message}
          type={n.type}
          duration={n.duration}
          onClose={() => removeNotification(n.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
}
