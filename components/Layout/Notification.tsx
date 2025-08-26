'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Truck,
  Package,
  AlertTriangle,
} from 'lucide-react';

interface NotificationProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export default function Notification({
  message,
  onClose,
  duration = 5000,
  type = 'info',
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getNotificationIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <Package className="h-5 w-5 text-red-500" />;
      default:
        if (message.includes('received'))
          return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        if (message.includes('dispatched'))
          return <Truck className="h-5 w-5 text-blue-500" />;
        return <Bell className="h-5 w-5 text-chak-blue" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-transform transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getNotificationIcon()}</div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-semibold text-gray-900">Notification</p>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close notification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
