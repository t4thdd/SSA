import React, { useState, useMemo } from 'react';
import { BarChart3, Download, Calendar, Filter, TrendingUp, Users, Package, CheckCircle, Clock, AlertTriangle, Star, Award, MapPin, Activity, PieChart, LineChart, Truck, Building2, Heart, Shield, Eye, RefreshCw, X, FileText, Database, Globe } from 'lucide-react';
import { 
  mockTasks, 
  mockBeneficiaries, 
  mockPackages, 
  mockCouriers, 
  mockOrganizations, 
  mockFamilies,
  calculateStats,
  type Task,
  type Beneficiary,
  type Organization,
  type Family
} from '../../data/mockData';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal, ExportModal } from '../ui';
import GazaMap, { type MapPoint } from '../GazaMap';

export default function ComprehensiveReportsPage() {
  const { logInfo, logError } = useErrorLogger();
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'map-details' | 'export' | 'analytics'>('map-details');
  const [selectedMapData, setSelectedMapData] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const stats = calculateStats();

  const reportTypes = [
    { id: 'overview', name: 'نظرة عامة', icon: BarChart3 },
    { id: 'delivery', name: 'تقرير التسليم', icon: CheckCircle },
    { id: 'performance', name: 'تقرير الأداء', icon: TrendingUp },
    { id: 'beneficiaries', name: 'تقرير المستفيدين', icon: Users },
    { id: 'geographical', name: 'التوزيع الجغرافي', icon: MapPin },
    { id: 'organizations', name: 'تقرير المؤسسات', icon: Building2 },
    { id: 'families', name: 'تقرير العائلات', icon: Heart }
  ];

  const regions = [
    { id: 'all', name: 'جميع المناطق', count: mockBeneficiaries.length },
    { id: 'north', name: 'شمال غزة', count: mockBeneficiaries.filter(b => b.detailedAddress.governorate.includes('شمال')).length },
    { id: 'gaza', name: 'مدينة غزة', count: mockBeneficiaries.filter(b => b.detailedAddress.governorate.includes('غزة')).length },
    { id: 'middle', name: 'الوسط', count: mockBeneficiaries.filter(b => b.detailedAddress.governorate.includes('الوسط')).length },
    { id: 'khan-younis', name: 'خان يونس', count: mockBeneficiaries.filter(b => b.detailedAddress.governorate.includes('خان يونس')).length },
    { id: 'rafah', name: 'رفح', count: mockBeneficiaries.filter(b => b.detailedAddress.governorate.includes('رفح')).length }
  ];

  // إحصائيات شاملة
  const comprehensiveStats = useMemo(() => {
    const totalBeneficiaries = mockBeneficiaries.length;
    const verifiedBeneficiaries = mockBeneficiaries.filter(b => b.identityStatus === 'verified').length;
    const activeBeneficiaries = mockBeneficiaries.filter(b => b.status === 'active').length;
    
    const totalPackages = mockPackages.length;
    const deliveredPackages = mockPackages.filter(p => p.status === 'delivered').length;
    const pendingPackages = mockPackages.filter(p => p.status === 'pending').length;
    
    const totalTasks = mockTasks.length;
    const completedTasks = mockTasks.filter(t => t.status === 'delivered').length;
    const failedTasks = mockTasks.filter(t => t.status === 'failed').length;
    
    const totalOrganizations = mockOrganizations.length;
    const activeOrganizations = mockOrganizations.filter(o => o.status === 'active').length;
    
    const totalFamilies = mockFamilies.length;
    
    const totalCouriers = mockCouriers.length;
    const activeCouriers = mockCouriers.filter(c => c.status === 'active').length;

    return {
      beneficiaries: {
        total: totalBeneficiaries,
        verified: verifiedBeneficiaries,
        active: activeBeneficiaries,
        verificationRate: totalBeneficiaries > 0 ? (verifiedBeneficiaries / totalBeneficiaries * 100).toFixed(1) : 0
      },
      packages: {
        total: totalPackages,
        delivered: deliveredPackages,
        pending: pendingPackages,
        deliveryRate: totalPackages > 0 ? (deliveredPackages / totalPackages * 100).toFixed(1) : 0
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        failed: failedTasks,
        successRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0
      },
      organizations: {
        total: totalOrganizations,
        active: activeOrganizations,
        averageBeneficiaries: totalOrganizations > 0 ? Math.round(totalBeneficiaries / totalOrganizations) : 0
      },
      families: {
        total: totalFamilies,
        averageMembers: totalFamilies > 0 ? Math.round(mockFamilies.reduce((sum, f) => sum + f.membersCount, 0) / totalFamilies) : 0
      },
      couriers: {
        total: totalCouriers,
        active: activeCouriers,
        averageRating: totalCouriers > 0 ? (mockCouriers.reduce((sum, c) => sum + c.rating, 0) / totalCouriers).toFixed(1) : 0
      }
    };
  }, []);

  // تحويل البيانات إلى نقاط خريطة حسب نوع التقرير
  const getMapPointsForReport = (): MapPoint[] => {
    switch (reportType) {
      case 'geographical':
      case 'beneficiaries':
        return mockBeneficiaries.map(beneficiary => {
          const lastReceived = new Date(beneficiary.lastReceived);
          const daysSinceLastReceived = Math.floor((Date.now() - lastReceived.getTime()) / (1000 * 60 * 60 * 24));
          
          let status: 'delivered' | 'problem' | 'rescheduled' | 'pending' = 'delivered';
          
          if (daysSinceLastReceived > 30) {
            status = 'problem';
          } else if (daysSinceLastReceived > 14) {
            status = 'rescheduled';
          } else if (daysSinceLastReceived > 7) {
            status = 'pending';
          }

          return {
            id: beneficiary.id,
            lat: beneficiary.location.lat,
            lng: beneficiary.location.lng,
            status,
            title: beneficiary.name,
            description: `آخر استلام: ${daysSinceLastReceived} يوم - ${beneficiary.detailedAddress.district}`,
            data: beneficiary
          };
        });

      case 'delivery':
      case 'performance':
        return mockTasks.map(task => {
          const beneficiary = mockBeneficiaries.find(b => b.id === task.beneficiaryId);
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
            description: `المهمة: ${task.status === 'delivered' ? 'تم التسليم' : 
                         task.status === 'failed' ? 'فشل' :
                         task.status === 'rescheduled' ? 'معاد جدولته' : 'في الانتظار'}`,
            data: { task, beneficiary }
          };
        }).filter(Boolean) as MapPoint[];

      default:
        return mockBeneficiaries.map(beneficiary => ({
          id: beneficiary.id,
          lat: beneficiary.location.lat,
          lng: beneficiary.location.lng,
          status: beneficiary.status === 'active' ? 'delivered' : 'problem',
          title: beneficiary.name,
          description: beneficiary.detailedAddress.district,
          data: beneficiary
        }));
    }
  };

  const handleMapPointClick = (data: any) => {
    setSelectedMapData(data);
    setModalType('map-details');
    setShowModal(true);
  };

  const handleExportReport = () => {
    const reportData = {
      type: reportType,
      dateRange,
      region: selectedRegion,
      generatedAt: new Date().toISOString(),
      stats: comprehensiveStats,
      details: {
        totalBeneficiaries: mockBeneficiaries.length,
        totalOrganizations: mockOrganizations.length,
        totalFamilies: mockFamilies.length,
        totalTasks: mockTasks.length,
        totalCouriers: mockCouriers.length
      }
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `التقرير_الشامل_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير التقرير الشامل بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    logInfo(`تم تصدير التقرير الشامل: ${reportType}`, 'ComprehensiveReportsPage');
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
            البيانات الوهمية محملة - {mockBeneficiaries.length} مستفيد، {mockOrganizations.length} مؤسسة، {mockFamilies.length} عائلة
          </span>
        </div>
      </Card>

      {/* Report Controls */}
      <Card>
        <div className="flex items-center justify-between mb-4">
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
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="quarter">هذا الربع</option>
              <option value="year">هذا العام</option>
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
                <option key={region.id} value={region.id}>{region.name} ({region.count})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">إجراءات</label>
            <Button 
              variant="secondary" 
              icon={Filter} 
              iconPosition="right"
              onClick={() => {
                setModalType('analytics');
                setShowModal(true);
              }}
              className="w-full"
            >
              تحليلات متقدمة
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <Users className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">إجمالي المستفيدين</p>
            <p className="text-2xl font-bold text-blue-900">{comprehensiveStats.beneficiaries.total}</p>
            <p className="text-xs text-blue-700 mt-1">{comprehensiveStats.beneficiaries.verificationRate}% موثق</p>
          </div>
        </Card>

        <Card className="bg-green-50">
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-xl mb-2">
              <Package className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm text-green-600">معدل التسليم</p>
            <p className="text-2xl font-bold text-green-900">{comprehensiveStats.packages.deliveryRate}%</p>
            <p className="text-xs text-green-700 mt-1">{comprehensiveStats.packages.delivered} من {comprehensiveStats.packages.total}</p>
          </div>
        </Card>

        <Card className="bg-purple-50">
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-xl mb-2">
              <Building2 className="w-6 h-6 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm text-purple-600">المؤسسات النشطة</p>
            <p className="text-2xl font-bold text-purple-900">{comprehensiveStats.organizations.active}</p>
            <p className="text-xs text-purple-700 mt-1">من {comprehensiveStats.organizations.total} إجمالي</p>
          </div>
        </Card>

        <Card className="bg-orange-50">
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-xl mb-2">
              <Truck className="w-6 h-6 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm text-orange-600">معدل نجاح المهام</p>
            <p className="text-2xl font-bold text-orange-900">{comprehensiveStats.tasks.successRate}%</p>
            <p className="text-xs text-orange-700 mt-1">{comprehensiveStats.tasks.completed} مهمة مكتملة</p>
          </div>
        </Card>
      </div>

      {/* Main Report Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Interactive Geographic Map */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Globe className="w-6 h-6 ml-2 text-blue-600" />
              الخريطة التفاعلية الشاملة
            </h3>
            <div className="text-sm text-gray-600">
              {getMapPointsForReport().length} نقطة
            </div>
          </div>
          
          <div className="h-[450px] w-full bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
            <GazaMap 
              points={getMapPointsForReport()}
              onPointClick={handleMapPointClick}
              activeFilter="all"
              heightClass="h-full"
              className="w-full"
            />
          </div>
          
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">إحصائيات الخريطة</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">تم التسليم:</span>
                <span className="font-medium text-green-600">
                  {getMapPointsForReport().filter(p => p.status === 'delivered').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">مشاكل:</span>
                <span className="font-medium text-red-600">
                  {getMapPointsForReport().filter(p => p.status === 'problem').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">معاد جدولته:</span>
                <span className="font-medium text-orange-600">
                  {getMapPointsForReport().filter(p => p.status === 'rescheduled').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">في الانتظار:</span>
                <span className="font-medium text-blue-600">
                  {getMapPointsForReport().filter(p => p.status === 'pending').length}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Comprehensive Statistics */}
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 ml-2 text-purple-600" />
            الإحصائيات الشاملة
          </h3>
          
          <div className="space-y-6">
            {/* Beneficiaries Stats */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <Users className="w-4 h-4 ml-2" />
                إحصائيات المستفيدين
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">إجمالي:</span>
                  <span className="font-medium text-blue-900">{comprehensiveStats.beneficiaries.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">موثق:</span>
                  <span className="font-medium text-blue-900">{comprehensiveStats.beneficiaries.verified}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">نشط:</span>
                  <span className="font-medium text-blue-900">{comprehensiveStats.beneficiaries.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">معدل التوثيق:</span>
                  <span className="font-medium text-blue-900">{comprehensiveStats.beneficiaries.verificationRate}%</span>
                </div>
              </div>
            </div>

            {/* Packages Stats */}
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h4 className="font-medium text-green-800 mb-3 flex items-center">
                <Package className="w-4 h-4 ml-2" />
                إحصائيات الطرود
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">إجمالي:</span>
                  <span className="font-medium text-green-900">{comprehensiveStats.packages.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">تم التسليم:</span>
                  <span className="font-medium text-green-900">{comprehensiveStats.packages.delivered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">معلق:</span>
                  <span className="font-medium text-green-900">{comprehensiveStats.packages.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">معدل التسليم:</span>
                  <span className="font-medium text-green-900">{comprehensiveStats.packages.deliveryRate}%</span>
                </div>
              </div>
            </div>

            {/* Organizations & Families Stats */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                <Building2 className="w-4 h-4 ml-2" />
                الشركاء والعائلات
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">المؤسسات:</span>
                  <span className="font-medium text-purple-900">{comprehensiveStats.organizations.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">العائلات:</span>
                  <span className="font-medium text-purple-900">{comprehensiveStats.families.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">متوسط المستفيدين/مؤسسة:</span>
                  <span className="font-medium text-purple-900">{comprehensiveStats.organizations.averageBeneficiaries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">متوسط أفراد العائلة:</span>
                  <span className="font-medium text-purple-900">{comprehensiveStats.families.averageMembers}</span>
                </div>
              </div>
            </div>

            {/* Couriers Stats */}
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-3 flex items-center">
                <Truck className="w-4 h-4 ml-2" />
                إحصائيات المندوبين
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-700">إجمالي المندوبين:</span>
                  <span className="font-medium text-orange-900">{comprehensiveStats.couriers.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">نشط:</span>
                  <span className="font-medium text-orange-900">{comprehensiveStats.couriers.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">متوسط التقييم:</span>
                  <span className="font-medium text-orange-900">{comprehensiveStats.couriers.averageRating} ⭐</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">معدل النجاح:</span>
                  <span className="font-medium text-orange-900">{comprehensiveStats.tasks.successRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Regional Performance Analysis */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <MapPin className="w-6 h-6 ml-2 text-green-600" />
          تحليل الأداء الإقليمي
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {regions.filter(r => r.id !== 'all').map((region) => {
            const regionBeneficiaries = mockBeneficiaries.filter(b => 
              b.detailedAddress.governorate.includes(region.name.replace('مدينة ', ''))
            );
            const successRate = 75 + Math.random() * 20; // Mock success rate
            const avgDeliveryTime = 2 + Math.random() * 2; // Mock average time
            
            return (
              <div key={region.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{region.name}</h4>
                  <span className="text-lg font-bold text-blue-600">{region.count}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">معدل النجاح:</span>
                    <span className={`font-medium ${successRate > 80 ? 'text-green-600' : successRate > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${successRate > 80 ? 'bg-green-500' : successRate > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${successRate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">متوسط الوقت:</span>
                    <span className="font-medium text-gray-900">{avgDeliveryTime.toFixed(1)} ساعة</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detailed Analysis */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Organizations Performance */}
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Building2 className="w-6 h-6 ml-2 text-blue-600" />
            أداء المؤسسات
          </h3>
          
          <div className="space-y-4">
            {mockOrganizations.slice(0, 5).map((org) => (
              <div key={org.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-sm text-gray-600">{org.beneficiariesCount} مستفيد</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{org.completionRate}%</div>
                  <div className="text-sm text-green-600 font-medium">معدل الإنجاز</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Families Performance */}
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Heart className="w-6 h-6 ml-2 text-purple-600" />
            أداء العائلات
          </h3>
          
          <div className="space-y-4">
            {mockFamilies.map((family) => (
              <div key={family.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Heart className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{family.name}</p>
                    <p className="text-sm text-gray-600">{family.membersCount} فرد</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{family.completionRate}%</div>
                  <div className="text-sm text-purple-600 font-medium">معدل الإنجاز</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal for Map Details/Analytics */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'map-details' ? 'تفاصيل النقطة من الخريطة' :
            modalType === 'analytics' ? 'تحليلات متقدمة' :
            'تصدير التقرير'
          }
          size={modalType === 'analytics' ? 'xl' : 'md'}
        >
          <div className="p-6">
            {/* Map Point Details */}
            {modalType === 'map-details' && selectedMapData && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">تفاصيل من الخريطة</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">الاسم:</span>
                      <span className="font-medium text-blue-900 mr-2">{selectedMapData.name}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">المنطقة:</span>
                      <span className="font-medium text-blue-900 mr-2">
                        {selectedMapData.detailedAddress?.district || 'غير محدد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">الهاتف:</span>
                      <span className="font-medium text-blue-900 mr-2">{selectedMapData.phone}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">الحالة:</span>
                      <span className="font-medium text-blue-900 mr-2">
                        {selectedMapData.status === 'active' ? 'نشط' :
                         selectedMapData.status === 'pending' ? 'معلق' : 'موقوف'}
                      </span>
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

            {/* Advanced Analytics */}
            {modalType === 'analytics' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Performance Trends */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4">اتجاهات الأداء</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">معدل التسليم الشهري:</span>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-600">+12%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">رضا المستفيدين:</span>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold text-gray-900">4.7/5</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">متوسط وقت التسليم:</span>
                        <span className="font-bold text-blue-600">2.3 ساعة</span>
                      </div>
                    </div>
                  </div>

                  {/* Geographic Insights */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4">رؤى جغرافية</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">أفضل منطقة أداء:</span>
                        <span className="font-bold text-green-600">خان يونس</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">تحتاج تحسين:</span>
                        <span className="font-bold text-red-600">رفح</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">التغطية الجغرافية:</span>
                        <span className="font-bold text-blue-600">95%</span>
                      </div>
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
          data={[
            ...mockBeneficiaries.map(b => ({ type: 'beneficiary', ...b })),
            ...mockOrganizations.map(o => ({ type: 'organization', ...o })),
            ...mockFamilies.map(f => ({ type: 'family', ...f })),
            ...mockTasks.map(t => ({ type: 'task', ...t }))
          ]}
          title="التقرير الشامل"
          defaultFilename={`التقرير_الشامل_${reportType}_${new Date().toISOString().split('T')[0]}`}
          availableFields={[
            { key: 'type', label: 'نوع البيانات' },
            { key: 'name', label: 'الاسم' },
            { key: 'status', label: 'الحالة' },
            { key: 'createdAt', label: 'تاريخ الإنشاء' }
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
                <span>استخدم الخريطة التفاعلية لتحليل التوزيع الجغرافي للمستفيدين</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن فلترة التقارير حسب النوع والفترة الزمنية والمنطقة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>انقر على نقاط الخريطة لعرض تفاصيل إضافية</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن تصدير التقارير بصيغ متعددة للتحليل الخارجي</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}