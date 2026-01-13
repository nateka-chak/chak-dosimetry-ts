'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import Notification from './Notification';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface NotificationData {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  showNotification: (
    message: string, 
    type?: NotificationType, 
    duration?: number,
    action?: NotificationData['action']
  ) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within a NotificationProvider");
  return context;
};

// Function to save notification to database
const saveNotificationToDB = async (message: string, type: string) => {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type, 
        message 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to save notification to database:', errorData.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to save notification to database:', error);
    return false;
  }
};

// Enhanced notification types for better categorization
const enhanceNotificationType = (message: string, type: NotificationType): string => {
  // Map toast notification types to more specific database types
  if (type === 'success') {
    if (message.includes('approved') || message.includes('successfully')) {
      return 'approval';
    }
    if (message.includes('delivered') || message.includes('received')) {
      return 'delivery';
    }
    if (message.includes('created') || message.includes('added')) {
      return 'creation';
    }
    return 'success';
  }

  if (type === 'info') {
    if (message.includes('dispatched') || message.includes('shipped')) {
      return 'dispatch';
    }
    if (message.includes('processing') || message.includes('pending')) {
      return 'processing';
    }
    return 'info';
  }

  if (type === 'warning') {
    if (message.includes('low stock') || message.includes('running out')) {
      return 'inventory_warning';
    }
    if (message.includes('expiring') || message.includes('soon')) {
      return 'expiry_warning';
    }
    return 'warning';
  }

  if (type === 'error') {
    if (message.includes('rejected') || message.includes('denied')) {
      return 'rejection';
    }
    if (message.includes('failed') || message.includes('error')) {
      return 'system_error';
    }
    return 'error';
  }

  return type;
};

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = async (
    message: string, 
    type: NotificationType = 'info', 
    duration = 5000,
    action?: NotificationData['action']
  ) => {
    const id = Math.random().toString(36).substring(2, 15);
    const notification: NotificationData = { id, message, type, duration, action };
    
    // Save to database for persistence (don't await to avoid blocking UI)
    const dbType = enhanceNotificationType(message, type);
    saveNotificationToDB(message, dbType).then(success => {
      if (!success) {
        console.warn('Notification was shown but failed to save to database');
      }
    });
    
    setNotifications((prev) => {
      // Limit to 5 notifications at once to prevent overflow
      const updated = [...prev, notification].slice(-5);
      return updated;
    });
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const contextValue: NotificationContextType = {
    showNotification,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none max-w-sm w-full">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Notification
              message={notification.message}
              type={notification.type}
              duration={notification.duration}
              action={notification.action}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}