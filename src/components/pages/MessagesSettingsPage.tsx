import React, { useState } from 'react';
import { MessageSquare, Mail, Phone, Bell, Settings, Save, RefreshCw, Plus, Edit, Trash2, Eye, Send, CheckCircle, AlertTriangle, Clock, Users, Package, Download, Upload, X, Star, Activity, Shield, Database } from 'lucide-react';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal, ExportModal } from '../ui';

interface MessageTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'push' | 'whatsapp';
  category: 'delivery' | 'reminder' | 'confirmation' | 'alert' | 'welcome';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  createdBy: string;
}

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  type: 'sms' | 'email' | 'push';
  isEnabled: boolean;
  triggers: string[];
  recipients: string[];
  template?: string;
  schedule?: string;
}

export default function MessagesSettingsPage() {
  const { logInfo, logError } = useErrorLogger();
  const [activeTab, setActiveTab] = useState('templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add-template' | 'edit-template' | 'test-send' | 'settings'>('add-template');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Mock message templates
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([
    {
      id: 'template-1',
      name: 'رسالة تأكيد التسليم',
      type: 'sms',
      category: 'delivery',
      content: 'عزيزي {beneficiary_name}، تم تسليم طردك بنجاح. رقم التتبع: {tracking_number}. شكراً لك.',
      variables: ['beneficiary_name', 'tracking_number', 'delivery_date'],
      isActive: true,
      usageCount: 1247,
      lastUsed: '2024-12-21T10:30:00',
      createdAt: '2024-01-15',
      createdBy: 'أحمد الإدمن'
    },
    {
      id: 'template-2',
      name: 'تذكير موعد التسليم',
      type: 'sms',
      category: 'reminder',
      content: 'مرحباً {beneficiary_name}، سيتم تسليم طردك غداً في {delivery_time}. يرجى التواجد في العنوان المحدد.',
      variables: ['beneficiary_name', 'delivery_time', 'address'],
      isActive: true,
      usageCount: 892,
      lastUsed: '2024-12-20T15:45:00',
      createdAt: '2024-01-20',
      createdBy: 'فاطمة المشرفة'
    },
    {
      id: 'template-3',
      name: 'بريد إلكتروني ترحيبي',
      type: 'email',
      category: 'welcome',
      subject: 'مرحباً بك في منصة المساعدات الإنسانية',
      content: 'عزيزي {beneficiary_name}،\n\nمرحباً بك في منصة المساعدات الإنسانية. تم تسجيلك بنجاح في النظام.\n\nرقم المستفيد: {beneficiary_id}\nتاريخ التسجيل: {registration_date}\n\nشكراً لك.',
      variables: ['beneficiary_name', 'beneficiary_id', 'registration_date'],
      isActive: true,
      usageCount: 456,
      lastUsed: '2024-12-19T09:15:00',
      createdAt: '2024-02-01',
      createdBy: 'سارة المنسقة'
    },
    {
      id: 'template-4',
      name: 'تنبيه فشل التسليم',
      type: 'sms',
      category: 'alert',
      content: 'عذراً {beneficiary_name}، لم نتمكن من تسليم طردك. السبب: {failure_reason}. سيتم إعادة المحاولة قريباً.',
      variables: ['beneficiary_name', 'failure_reason', 'retry_date'],
      isActive: true,
      usageCount: 89,
      lastUsed: '2024-12-18T14:20:00',
      createdAt: '2024-01-25',
      createdBy: 'أحمد الإدمن'
    },
    {
      id: 'template-5',
      name: 'رسالة تأكيد الموعد',
      type: 'whatsapp',
      category: 'confirmation',
      content: 'مرحباً {beneficiary_name}! تم تأكيد موعد تسليم طردك يوم {delivery_date} في {delivery_time}. المندوب: {courier_name}',
      variables: ['beneficiary_name', 'delivery_date', 'delivery_time', 'courier_name'],
      isActive: false,
      usageCount: 0,
      createdAt: '2024-12-10',
      createdBy: 'محمد المطور'
    }
  ]);

  // Mock notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'notif-1',
      name: 'إشعار تسليم الطرد',
      description: 'إرسال رسالة نصية عند تسليم الطرد بنجاح',
      type: 'sms',
      isEnabled: true,
      triggers: ['package_delivered'],
      recipients: ['beneficiary'],
      template: 'template-1'
    },
    {
      id: 'notif-2',
      name: 'تذكير موعد التسليم',
      description: 'إرسال تذكير قبل 24 ساعة من موعد التسليم',
      type: 'sms',
      isEnabled: true,
      triggers: ['delivery_scheduled'],
      recipients: ['beneficiary'],
      template: 'template-2',
      schedule: '24_hours_before'
    },
    {
      id: 'notif-3',
      name: 'تنبيه فشل التسليم',
      description: 'إشعار المستفيد والإدارة عند فشل التسليم',
      type: 'sms',
      isEnabled: true,
      triggers: ['delivery_failed'],
      recipients: ['beneficiary', 'admin'],
      template: 'template-4'
    },
    {
      id: 'notif-4',
      name: 'بريد ترحيبي للمستفيدين الجدد',
      description: 'إرسال بريد إلكتروني ترحيبي للمستفيدين الجدد',
      type: 'email',
      isEnabled: false,
      triggers: ['beneficiary_registered'],
      recipients: ['beneficiary'],
      template: 'template-3'
    }
  ]);

  const tabs = [
    { id: 'templates', name: 'قوالب الرسائل', icon: MessageSquare },
    { id: 'notifications', name: 'إعدادات الإشعارات', icon: Bell },
    { id: 'providers', name: 'مزودي الخدمة', icon: Settings },
    { id: 'logs', name: 'سجل الرسائل', icon: Activity }
  ];

  // فلترة القوالب
  const filteredTemplates = messageTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // إحصائيات
  const templateStats = {
    total: messageTemplates.length,
    active: messageTemplates.filter(t => t.isActive).length,
    sms: messageTemplates.filter(t => t.type === 'sms').length,
    email: messageTemplates.filter(t => t.type === 'email').length,
    totalUsage: messageTemplates.reduce((sum, t) => sum + t.usageCount, 0)
  };

  const handleAddTemplate = () => {
    setModalType('add-template');
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setModalType('edit-template');
    setSelectedItem(template);
    setShowModal(true);
  };

  const handleTestSend = (template: MessageTemplate) => {
    setModalType('test-send');
    setSelectedItem(template);
    setShowModal(true);
  };

  const handleDeleteTemplate = (template: MessageTemplate) => {
    if (confirm(`هل أنت متأكد من حذف القالب "${template.name}"؟`)) {
      setMessageTemplates(prev => prev.filter(t => t.id !== template.id));
      setNotification({ message: `تم حذف القالب "${template.name}"`, type: 'warning' });
      setTimeout(() => setNotification(null), 3000);
      logInfo(`تم حذف قالب الرسالة: ${template.name}`, 'MessagesSettingsPage');
    }
  };

  const handleToggleTemplate = (templateId: string) => {
    setMessageTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { ...template, isActive: !template.isActive }
          : template
      )
    );
    
    const template = messageTemplates.find(t => t.id === templateId);
    const action = template?.isActive ? 'إلغاء تفعيل' : 'تفعيل';
    setNotification({ message: `تم ${action} القالب "${template?.name}"`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleNotification = (notificationId: string) => {
    setNotificationSettings(prev => 
      prev.map(setting => 
        setting.id === notificationId 
          ? { ...setting, isEnabled: !setting.isEnabled }
          : setting
      )
    );
    
    const setting = notificationSettings.find(s => s.id === notificationId);
    const action = setting?.isEnabled ? 'إلغاء تفعيل' : 'تفعيل';
    setNotification({ message: `تم ${action} الإشعار "${setting?.name}"`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'push': return <Bell className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sms': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'push': return 'bg-purple-100 text-purple-800';
      case 'whatsapp': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'delivery': return 'bg-green-100 text-green-800';
      case 'reminder': return 'bg-orange-100 text-orange-800';
      case 'confirmation': return 'bg-blue-100 text-blue-800';
      case 'alert': return 'bg-red-100 text-red-800';
      case 'welcome': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const handleExportTemplates = () => {
    const exportData = {
      date: new Date().toISOString(),
      totalTemplates: messageTemplates.length,
      statistics: templateStats,
      templates: messageTemplates.map(template => ({
        name: template.name,
        type: template.type,
        category: template.category,
        isActive: template.isActive ? 'نشط' : 'معطل',
        usageCount: template.usageCount,
        lastUsed: template.lastUsed || 'لم يستخدم',
        createdAt: template.createdAt,
        createdBy: template.createdBy
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قوالب_الرسائل_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير قوالب الرسائل بنجاح', type: 'success' });
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
            البيانات الوهمية محملة - {messageTemplates.length} قالب، {notificationSettings.length} إعداد إشعار
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

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3 space-x-reverse">
              <Button variant="success" icon={Download} iconPosition="right" onClick={handleExportTemplates}>
                تصدير القوالب
              </Button>
              <Button 
                variant="primary" 
                icon={Plus} 
                iconPosition="right" 
                onClick={handleAddTemplate}
              >
                إضافة قالب جديد
              </Button>
            </div>
          </div>

          {/* Search */}
          <Card>
            <Input
              type="text"
              icon={MessageSquare}
              iconPosition="right"
              placeholder="البحث في قوالب الرسائل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <MessageSquare className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-blue-600">إجمالي القوالب</p>
                <p className="text-2xl font-bold text-blue-900">{templateStats.total}</p>
              </div>
            </Card>

            <Card className="bg-green-50">
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-green-600">قوالب نشطة</p>
                <p className="text-2xl font-bold text-green-900">{templateStats.active}</p>
              </div>
            </Card>

            <Card className="bg-purple-50">
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <Phone className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-purple-600">رسائل نصية</p>
                <p className="text-2xl font-bold text-purple-900">{templateStats.sms}</p>
              </div>
            </Card>

            <Card className="bg-orange-50">
              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <Star className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-orange-600">إجمالي الاستخدام</p>
                <p className="text-2xl font-bold text-orange-900">{templateStats.totalUsage}</p>
              </div>
            </Card>
          </div>

          {/* Templates List */}
          <div className="grid gap-4">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 space-x-reverse flex-1">
                      <div className={`p-3 rounded-xl ${getTypeColor(template.type)}`}>
                        {getTypeIcon(template.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <Badge variant={
                            template.type === 'sms' ? 'success' :
                            template.type === 'email' ? 'info' :
                            template.type === 'whatsapp' ? 'success' : 'neutral'
                          } size="sm">
                            {template.type.toUpperCase()}
                          </Badge>
                          <Badge variant={
                            template.category === 'delivery' ? 'success' :
                            template.category === 'alert' ? 'error' :
                            template.category === 'reminder' ? 'warning' : 'info'
                          } size="sm">
                            {template.category === 'delivery' ? 'تسليم' :
                             template.category === 'reminder' ? 'تذكير' :
                             template.category === 'confirmation' ? 'تأكيد' :
                             template.category === 'alert' ? 'تنبيه' : 'ترحيب'}
                          </Badge>
                          <Badge variant={template.isActive ? 'success' : 'neutral'} size="sm">
                            {template.isActive ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.content}</p>
                        
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">عدد الاستخدام:</span>
                            <span className="font-medium text-gray-900 mr-1">{template.usageCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">آخر استخدام:</span>
                            <span className="font-medium text-gray-900 mr-1">
                              {template.lastUsed ? new Date(template.lastUsed).toLocaleDateString('ar-SA') : 'لم يستخدم'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">المتغيرات:</span>
                            <span className="font-medium text-gray-900 mr-1">{template.variables.length}</span>
                          </div>
                        </div>

                        {template.variables.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1">
                              {template.variables.slice(0, 3).map(variable => (
                                <span key={variable} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  {variable}
                                </span>
                              ))}
                              {template.variables.length > 3 && (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  +{template.variables.length - 3} أخرى
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 space-x-reverse">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleTestSend(template)}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={template.isActive ? 'warning' : 'success'} 
                        size="sm" 
                        onClick={() => handleToggleTemplate(template.id)}
                      >
                        {template.isActive ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteTemplate(template)}
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
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">
                    {searchTerm ? 'لا توجد قوالب مطابقة للبحث' : 'لا توجد قوالب رسائل'}
                  </p>
                  <p className="text-sm mt-2">
                    {searchTerm ? 'جرب تعديل مصطلح البحث' : 'ابدأ بإضافة قالب رسالة جديد'}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">إعدادات الإشعارات</h3>
            <Button variant="primary" icon={Plus} iconPosition="right">
              إضافة إشعار جديد
            </Button>
          </div>

          <div className="grid gap-4">
            {notificationSettings.map((setting) => (
              <Card key={setting.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`p-3 rounded-xl ${getTypeColor(setting.type)}`}>
                      {getTypeIcon(setting.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        <h4 className="font-semibold text-gray-900">{setting.name}</h4>
                        <Badge variant={setting.isEnabled ? 'success' : 'neutral'} size="sm">
                          {setting.isEnabled ? 'مفعل' : 'معطل'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{setting.description}</p>
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500">
                        <span>المستقبلين: {setting.recipients.join(', ')}</span>
                        <span>•</span>
                        <span>المحفزات: {setting.triggers.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 space-x-reverse">
                    <Button 
                      variant="secondary" 
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={setting.isEnabled ? 'warning' : 'success'} 
                      size="sm" 
                      onClick={() => handleToggleNotification(setting.id)}
                    >
                      {setting.isEnabled ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">مزودي الخدمة</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h4 className="font-semibold text-gray-900 mb-4">إعدادات الرسائل النصية</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">مزود الخدمة الحالي</p>
                    <p className="text-sm text-gray-600">SMS Gateway Provider</p>
                  </div>
                  <Badge variant="success" size="sm">متصل</Badge>
                </div>

                <Input
                  label="API Key"
                  type="password"
                  placeholder="أدخل مفتاح API..."
                />

                <Input
                  label="رقم المرسل"
                  type="text"
                  placeholder="اسم أو رقم المرسل..."
                />

                <div className="flex space-x-3 space-x-reverse">
                  <Button variant="primary">
                    حفظ الإعدادات
                  </Button>
                  <Button variant="secondary">
                    اختبار الاتصال
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="font-semibold text-gray-900 mb-4">إعدادات البريد الإلكتروني</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">خادم SMTP</p>
                    <p className="text-sm text-gray-600">smtp.gmail.com</p>
                  </div>
                  <Badge variant="success" size="sm">متصل</Badge>
                </div>

                <Input
                  label="عنوان البريد الإلكتروني"
                  type="email"
                  placeholder="noreply@example.com"
                />

                <Input
                  label="كلمة المرور"
                  type="password"
                  placeholder="كلمة مرور التطبيق..."
                />

                <div className="flex space-x-3 space-x-reverse">
                  <Button variant="primary">
                    حفظ الإعدادات
                  </Button>
                  <Button variant="secondary">
                    اختبار الاتصال
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">سجل الرسائل</h3>
            <Button variant="secondary" icon={Download} iconPosition="right">
              تصدير السجل
            </Button>
          </div>

          <Card className="p-12">
            <div className="text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">سجل الرسائل</p>
              <p className="text-sm mt-2">سيتم تطوير سجل الرسائل المرسلة هنا</p>
            </div>
          </Card>
        </div>
      )}

      {/* Modal for Template Operations */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'add-template' ? 'إضافة قالب رسالة جديد' :
            modalType === 'edit-template' ? 'تعديل قالب الرسالة' :
            modalType === 'test-send' ? 'اختبار إرسال الرسالة' :
            'إعدادات'
          }
          size="lg"
        >
          <div className="p-6">
            {modalType === 'add-template' && (
              <div className="space-y-6">
                <Input
                  label="اسم القالب *"
                  type="text"
                  placeholder="أدخل اسم القالب..."
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الرسالة</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="sms">رسالة نصية (SMS)</option>
                    <option value="email">بريد إلكتروني</option>
                    <option value="push">إشعار فوري</option>
                    <option value="whatsapp">واتساب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">فئة الرسالة</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="delivery">تسليم</option>
                    <option value="reminder">تذكير</option>
                    <option value="confirmation">تأكيد</option>
                    <option value="alert">تنبيه</option>
                    <option value="welcome">ترحيب</option>
                  </select>
                </div>

                <Input
                  label="موضوع الرسالة (للبريد الإلكتروني)"
                  type="text"
                  placeholder="أدخل موضوع الرسالة..."
                />

                <Input
                  label="محتوى الرسالة *"
                  type="textarea"
                  placeholder="أدخل محتوى الرسالة... يمكنك استخدام متغيرات مثل {beneficiary_name}"
                  rows={5}
                  required
                />

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">المتغيرات المتاحة:</h5>
                  <div className="flex flex-wrap gap-2">
                    {['{beneficiary_name}', '{tracking_number}', '{delivery_date}', '{courier_name}', '{package_name}'].map(variable => (
                      <span key={variable} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={() => {
                    setNotification({ message: 'تم إضافة القالب بنجاح', type: 'success' });
                    setTimeout(() => setNotification(null), 3000);
                    setShowModal(false);
                  }}>
                    إضافة القالب
                  </Button>
                </div>
              </div>
            )}

            {modalType === 'edit-template' && selectedItem && (
              <div className="space-y-6">
                <Input
                  label="اسم القالب *"
                  type="text"
                  value={selectedItem.name}
                  placeholder="أدخل اسم القالب..."
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الرسالة</label>
                  <select 
                    value={selectedItem.type}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="sms">رسالة نصية (SMS)</option>
                    <option value="email">بريد إلكتروني</option>
                    <option value="push">إشعار فوري</option>
                    <option value="whatsapp">واتساب</option>
                  </select>
                </div>

                <Input
                  label="محتوى الرسالة *"
                  type="textarea"
                  value={selectedItem.content}
                  placeholder="أدخل محتوى الرسالة..."
                  rows={5}
                  required
                />

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-2">إحصائيات الاستخدام:</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-yellow-700">عدد مرات الاستخدام:</span>
                      <span className="font-medium text-yellow-900 mr-2">{selectedItem.usageCount}</span>
                    </div>
                    <div>
                      <span className="text-yellow-700">آخر استخدام:</span>
                      <span className="font-medium text-yellow-900 mr-2">
                        {selectedItem.lastUsed ? new Date(selectedItem.lastUsed).toLocaleDateString('ar-SA') : 'لم يستخدم'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={() => {
                    setNotification({ message: 'تم تحديث القالب بنجاح', type: 'success' });
                    setTimeout(() => setNotification(null), 3000);
                    setShowModal(false);
                  }}>
                    حفظ التغييرات
                  </Button>
                </div>
              </div>
            )}

            {modalType === 'test-send' && selectedItem && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">معاينة القالب</h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>النوع:</strong> {selectedItem.type.toUpperCase()}
                    </div>
                    {selectedItem.subject && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>الموضوع:</strong> {selectedItem.subject}
                      </div>
                    )}
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border">
                      {selectedItem.content}
                    </div>
                  </div>
                </div>

                <Input
                  label="رقم الهاتف للاختبار"
                  type="tel"
                  placeholder="0591234567"
                  helpText="سيتم إرسال رسالة تجريبية لهذا الرقم"
                />

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 space-x-reverse text-yellow-600 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">تحذير</span>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    الإرسال التجريبي سيستخدم رصيد الرسائل الفعلي. تأكد من الرقم قبل الإرسال.
                  </p>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={() => {
                    setNotification({ message: 'تم إرسال الرسالة التجريبية بنجاح', type: 'success' });
                    setTimeout(() => setNotification(null), 3000);
                    setShowModal(false);
                  }}>
                    إرسال تجريبي
                  </Button>
                </div>
              </div>
            )}

            {modalType === 'settings' && (
              <div className="text-center py-12">
                <div className="bg-blue-100 p-6 rounded-xl mb-4">
                  <Settings className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-gray-900 mb-2">إعدادات الرسائل</h4>
                  <p className="text-gray-600">سيتم تطوير النماذج التفاعلية هنا</p>
                </div>
                
                <div className="flex space-x-3 space-x-reverse justify-center">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary">
                    حفظ الإعدادات
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          data={filteredTemplates}
          title="قوالب الرسائل"
          defaultFilename={`قوالب_الرسائل_${new Date().toISOString().split('T')[0]}`}
          availableFields={[
            { key: 'name', label: 'اسم القالب' },
            { key: 'type', label: 'النوع' },
            { key: 'category', label: 'الفئة' },
            { key: 'content', label: 'المحتوى' },
            { key: 'isActive', label: 'الحالة' },
            { key: 'usageCount', label: 'عدد الاستخدام' },
            { key: 'lastUsed', label: 'آخر استخدام' },
            { key: 'createdAt', label: 'تاريخ الإنشاء' },
            { key: 'createdBy', label: 'أنشئ بواسطة' }
          ]}
          filters={{ searchTerm }}
        />
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <MessageSquare className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات إدارة الرسائل</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>استخدم المتغيرات مثل {'{beneficiary_name}'} لتخصيص الرسائل</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>اختبر القوالب قبل تفعيلها لضمان صحة المحتوى</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>راقب إحصائيات الاستخدام لتحسين فعالية الرسائل</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>تأكد من تفعيل الإشعارات المهمة مثل تأكيد التسليم</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}