'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Truck,
  Package,
  AlertTriangle,
  Info,
  RotateCcw,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'info' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Notification({
  message,
  onClose,
  duration = 5000,
  type = 'info',
  action,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setProgress((remaining / duration) * 100);

      if (remaining <= 0) {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onClose, isPaused]);

  const getNotificationConfig = () => {
    const baseConfig = {
      success: {
        icon: CheckCircle2,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-500',
        progressColor: 'bg-green-500',
        title: 'Success'
      },
      info: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-500',
        progressColor: 'bg-blue-500',
        title: 'Information'
      },
      warning: {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-500',
        progressColor: 'bg-yellow-500',
        title: 'Warning'
      },
      error: {
        icon: Package,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500',
        progressColor: 'bg-red-500',
        title: 'Error'
      }
    };

    // Auto-detect type based on message content
    if (type === 'info') {
      if (message.includes('received') || message.includes('delivered')) {
        return {
          ...baseConfig.success,
          icon: CheckCircle2,
          title: 'Delivery Update'
        };
      }
      if (message.includes('dispatched') || message.includes('shipped')) {
        return {
          ...baseConfig.info,
          icon: Truck,
          title: 'Dispatch Update'
        };
      }
      if (message.includes('returned')) {
        return {
          ...baseConfig.info,
          icon: RotateCcw,
          title: 'Return Update'
        };
      }
      if (message.includes('processing')) {
        return {
          ...baseConfig.info,
          icon: Clock,
          title: 'Processing'
        };
      }
    }

    return baseConfig[type];
  };

  const config = getNotificationConfig();
  const Icon = config.icon;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
          role="alert"
          aria-live="polite"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className={`professional-card rounded-xl border-l-4 ${config.borderColor} p-0 overflow-hidden hover:shadow-xl transition-all duration-200`}>
            {/* Progress Bar */}
            {!isPaused && (
              <div className="w-full h-1 bg-gray-200">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                  className={`h-full ${config.progressColor} transition-all duration-100`}
                />
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${config.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-sm font-semibold ${config.textColor}`}>
                        {config.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                        {message}
                      </p>
                      
                      {/* Action Button */}
                      {action && (
                        <button
                          onClick={action.onClick}
                          className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200"
                        >
                          {action.label}
                        </button>
                      )}
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={handleClose}
                      className="flex-shrink-0 ml-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                      aria-label="Close notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`px-4 py-2 ${config.bgColor} border-t border-gray-100`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${config.textColor}`}>
                  {type === 'success' && 'Completed successfully'}
                  {type === 'info' && 'System notification'}
                  {type === 'warning' && 'Attention required'}
                  {type === 'error' && 'Action needed'}
                </span>
                <span className="text-gray-500">
                  {isPaused ? 'Paused' : 'Auto-close'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}