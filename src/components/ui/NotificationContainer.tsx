import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationToast } from './NotificationToast'; // Assuming NotificationToast is correctly imported

interface NotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
}

export default function NotificationContainer({
  position = 'top-right',
  maxNotifications = 5
}: NotificationContainerProps) {
  const { notifications, removeNotification } = useNotifications();

  // Limit the number of visible notifications
  const visibleNotifications = notifications.slice(-maxNotifications);

  return (
    <div className="fixed z-50 pointer-events-none">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            marginBottom: index > 0 ? '8px' : '0'
          }}
        >
          <NotificationToast
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
            position={position}
          />
        </div>
      ))}
    </div>
  );
}