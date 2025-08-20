import { useState, useCallback } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, duration?: number) => {
    return addNotification({ message, type: 'success', duration });
  }, [addNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    return addNotification({ message, type: 'error', duration });
  }, [addNotification]);

  const showWarning = useCallback((message: string, duration?: number) => {
    return addNotification({ message, type: 'warning', duration });
  }, [addNotification]);

  const showInfo = useCallback((message: string, duration?: number) => {
    return addNotification({ message, type: 'info', duration });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};