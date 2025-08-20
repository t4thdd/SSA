import React, { useState, useMemo } from 'react';
import { Activity, Search, Filter, Download, RefreshCw, Calendar, Users, Shield, Eye, AlertTriangle, CheckCircle, Clock, Package, Building2, Heart, UserPlus, Edit, Trash2, FileText, BarChart3, TrendingUp, Star, X, Database, Lock, Unlock } from 'lucide-react';
import { 
  mockActivityLog, 
  mockBeneficiaries, 
  mockSystemUsers, 
  mockOrganizations, 
  mockFamilies,
  type ActivityLog, 
  type Beneficiary, 
  type SystemUser 
} from '../../data/mockData'; // Assuming mockData.ts is correctly imported
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal } from '../ui';
import { ExportModal } from '../ui';

export default function ActivityLogPage() {
  const { logInfo, logError } = useErrorLogger();
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'export' | 'analytics'>('view');
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // استخدام البيانات الوهمية مباشرة
  const activityLog = mockActivityLog;
  const beneficiaries = mockBeneficiaries;
  const systemUsers = mockSystemUsers;
  const organizations = mockOrganizations;
  const families = mockFamilies;

  // فلترة سجل الأنشطة
  const filteredActivities = useMemo(() => {
    return activityLog.filter(activity => {
      // فلترة البحث
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesAction = activity.action.toLowerCase().includes(searchLower);
        const matchesUser = activity.user.toLowerCase().includes(searchLower);
        const matchesDetails = activity.details?.toLowerCase().includes(searchLower);
        
        if (!matchesAction && !matchesUser && !matchesDetails) {
          return false;
        }
      }

      // فلترة المستخدم
      if (userFilter !== 'all' && activity.user !== userFilter) {
        return false;
      }

      // فلترة نوع الإجراء
      if (actionFilter !== 'all' && activity.type !== actionFilter) {
        return false;
      }

      // فلترة التاريخ
      const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
      
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        if (activityDate !== today) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (new Date(activity.timestamp) < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (new Date(activity.timestamp) < monthAgo) return false;
      } else if (dateFilter === 'custom') {
        if (fromDate && activityDate < fromDate) return false;
        if (toDate && activityDate > toDate) return false;
      }

      return true;
    });
  }, [activityLog, searchTerm, userFilter, actionFilter, dateFilter, fromDate, toDate]);

  // إحصائيات
  const statistics = useMemo(() => {
    const total = filteredActivities.length;
    const byType = {
      create: filteredActivities.filter(a => a.type === 'create').length,
      verify: filteredActivities.filter(a => a.type === 'verify').length,
      approve: filteredActivities.filter(a => a.type === 'approve').length,
      update: filteredActivities.filter(a => a.type === 'update').length,
      deliver: filteredActivities.filter(a => a.type === 'deliver').length,
      review: filteredActivities.filter(a => a.type === 'review').length
    };

    const byUser = systemUsers.map(user => ({
      name: user.name,
      count: filteredActivities.filter(a => a.user === user.name).length
    })).sort((a, b) => b.count - a.count);

    const byDate = {};
    filteredActivities.forEach(activity => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    });

    return {
      total,
      byType,
      byUser: byUser.slice(0, 5),
      byDate,
      todayCount: filteredActivities.filter(a => 
        new Date(a.timestamp).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
      ).length
    };
  }, [filteredActivities, systemUsers]);

  // الحصول على معلومات المستفيد
  const getBeneficiaryInfo = (beneficiaryId?: string) => {
    if (!beneficiaryId) return null;
    return beneficiaries.find(b => b.id === beneficiaryId);
  };

  // الحصول على معلومات المستخدم
  const getUserInfo = (userName: string) => {
    return systemUsers.find(u => u.name === userName);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create': return <UserPlus className="w-4 h-4" />;
      case 'verify': return <Shield className="w-4 h-4" />;
      case 'approve': return <CheckCircle className="w-4 h-4" />;
      case 'update': return <Edit className="w-4 h-4" />;
      case 'deliver': return <Package className="w-4 h-4" />;
      case 'review': return <Eye className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'create': return 'bg-blue-100 text-blue-800';
      case 'verify': return 'bg-purple-100 text-purple-800';
      case 'approve': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-orange-100 text-orange-800';
      case 'deliver': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'create': return 'إنشاء';
      case 'verify': return 'توثيق';
      case 'approve': return 'موافقة';
      case 'update': return 'تحديث';
      case 'deliver': return 'تسليم';
      case 'review': return 'مراجعة';
      default: return 'نشاط';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'مدير': return 'bg-red-100 text-red-800';
      case 'مشرف': return 'bg-blue-100 text-blue-800';
      case 'مندوب': return 'bg-green-100 text-green-800';
      case 'منسق': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewActivity = (activity: ActivityLog) => {
    setSelectedActivity(activity);
    setModalType('view');
    setShowModal(true);
  };

  const handleExportLog = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalActivities: filteredActivities.length,
      dateRange: {
        from: fromDate || 'البداية',
        to: toDate || 'النهاية'
      },
      filters: {
        search: searchTerm || 'بدون',
        user: userFilter === 'all' ? 'جميع المستخدمين' : userFilter,
        action: actionFilter === 'all' ? 'جميع الإجراءات' : getActionText(actionFilter),
        date: dateFilter === 'all' ? 'جميع التواريخ' : dateFilter
      },
      statistics,
      activities: filteredActivities.map(activity => {
        const beneficiary = getBeneficiaryInfo(activity.beneficiaryId);
        return {
          timestamp: activity.timestamp,
          action: activity.action,
          user: activity.user,
          role: activity.role,
          type: getActionText(activity.type),
          beneficiary: beneficiary ? `${beneficiary.name} (${beneficiary.nationalId})` : 'غير محدد',
          details: activity.details || 'لا توجد تفاصيل'
        };
      })
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `سجل_المراجعة_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير سجل المراجعة بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    logInfo('تم تصدير سجل المراجعة', 'ActivityLogPage');
  };

  const handleShowAnalytics = () => {
    setModalType('analytics');
    setShowModal(true);
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
            البيانات الوهمية محملة - {activityLog.length} نشاط، {systemUsers.length} مستخدم
          </span>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3 space-x-reverse">
          <Button variant="success" icon={Download} iconPosition="right" onClick={handleExportLog}>
            تصدير سريع
          </Button>
          <Button 
            variant="success" 
            icon={Download} 
            iconPosition="right" 
            onClick={() => setShowExportModal(true)}
          >
            تصدير متقدم
          </Button>
          <Button variant="secondary" icon={BarChart3} iconPosition="right" onClick={handleShowAnalytics}>
            عرض التحليلات
          </Button>
          <Button variant="primary" icon={RefreshCw} iconPosition="right">
            تحديث السجل
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="grid md:grid-cols-5 gap-4">
          <Input
            type="text"
            icon={Search}
            iconPosition="right"
            placeholder="البحث في الأنشطة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المستخدم</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المستخدمين</option>
              {systemUsers.map(user => (
                <option key={user.id} value={user.name}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الإجراء</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الإجراءات</option>
              <option value="create">إنشاء</option>
              <option value="verify">توثيق</option>
              <option value="approve">موافقة</option>
              <option value="update">تحديث</option>
              <option value="deliver">تسليم</option>
              <option value="review">مراجعة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== 'custom') {
                  setFromDate('');
                  setToDate('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع التواريخ</option>
              <option value="today">اليوم</option>
              <option value="week">آخر أسبوع</option>
              <option value="month">آخر شهر</option>
              <option value="custom">فترة مخصصة</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setUserFilter('all');
                setActionFilter('all');
                setDateFilter('all');
                setFromDate('');
                setToDate('');
              }}
              className="w-full"
            >
              إعادة تعيين
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <Activity className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">إجمالي الأنشطة</p>
            <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
          </div>
        </Card>

        <Card className="bg-green-50">
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-xl mb-2">
              <UserPlus className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm text-green-600">إنشاء</p>
            <p className="text-2xl font-bold text-green-900">{statistics.byType.create}</p>
          </div>
        </Card>

        <Card className="bg-purple-50">
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-xl mb-2">
              <Shield className="w-6 h-6 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm text-purple-600">توثيق</p>
            <p className="text-2xl font-bold text-purple-900">{statistics.byType.verify}</p>
          </div>
        </Card>

        <Card className="bg-orange-50">
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-xl mb-2">
              <Edit className="w-6 h-6 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm text-orange-600">تحديث</p>
            <p className="text-2xl font-bold text-orange-900">{statistics.byType.update}</p>
          </div>
        </Card>

        <Card className="bg-indigo-50">
          <div className="text-center">
            <div className="bg-indigo-100 p-3 rounded-xl mb-2">
              <Package className="w-6 h-6 text-indigo-600 mx-auto" />
            </div>
            <p className="text-sm text-indigo-600">تسليم</p>
            <p className="text-2xl font-bold text-indigo-900">{statistics.byType.deliver}</p>
          </div>
        </Card>

        <Card className="bg-yellow-50">
          <div className="text-center">
            <div className="bg-yellow-100 p-3 rounded-xl mb-2">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto" />
            </div>
            <p className="text-sm text-yellow-600">اليوم</p>
            <p className="text-2xl font-bold text-yellow-900">{statistics.todayCount}</p>
          </div>
        </Card>
      </div>

      {/* Activity Log Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">سجل الأنشطة ({filteredActivities.length})</h3>
            <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">البيانات الوهمية</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوقت
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراء
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستفيد
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التفاصيل
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => {
                  const beneficiary = getBeneficiaryInfo(activity.beneficiaryId);
                  const userInfo = getUserInfo(activity.user);
                  
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {new Date(activity.timestamp).toLocaleDateString('ar-SA')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString('ar-SA', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div className={`p-2 rounded-lg ${getActionColor(activity.type)}`}>
                            {getActionIcon(activity.type)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{activity.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{activity.user}</div>
                          <Badge variant={
                            activity.role === 'مدير' ? 'error' :
                            activity.role === 'مشرف' ? 'info' :
                            activity.role === 'مندوب' ? 'success' : 'neutral'
                          } size="sm">
                            {activity.role}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          activity.type === 'create' ? 'info' :
                          activity.type === 'verify' ? 'warning' :
                          activity.type === 'approve' ? 'success' :
                          activity.type === 'deliver' ? 'success' : 'neutral'
                        } size="sm">
                          {getActionText(activity.type)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary ? (
                          <div>
                            <div className="font-medium">{beneficiary.name}</div>
                            <div className="text-xs text-gray-500">{beneficiary.nationalId}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">غير محدد</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={activity.details}>
                          {activity.details || 'لا توجد تفاصيل'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleViewActivity(activity)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {searchTerm || userFilter !== 'all' || actionFilter !== 'all' || dateFilter !== 'all' 
                          ? 'لا توجد أنشطة مطابقة للفلاتر' 
                          : 'لا توجد أنشطة'}
                      </p>
                      <p className="text-sm mt-2">
                        {searchTerm || userFilter !== 'all' || actionFilter !== 'all' || dateFilter !== 'all'
                          ? 'جرب تعديل الفلاتر أو مصطلح البحث'
                          : 'لم يتم تسجيل أي أنشطة بعد'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Users Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">أكثر المستخدمين نشاطاً</h3>
          <div className="space-y-4">
            {statistics.byUser.map((user, index) => {
              const userInfo = getUserInfo(user.name);
              return (
                <div key={user.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      {userInfo && (
                        <Badge variant={
                          userInfo.roleId === '1' ? 'error' : 'info'
                        } size="sm">
                          {userInfo.roleId === '1' ? 'مدير' : 'مستخدم'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{user.count}</p>
                    <p className="text-xs text-gray-500">نشاط</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات الأمان</h3>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">عمليات التوثيق</span>
                </div>
                <span className="text-2xl font-bold text-green-900">{statistics.byType.verify}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700">عمليات الموافقة</span>
                </div>
                <span className="text-2xl font-bold text-blue-900">{statistics.byType.approve}</span>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Edit className="w-5 h-5 text-orange-600" />
                  <span className="text-orange-700">تحديثات البيانات</span>
                </div>
                <span className="text-2xl font-bold text-orange-900">{statistics.byType.update}</span>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Package className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-700">عمليات التسليم</span>
                </div>
                <span className="text-2xl font-bold text-purple-900">{statistics.byType.deliver}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal for Activity Details/Analytics */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'view' ? 'تفاصيل النشاط' :
            modalType === 'analytics' ? 'تحليلات سجل المراجعة' :
            'تصدير السجل'
          }
          size={modalType === 'analytics' ? 'xl' : 'md'}
        >
          <div className="p-6">
            {/* View Activity Details */}
            {modalType === 'view' && selectedActivity && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">تفاصيل النشاط</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">الإجراء:</span>
                      <span className="font-medium text-blue-900 mr-2">{selectedActivity.action}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">المستخدم:</span>
                      <span className="font-medium text-blue-900 mr-2">{selectedActivity.user}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">الدور:</span>
                      <Badge variant={
                        selectedActivity.role === 'مدير' ? 'error' :
                        selectedActivity.role === 'مشرف' ? 'info' : 'success'
                      } size="sm" className="mr-2">
                        {selectedActivity.role}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-blue-700">النوع:</span>
                      <Badge variant="info" size="sm" className="mr-2">
                        {getActionText(selectedActivity.type)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-blue-700">التاريخ والوقت:</span>
                      <span className="font-medium text-blue-900 mr-2">
                        {new Date(selectedActivity.timestamp).toLocaleString('ar-SA')}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">معرف النشاط:</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mr-2">{selectedActivity.id}</span>
                    </div>
                  </div>
                </div>

                {selectedActivity.beneficiaryId && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">معلومات المستفيد</h4>
                    {(() => {
                      const beneficiary = getBeneficiaryInfo(selectedActivity.beneficiaryId);
                      return beneficiary ? (
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-green-700">الاسم:</span>
                            <span className="font-medium text-green-900 mr-2">{beneficiary.name}</span>
                          </div>
                          <div>
                            <span className="text-green-700">رقم الهوية:</span>
                            <span className="font-medium text-green-900 mr-2">{beneficiary.nationalId}</span>
                          </div>
                          <div>
                            <span className="text-green-700">الهاتف:</span>
                            <span className="font-medium text-green-900 mr-2">{beneficiary.phone}</span>
                          </div>
                          <div>
                            <span className="text-green-700">المنطقة:</span>
                            <span className="font-medium text-green-900 mr-2">{beneficiary.detailedAddress.district}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-green-700">معلومات المستفيد غير متاحة</p>
                      );
                    })()}
                  </div>
                )}

                {selectedActivity.details && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-800 mb-2">التفاصيل الإضافية</h4>
                    <p className="text-gray-700 text-sm">{selectedActivity.details}</p>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button variant="primary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}

            {/* Analytics View */}
            {modalType === 'analytics' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Activity Types Chart */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4">توزيع أنواع الأنشطة</h4>
                    <div className="space-y-3">
                      {Object.entries(statistics.byType).map(([type, count]) => {
                        const percentage = statistics.total > 0 ? (count / statistics.total * 100) : 0;
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <div className={`p-1 rounded ${getActionColor(type)}`}>
                                  {getActionIcon(type)}
                                </div>
                                <span className="text-sm font-medium">{getActionText(type)}</span>
                              </div>
                              <span className="text-sm font-bold">{count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 text-right">{percentage.toFixed(1)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Activity Trend */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4">النشاط اليومي</h4>
                    <div className="space-y-3">
                      {Object.entries(statistics.byDate).slice(-7).map(([date, count]) => (
                        <div key={date} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            {new Date(date).toLocaleDateString('ar-SA')}
                          </span>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${Math.min((count / Math.max(...Object.values(statistics.byDate))) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Security Insights */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-4">رؤى الأمان</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="bg-red-100 p-3 rounded-lg mb-2">
                        <Shield className="w-6 h-6 text-red-600 mx-auto" />
                      </div>
                      <p className="text-sm text-red-700">عمليات حساسة</p>
                      <p className="text-xl font-bold text-red-900">
                        {statistics.byType.verify + statistics.byType.approve}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-red-100 p-3 rounded-lg mb-2">
                        <Users className="w-6 h-6 text-red-600 mx-auto" />
                      </div>
                      <p className="text-sm text-red-700">مستخدمين نشطين</p>
                      <p className="text-xl font-bold text-red-900">{statistics.byUser.length}</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-red-100 p-3 rounded-lg mb-2">
                        <Clock className="w-6 h-6 text-red-600 mx-auto" />
                      </div>
                      <p className="text-sm text-red-700">أنشطة اليوم</p>
                      <p className="text-xl font-bold text-red-900">{statistics.todayCount}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="primary" onClick={() => setShowModal(false)}>
                    إغلاق
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
          data={filteredActivities.map(activity => {
            const beneficiary = getBeneficiaryInfo(activity.beneficiaryId);
            return {
              id: activity.id,
              timestamp: activity.timestamp,
              action: activity.action,
              user: activity.user,
              role: activity.role,
              type: getActionText(activity.type),
              beneficiaryName: beneficiary?.name || 'غير محدد',
              beneficiaryId: beneficiary?.nationalId || 'غير محدد',
              details: activity.details || 'لا توجد تفاصيل'
            };
          })}
          title="سجل المراجعة"
          defaultFilename={`سجل_المراجعة_${new Date().toISOString().split('T')[0]}`}
          availableFields={[
            { key: 'timestamp', label: 'الوقت' },
            { key: 'action', label: 'الإجراء' },
            { key: 'user', label: 'المستخدم' },
            { key: 'role', label: 'الدور' },
            { key: 'type', label: 'النوع' },
            { key: 'beneficiaryName', label: 'اسم المستفيد' },
            { key: 'beneficiaryId', label: 'رقم هوية المستفيد' },
            { key: 'details', label: 'التفاصيل' }
          ]}
          filters={{ userFilter, actionFilter, dateFilter, searchTerm }}
        />
      )}

      {/* Security and Compliance Information */}
      <Card className="bg-red-50 border-red-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Shield className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800 mb-3">معلومات الأمان والامتثال</h4>
            <ul className="text-sm text-red-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يتم تسجيل جميع العمليات الحساسة تلقائياً في سجل المراجعة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>السجل محمي من التعديل ويحتفظ بالبيانات لمدة سنة كاملة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن تصدير السجل للمراجعة الخارجية والامتثال القانوني</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>التحليلات تساعد في اكتشاف الأنماط غير العادية والمشبوهة</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}