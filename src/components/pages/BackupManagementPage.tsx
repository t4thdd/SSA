import React, { useState } from 'react';
import { Database, Download, Upload, RefreshCw, Calendar, Clock, CheckCircle, AlertTriangle, Shield, HardDrive, Archive, Trash2, Eye, Settings, Activity, FileText, Save, X, Plus, Edit, Star, TrendingUp, BarChart3 } from 'lucide-react';
import { useErrorLogger } from '../../utils/errorLogger'; // Assuming errorLogger.ts is correctly imported
import { Button, Card, Input, Badge, Modal } from '../ui';

interface BackupRecord {
  id: string;
  name: string;
  type: 'manual' | 'automatic' | 'scheduled';
  size: number; // in MB
  status: 'completed' | 'in_progress' | 'failed' | 'corrupted';
  createdAt: string;
  createdBy: string;
  description: string;
  tables: string[];
  compressionRatio: number;
  downloadUrl?: string;
  restoreCount: number;
  lastRestored?: string;
}

interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time: string;
  isActive: boolean;
  lastRun: string;
  nextRun: string;
  retentionDays: number;
  includeTables: string[];
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

export default function BackupManagementPage() {
  const { logInfo, logError } = useErrorLogger();
  const [activeTab, setActiveTab] = useState('backups');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'schedule' | 'restore' | 'view' | 'settings'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Mock backup records
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([
    {
      id: 'backup-1',
      name: 'نسخة احتياطية شاملة - ديسمبر 2024',
      type: 'manual',
      size: 45.7,
      status: 'completed',
      createdAt: '2024-12-21T10:30:00',
      createdBy: 'أحمد الإدمن',
      description: 'نسخة احتياطية شاملة تتضمن جميع البيانات',
      tables: ['beneficiaries', 'organizations', 'packages', 'tasks', 'users'],
      compressionRatio: 0.65,
      downloadUrl: 'https://example.com/backup-1.sql.gz',
      restoreCount: 0
    },
    {
      id: 'backup-2',
      name: 'نسخة احتياطية تلقائية يومية',
      type: 'automatic',
      size: 38.2,
      status: 'completed',
      createdAt: '2024-12-20T02:00:00',
      createdBy: 'النظام',
      description: 'نسخة احتياطية تلقائية يومية',
      tables: ['beneficiaries', 'packages', 'tasks'],
      compressionRatio: 0.72,
      downloadUrl: 'https://example.com/backup-2.sql.gz',
      restoreCount: 1,
      lastRestored: '2024-12-20T15:30:00'
    },
    {
      id: 'backup-3',
      name: 'نسخة احتياطية أسبوعية',
      type: 'scheduled',
      size: 52.1,
      status: 'completed',
      createdAt: '2024-12-15T01:00:00',
      createdBy: 'النظام',
      description: 'نسخة احتياطية أسبوعية مجدولة',
      tables: ['beneficiaries', 'organizations', 'families', 'packages', 'tasks', 'users', 'roles'],
      compressionRatio: 0.58,
      downloadUrl: 'https://example.com/backup-3.sql.gz',
      restoreCount: 0
    },
    {
      id: 'backup-4',
      name: 'نسخة احتياطية طوارئ',
      type: 'manual',
      size: 0,
      status: 'failed',
      createdAt: '2024-12-19T14:45:00',
      createdBy: 'فاطمة المشرفة',
      description: 'نسخة احتياطية طوارئ - فشلت',
      tables: ['beneficiaries', 'packages'],
      compressionRatio: 0,
      restoreCount: 0
    },
    {
      id: 'backup-5',
      name: 'نسخة احتياطية قيد التنفيذ',
      type: 'manual',
      size: 0,
      status: 'in_progress',
      createdAt: '2024-12-21T11:00:00',
      createdBy: 'أحمد الإدمن',
      description: 'نسخة احتياطية قيد الإنشاء حالياً',
      tables: ['beneficiaries', 'organizations', 'packages'],
      compressionRatio: 0,
      restoreCount: 0
    }
  ]);

  // Mock backup schedules
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([
    {
      id: 'schedule-1',
      name: 'نسخة احتياطية يومية',
      frequency: 'daily',
      time: '02:00',
      isActive: true,
      lastRun: '2024-12-21T02:00:00',
      nextRun: '2024-12-22T02:00:00',
      retentionDays: 30,
      includeTables: ['beneficiaries', 'packages', 'tasks'],
      compressionEnabled: true,
      encryptionEnabled: true
    },
    {
      id: 'schedule-2',
      name: 'نسخة احتياطية أسبوعية شاملة',
      frequency: 'weekly',
      time: '01:00',
      isActive: true,
      lastRun: '2024-12-15T01:00:00',
      nextRun: '2024-12-22T01:00:00',
      retentionDays: 90,
      includeTables: ['beneficiaries', 'organizations', 'families', 'packages', 'tasks', 'users', 'roles'],
      compressionEnabled: true,
      encryptionEnabled: true
    },
    {
      id: 'schedule-3',
      name: 'نسخة احتياطية شهرية أرشيفية',
      frequency: 'monthly',
      time: '00:00',
      isActive: false,
      lastRun: '2024-11-01T00:00:00',
      nextRun: '2025-01-01T00:00:00',
      retentionDays: 365,
      includeTables: ['beneficiaries', 'organizations', 'families', 'packages', 'tasks', 'users', 'roles', 'activity_log'],
      compressionEnabled: true,
      encryptionEnabled: true
    }
  ]);

  // Form states
  const [backupForm, setBackupForm] = useState({
    name: '',
    description: '',
    includeTables: [] as string[],
    compressionEnabled: true,
    encryptionEnabled: true
  });

  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    frequency: 'daily' as BackupSchedule['frequency'],
    time: '02:00',
    retentionDays: 30,
    includeTables: [] as string[],
    compressionEnabled: true,
    encryptionEnabled: true
  });

  const availableTables = [
    { name: 'beneficiaries', label: 'المستفيدين', size: '15.2 MB' },
    { name: 'organizations', label: 'المؤسسات', size: '2.1 MB' },
    { name: 'families', label: 'العائلات', size: '1.8 MB' },
    { name: 'packages', label: 'الطرود', size: '8.9 MB' },
    { name: 'tasks', label: 'المهام', size: '12.3 MB' },
    { name: 'users', label: 'المستخدمين', size: '0.5 MB' },
    { name: 'roles', label: 'الأدوار', size: '0.1 MB' },
    { name: 'activity_log', label: 'سجل النشاط', size: '25.7 MB' }
  ];

  const tabs = [
    { id: 'backups', name: 'النسخ الاحتياطية', icon: Database },
    { id: 'schedules', name: 'الجدولة التلقائية', icon: Calendar },
    { id: 'settings', name: 'إعدادات النسخ', icon: Settings },
    { id: 'analytics', name: 'تحليلات النسخ', icon: BarChart3 }
  ];

  // فلترة النسخ الاحتياطية
  const filteredBackups = backupRecords.filter(backup => {
    const matchesSearch = backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         backup.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // إحصائيات
  const backupStats = {
    total: backupRecords.length,
    completed: backupRecords.filter(b => b.status === 'completed').length,
    failed: backupRecords.filter(b => b.status === 'failed').length,
    inProgress: backupRecords.filter(b => b.status === 'in_progress').length,
    totalSize: backupRecords.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.size, 0),
    activeSchedules: backupSchedules.filter(s => s.isActive).length
  };

  const handleCreateBackup = async () => {
    if (!backupForm.name.trim() || backupForm.includeTables.length === 0) {
      setNotification({ message: 'يرجى إدخال اسم النسخة واختيار الجداول', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsCreatingBackup(true);
    
    Sentry.addBreadcrumb({
      message: 'Creating backup',
      category: 'backup',
      data: { backupName: backupForm.name, tables: backupForm.includeTables }
    });
    
    try {
      // محاكاة إنشاء نسخة احتياطية
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newBackup: BackupRecord = {
        id: `backup-${Date.now()}`,
        name: backupForm.name,
        type: 'manual',
        size: Math.random() * 50 + 10, // حجم عشوائي بين 10-60 MB
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: 'أحمد الإدمن',
        description: backupForm.description,
        tables: backupForm.includeTables,
        compressionRatio: backupForm.compressionEnabled ? 0.6 + Math.random() * 0.2 : 1,
        downloadUrl: `https://example.com/backup-${Date.now()}.sql.gz`,
        restoreCount: 0
      };

      setBackupRecords(prev => [newBackup, ...prev]);
      setNotification({ message: `تم إنشاء النسخة الاحتياطية "${backupForm.name}" بنجاح`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      
      setShowModal(false);
      setBackupForm({
        name: '',
        description: '',
        includeTables: [],
        compressionEnabled: true,
        encryptionEnabled: true
      });
      
      logInfo(`تم إنشاء نسخة احتياطية: ${backupForm.name}`, 'BackupManagementPage');
    } catch (error) {
      logError(error as Error, 'BackupManagementPage');
      setNotification({ message: 'حدث خطأ في إنشاء النسخة الاحتياطية', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backup: BackupRecord) => {
    if (!confirm(`هل أنت متأكد من استعادة النسخة الاحتياطية "${backup.name}"؟\n\nتحذير: سيتم استبدال البيانات الحالية!`)) {
      return;
    }

    setIsRestoring(true);
    
    try {
      // محاكاة استعادة النسخة الاحتياطية
      await new Promise(resolve => setTimeout(resolve, 5000));

      // تحديث عداد الاستعادة
      setBackupRecords(prev => 
        prev.map(b => 
          b.id === backup.id 
            ? { ...b, restoreCount: b.restoreCount + 1, lastRestored: new Date().toISOString() }
            : b
        )
      );

      setNotification({ message: `تم استعادة النسخة الاحتياطية "${backup.name}" بنجاح`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      
      logInfo(`تم استعادة النسخة الاحتياطية: ${backup.name}`, 'BackupManagementPage');
    } catch (error) {
      logError(error as Error, 'BackupManagementPage');
      setNotification({ message: 'حدث خطأ في استعادة النسخة الاحتياطية', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = (backup: BackupRecord) => {
    if (confirm(`هل أنت متأكد من حذف النسخة الاحتياطية "${backup.name}"؟`)) {
      setBackupRecords(prev => prev.filter(b => b.id !== backup.id));
      setNotification({ message: `تم حذف النسخة الاحتياطية "${backup.name}"`, type: 'warning' });
      setTimeout(() => setNotification(null), 3000);
      logInfo(`تم حذف النسخة الاحتياطية: ${backup.name}`, 'BackupManagementPage');
    }
  };

  const handleDownloadBackup = (backup: BackupRecord) => {
    if (backup.downloadUrl) {
      // محاكاة تحميل النسخة الاحتياطية
      const link = document.createElement('a');
      link.href = backup.downloadUrl;
      link.download = `${backup.name.replace(/\s+/g, '_')}.sql.gz`;
      link.click();
      
      setNotification({ message: `بدء تحميل النسخة الاحتياطية "${backup.name}"`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      logInfo(`تم تحميل النسخة الاحتياطية: ${backup.name}`, 'BackupManagementPage');
    }
  };

  const handleToggleSchedule = (scheduleId: string) => {
    setBackupSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, isActive: !schedule.isActive }
          : schedule
      )
    );
    
    const schedule = backupSchedules.find(s => s.id === scheduleId);
    const action = schedule?.isActive ? 'إلغاء تفعيل' : 'تفعيل';
    setNotification({ message: `تم ${action} الجدولة "${schedule?.name}"`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'corrupted': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتملة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'failed': return 'فشلت';
      case 'corrupted': return 'تالفة';
      default: return 'غير محدد';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual': return 'bg-blue-100 text-blue-800';
      case 'automatic': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'manual': return 'يدوية';
      case 'automatic': return 'تلقائية';
      case 'scheduled': return 'مجدولة';
      default: return 'غير محدد';
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'hourly': return 'كل ساعة';
      case 'daily': return 'يومياً';
      case 'weekly': return 'أسبوعياً';
      case 'monthly': return 'شهرياً';
      default: return 'غير محدد';
    }
  };

  const getNotificationClasses = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-200 text-green-800';
      case 'error': return 'bg-red-100 border-red-200 text-red-800';
      case 'warning': return 'bg-orange-100 border-orange-200 text-orange-800';
    }
  };

  const getNotificationIcon = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  const handleExportBackupList = () => {
    const exportData = {
      date: new Date().toISOString(),
      totalBackups: backupRecords.length,
      statistics: backupStats,
      backups: backupRecords.map(backup => ({
        name: backup.name,
        type: getTypeText(backup.type),
        size: `${backup.size} MB`,
        status: getStatusText(backup.status),
        createdAt: backup.createdAt,
        createdBy: backup.createdBy,
        tables: backup.tables.join(', '),
        restoreCount: backup.restoreCount
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قائمة_النسخ_الاحتياطية_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير قائمة النسخ الاحتياطية بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 space-x-reverse ${getNotificationClasses(notification.type)}`}>
          {getNotificationIcon(notification.type)}
          <span className="font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            البيانات الوهمية محملة - {backupRecords.length} نسخة احتياطية، {backupSchedules.length} جدولة
          </span>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <div className="flex space-x-1 space-x-reverse">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3 space-x-reverse">
              <Button variant="success" icon={Download} iconPosition="right" onClick={handleExportBackupList}>
                تصدير القائمة
              </Button>
              <Button 
                variant="primary" 
                icon={Plus} 
                iconPosition="right" 
                onClick={() => {
                  setModalType('create');
                  setShowModal(true);
                }}
              >
                إنشاء نسخة احتياطية
              </Button>
            </div>
          </div>

          {/* Search */}
          <Card>
            <Input
              type="text"
              icon={Database}
              iconPosition="right"
              placeholder="البحث في النسخ الاحتياطية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <Database className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-blue-600">إجمالي النسخ</p>
                <p className="text-2xl font-bold text-blue-900">{backupStats.total}</p>
              </div>
            </Card>

            <Card className="bg-green-50">
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-green-600">مكتملة</p>
                <p className="text-2xl font-bold text-green-900">{backupStats.completed}</p>
              </div>
            </Card>

            <Card className="bg-purple-50">
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <HardDrive className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-purple-600">الحجم الإجمالي</p>
                <p className="text-2xl font-bold text-purple-900">{backupStats.totalSize.toFixed(1)} MB</p>
              </div>
            </Card>

            <Card className="bg-orange-50">
              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <Calendar className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-orange-600">جدولة نشطة</p>
                <p className="text-2xl font-bold text-orange-900">{backupStats.activeSchedules}</p>
              </div>
            </Card>
          </div>

          {/* Backup Progress */}
          {isCreatingBackup && (
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-3 space-x-reverse">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <span className="font-medium text-blue-800">جاري إنشاء النسخة الاحتياطية...</span>
                  <p className="text-blue-600 text-sm mt-1">يرجى الانتظار، قد تستغرق العملية عدة دقائق</p>
                </div>
              </div>
            </Card>
          )}

          {/* Restore Progress */}
          {isRestoring && (
            <Card className="bg-orange-50 border-orange-200">
              <div className="flex items-center space-x-3 space-x-reverse">
                <RefreshCw className="w-5 h-5 text-orange-600 animate-spin" />
                <div>
                  <span className="font-medium text-orange-800">جاري استعادة النسخة الاحتياطية...</span>
                  <p className="text-orange-600 text-sm mt-1">يرجى عدم إغلاق المتصفح أثناء العملية</p>
                </div>
              </div>
            </Card>
          )}

          {/* Backups List */}
          <div className="grid gap-4">
            {filteredBackups.length > 0 ? (
              filteredBackups.map((backup) => (
                <Card key={backup.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 space-x-reverse flex-1">
                      <div className={`p-3 rounded-xl ${getStatusColor(backup.status)}`}>
                        <Database className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                          <h3 className="font-semibold text-gray-900">{backup.name}</h3>
                          <Badge variant={
                            backup.type === 'manual' ? 'info' :
                            backup.type === 'automatic' ? 'success' : 'warning'
                          } size="sm">
                            {getTypeText(backup.type)}
                          </Badge>
                          <Badge variant={
                            backup.status === 'completed' ? 'success' :
                            backup.status === 'failed' ? 'error' :
                            backup.status === 'in_progress' ? 'warning' : 'neutral'
                          } size="sm">
                            {getStatusText(backup.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{backup.description}</p>
                        
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">الحجم:</span>
                            <span className="font-medium text-gray-900 mr-1">
                              {backup.size > 0 ? `${backup.size.toFixed(1)} MB` : 'غير محدد'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">الجداول:</span>
                            <span className="font-medium text-gray-900 mr-1">{backup.tables.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">تاريخ الإنشاء:</span>
                            <span className="font-medium text-gray-900 mr-1">
                              {new Date(backup.createdAt).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">بواسطة:</span>
                            <span className="font-medium text-gray-900 mr-1">{backup.createdBy}</span>
                          </div>
                        </div>

                        {backup.restoreCount > 0 && (
                          <div className="mt-3 text-xs text-purple-600">
                            <Star className="w-3 h-3 inline ml-1" />
                            تم استعادتها {backup.restoreCount} مرة
                            {backup.lastRestored && (
                              <span className="mr-2">
                                - آخر استعادة: {new Date(backup.lastRestored).toLocaleDateString('ar-SA')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 space-x-reverse">
                      {backup.status === 'completed' && (
                        <>
                          <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => handleDownloadBackup(backup)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="warning" 
                            size="sm" 
                            onClick={() => handleRestoreBackup(backup)}
                            disabled={isRestoring}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => {
                          setModalType('view');
                          setSelectedItem(backup);
                          setShowModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteBackup(backup)}
                        disabled={backup.status === 'in_progress'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">
                    {searchTerm ? 'لا توجد نسخ احتياطية مطابقة للبحث' : 'لا توجد نسخ احتياطية'}
                  </p>
                  <p className="text-sm mt-2">
                    {searchTerm ? 'جرب تعديل مصطلح البحث' : 'ابدأ بإنشاء نسخة احتياطية جديدة'}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">الجدولة التلقائية</h3>
            <Button 
              variant="primary" 
              icon={Plus} 
              iconPosition="right"
              onClick={() => {
                setModalType('schedule');
                setShowModal(true);
              }}
            >
              إضافة جدولة جديدة
            </Button>
          </div>

          <div className="grid gap-4">
            {backupSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`p-3 rounded-xl ${schedule.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Calendar className={`w-6 h-6 ${schedule.isActive ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        <h4 className="font-semibold text-gray-900">{schedule.name}</h4>
                        <Badge variant={schedule.isActive ? 'success' : 'neutral'} size="sm">
                          {schedule.isActive ? 'نشط' : 'معطل'}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span>التكرار: </span>
                          <span className="font-medium">{getFrequencyText(schedule.frequency)}</span>
                        </div>
                        <div>
                          <span>الوقت: </span>
                          <span className="font-medium">{schedule.time}</span>
                        </div>
                        <div>
                          <span>الاحتفاظ: </span>
                          <span className="font-medium">{schedule.retentionDays} يوم</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        آخر تشغيل: {new Date(schedule.lastRun).toLocaleDateString('ar-SA')} | 
                        التشغيل التالي: {new Date(schedule.nextRun).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 space-x-reverse">
                    <Button 
                      variant={schedule.isActive ? 'warning' : 'success'} 
                      size="sm"
                      onClick={() => handleToggleSchedule(schedule.id)}
                    >
                      {schedule.isActive ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="danger" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">إعدادات النسخ الاحتياطي</h3>
          
          <div className="grid gap-6">
            <Card>
              <h4 className="font-semibold text-gray-900 mb-4">الإعدادات العامة</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">تفعيل النسخ الاحتياطي التلقائي</p>
                    <p className="text-sm text-gray-600">إنشاء نسخ احتياطية تلقائية حسب الجدولة</p>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-green-600">مفعل</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">ضغط النسخ الاحتياطية</p>
                    <p className="text-sm text-gray-600">تقليل حجم النسخ الاحتياطية بالضغط</p>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-green-600">مفعل</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">تشفير النسخ الاحتياطية</p>
                    <p className="text-sm text-gray-600">حماية النسخ الاحتياطية بالتشفير</p>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-green-600">مفعل</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="font-semibold text-gray-900 mb-4">إعدادات التخزين</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">مدة الاحتفاظ الافتراضية (أيام)</label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأقصى لحجم النسخة (MB)</label>
                  <input
                    type="number"
                    defaultValue="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">تحليلات النسخ الاحتياطي</h3>
          
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <h4 className="font-semibold text-gray-900 mb-4">إحصائيات الأداء</h4>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">معدل النجاح</span>
                    <span className="text-2xl font-bold text-green-900">
                      {backupRecords.length > 0 ? ((backupStats.completed / backupRecords.length) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">متوسط الحجم</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {backupStats.completed > 0 ? (backupStats.totalSize / backupStats.completed).toFixed(1) : 0} MB
                    </span>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700">متوسط نسبة الضغط</span>
                    <span className="text-2xl font-bold text-purple-900">65%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="font-semibold text-gray-900 mb-4">اتجاهات الاستخدام</h4>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>رسم بياني لاتجاهات النسخ الاحتياطي</p>
                  <p className="text-sm mt-1">سيتم تطوير الرسوم البيانية التفاعلية هنا</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal for Backup Operations */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'create' ? 'إنشاء نسخة احتياطية جديدة' :
            modalType === 'schedule' ? 'إضافة جدولة جديدة' :
            modalType === 'restore' ? 'استعادة نسخة احتياطية' :
            modalType === 'view' ? 'تفاصيل النسخة الاحتياطية' :
            'إعدادات النسخ الاحتياطي'
          }
          size="lg"
        >
          <div className="p-6">
            {/* Create Backup Form */}
            {modalType === 'create' && (
              <div className="space-y-6">
                <Input
                  label="اسم النسخة الاحتياطية *"
                  type="text"
                  value={backupForm.name}
                  onChange={(e) => setBackupForm({...backupForm, name: e.target.value})}
                  placeholder="أدخل اسم النسخة الاحتياطية..."
                  required
                />

                <Input
                  label="الوصف"
                  type="textarea"
                  value={backupForm.description}
                  onChange={(e) => setBackupForm({...backupForm, description: e.target.value})}
                  placeholder="وصف مختصر للنسخة الاحتياطية..."
                  rows={3}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">الجداول المراد نسخها *</label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {availableTables.map((table) => (
                      <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="checkbox"
                            checked={backupForm.includeTables.includes(table.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBackupForm({
                                  ...backupForm,
                                  includeTables: [...backupForm.includeTables, table.name]
                                });
                              } else {
                                setBackupForm({
                                  ...backupForm,
                                  includeTables: backupForm.includeTables.filter(t => t !== table.name)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-900">{table.label}</span>
                        </div>
                        <span className="text-xs text-gray-500">{table.size}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={backupForm.compressionEnabled}
                      onChange={(e) => setBackupForm({...backupForm, compressionEnabled: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">تفعيل الضغط (يقلل الحجم بـ 60%)</label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={backupForm.encryptionEnabled}
                      onChange={(e) => setBackupForm({...backupForm, encryptionEnabled: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">تفعيل التشفير (حماية إضافية)</label>
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    loading={isCreatingBackup}
                  >
                    إنشاء النسخة الاحتياطية
                  </Button>
                </div>
              </div>
            )}

            {/* View Backup Details */}
            {modalType === 'view' && selectedItem && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3">تفاصيل النسخة الاحتياطية</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">الاسم:</span>
                      <span className="font-medium text-gray-900 mr-2">{selectedItem.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">النوع:</span>
                      <Badge variant="info" size="sm" className="mr-2">
                        {getTypeText(selectedItem.type)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">الحجم:</span>
                      <span className="font-medium text-gray-900 mr-2">
                        {selectedItem.size > 0 ? `${selectedItem.size.toFixed(1)} MB` : 'غير محدد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">الحالة:</span>
                      <Badge variant={
                        selectedItem.status === 'completed' ? 'success' :
                        selectedItem.status === 'failed' ? 'error' : 'warning'
                      } size="sm" className="mr-2">
                        {getStatusText(selectedItem.status)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">تاريخ الإنشاء:</span>
                      <span className="font-medium text-gray-900 mr-2">
                        {new Date(selectedItem.createdAt).toLocaleString('ar-SA')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">بواسطة:</span>
                      <span className="font-medium text-gray-900 mr-2">{selectedItem.createdBy}</span>
                    </div>
                    {selectedItem.compressionRatio > 0 && selectedItem.compressionRatio < 1 && (
                      <div>
                        <span className="text-gray-600">نسبة الضغط:</span>
                        <span className="font-medium text-gray-900 mr-2">
                          {((1 - selectedItem.compressionRatio) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {selectedItem.restoreCount > 0 && (
                      <div>
                        <span className="text-gray-600">مرات الاستعادة:</span>
                        <span className="font-medium text-gray-900 mr-2">{selectedItem.restoreCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedItem.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-900">{selectedItem.description}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الجداول المشمولة ({selectedItem.tables.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.tables.map((table: string) => {
                      const tableInfo = availableTables.find(t => t.name === table);
                      return (
                        <span key={table} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm">
                          {tableInfo ? tableInfo.label : table}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                  {selectedItem.status === 'completed' && (
                    <>
                      <Button variant="success" onClick={() => handleDownloadBackup(selectedItem)}>
                        تحميل
                      </Button>
                      <Button 
                        variant="warning" 
                        onClick={() => handleRestoreBackup(selectedItem)}
                        disabled={isRestoring}
                      >
                        استعادة
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Schedule Form */}
            {modalType === 'schedule' && (
              <div className="space-y-6">
                <Input
                  label="اسم الجدولة *"
                  type="text"
                  placeholder="مثال: نسخة احتياطية يومية"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تكرار النسخ</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="hourly">كل ساعة</option>
                    <option value="daily">يومياً</option>
                    <option value="weekly">أسبوعياً</option>
                    <option value="monthly">شهرياً</option>
                  </select>
                </div>

                <Input
                  label="وقت التنفيذ"
                  type="time"
                  value="02:00"
                  helpText="الوقت المفضل لتنفيذ النسخ الاحتياطي"
                />

                <Input
                  label="مدة الاحتفاظ (أيام)"
                  type="number"
                  value={30}
                  min={1}
                  max={365}
                  helpText="عدد الأيام للاحتفاظ بالنسخ الاحتياطية"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">الجداول المراد نسخها</label>
                  <div className="grid md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableTables.map((table) => (
                      <div key={table.name} className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="checkbox"
                          defaultChecked={['beneficiaries', 'packages', 'tasks'].includes(table.name)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-700">{table.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">تفعيل الضغط</label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">تفعيل التشفير</label>
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={() => {
                    setNotification({ message: 'تم إضافة الجدولة بنجاح', type: 'success' });
                    setTimeout(() => setNotification(null), 3000);
                    setShowModal(false);
                  }}>
                    إضافة الجدولة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Database className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات النسخ الاحتياطي</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>قم بإنشاء نسخ احتياطية منتظمة لحماية البيانات</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>استخدم الضغط والتشفير لحماية وتوفير مساحة التخزين</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>اختبر استعادة النسخ الاحتياطية بانتظام للتأكد من سلامتها</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>احتفظ بنسخ احتياطية في مواقع متعددة لضمان الأمان</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}