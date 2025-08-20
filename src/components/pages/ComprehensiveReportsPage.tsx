import React, { useState, useMemo } from 'react';
import { BarChart3, Download, Calendar, Filter, TrendingUp, Users, Package, CheckCircle, Clock, AlertTriangle, Star, Award, MapPin, Activity, PieChart, LineChart, Truck, Building2, Heart, Shield, FileText, Eye, RefreshCw, X } from 'lucide-react';
import { 
  mockTasks, 
  mockBeneficiaries, 
  mockPackages, 
  mockCouriers, 
  mockOrganizations, 
  mockFamilies,
  mockActivityLog,
  calculateStats,
  type Task,
  type Beneficiary,
  type Package as PackageType,
  type Courier,
  type Organization,
  type Family
} from '../../data/mockData';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal, ExportModal } from '../ui';
import * as Sentry from '@sentry/react';

export default function ComprehensiveReportsPage() {
  const { logInfo, logError } = useErrorLogger();
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'chart' | 'details' | 'export'>('chart');
  const [selectedData, setSelectedData] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // استخدام البيانات الوهمية مباشرة
  const tasks = mockTasks;
  const beneficiaries = mockBeneficiaries;
  const packages = mockPackages;
  const couriers = mockCouriers;
  const organizations = mockOrganizations;
  const families = mockFamilies;
  const activityLog = mockActivityLog;

  const stats = calculateStats();

  const reportTypes = [
    { id: 'overview', name: 'نظرة عامة', icon: BarChart3, description: 'إحصائيات شاملة للنظام' },
    { id: 'delivery', name: 'تقرير التسليم', icon: CheckCircle, description: 'تفاصيل عمليات التسليم' },
    { id: 'performance', name: 'تقرير الأداء', icon: TrendingUp, description: 'أداء المندوبين والمؤسسات' },
    { id: 'beneficiaries', name: 'تقرير المستفيدين', icon: Users, description: 'إحصائيات المستفيدين' },
    { id: 'geographical', name: 'التوزيع الجغرافي', icon: MapPin, description: 'التوزيع حسب المناطق' },
    { id: 'financial', name: 'التقرير المالي', icon: Star, description: 'التكاليف والميزانيات' }
  ];

  const regions = [
    { id: 'all', name: 'جميع المناطق', count: beneficiaries.length },
    { id: 'north', name: 'شمال غزة', count: Math.floor(beneficiaries.length * 0.2) },
    { id: 'gaza', name: 'مدينة غزة', count: Math.floor(beneficiaries.length * 0.3) },
    { id: 'middle', name: 'الوسط', count: Math.floor(beneficiaries.length * 0.15) },
    { id: 'khan-younis', name: 'خان يونس', count: Math.floor(beneficiaries.length * 0.25) },
    { id: 'rafah', name: 'رفح', count: Math.floor(beneficiaries.length * 0.1) }
  ];

  // حساب البيانات المفلترة حسب التاريخ والمنطقة
  const filteredData = useMemo(() => {
    let filteredTasks = [...tasks];
    let filteredBeneficiaries = [...beneficiaries];
    let filteredPackages = [...packages];

    // فلترة التاريخ
    if (dateRange === 'custom' && fromDate && toDate) {
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate >= fromDate && taskDate <= toDate;
      });
      
      filteredPackages = filteredPackages.filter(pkg => {
        const pkgDate = new Date(pkg.createdAt).toISOString().split('T')[0];
        return pkgDate >= fromDate && pkgDate <= toDate;
      });
    } else if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredTasks = filteredTasks.filter(task => new Date(task.createdAt) >= startDate);
      filteredPackages = filteredPackages.filter(pkg => new Date(pkg.createdAt) >= startDate);
    }

    // فلترة المنطقة
    if (selectedRegion !== 'all') {
      const regionBeneficiaries = filteredBeneficiaries.filter(b => 
        b.detailedAddress.governorate.includes(selectedRegion) ||
        b.detailedAddress.city.includes(selectedRegion)
      );
      
      const regionBeneficiaryIds = regionBeneficiaries.map(b => b.id);
      filteredTasks = filteredTasks.filter(task => 
        regionBeneficiaryIds.includes(task.beneficiaryId)
      );
      filteredPackages = filteredPackages.filter(pkg => 
        regionBeneficiaryIds.includes(pkg.beneficiaryId || '')
      );
      filteredBeneficiaries = regionBeneficiaries;
    }

    return {
      tasks: filteredTasks,
      beneficiaries: filteredBeneficiaries,
      packages: filteredPackages
    };
  }, [dateRange, selectedRegion, fromDate, toDate, tasks, beneficiaries, packages]);

  // إحصائيات متقدمة
  const advancedStats = useMemo(() => {
    const { tasks: fTasks, beneficiaries: fBeneficiaries, packages: fPackages } = filteredData;
    
    // إحصائيات التسليم
    const deliveryStats = {
      total: fTasks.length,
      delivered: fTasks.filter(t => t.status === 'delivered').length,
      pending: fTasks.filter(t => t.status === 'pending').length,
      failed: fTasks.filter(t => t.status === 'failed').length,
      inProgress: fTasks.filter(t => t.status === 'in_progress').length,
      successRate: fTasks.length > 0 ? (fTasks.filter(t => t.status === 'delivered').length / fTasks.length * 100) : 0
    };

    // إحصائيات المندوبين
    const courierStats = couriers.map(courier => {
      const courierTasks = fTasks.filter(t => t.courierId === courier.id);
      const completedTasks = courierTasks.filter(t => t.status === 'delivered').length;
      const successRate = courierTasks.length > 0 ? (completedTasks / courierTasks.length * 100) : 0;
      
      return {
        ...courier,
        tasksCount: courierTasks.length,
        completedCount: completedTasks,
        successRate
      };
    }).sort((a, b) => b.successRate - a.successRate);

    // إحصائيات المؤسسات
    const organizationStats = organizations.map(org => {
      const orgBeneficiaries = fBeneficiaries.filter(b => b.organizationId === org.id);
      const orgTasks = fTasks.filter(t => 
        orgBeneficiaries.some(b => b.id === t.beneficiaryId)
      );
      const completedTasks = orgTasks.filter(t => t.status === 'delivered').length;
      
      return {
        ...org,
        activeBeneficiaries: orgBeneficiaries.length,
        totalTasks: orgTasks.length,
        completedTasks,
        successRate: orgTasks.length > 0 ? (completedTasks / orgTasks.length * 100) : 0
      };
    }).sort((a, b) => b.successRate - a.successRate);

    // توزيع أنواع الطرود
    const packageTypeDistribution = [
      { type: 'مواد غذائية', count: fPackages.filter(p => p.type === 'مواد غذائية').length, color: 'bg-orange-500' },
      { type: 'أدوية', count: fPackages.filter(p => p.type === 'أدوية').length, color: 'bg-red-500' },
      { type: 'ملابس', count: fPackages.filter(p => p.type === 'ملابس').length, color: 'bg-purple-500' },
      { type: 'أخرى', count: fPackages.filter(p => !['مواد غذائية', 'أدوية', 'ملابس'].includes(p.type)).length, color: 'bg-blue-500' }
    ].map(item => ({
      ...item,
      percentage: fPackages.length > 0 ? (item.count / fPackages.length * 100) : 0
    }));

    // الاتجاهات الشهرية
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('ar-SA', { month: 'long' });
      
      const monthTasks = fTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.getMonth() === date.getMonth() && taskDate.getFullYear() === date.getFullYear();
      });
      
      monthlyTrends.push({
        month: monthName,
        delivered: monthTasks.filter(t => t.status === 'delivered').length,
        failed: monthTasks.filter(t => t.status === 'failed').length,
        pending: monthTasks.filter(t => ['pending', 'assigned', 'in_progress'].includes(t.status)).length,
        total: monthTasks.length
      });
    }

    // إحصائيات المناطق
    const regionalStats = regions.filter(r => r.id !== 'all').map(region => {
      const regionBeneficiaries = fBeneficiaries.filter(b => 
        b.detailedAddress.governorate.includes(region.name) ||
        b.detailedAddress.city.includes(region.name)
      );
      
      const regionTasks = fTasks.filter(task => 
        regionBeneficiaries.some(b => b.id === task.beneficiaryId)
      );
      
      const completedTasks = regionTasks.filter(t => t.status === 'delivered').length;
      const successRate = regionTasks.length > 0 ? (completedTasks / regionTasks.length * 100) : 0;
      
      return {
        ...region,
        beneficiariesCount: regionBeneficiaries.length,
        tasksCount: regionTasks.length,
        completedTasks,
        successRate,
        avgDeliveryTime: 2 + Math.random() * 2 // محاكاة متوسط وقت التسليم
      };
    });

    return {
      delivery: deliveryStats,
      couriers: courierStats,
      organizations: organizationStats,
      packageTypes: packageTypeDistribution,
      monthly: monthlyTrends,
      regional: regionalStats
    };
  }, [filteredData, couriers, organizations, regions]);

  const handleExportReport = () => {
    const reportData = {
      type: reportType,
      dateRange,
      region: selectedRegion,
      generatedAt: new Date().toISOString(),
      period: {
        from: fromDate || 'البداية',
        to: toDate || 'النهاية'
      },
      summary: {
        totalBeneficiaries: filteredData.beneficiaries.length,
        totalTasks: filteredData.tasks.length,
        totalPackages: filteredData.packages.length,
        deliveryRate: advancedStats.delivery.successRate,
        averageDeliveryTime: '2.3 ساعة'
      },
      details: advancedStats
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_شامل_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير التقرير الشامل بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    logInfo(`تم تصدير التقرير الشامل: ${reportType}`, 'ComprehensiveReportsPage');
  };

  const handleViewChart = (chartType: string, data: any) => {
    setModalType('chart');
    setSelectedData({ type: chartType, data });
    setShowModal(true);
  };

  const handleViewDetails = (detailType: string, data: any) => {
    setModalType('details');
    setSelectedData({ type: detailType, data });
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
            البيانات الوهمية محملة - {tasks.length} مهمة، {beneficiaries.length} مستفيد، {organizations.length} مؤسسة
          </span>
        </div>
      </Card>

      {/* Report Controls */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">إعدادات التقرير الشامل</h3>
          <div className="flex space-x-3 space-x-reverse">
            <Button variant="success" icon={Download} iconPosition="right" onClick={handleExportReport}>
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
        
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع التقرير</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                if (e.target.value !== 'custom') {
                  setFromDate('');
                  setToDate('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الفترات</option>
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="quarter">هذا الربع</option>
              <option value="year">هذا العام</option>
              <option value="custom">فترة مخصصة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {regions.map(region => (
                <option key={region.id} value={region.name === 'جميع المناطق' ? 'all' : region.name}>
                  {region.name} ({region.count})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تصفية إضافية</label>
            <Button variant="secondary" icon={Filter} iconPosition="right" fullWidth>
              فلاتر متقدمة
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
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

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-blue-50 hover-lift" hover onClick={() => handleViewDetails('beneficiaries', filteredData.beneficiaries)}>
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <Users className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">إجمالي المستفيدين</p>
            <p className="text-2xl font-bold text-blue-900">{filteredData.beneficiaries.length}</p>
            <p className="text-xs text-blue-700 mt-1">
              {filteredData.beneficiaries.filter(b => b.identityStatus === 'verified').length} موثق
            </p>
          </div>
        </Card>

        <Card className="bg-green-50 hover-lift" hover onClick={() => handleViewDetails('delivery', advancedStats.delivery)}>
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-xl mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm text-green-600">معدل النجاح</p>
            <p className="text-2xl font-bold text-green-900">{advancedStats.delivery.successRate.toFixed(1)}%</p>
            <p className="text-xs text-green-700 mt-1">
              {advancedStats.delivery.delivered} من {advancedStats.delivery.total}
            </p>
          </div>
        </Card>

        <Card className="bg-orange-50 hover-lift" hover onClick={() => handleViewDetails('tasks', filteredData.tasks)}>
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-xl mb-2">
              <Clock className="w-6 h-6 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm text-orange-600">متوسط وقت التسليم</p>
            <p className="text-2xl font-bold text-orange-900">2.3</p>
            <p className="text-xs text-orange-700 mt-1">ساعة</p>
          </div>
        </Card>

        <Card className="bg-yellow-50 hover-lift" hover onClick={() => handleViewDetails('satisfaction', { rating: 4.6 })}>
          <div className="text-center">
            <div className="bg-yellow-100 p-3 rounded-xl mb-2">
              <Star className="w-6 h-6 text-yellow-600 mx-auto" />
            </div>
            <p className="text-sm text-yellow-600">رضا المستفيدين</p>
            <p className="text-2xl font-bold text-yellow-900">4.6</p>
            <p className="text-xs text-yellow-700 mt-1">من 5 نجوم</p>
          </div>
        </Card>

        <Card className="bg-purple-50 hover-lift" hover onClick={() => handleViewDetails('cost', { cost: 45.5 })}>
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-xl mb-2">
              <TrendingUp className="w-6 h-6 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm text-purple-600">التكلفة لكل طرد</p>
            <p className="text-2xl font-bold text-purple-900">45.5</p>
            <p className="text-xs text-purple-700 mt-1">شيكل</p>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <Card className="hover-lift" hover onClick={() => handleViewChart('monthly', advancedStats.monthly)}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <LineChart className="w-5 h-5 ml-2 text-blue-600" />
              الاتجاهات الشهرية
            </h3>
            <div className="text-sm text-gray-600">آخر 6 أشهر</div>
          </div>
          
          <div className="space-y-4">
            {advancedStats.monthly.map((month, index) => {
              const successRate = month.total > 0 ? ((month.delivered / month.total) * 100) : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{month.month}</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{month.delivered}</span>
                      <span className="text-sm text-gray-600 mr-1">طرد</span>
                      <div className="text-xs text-green-600">{successRate.toFixed(1)}% نجاح</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="flex h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${month.total > 0 ? (month.delivered / month.total) * 100 : 0}%` }}
                      ></div>
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${month.total > 0 ? (month.pending / month.total) * 100 : 0}%` }}
                      ></div>
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${month.total > 0 ? (month.failed / month.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>تم التسليم: {month.delivered}</span>
                    <span>معلق: {month.pending}</span>
                    <span>فشل: {month.failed}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Package Types Distribution */}
        <Card className="hover-lift" hover onClick={() => handleViewChart('packageTypes', advancedStats.packageTypes)}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <PieChart className="w-5 h-5 ml-2 text-purple-600" />
              توزيع أنواع الطرود
            </h3>
            <div className="text-sm text-gray-600">إجمالي: {filteredData.packages.length}</div>
          </div>
          
          <div className="space-y-4">
            {advancedStats.packageTypes.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="font-medium text-gray-900">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{item.count}</span>
                    <div className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Regional Performance */}
      <Card className="hover-lift" hover onClick={() => handleViewChart('regional', advancedStats.regional)}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 ml-2 text-green-600" />
            الأداء حسب المناطق
          </h3>
          <div className="text-sm text-gray-600">إجمالي الطرود الموزعة</div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {advancedStats.regional.map((region) => (
            <div key={region.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{region.name}</h4>
                <span className="text-lg font-bold text-blue-600">{region.beneficiariesCount}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">معدل النجاح:</span>
                  <span className={`font-medium ${region.successRate > 80 ? 'text-green-600' : region.successRate > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {region.successRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${region.successRate > 80 ? 'bg-green-500' : region.successRate > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${region.successRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">متوسط الوقت:</span>
                  <span className="font-medium text-gray-900">{region.avgDeliveryTime.toFixed(1)} ساعة</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">المهام:</span>
                  <span className="font-medium text-gray-900">{region.tasksCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Performers */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Couriers */}
        <Card className="hover-lift" hover onClick={() => handleViewDetails('couriers', advancedStats.couriers)}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Award className="w-5 h-5 ml-2 text-yellow-600" />
              أفضل المندوبين
            </h3>
            <div className="text-sm text-gray-600">هذا الشهر</div>
          </div>
          
          <div className="space-y-4">
            {advancedStats.couriers.slice(0, 5).map((courier, index) => (
              <div key={courier.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{courier.name}</p>
                    <p className="text-sm text-gray-600">{courier.completedCount} طرد موزع</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 space-x-reverse mb-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-gray-900">{courier.rating}</span>
                  </div>
                  <div className="text-sm text-green-600 font-medium">{courier.successRate.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Organizations */}
        <Card className="hover-lift" hover onClick={() => handleViewDetails('organizations', advancedStats.organizations)}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 ml-2 text-green-600" />
              أفضل المؤسسات أداءً
            </h3>
            <div className="text-sm text-gray-600">حسب معدل النجاح</div>
          </div>
          
          <div className="space-y-4">
            {advancedStats.organizations.slice(0, 5).map((org, index) => (
              <div key={org.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-green-500' : 
                    index === 1 ? 'bg-blue-500' : 
                    index === 2 ? 'bg-purple-600' : 'bg-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-sm text-gray-600">{org.activeBeneficiaries} مستفيد نشط</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600 font-medium">{org.successRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">{org.completedTasks} مهمة مكتملة</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 ml-2 text-blue-600" />
          إحصائيات مفصلة
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <h4 className="font-medium text-green-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 ml-2" />
              الطرود المسلمة بنجاح
            </h4>
            <div className="space-y-3">
              {advancedStats.packageTypes.map((type, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-green-700">{type.type}:</span>
                  <span className="font-medium text-green-900">{type.count} طرد</span>
                </div>
              ))}
              <div className="pt-2 border-t border-green-200">
                <div className="flex justify-between font-semibold">
                  <span className="text-green-700">الإجمالي:</span>
                  <span className="text-green-900">{advancedStats.delivery.delivered} طرد</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-4 flex items-center">
              <Clock className="w-5 h-5 ml-2" />
              الطرود المعلقة
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-yellow-700">في الانتظار:</span>
                <span className="font-medium text-yellow-900">{advancedStats.delivery.pending} طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">قيد التوصيل:</span>
                <span className="font-medium text-yellow-900">{advancedStats.delivery.inProgress} طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">معاد جدولتها:</span>
                <span className="font-medium text-yellow-900">
                  {filteredData.tasks.filter(t => t.status === 'rescheduled').length} طرد
                </span>
              </div>
              <div className="pt-2 border-t border-yellow-200">
                <div className="flex justify-between font-semibold">
                  <span className="text-yellow-700">الإجمالي:</span>
                  <span className="text-yellow-900">
                    {advancedStats.delivery.pending + advancedStats.delivery.inProgress} طرد
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-6 rounded-xl border border-red-200">
            <h4 className="font-medium text-red-800 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 ml-2" />
              المشاكل والتحديات
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-red-700">فشل التسليم:</span>
                <span className="font-medium text-red-900">{advancedStats.delivery.failed} طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">عناوين خاطئة:</span>
                <span className="font-medium text-red-900">{Math.floor(advancedStats.delivery.failed * 0.6)} طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">عدم توفر المستفيد:</span>
                <span className="font-medium text-red-900">{Math.floor(advancedStats.delivery.failed * 0.3)} طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">مشاكل أمنية:</span>
                <span className="font-medium text-red-900">{Math.floor(advancedStats.delivery.failed * 0.1)} طرد</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Time-based Analysis */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Clock className="w-5 h-5 ml-2 text-blue-600" />
          تحليل الأوقات والكفاءة
        </h3>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-xl mb-3">
              <Clock className="w-8 h-8 text-blue-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">متوسط وقت التحضير</h4>
            <p className="text-2xl font-bold text-blue-600">1.2</p>
            <p className="text-sm text-gray-600">ساعة</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 p-4 rounded-xl mb-3">
              <Truck className="w-8 h-8 text-green-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">متوسط وقت التوصيل</h4>
            <p className="text-2xl font-bold text-green-600">2.3</p>
            <p className="text-sm text-gray-600">ساعة</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 p-4 rounded-xl mb-3">
              <Activity className="w-8 h-8 text-purple-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">أفضل وقت للتوصيل</h4>
            <p className="text-2xl font-bold text-purple-600">10-14</p>
            <p className="text-sm text-gray-600">صباحاً</p>
          </div>
          
          <div className="text-center">
            <div className="bg-orange-100 p-4 rounded-xl mb-3">
              <Calendar className="w-8 h-8 text-orange-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">أفضل يوم للتوصيل</h4>
            <p className="text-2xl font-bold text-orange-600">الأحد</p>
            <p className="text-sm text-gray-600">أعلى معدل نجاح</p>
          </div>
        </div>
      </Card>

      {/* Performance Insights */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="w-5 h-5 ml-2 text-indigo-600" />
          رؤى الأداء والتوصيات
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-700 mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 ml-2" />
              نقاط القوة
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>معدل نجاح عالي في منطقة {advancedStats.regional[0]?.name} ({advancedStats.regional[0]?.successRate.toFixed(1)}%)</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>تحسن مستمر في أوقات التسليم</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>رضا عالي من المستفيدين (4.6/5)</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>أداء ممتاز للمندوب {advancedStats.couriers[0]?.name} ({advancedStats.couriers[0]?.successRate.toFixed(1)}%)</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-orange-700 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 ml-2" />
              مجالات التحسين
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>تحسين الأداء في منطقة {advancedStats.regional[advancedStats.regional.length - 1]?.name}</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>تقليل أوقات التسليم في المناطق النائية</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>زيادة عدد المندوبين المتاحين</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>تحديث قاعدة بيانات العناوين</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Financial Overview */}
      {reportType === 'financial' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Star className="w-5 h-5 ml-2 text-purple-600" />
            التحليل المالي
          </h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-xl mb-3">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">إجمالي التكاليف</h4>
              <p className="text-2xl font-bold text-green-600">
                {(filteredData.packages.length * 45.5).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">شيكل</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-xl mb-3">
                <Package className="w-8 h-8 text-blue-600 mx-auto" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">متوسط تكلفة الطرد</h4>
              <p className="text-2xl font-bold text-blue-600">45.5</p>
              <p className="text-sm text-gray-600">شيكل</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-xl mb-3">
                <Users className="w-8 h-8 text-purple-600 mx-auto" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">تكلفة المستفيد</h4>
              <p className="text-2xl font-bold text-purple-600">
                {filteredData.beneficiaries.length > 0 ? 
                  ((filteredData.packages.length * 45.5) / filteredData.beneficiaries.length).toFixed(1) : 0}
              </p>
              <p className="text-sm text-gray-600">شيكل</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 p-4 rounded-xl mb-3">
                <Truck className="w-8 h-8 text-orange-600 mx-auto" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">تكلفة التوصيل</h4>
              <p className="text-2xl font-bold text-orange-600">12.5</p>
              <p className="text-sm text-gray-600">شيكل لكل طرد</p>
            </div>
          </div>
        </Card>
      )}

      {/* Activity Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Activity className="w-5 h-5 ml-2 text-indigo-600" />
          ملخص النشاط
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">المستفيدين</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{filteredData.beneficiaries.length}</p>
            <p className="text-xs text-blue-700">
              {filteredData.beneficiaries.filter(b => b.identityStatus === 'verified').length} موثق
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Package className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">الطرود</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{filteredData.packages.length}</p>
            <p className="text-xs text-green-700">
              {filteredData.tasks.filter(t => t.status === 'delivered').length} مسلم
            </p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Truck className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-800">المندوبين</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{couriers.length}</p>
            <p className="text-xs text-orange-700">
              {couriers.filter(c => c.status === 'active').length} نشط
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-800">المؤسسات</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{organizations.length}</p>
            <p className="text-xs text-purple-700">
              {organizations.filter(o => o.status === 'active').length} نشطة
            </p>
          </div>
        </div>
      </Card>

      {/* Modal for Charts and Details */}
      {showModal && selectedData && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'chart' ? 'عرض الرسم البياني' :
            modalType === 'details' ? 'التفاصيل المفصلة' :
            'تصدير البيانات'
          }
          size="xl"
        >
          <div className="p-6">
            {modalType === 'chart' && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-4">
                    {selectedData.type === 'monthly' ? 'الاتجاهات الشهرية' :
                     selectedData.type === 'packageTypes' ? 'توزيع أنواع الطرود' :
                     selectedData.type === 'regional' ? 'الأداء الإقليمي' :
                     'رسم بياني تفاعلي'}
                  </h4>
                  
                  <div className="bg-white rounded-lg p-8 min-h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">رسم بياني تفاعلي</p>
                      <p className="text-gray-500 text-sm mt-2">
                        سيتم تطوير الرسوم البيانية التفاعلية هنا باستخدام مكتبة Chart.js أو Recharts
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="primary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}

            {modalType === 'details' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    تفاصيل {
                      selectedData.type === 'beneficiaries' ? 'المستفيدين' :
                      selectedData.type === 'delivery' ? 'التسليم' :
                      selectedData.type === 'couriers' ? 'المندوبين' :
                      selectedData.type === 'organizations' ? 'المؤسسات' :
                      'البيانات'
                    }
                  </h4>
                  
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedData.data, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end">
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
          data={[
            {
              reportType,
              dateRange,
              selectedRegion,
              generatedAt: new Date().toISOString(),
              summary: {
                totalBeneficiaries: filteredData.beneficiaries.length,
                totalTasks: filteredData.tasks.length,
                totalPackages: filteredData.packages.length,
                deliveryRate: advancedStats.delivery.successRate,
                topCourier: advancedStats.couriers[0]?.name,
                topOrganization: advancedStats.organizations[0]?.name
              },
              statistics: advancedStats
            }
          ]}
          title="التقرير الشامل"
          defaultFilename={`التقرير_الشامل_${reportType}_${new Date().toISOString().split('T')[0]}`}
          availableFields={[
            { key: 'reportType', label: 'نوع التقرير' },
            { key: 'dateRange', label: 'الفترة الزمنية' },
            { key: 'selectedRegion', label: 'المنطقة المحددة' },
            { key: 'generatedAt', label: 'تاريخ الإنشاء' },
            { key: 'summary', label: 'الملخص' },
            { key: 'statistics', label: 'الإحصائيات التفصيلية' }
          ]}
          filters={{ reportType, dateRange, selectedRegion }}
        />
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <BarChart3 className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات التقارير الشاملة</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>استخدم الفلاتر لتخصيص التقرير حسب الفترة الزمنية والمنطقة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>اضغط على البطاقات لعرض تفاصيل أكثر أو رسوم بيانية</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن تصدير التقارير بصيغ متعددة للمراجعة الخارجية</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>التقارير تتحدث تلقائياً عند تغيير البيانات</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}