import React, { useState } from 'react';
import { Users, Package, Truck, Bell, BarChart3, Plus, Heart, Search, Filter, Eye, Edit, Phone, CheckCircle, Clock, AlertTriangle, MapPin, Star, Calendar, FileText, UserPlus, RefreshCw, Download, TrendingUp, Activity, X, Send, Archive, Settings } from 'lucide-react';
import { 
  mockBeneficiaries, 
  mockPackages, 
  mockTasks, 
  mockAlerts,
  mockFamilies,
  mockPackageTemplates,
  mockOrganizations,
  getBeneficiariesByFamily,
  type Family,
  type Beneficiary,
  type Package as PackageType,
  type Task,
  type PackageTemplate
} from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useErrorLogger } from '../utils/errorLogger';
import { Button, Card, Input, Badge, StatCard, Modal } from './ui';
import FamilyMemberForm from './FamilyMemberForm';
import BeneficiaryProfileModal from './BeneficiaryProfileModal';

interface FamiliesDashboardProps {
  onNavigateBack: () => void;
}

export default function FamiliesDashboard({ onNavigateBack }: FamiliesDashboardProps) {
  const { loggedInUser, logout } = useAuth();
  const { logInfo, logError } = useErrorLogger();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add-member' | 'edit-member' | 'view-member' | 'assign-package' | 'view-task' | 'view-alert'>('add-member');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // الحصول على العائلة الحالية
  const currentFamily = loggedInUser?.associatedId 
    ? mockFamilies.find(family => family.id === loggedInUser.associatedId) || mockFamilies[0]
    : mockFamilies[0];

  // بيانات العائلة
  const familyMembers = currentFamily ? getBeneficiariesByFamily(currentFamily.id) : [];
  const familyPackages = currentFamily ? mockPackages.filter(p => 
    familyMembers.some(member => member.id === p.beneficiaryId)
  ) : [];
  const familyTasks = currentFamily ? mockTasks.filter(t => 
    familyMembers.some(member => member.id === t.beneficiaryId)
  ) : [];
  const familyAlerts = currentFamily ? mockAlerts.filter(a => 
    familyMembers.some(member => member.id === a.relatedId)
  ) : [];

  // إحصائيات العائلة
  const familyStats = {
    totalMembers: familyMembers.length,
    verifiedMembers: familyMembers.filter(m => m.identityStatus === 'verified').length,
    totalPackages: familyPackages.length,
    deliveredPackages: familyPackages.filter(p => p.status === 'delivered').length,
    pendingPackages: familyPackages.filter(p => p.status === 'pending').length,
    activeTasks: familyTasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length,
    completedTasks: familyTasks.filter(t => t.status === 'delivered').length,
    unreadAlerts: familyAlerts.filter(a => !a.isRead).length
  };

  const sidebarItems = [
    { id: 'overview', name: 'نظرة عامة', icon: BarChart3 },
    { id: 'beneficiaries', name: 'أفراد العائلة', icon: Users },
    { id: 'packages', name: 'الطرود', icon: Package },
    { id: 'tasks', name: 'متابعة التوزيع', icon: Truck },
    { id: 'alerts', name: 'التنبيهات', icon: Bell },
  ];

  const handleAddMember = () => {
    setModalType('add-member');
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEditMember = (member: Beneficiary) => {
    setModalType('edit-member');
    setSelectedItem(member);
    setShowModal(true);
  };

  const handleViewMember = (member: Beneficiary) => {
    setModalType('view-member');
    setSelectedItem(member);
    setShowModal(true);
  };

  const handleAssignPackage = () => {
    setModalType('assign-package');
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleViewTask = (task: Task) => {
    setModalType('view-task');
    setSelectedItem(task);
    setShowModal(true);
  };

  const handleViewAlert = (alert: any) => {
    setModalType('view-alert');
    setSelectedItem(alert);
    setShowModal(true);
  };

  const handleSaveMember = (memberData: Partial<Beneficiary>) => {
    if (modalType === 'add-member') {
      // محاكاة إضافة فرد جديد للعائلة
      const newMember: Beneficiary = {
        id: `member-${Date.now()}`,
        name: memberData.name || '',
        fullName: memberData.fullName || '',
        nationalId: memberData.nationalId || '',
        dateOfBirth: memberData.dateOfBirth || '',
        gender: memberData.gender || 'male',
        phone: memberData.phone || '',
        address: memberData.address || currentFamily?.location || '',
        detailedAddress: memberData.detailedAddress || {
          governorate: currentFamily?.location.split(' - ')[0] || '',
          city: currentFamily?.location.split(' - ')[1] || '',
          district: currentFamily?.location.split(' - ')[2] || '',
          street: '',
          additionalInfo: ''
        },
        location: memberData.location || { lat: 31.3469, lng: 34.3029 },
        familyId: currentFamily?.id,
        relationToFamily: memberData.relationToFamily,
        profession: memberData.profession || '',
        maritalStatus: memberData.maritalStatus || 'single',
        economicLevel: memberData.economicLevel || 'poor',
        membersCount: memberData.membersCount || 1,
        additionalDocuments: [],
        identityStatus: 'pending',
        status: 'active',
        eligibilityStatus: 'under_review',
        lastReceived: new Date().toISOString().split('T')[0],
        totalPackages: 0,
        notes: memberData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'family_admin',
        updatedBy: 'family_admin'
      };
      
      // إضافة الفرد الجديد للبيانات الوهمية
      mockBeneficiaries.unshift(newMember);
      
      setNotification({ message: `تم إضافة ${memberData.name} بنجاح كفرد جديد في العائلة`, type: 'success' });
      logInfo(`تم إضافة فرد جديد للعائلة: ${memberData.name}`, 'FamiliesDashboard');
    } else if (modalType === 'edit-member' && selectedItem) {
      // محاكاة تحديث بيانات فرد العائلة
      const memberIndex = mockBeneficiaries.findIndex(b => b.id === selectedItem.id);
      if (memberIndex !== -1) {
        mockBeneficiaries[memberIndex] = {
          ...mockBeneficiaries[memberIndex],
          ...memberData,
          updatedAt: new Date().toISOString(),
          updatedBy: 'family_admin'
        };
        setNotification({ message: `تم تحديث بيانات ${memberData.name} بنجاح`, type: 'success' });
        logInfo(`تم تحديث بيانات فرد العائلة: ${memberData.name}`, 'FamiliesDashboard');
      }
    }
    
    setTimeout(() => setNotification(null), 3000);
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleCancelMember = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleCall = (phone: string) => {
    if (confirm(`هل تريد الاتصال بالرقم ${phone}؟`)) {
      window.open(`tel:${phone}`);
    }
  };

  const handleMarkAlertAsRead = (alertId: string) => {
    const alert = familyAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      setNotification({ message: 'تم وضع علامة كمقروء للتنبيه', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleExportFamilyReport = () => {
    const reportData = {
      family: currentFamily,
      members: familyMembers,
      packages: familyPackages,
      tasks: familyTasks,
      alerts: familyAlerts,
      statistics: familyStats,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_العائلة_${currentFamily?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير تقرير العائلة بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredMembers = familyMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.nationalId.includes(searchTerm) ||
    member.phone.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_delivery': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-orange-100 text-orange-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'pending': return 'معلق';
      case 'suspended': return 'موقوف';
      case 'delivered': return 'تم التسليم';
      case 'in_delivery': return 'قيد التوصيل';
      case 'assigned': return 'معين';
      case 'in_progress': return 'قيد التنفيذ';
      case 'failed': return 'فشل';
      default: return 'غير محدد';
    }
  };

  const getIdentityColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'delayed': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="min-h-screen bg-gray-50/30 flex" dir="rtl">
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

      {/* Sidebar */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">لوحة العائلات</h1>
              <p className="text-sm text-gray-500">
                {currentFamily?.name || 'غير محدد'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 border-l-2 border-purple-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-purple-600' : ''}`} />
                <span>{item.name}</span>
                {item.id === 'alerts' && familyStats.unreadAlerts > 0 && (
                  <Badge variant="error" size="sm">
                    {familyStats.unreadAlerts}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Family Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-800 mb-2">معلومات العائلة</div>
            {currentFamily ? (
              <div className="space-y-1 text-xs text-purple-700">
                <div className="flex justify-between">
                  <span>أفراد العائلة:</span>
                  <span className="font-medium">{familyStats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span>الطرود الموزعة:</span>
                  <span className="font-medium">{familyStats.deliveredPackages}</span>
                </div>
                <div className="flex justify-between">
                  <span>نسبة الإنجاز:</span>
                  <span className="font-medium">{currentFamily.completionRate}%</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-purple-700 text-center">
                <p>لا توجد بيانات متاحة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentFamily?.name || 'غير محدد'}
                  </h2>
                  <p className="text-gray-600 mt-1">إدارة أفراد العائلة والمساعدات</p>
                </div>
                <div className="flex space-x-3 space-x-reverse">
                  <Button variant="success" icon={Download} iconPosition="right" onClick={handleExportFamilyReport}>
                    تقرير العائلة
                  </Button>
                  <Button variant="secondary" icon={RefreshCw} iconPosition="right">
                    تحديث البيانات
                  </Button>
                </div>
              </div>

              {/* Welcome Card */}
              {currentFamily && (
                <Card className="bg-purple-600 text-white border-purple-700">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-2">مرحباً بعائلة {currentFamily.name.split(' ')[2] || currentFamily.name}</h2>
                      <p className="text-purple-100">نشكرك على مساعدتك في دعم المحتاجين من أفراد عائلتك</p>
                      <p className="text-purple-200 text-sm mt-1">رب الأسرة: {currentFamily.headOfFamily}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="أفراد العائلة"
                  value={familyStats.totalMembers}
                  icon={Users}
                  trend={{
                    value: `${familyStats.verifiedMembers} موثق`,
                    direction: 'up',
                    label: ''
                  }}
                  color="purple"
                />

                <StatCard
                  title="الطرود المقدمة"
                  value={familyStats.totalPackages}
                  icon={Package}
                  trend={{
                    value: `${familyStats.deliveredPackages} مسلم`,
                    direction: 'up',
                    label: ''
                  }}
                  color="blue"
                />

                <StatCard
                  title="المهام النشطة"
                  value={familyStats.activeTasks}
                  icon={Truck}
                  trend={{
                    value: `${familyStats.completedTasks} مكتمل`,
                    direction: 'up',
                    label: ''
                  }}
                  color="green"
                />

                <StatCard
                  title="التنبيهات"
                  value={familyStats.unreadAlerts}
                  icon={Bell}
                  trend={{
                    value: 'تحتاج متابعة',
                    direction: familyStats.unreadAlerts > 0 ? 'down' : 'up',
                    label: ''
                  }}
                  color="orange"
                />
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card hover onClick={handleAddMember}>
                  <div className="flex items-center space-x-4 space-x-reverse mb-4">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">إضافة فرد للعائلة</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">أضف فرد جديد من العائلة لقائمة المستفيدين</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <span>إضافة فرد جديد</span>
                    <Plus className="w-4 h-4 mr-1" />
                  </div>
                </Card>

                <Card hover onClick={handleAssignPackage}>
                  <div className="flex items-center space-x-4 space-x-reverse mb-4">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">تحديد طرد للتوزيع</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">حدد الطرود المراد توزيعها على أفراد العائلة</p>
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <span>تحديد طرد</span>
                    <Send className="w-4 h-4 mr-1" />
                  </div>
                </Card>
              </div>

              {/* Recent Activities and Family Map */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">آخر الأنشطة</h3>
                  <div className="space-y-4">
                    {familyTasks.slice(0, 4).map((task, index) => {
                      const beneficiary = mockBeneficiaries.find(b => b.id === task.beneficiaryId);
                      const packageInfo = mockPackages.find(p => p.id === task.packageId);
                      
                      return (
                        <div key={task.id} className={`flex items-start space-x-3 space-x-reverse p-3 rounded-lg border ${getStatusColor(task.status)}`}>
                          <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                            {task.status === 'delivered' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                             task.status === 'failed' ? <AlertTriangle className="w-4 h-4 text-red-600" /> :
                             task.status === 'in_progress' ? <Truck className="w-4 h-4 text-blue-600" /> :
                             <Clock className="w-4 h-4 text-orange-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {task.status === 'delivered' ? 'تم تسليم' :
                               task.status === 'failed' ? 'فشل تسليم' :
                               task.status === 'in_progress' ? 'قيد توصيل' :
                               'مهمة جديدة'} {packageInfo?.name || 'طرد'} لـ {beneficiary?.name || 'مستفيد'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(task.createdAt).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Button variant="ghost" size="sm" className="w-full mt-4" onClick={() => setActiveTab('tasks')}>
                    عرض جميع الأنشطة
                  </Button>
                </Card>

                {/* Family Distribution Map */}
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">خريطة أفراد العائلة</h3>
                  <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center relative">
                    <div className="text-center z-10">
                      <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700">مواقع أفراد العائلة</p>
                      <p className="text-sm text-gray-500 mt-2">{familyStats.totalMembers} فرد في مناطق مختلفة</p>
                    </div>
                    {/* Mock map points */}
                    {familyMembers.slice(0, 4).map((member, index) => (
                      <div 
                        key={member.id}
                        className={`absolute w-2 h-2 rounded-full ${
                          index === 0 ? 'top-16 left-16 bg-purple-500' :
                          index === 1 ? 'top-24 right-20 bg-green-500' :
                          index === 2 ? 'bottom-16 left-24 bg-orange-500' :
                          'bottom-24 right-16 bg-blue-500'
                        }`}
                        title={member.name}
                      ></div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Family Members Tab */}
          {activeTab === 'beneficiaries' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">أفراد العائلة المستفيدين</h2>
                  <p className="text-gray-600 mt-1">إدارة مستفيدي {currentFamily?.name || 'العائلة'}</p>
                </div>
                <div className="flex space-x-3 space-x-reverse">
                  <Button variant="success" icon={Download} iconPosition="right">
                    تصدير القائمة
                  </Button>
                  <Button variant="primary" icon={Plus} iconPosition="right" onClick={handleAddMember}>
                    إضافة فرد جديد
                  </Button>
                </div>
              </div>

              {/* Search */}
              <Card>
                <Input
                  type="text"
                  icon={Search}
                  iconPosition="right"
                  placeholder="البحث في أفراد العائلة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Card>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-purple-50">
                  <div className="text-center">
                    <div className="bg-purple-100 p-3 rounded-xl mb-2">
                      <Users className="w-6 h-6 text-purple-600 mx-auto" />
                    </div>
                    <p className="text-sm text-purple-600">إجمالي الأفراد</p>
                    <p className="text-2xl font-bold text-purple-900">{familyStats.totalMembers}</p>
                  </div>
                </Card>

                <Card className="bg-green-50">
                  <div className="text-center">
                    <div className="bg-green-100 p-3 rounded-xl mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                    </div>
                    <p className="text-sm text-green-600">موثقين</p>
                    <p className="text-2xl font-bold text-green-900">{familyStats.verifiedMembers}</p>
                  </div>
                </Card>

                <Card className="bg-blue-50">
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-xl mb-2">
                      <Package className="w-6 h-6 text-blue-600 mx-auto" />
                    </div>
                    <p className="text-sm text-blue-600">طرود مستلمة</p>
                    <p className="text-2xl font-bold text-blue-900">{familyStats.deliveredPackages}</p>
                  </div>
                </Card>

                <Card className="bg-orange-50">
                  <div className="text-center">
                    <div className="bg-orange-100 p-3 rounded-xl mb-2">
                      <Clock className="w-6 h-6 text-orange-600 mx-auto" />
                    </div>
                    <p className="text-sm text-orange-600">طرود معلقة</p>
                    <p className="text-2xl font-bold text-orange-900">{familyStats.pendingPackages}</p>
                  </div>
                </Card>
              </div>

              {/* Family Members Table */}
              <Card padding="none" className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">قائمة أفراد العائلة ({filteredMembers.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">صلة القرابة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الهاتف</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">آخر استلام</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center ml-3">
                                  <Users className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                  <div className="text-xs text-gray-500">{member.nationalId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.relationToFamily || 'فرد من العائلة'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(member.lastReceived).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col space-y-1">
                                <Badge variant={
                                  member.identityStatus === 'verified' ? 'success' :
                                  member.identityStatus === 'pending' ? 'warning' : 'error'
                                } size="sm">
                                  {member.identityStatus === 'verified' ? 'موثق' :
                                   member.identityStatus === 'pending' ? 'بانتظار التوثيق' : 'مرفوض'}
                                </Badge>
                                <Badge variant={
                                  member.status === 'active' ? 'success' :
                                  member.status === 'pending' ? 'warning' : 'error'
                                } size="sm">
                                  {getStatusText(member.status)}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2 space-x-reverse">
                                <button 
                                  onClick={() => handleViewMember(member)}
                                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" 
                                  title="عرض السجل"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleEditMember(member)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                                  title="تعديل"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleCall(member.phone)}
                                  className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" 
                                  title="اتصال"
                                >
                                  <Phone className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <Users className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm mt-2">
                                {searchTerm ? 'لا توجد نتائج للبحث' : 'لم يتم إضافة أي أفراد لهذه العائلة بعد'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Packages Tab */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">طرود العائلة</h2>
                  <p className="text-gray-600 mt-1">إدارة الطرود المخصصة لأفراد العائلة</p>
                </div>
                <div className="flex space-x-3 space-x-reverse">
                  <Button variant="success" icon={Download} iconPosition="right">
                    تصدير الطرود
                  </Button>
                  <Button variant="primary" icon={Plus} iconPosition="right" onClick={handleAssignPackage}>
                    تحديد طرد جديد
                  </Button>
                </div>
              </div>

              {/* Package Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50">
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-xl mb-2">
                      <Package className="w-6 h-6 text-blue-600 mx-auto" />
                    </div>
                    <p className="text-sm text-blue-600">إجمالي الطرود</p>
                    <p className="text-2xl font-bold text-blue-900">{familyPackages.length}</p>
                  </div>
                </Card>

                <Card className="bg-green-50">
                  <div className="text-center">
                    <div className="bg-green-100 p-3 rounded-xl mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                    </div>
                    <p className="text-sm text-green-600">تم التسليم</p>
                    <p className="text-2xl font-bold text-green-900">{familyStats.deliveredPackages}</p>
                  </div>
                </Card>

                <Card className="bg-orange-50">
                  <div className="text-center">
                    <div className="bg-orange-100 p-3 rounded-xl mb-2">
                      <Clock className="w-6 h-6 text-orange-600 mx-auto" />
                    </div>
                    <p className="text-sm text-orange-600">معلقة</p>
                    <p className="text-2xl font-bold text-orange-900">{familyStats.pendingPackages}</p>
                  </div>
                </Card>

                <Card className="bg-purple-50">
                  <div className="text-center">
                    <div className="bg-purple-100 p-3 rounded-xl mb-2">
                      <TrendingUp className="w-6 h-6 text-purple-600 mx-auto" />
                    </div>
                    <p className="text-sm text-purple-600">نسبة النجاح</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {familyPackages.length > 0 ? ((familyStats.deliveredPackages / familyPackages.length) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </Card>
              </div>

              {/* Packages List */}
              <Card padding="none" className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">طرود العائلة ({familyPackages.length})</h3>
                </div>
                <div className="p-6">
                  {familyPackages.length > 0 ? (
                    <div className="space-y-4">
                      {familyPackages.map((pkg) => {
                        const beneficiary = mockBeneficiaries.find(b => b.id === pkg.beneficiaryId);
                        return (
                          <div key={pkg.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-4 space-x-reverse">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Package className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{pkg.name}</p>
                                <p className="text-sm text-gray-600">
                                  للمستفيد: {beneficiary?.name || 'غير محدد'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  تاريخ الإنشاء: {new Date(pkg.createdAt).toLocaleDateString('ar-SA')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <Badge variant={
                                pkg.status === 'delivered' ? 'success' :
                                pkg.status === 'in_delivery' ? 'warning' :
                                pkg.status === 'pending' ? 'info' : 'error'
                              } size="sm">
                                {getStatusText(pkg.status)}
                              </Badge>
                              <div className="text-right">
                                <p className="text-sm font-medium text-green-600">{pkg.value} ₪</p>
                                <p className="text-xs text-gray-500">القيمة</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">لا توجد طرود للعائلة</p>
                      <p className="text-sm mt-2">ابدأ بتحديد طرود للتوزيع على أفراد العائلة</p>
                      <Button variant="primary" className="mt-4" onClick={handleAssignPackage}>
                        تحديد طرد جديد
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">متابعة التوزيع</h2>
                  <p className="text-gray-600 mt-1">متابعة مهام توزيع طرود العائلة</p>
                </div>
                <div className="flex space-x-3 space-x-reverse">
                  <Button variant="success" icon={Download} iconPosition="right">
                    تصدير التقرير
                  </Button>
                  <Button variant="secondary" icon={RefreshCw} iconPosition="right">
                    تحديث الحالة
                  </Button>
                </div>
              </div>

              {/* Task Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50">
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-xl mb-2">
                      <Activity className="w-6 h-6 text-blue-600 mx-auto" />
                    </div>
                    <p className="text-sm text-blue-600">إجمالي المهام</p>
                    <p className="text-2xl font-bold text-blue-900">{familyTasks.length}</p>
                  </div>
                </Card>

                <Card className="bg-green-50">
                  <div className="text-center">
                    <div className="bg-green-100 p-3 rounded-xl mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                    </div>
                    <p className="text-sm text-green-600">مكتملة</p>
                    <p className="text-2xl font-bold text-green-900">{familyStats.completedTasks}</p>
                  </div>
                </Card>

                <Card className="bg-orange-50">
                  <div className="text-center">
                    <div className="bg-orange-100 p-3 rounded-xl mb-2">
                      <Truck className="w-6 h-6 text-orange-600 mx-auto" />
                    </div>
                    <p className="text-sm text-orange-600">نشطة</p>
                    <p className="text-2xl font-bold text-orange-900">{familyStats.activeTasks}</p>
                  </div>
                </Card>

                <Card className="bg-purple-50">
                  <div className="text-center">
                    <div className="bg-purple-100 p-3 rounded-xl mb-2">
                      <Star className="w-6 h-6 text-purple-600 mx-auto" />
                    </div>
                    <p className="text-sm text-purple-600">معدل النجاح</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {familyTasks.length > 0 ? ((familyStats.completedTasks / familyTasks.length) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </Card>
              </div>

              {/* Tasks List */}
              <Card padding="none" className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">مهام التوزيع ({familyTasks.length})</h3>
                </div>
                <div className="p-6">
                  {familyTasks.length > 0 ? (
                    <div className="space-y-4">
                      {familyTasks.map((task) => {
                        const beneficiary = mockBeneficiaries.find(b => b.id === task.beneficiaryId);
                        const packageInfo = mockPackages.find(p => p.id === task.packageId);
                        const courier = task.courierId ? mockCouriers.find(c => c.id === task.courierId) : null;
                        
                        return (
                          <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-4 space-x-reverse">
                              <div className={`p-2 rounded-lg ${getStatusColor(task.status)}`}>
                                {task.status === 'delivered' ? <CheckCircle className="w-5 h-5" /> :
                                 task.status === 'failed' ? <AlertTriangle className="w-5 h-5" /> :
                                 task.status === 'in_progress' ? <Truck className="w-5 h-5" /> :
                                 <Clock className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {packageInfo?.name || 'طرد غير محدد'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  للمستفيد: {beneficiary?.name || 'غير محدد'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  المندوب: {courier?.name || 'غير معين'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <Badge variant={
                                task.status === 'delivered' ? 'success' :
                                task.status === 'failed' ? 'error' :
                                task.status === 'in_progress' ? 'warning' : 'info'
                              } size="sm">
                                {getStatusText(task.status)}
                              </Badge>
                              <button 
                                onClick={() => handleViewTask(task)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">لا توجد مهام توزيع</p>
                      <p className="text-sm mt-2">سيتم إنشاء المهام تلقائياً عند تحديد الطرود</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">تنبيهات العائلة</h2>
                  <p className="text-gray-600 mt-1">التنبيهات والإشعارات الخاصة بالعائلة</p>
                </div>
                <div className="flex space-x-3 space-x-reverse">
                  <Button variant="warning" size="sm">
                    وضع علامة كمقروء للكل
                  </Button>
                  <Button variant="secondary" icon={Settings} iconPosition="right">
                    إعدادات التنبيهات
                  </Button>
                </div>
              </div>

              {/* Alert Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-red-50">
                  <div className="text-center">
                    <div className="bg-red-100 p-3 rounded-xl mb-2">
                      <Bell className="w-6 h-6 text-red-600 mx-auto" />
                    </div>
                    <p className="text-sm text-red-600">إجمالي التنبيهات</p>
                    <p className="text-2xl font-bold text-red-900">{familyAlerts.length}</p>
                  </div>
                </Card>

                <Card className="bg-orange-50">
                  <div className="text-center">
                    <div className="bg-orange-100 p-3 rounded-xl mb-2">
                      <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto" />
                    </div>
                    <p className="text-sm text-orange-600">غير مقروءة</p>
                    <p className="text-2xl font-bold text-orange-900">{familyStats.unreadAlerts}</p>
                  </div>
                </Card>

                <Card className="bg-yellow-50">
                  <div className="text-center">
                    <div className="bg-yellow-100 p-3 rounded-xl mb-2">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto" />
                    </div>
                    <p className="text-sm text-yellow-600">متأخرة</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {familyAlerts.filter(a => a.type === 'delayed').length}
                    </p>
                  </div>
                </Card>

                <Card className="bg-blue-50">
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-xl mb-2">
                      <CheckCircle className="w-6 h-6 text-blue-600 mx-auto" />
                    </div>
                    <p className="text-sm text-blue-600">مقروءة</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {familyAlerts.filter(a => a.isRead).length}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Alerts List */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">قائمة التنبيهات</h3>
                {familyAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {familyAlerts.map((alert) => (
                      <div key={alert.id} className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                        !alert.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 space-x-reverse">
                            <div className={`p-2 rounded-lg ${getAlertTypeColor(alert.type)}`}>
                              {alert.type === 'delayed' ? <Clock className="w-4 h-4" /> :
                               alert.type === 'failed' ? <AlertTriangle className="w-4 h-4" /> :
                               alert.type === 'expired' ? <Calendar className="w-4 h-4" /> :
                               <Bell className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 space-x-reverse mb-1">
                                <h4 className="font-medium text-gray-900">{alert.title}</h4>
                                {!alert.isRead && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                              <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500">
                                <Badge variant={
                                  alert.priority === 'critical' ? 'error' :
                                  alert.priority === 'high' ? 'warning' :
                                  alert.priority === 'medium' ? 'info' : 'neutral'
                                } size="sm">
                                  {alert.priority === 'critical' ? 'حرجة' :
                                   alert.priority === 'high' ? 'عالية' :
                                   alert.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                </Badge>
                                <span>•</span>
                                <span>{new Date(alert.createdAt).toLocaleDateString('ar-SA')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 space-x-reverse">
                            <button 
                              onClick={() => handleViewAlert(alert)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {!alert.isRead && (
                              <button 
                                onClick={() => handleMarkAlertAsRead(alert.id)}
                                className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                                title="وضع علامة كمقروء"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">لا توجد تنبيهات</p>
                    <p className="text-sm mt-2">ستظهر التنبيهات هنا عند وجود أحداث مهمة</p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Various Operations */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'add-member' ? 'إضافة فرد جديد للعائلة' :
            modalType === 'edit-member' ? 'تعديل بيانات فرد العائلة' :
            modalType === 'view-member' ? 'عرض تفاصيل فرد العائلة' :
            modalType === 'assign-package' ? 'تحديد طرد للتوزيع' :
            modalType === 'view-task' ? 'تفاصيل المهمة' :
            'تفاصيل التنبيه'
          }
          size="lg"
        >
          {/* Family Member Form */}
          {(modalType === 'add-member' || modalType === 'edit-member') && currentFamily && (
            <FamilyMemberForm
              familyId={currentFamily.id}
              member={modalType === 'edit-member' ? selectedItem : null}
              onSave={handleSaveMember}
              onCancel={handleCancelMember}
            />
          )}

          {/* View Family Member Details */}
          {modalType === 'view-member' && selectedItem && (
            <BeneficiaryProfileModal
              beneficiary={selectedItem}
              onClose={() => setShowModal(false)}
              onNavigateToIndividualSend={() => {}}
              onEditBeneficiary={handleEditMember}
            />
          )}

          {/* Package Assignment */}
          {modalType === 'assign-package' && (
            <div className="p-6">
              <div className="text-center py-8">
                <div className="bg-green-100 p-6 rounded-xl mb-4">
                  <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-gray-900 mb-2">تحديد طرد للتوزيع</h4>
                  <p className="text-gray-600">اختر نوع الطرد والمستفيد من العائلة</p>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اختيار المستفيد</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">اختر المستفيد...</option>
                      {familyMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} - {member.relationToFamily || 'فرد من العائلة'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطرد</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">اختر نوع الطرد...</option>
                      <option value="food">طرد غذائي</option>
                      <option value="clothing">طرد ملابس</option>
                      <option value="medical">طرد طبي</option>
                      <option value="hygiene">طرد نظافة</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3 space-x-reverse justify-center">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={() => {
                    setNotification({ message: 'تم تحديد الطرد بنجاح، سيتم إنشاء مهمة توزيع', type: 'success' });
                    setTimeout(() => setNotification(null), 3000);
                    setShowModal(false);
                  }}>
                    تحديد الطرد
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* View Task Details */}
          {modalType === 'view-task' && selectedItem && (
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">تفاصيل المهمة</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">المستفيد:</span>
                      <span className="font-medium text-blue-900 mr-2">
                        {mockBeneficiaries.find(b => b.id === selectedItem.beneficiaryId)?.name || 'غير محدد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">الطرد:</span>
                      <span className="font-medium text-blue-900 mr-2">
                        {mockPackages.find(p => p.id === selectedItem.packageId)?.name || 'غير محدد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">الحالة:</span>
                      <Badge variant={
                        selectedItem.status === 'delivered' ? 'success' :
                        selectedItem.status === 'failed' ? 'error' :
                        selectedItem.status === 'in_progress' ? 'warning' : 'info'
                      } size="sm" className="mr-2">
                        {getStatusText(selectedItem.status)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-blue-700">تاريخ الإنشاء:</span>
                      <span className="font-medium text-blue-900 mr-2">
                        {new Date(selectedItem.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedItem.courierNotes && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2">ملاحظات المندوب</h5>
                    <p className="text-sm text-green-700">{selectedItem.courierNotes}</p>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button variant="primary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* View Alert Details */}
          {modalType === 'view-alert' && selectedItem && (
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-3">تفاصيل التنبيه</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-orange-700">العنوان:</span>
                      <span className="font-medium text-orange-900 mr-2">{selectedItem.title}</span>
                    </div>
                    <div>
                      <span className="text-orange-700">الوصف:</span>
                      <p className="text-orange-900 mt-1">{selectedItem.description}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-orange-700">النوع:</span>
                        <Badge variant="warning" size="sm" className="mr-2">
                          {selectedItem.type === 'delayed' ? 'متأخر' :
                           selectedItem.type === 'failed' ? 'فشل' :
                           selectedItem.type === 'expired' ? 'منتهي الصلاحية' : 'عاجل'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-orange-700">الأولوية:</span>
                        <Badge variant={
                          selectedItem.priority === 'critical' ? 'error' :
                          selectedItem.priority === 'high' ? 'warning' : 'info'
                        } size="sm" className="mr-2">
                          {selectedItem.priority === 'critical' ? 'حرجة' :
                           selectedItem.priority === 'high' ? 'عالية' :
                           selectedItem.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-orange-700">تاريخ الإنشاء:</span>
                      <span className="font-medium text-orange-900 mr-2">
                        {new Date(selectedItem.createdAt).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                  {!selectedItem.isRead && (
                    <Button variant="success" onClick={() => {
                      handleMarkAlertAsRead(selectedItem.id);
                      setShowModal(false);
                    }}>
                      وضع علامة كمقروء
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}