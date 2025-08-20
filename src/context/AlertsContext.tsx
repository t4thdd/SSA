import React, { createContext, useContext, useState, ReactNode } from 'react';
import { type Alert, mockAlerts, mockDistributionRequests } from '../data/mockData';

interface AlertsContextType {
  alerts: Alert[];
  unreadAlerts: Alert[];
  criticalAlerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void;
  markAsRead: (alertId: string) => void;
  removeAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};

interface AlertsProviderProps {
  children: ReactNode;
}

export const AlertsProvider: React.FC<AlertsProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const criticalAlerts = alerts.filter(alert => alert.priority === 'critical' && !alert.isRead);

  const addAlert = (alertData: Omit<Alert, 'id' | 'createdAt'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isRead: true }
          : alert
      )
    );
  };

  const removeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };
  // إضافة تنبيه تلقائي عند وجود طلبات توزيع معلقة
  React.useEffect(() => {
    const pendingRequests = mockDistributionRequests.filter(r => r.status === 'pending');
    if (pendingRequests.length > 0) {
      const existingAlert = alerts.find(a => 
        a.type === 'urgent' && 
        a.title.includes('طلبات توزيع معلقة') && 
        !a.isRead
      );
      
      if (!existingAlert) {
        const newAlert: Alert = {
          id: `alert-pending-requests-${Date.now()}`,
          type: 'urgent',
          title: 'طلبات توزيع معلقة تحتاج مراجعة',
          description: `يوجد ${pendingRequests.length} طلب توزيع في انتظار مراجعة الأدمن`,
          relatedId: 'admin-dashboard',
          relatedType: 'task',
          priority: 'high',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        
        setAlerts(prev => [newAlert, ...prev]);
      }
    }
  }, [alerts]);

  const value = {
    alerts,
    unreadAlerts,
    criticalAlerts,
    addAlert,
    markAsRead,
    removeAlert,
    clearAllAlerts
  };

  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
};