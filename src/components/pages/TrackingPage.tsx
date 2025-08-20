import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Eye, Truck, Clock, CheckCircle, AlertTriangle, Package, User, Phone, Calendar, RefreshCw, Download, Star, TrendingUp, Activity, Navigation, BarChart3 } from 'lucide-react';
import { 
  mockTasks, 
  mockBeneficiaries, 
  mockPackages, 
  mockCouriers,
  type Task, 
  type Beneficiary, 
  type Package as PackageType, 
  type Courier
} from '../../data/mockData';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal, ExportModal } from '../ui';
import GazaMap, { type MapPoint } from '../GazaMap';

export default function TrackingPage() {
  const { logInfo, logError } = useErrorLogger();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [courierFilter, setCourierFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'update' | 'track'>('view');
  const [showExportModal, setShowExportModal] = useState(false);
  const [mapFilter, setMapFilter] = useState('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // استخدام البيانات الوهمية مباشرة
  const tasks = mockTasks;
  const beneficiaries = mockBeneficiaries;
  const packages = mockPackages;
  const couriers = mockCouriers;

  const regions = ['شمال غزة', 'مدينة غزة', 'الوسط', 'خان يونس', 'رفح'];

  // فلترة المهام
  const filteredTasks = tasks.filter(task => {
    const beneficiary = beneficiaries.find(b => b.id === task.beneficiaryId);
    const packageInfo = packages.find(p => p.id === task.packageId);
    const courier = task.courierId ? couriers.find(c => c.id === task.courierId) : null;

    // فلترة البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesBeneficiary = beneficiary?.name.toLowerCase().includes(searchLower) || 
                                beneficiary?.nationalId.includes(searchTerm) ||
                                beneficiary?.phone.includes(searchTerm);
      const matchesPackage = packageInfo?.name.toLowerCase().includes(searchLower);
      const matchesCourier = courier?.name.toLowerCase().includes(searchLower);
      const matchesTaskId = task.id.toLowerCase().includes(searchLower);
      
      if (!matchesBeneficiary && !matchesPackage && !matchesCourier && !matchesTaskId) {
        return false;
      }
    }

    // فلترة الحالة
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }

    // فلترة المندوب
    if (courierFilter !== 'all') {
      if (courierFilter === 'unassigned' && task.courierId) {
        return false;
      }
      if (courierFilter !== 'unassigned' && task.courierId !== courierFilter) {
        return false;
      }
    }

    // فلترة المنطقة
    if (regionFilter !== 'all' && beneficiary) {
      if (!beneficiary.detailedAddress.governorate.includes(regionFilter)) {
        return false;
      }
    }

    return true;
  });

  // إحصائيات
  const statistics = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    delivered: tasks.filter(t => t.status === 'delivered').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    rescheduled: tasks.filter(t => t.status === 'rescheduled').length
  };

  // تحويل المهام إلى نقاط خريطة
  const mapPoints: MapPoint[] = filteredTasks.map(task => {
    const beneficiary = beneficiaries.find(b => b.id === task.beneficiaryId);
    if (!beneficiary || !beneficiary.location) return null;

    const status = task.status === 'delivered' ? 'delivered' :
                  task.status === 'failed' ? 'problem' :
                  task.status === 'rescheduled' ? 'rescheduled' : 'pending';

    return {
      id: task.id,
      lat: beneficiary.location.lat,
      lng: beneficiary.location.lng,
      status,
      title: beneficiary.name,
      description: `${packages.find(p => p.id === task.packageId)?.name || 'طرد غير محدد'}`,
      data: beneficiary
    };
  }).filter(Boolean) as MapPoint[];

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setModalType('view');
    setShowModal(true);
  };

  const handleUpdateTask = (task: Task) => {
    setSelectedTask(task);
    setModalType('update');
    setShowModal(true);
  };

  const handleTrackCourier = (task: Task) => {
    setSelectedTask(task);
    setModalType('track');
    setShowModal(true);
  };

  const handleMapPointClick = (beneficiary: Beneficiary) => {
    const task = tasks.find(t => t.beneficiaryId === beneficiary.id);
    if (task) {
      handleViewTask(task);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'assigned': return 'معين';
      case 'in_progress': return 'قيد التنفيذ';
      case 'delivered': return 'تم التسليم';
      case 'failed': return 'فشل';
      case 'rescheduled': return 'معاد جدولته';
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

  const handleExportTasks = () => {
    const exportData = {
      date: new Date().toISOString(),
      totalTasks: tasks.length,
      filteredTasks: filteredTasks.length,
      statistics,
      tasks: filteredTasks.map(task => {
        const beneficiary = beneficiaries.find(b => b.id === task.beneficiaryId);
        const packageInfo = packages.find(p => p.id === task.packageId);
        const courier = task.courierId ? couriers.find(c => c.id === task.courierId) : null;
        
        return {
          id: task.id,
          beneficiary: beneficiary?.name,
          package: packageInfo?.name,
          courier: courier?.name || 'غير معين',
          status: getStatusText(task.status),
          createdAt: task.createdAt,
          scheduledAt: task.scheduledAt,
          deliveredAt: task.deliveredAt
        };
      })
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_التتبع_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير تقرير التتبع بنجاح', type: 'success' });
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
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            البيانات الوهمية محملة - {tasks.length} مهمة، {couriers.length} مندوب
          </span>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3 space-x-reverse">
          <Button variant="success" icon={Download} iconPosition="right" onClick={handleExportTasks}>
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
          <Button variant="primary" icon={RefreshCw} iconPosition="right">
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="grid md:grid-cols-4 gap-4">
          <Input
            type="text"
            icon={Search}
            iconPosition="right"
            placeholder="البحث في المهام..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة المهمة</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">في الانتظار</option>
              <option value="assigned">معين</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="delivered">تم التسليم</option>
              <option value="failed">فشل</option>
              <option value="rescheduled">معاد جدولته</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المندوب</label>
            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المندوبين</option>
              <option value="unassigned">غير معين</option>
              {couriers.map(courier => (
                <option key={courier.id} value={courier.id}>{courier.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المناطق</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gray-50">
          <div className="text-center">
            <div className="bg-gray-100 p-3 rounded-xl mb-2">
              <Activity className="w-6 h-6 text-gray-600 mx-auto" />
            </div>
            <p className="text-sm text-gray-600">إجمالي المهام</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
          </div>
        </Card>

        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <Clock className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">في الانتظار</p>
            <p className="text-2xl font-bold text-blue-900">{statistics.pending}</p>
          </div>
        </Card>

        <Card className="bg-orange-50">
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-xl mb-2">
              <Truck className="w-6 h-6 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm text-orange-600">قيد التنفيذ</p>
            <p className="text-2xl font-bold text-orange-900">{statistics.inProgress}</p>
          </div>
        </Card>

        <Card className="bg-green-50">
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-xl mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm text-green-600">تم التسليم</p>
            <p className="text-2xl font-bold text-green-900">{statistics.delivered}</p>
          </div>
        </Card>

        <Card className="bg-red-50">
          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-xl mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
            </div>
            <p className="text-sm text-red-600">فشل</p>
            <p className="text-2xl font-bold text-red-900">{statistics.failed}</p>
          </div>
        </Card>

        <Card className="bg-yellow-50">
          <div className="text-center">
            <div className="bg-yellow-100 p-3 rounded-xl mb-2">
              <Calendar className="w-6 h-6 text-yellow-600 mx-auto" />
            </div>
            <p className="text-sm text-yellow-600">معاد جدولته</p>
            <p className="text-2xl font-bold text-yellow-900">{statistics.rescheduled}</p>
          </div>
        </Card>
      </div>

      {/* Map and Tasks Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Interactive Map */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">خريطة التتبع التفاعلية</h3>
            <div className="flex space-x-2 space-x-reverse">
              <select
                value={mapFilter}
                onChange={(e) => setMapFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="delivered">تم التسليم</option>
                <option value="problem">مشاكل</option>
                <option value="rescheduled">معاد جدولته</option>
                <option value="pending">في الانتظار</option>
              </select>
            </div>
          </div>
          
          <GazaMap 
            points={mapPoints}
            onPointClick={handleMapPointClick}
            activeFilter={mapFilter}
            className="h-96"
          />
        </Card>

        {/* Tasks Summary */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص المهام</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredTasks.slice(0, 10).map((task) => {
              const beneficiary = beneficiaries.find(b => b.id === task.beneficiaryId);
              const packageInfo = packages.find(p => p.id === task.packageId);
              const courier = task.courierId ? couriers.find(c => c.id === task.courierId) : null;

              return (
                <div key={task.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {packageInfo?.name || 'طرد غير محدد'}
                      </span>
                    </div>
                    <Badge variant={
                      task.status === 'delivered' ? 'success' :
                      task.status === 'failed' ? 'error' :
                      task.status === 'in_progress' ? 'warning' : 'info'
                    } size="sm">
                      {getStatusText(task.status)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <User className="w-3 h-3" />
                      <span>{beneficiary?.name || 'غير محدد'}</span>
                    </div>
                    {courier && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Truck className="w-3 h-3" />
                        <span>{courier.name}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <MapPin className="w-3 h-3" />
                      <span>{beneficiary?.detailedAddress?.district || 'غير محدد'}</span>
                    </div>
                    {task.scheduledAt && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(task.scheduledAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 space-x-reverse mt-3">
                    <button 
                      onClick={() => handleViewTask(task)}
                      className="flex-1 bg-blue-600 text-white py-1 px-3 rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      عرض
                    </button>
                    <button 
                      onClick={() => handleUpdateTask(task)}
                      className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-xs hover:bg-green-700 transition-colors"
                    >
                      تحديث
                    </button>
                    {courier && (
                      <button 
                        onClick={() => handleTrackCourier(task)}
                        className="flex-1 bg-purple-600 text-white py-1 px-3 rounded text-xs hover:bg-purple-700 transition-colors"
                      >
                        تتبع
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Detailed Tasks Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">تفاصيل المهام ({filteredTasks.length})</h3>
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
                  المهمة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستفيد
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المندوب
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الموعد المحدد
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const beneficiary = beneficiaries.find(b => b.id === task.beneficiaryId);
                  const packageInfo = packages.find(p => p.id === task.packageId);
                  const courier = task.courierId ? couriers.find(c => c.id === task.courierId) : null;

                  return (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg ml-4">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {packageInfo?.name || 'طرد غير محدد'}
                            </div>
                            <div className="text-sm text-gray-500">#{task.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {beneficiary?.name || 'غير محدد'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {beneficiary?.detailedAddress?.district || 'غير محدد'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {courier ? (
                          <div className="flex items-center">
                            <div className="bg-green-100 p-1 rounded-lg ml-2">
                              <Truck className="w-3 h-3 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{courier.name}</div>
                              <div className="text-sm text-gray-500">{courier.phone}</div>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="warning" size="sm">
                            غير معين
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          task.status === 'delivered' ? 'success' :
                          task.status === 'failed' ? 'error' :
                          task.status === 'in_progress' ? 'warning' : 'info'
                        } size="sm">
                          {getStatusText(task.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.scheduledAt ? new Date(task.scheduledAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button 
                            onClick={() => handleViewTask(task)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateTask(task)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors" 
                            title="تحديث الحالة"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          {courier && (
                            <button 
                              onClick={() => handleTrackCourier(task)}
                              className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors" 
                              title="تتبع المندوب"
                            >
                              <Navigation className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {searchTerm || statusFilter !== 'all' || courierFilter !== 'all' || regionFilter !== 'all' 
                          ? 'لا توجد مهام مطابقة للفلاتر' 
                          : 'لا توجد مهام'}
                      </p>
                      <p className="text-sm mt-2">
                        {searchTerm || statusFilter !== 'all' || courierFilter !== 'all' || regionFilter !== 'all'
                          ? 'جرب تعديل الفلاتر أو مصطلح البحث'
                          : 'لم يتم إنشاء أي مهام بعد'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal for Task Operations */}
      {showModal && selectedTask && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'view' ? 'تفاصيل المهمة' :
            modalType === 'update' ? 'تحديث حالة المهمة' :
            'تتبع المندوب'
          }
          size="md"
        >
          <div className="p-6">
            {/* Task Info */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">معلومات المهمة</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">المستفيد:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {beneficiaries.find(b => b.id === selectedTask.beneficiaryId)?.name || 'غير محدد'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الطرد:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {packages.find(p => p.id === selectedTask.packageId)?.name || 'غير محدد'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الحالة:</span>
                  <Badge variant={
                    selectedTask.status === 'delivered' ? 'success' :
                    selectedTask.status === 'failed' ? 'error' :
                    selectedTask.status === 'in_progress' ? 'warning' : 'info'
                  } size="sm" className="mr-2">
                    {getStatusText(selectedTask.status)}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">تاريخ الإنشاء:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {new Date(selectedTask.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
            </div>

            {/* View Mode */}
            {modalType === 'view' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h5 className="font-medium text-blue-800 mb-2">تفاصيل إضافية</h5>
                  <div className="space-y-2 text-sm">
                    {selectedTask.notes && (
                      <div>
                        <span className="text-blue-700">ملاحظات:</span>
                        <p className="text-blue-900 mt-1">{selectedTask.notes}</p>
                      </div>
                    )}
                    {selectedTask.courierNotes && (
                      <div>
                        <span className="text-blue-700">ملاحظات المندوب:</span>
                        <p className="text-blue-900 mt-1">{selectedTask.courierNotes}</p>
                      </div>
                    )}
                    {selectedTask.estimatedArrivalTime && (
                      <div>
                        <span className="text-blue-700">وقت الوصول المتوقع:</span>
                        <span className="font-medium text-blue-900 mr-2">
                          {new Date(selectedTask.estimatedArrivalTime).toLocaleString('ar-SA')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="primary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}

            {/* Update Mode */}
            {modalType === 'update' && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">نموذج تحديث حالة المهمة</p>
                  <p className="text-sm text-gray-500">سيتم تطوير واجهة تحديث المهام هنا</p>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary">
                    حفظ التحديث
                  </Button>
                </div>
              </div>
            )}

            {/* Track Mode */}
            {modalType === 'track' && (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h5 className="font-medium text-purple-800 mb-2">تتبع المندوب</h5>
                  <div className="bg-gray-50 rounded-lg h-48 flex items-center justify-center">
                    <div className="text-center">
                      <Navigation className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">خريطة تتبع المندوب</p>
                      <p className="text-xs text-gray-500">سيتم تطوير تتبع المندوب المباشر هنا</p>
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
          data={filteredTasks.map(task => {
            const beneficiary = beneficiaries.find(b => b.id === task.beneficiaryId);
            const packageInfo = packages.find(p => p.id === task.packageId);
            const courier = task.courierId ? couriers.find(c => c.id === task.courierId) : null;
            
            return {
              id: task.id,
              beneficiaryName: beneficiary?.name || 'غير محدد',
              beneficiaryPhone: beneficiary?.phone || 'غير محدد',
              beneficiaryArea: beneficiary?.detailedAddress?.district || 'غير محدد',
              packageName: packageInfo?.name || 'غير محدد',
              packageType: packageInfo?.type || 'غير محدد',
              courierName: courier?.name || 'غير معين',
              courierPhone: courier?.phone || 'غير محدد',
              status: getStatusText(task.status),
              createdAt: task.createdAt,
              scheduledAt: task.scheduledAt || 'غير محدد',
              deliveredAt: task.deliveredAt || 'غير محدد',
              notes: task.notes || 'لا توجد ملاحظات',
              courierNotes: task.courierNotes || 'لا توجد ملاحظات'
            };
          })}
          title="قائمة التتبع"
          defaultFilename={`قائمة_التتبع_${new Date().toISOString().split('T')[0]}`}
          availableFields={[
            { key: 'id', label: 'معرف المهمة' },
            { key: 'beneficiaryName', label: 'اسم المستفيد' },
            { key: 'beneficiaryPhone', label: 'هاتف المستفيد' },
            { key: 'beneficiaryArea', label: 'منطقة المستفيد' },
            { key: 'packageName', label: 'اسم الطرد' },
            { key: 'packageType', label: 'نوع الطرد' },
            { key: 'courierName', label: 'اسم المندوب' },
            { key: 'courierPhone', label: 'هاتف المندوب' },
            { key: 'status', label: 'الحالة' },
            { key: 'createdAt', label: 'تاريخ الإنشاء' },
            { key: 'scheduledAt', label: 'موعد التسليم' },
            { key: 'deliveredAt', label: 'تاريخ التسليم' },
            { key: 'notes', label: 'ملاحظات' },
            { key: 'courierNotes', label: 'ملاحظات المندوب' }
          ]}
          filters={{ statusFilter, courierFilter, regionFilter, searchTerm }}
        />
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <MapPin className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات التتبع</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>استخدم الخريطة التفاعلية لرؤية توزيع المهام جغرافياً</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن فلترة المهام حسب الحالة والمنطقة والمندوب</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>النقاط الملونة على الخريطة تمثل حالات مختلفة للتسليم</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن تصدير تقارير مفصلة للمتابعة والتحليل</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}