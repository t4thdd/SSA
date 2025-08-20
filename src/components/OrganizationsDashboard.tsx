import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Users, Package, Truck, Bell, BarChart3, Settings, MapPin, Calendar, FileText, AlertTriangle, CheckCircle, Clock, Plus, Search, Filter, Download, Eye, Edit, Phone, Star, UserPlus, Heart, TrendingUp, Activity, Database, MessageSquare, UserCheck, Crown, Key, Lock, ChevronRight, RefreshCw, LogOut } from 'lucide-react';
import { mockBeneficiaries, mockPackages, mockOrganizations, mockFamilies, mockPackageTemplates, calculateStats, type Beneficiary, type Package as PackageType, type Organization, type Family, type PackageTemplate } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertsContext';
import { useErrorLogger } from '../utils/errorLogger';
import { Button, Card, Input, Badge, Modal, StatCard, ExportModal } from './ui';
import PackageTemplateForm from './PackageTemplateForm';
import BeneficiariesManagement from '../BeneficiariesManagement';
import SupabaseConnectionStatus from './SupabaseConnectionStatus';
import * as Sentry from '@sentry/react';

interface OrganizationsDashboardProps {
  onNavigateBack: () => void;
}

export default function OrganizationsDashboard({ onNavigateBack }: OrganizationsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageModalType, setPackageModalType] = useState<'add' | 'edit' | 'view' | 'copy'>('add');
  const [selectedPackageTemplate, setSelectedPackageTemplate] = useState<PackageTemplate | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [openMenus, setOpenMenus] = useState<string[]>(['beneficiaries', 'packages', 'reports']);

  const { loggedInUser } = useAuth();
  const { alerts } = useAlerts();
  const { logInfo, logError } = useErrorLogger();

  const organization = mockOrganizations.find(org => org.id === loggedInUser?.associatedId);
  const organizationBeneficiaries = mockBeneficiaries.filter(b => b.organizationId === loggedInUser?.associatedId);
  const organizationPackages = mockPackages.filter(p => p.organizationId === loggedInUser?.associatedId);
  const organizationTemplates = mockPackageTemplates.filter(t => t.organization_id === loggedInUser?.associatedId);

  const stats = {
    totalBeneficiaries: organizationBeneficiaries.length,
    totalPackages: organizationPackages.length,
    totalTemplates: organizationTemplates.length,
    deliveredPackages: organizationPackages.filter(p => p.status === 'delivered').length,
    pendingPackages: organizationPackages.filter(p => p.status === 'pending').length,
    activeTemplates: organizationTemplates.filter(t => t.status === 'active').length,
    deliveryRate: organizationPackages.length > 0 ? Math.round((organizationPackages.filter(p => p.status === 'delivered').length / organizationPackages.length) * 100) : 0
  };

  const sidebarItems = [
    {
      id: 'overview',
      name: 'نظرة عامة',
      icon: BarChart3,
      children: []
    },
    {
      id: 'beneficiaries',
      name: 'إدارة المستفيدين',
      icon: Users,
      children: [
        { id: 'beneficiaries-list', name: 'قائمة المستفيدين', icon: Users },
        { id: 'beneficiaries-add', name: 'إضافة مستفيد', icon: UserPlus },
        { id: 'beneficiaries-families', name: 'إدارة العائلات', icon: Heart },
        { id: 'beneficiaries-verification', name: 'التحقق من الهوية', icon: UserCheck }
      ]
    },
    {
      id: 'packages',
      name: 'إدارة الطرود',
      icon: Package,
      children: [
        { id: 'packages-list', name: 'قوالب الطرود', icon: Package },
        { id: 'packages-create', name: 'إنشاء طرد جديد', icon: Plus },
        { id: 'packages-tasks', name: 'مهام التوزيع', icon: Truck },
        { id: 'packages-analytics', name: 'تحليلات الطرود', icon: BarChart3 }
      ]
    },
    {
      id: 'reports',
      name: 'التقارير والإحصائيات',
      icon: FileText,
      children: [
        { id: 'reports-overview', name: 'نظرة عامة', icon: BarChart3 },
        { id: 'reports-beneficiaries', name: 'تقارير المستفيدين', icon: Users },
        { id: 'reports-packages', name: 'تقارير الطرود', icon: Package },
        { id: 'reports-performance', name: 'تقارير الأداء', icon: TrendingUp }
      ]
    },
    {
      id: 'settings',
      name: 'الإعدادات',
      icon: Settings,
      children: [
        { id: 'settings-organization', name: 'إعدادات المؤسسة', icon: Building2 },
        { id: 'settings-users', name: 'إدارة المستخدمين', icon: Users },
        { id: 'settings-notifications', name: 'إعدادات التنبيهات', icon: Bell },
        { id: 'settings-security', name: 'الأمان والخصوصية', icon: Lock }
      ]
    }
  ];

  // Package management functions
  const handleAddPackageTemplate = () => {
    setPackageModalType('add');
    setSelectedPackageTemplate(null);
    setShowPackageModal(true);
  };

  const handleEditPackageTemplate = (template: PackageTemplate) => {
    setPackageModalType('edit');
    setSelectedPackageTemplate(template);
    setShowPackageModal(true);
  };

  const handleViewPackageTemplate = (template: PackageTemplate) => {
    setPackageModalType('view');
    setSelectedPackageTemplate(template);
    setShowPackageModal(true);
  };

  const handleCopyPackageTemplate = (template: PackageTemplate) => {
    setPackageModalType('copy');
    setSelectedPackageTemplate(template);
    setShowPackageModal(true);
  };

  const handleSavePackageTemplate = async (data: Partial<PackageTemplate>) => {
    try {
      if (packageModalType === 'add' || packageModalType === 'copy') {
        const newTemplate: PackageTemplate = {
          id: `template-${Date.now()}`,
          name: data.name || '',
          type: data.type || 'food',
          organization_id: loggedInUser?.associatedId || '',
          description: data.description || '',
          contents: data.contents || [],
          status: 'draft',
          createdAt: new Date().toISOString(),
          usageCount: 0,
          totalWeight: data.totalWeight || 0,
          estimatedCost: data.estimatedCost || 0,
        };
        mockPackageTemplates.unshift(newTemplate);
        logInfo(`تم إضافة قالب طرد جديد: ${newTemplate.name}`, 'OrganizationsDashboard');
      } else if (packageModalType === 'edit' && selectedPackageTemplate) {
        const index = mockPackageTemplates.findIndex(t => t.id === selectedPackageTemplate.id);
        if (index !== -1) {
          mockPackageTemplates[index] = { ...mockPackageTemplates[index], ...data };
          logInfo(`تم تحديث قالب الطرد: ${data.name}`, 'OrganizationsDashboard');
        }
      }
      setShowPackageModal(false);
      setSelectedPackageTemplate(null);
    } catch (error) {
      logError(error as Error, 'OrganizationsDashboard');
    }
  };

  const handleDeletePackageTemplate = (template: PackageTemplate) => {
    if (confirm(`هل أنت متأكد من حذف القالب "${template.name}"؟`)) {
      const index = mockPackageTemplates.findIndex(t => t.id === template.id);
      if (index !== -1) {
        mockPackageTemplates.splice(index, 1);
        logInfo(`تم حذف قالب الطرد: ${template.name}`, 'OrganizationsDashboard');
      }
    }
  };

  const filteredPackageTemplates = organizationTemplates.filter(template =>
    template.name.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(packageSearchTerm.toLowerCase())
  );

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const getPageTitle = (tabId: string) => {
    const findInItems = (items: any[]): any => {
      for (const item of items) {
        if (item.id === tabId) return item;
        if (item.children) {
          const found = findInItems(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findInItems(sidebarItems) || { name: 'غير محدد', icon: FileText };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'food': return '🍚';
      case 'medical': return '💊';
      case 'clothing': return '👕';
      case 'hygiene': return '🧼';
      case 'emergency': return '🚨';
      default: return '📦';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'food': return 'bg-orange-100 text-orange-800';
      case 'medical': return 'bg-red-100 text-red-800';
      case 'clothing': return 'bg-purple-100 text-purple-800';
      case 'hygiene': return 'bg-blue-100 text-blue-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'draft': return 'مسودة';
      case 'inactive': return 'غير نشط';
      default: return 'غير محدد';
    }
  };

  const renderMainContent = () => {
    const pageInfo = getPageTitle(activeTab);
    const IconComponent = pageInfo.icon;

    // Overview Tab
    if (activeTab === 'overview') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">لوحة تحكم {organization?.name}</h2>
                <p className="text-gray-600 mt-1">نظرة عامة على أنشطة المؤسسة</p>
              </div>
            </div>
            <div className="flex space-x-3 space-x-reverse">
              <Button variant="secondary" icon={Download} iconPosition="right">
                تصدير التقرير
              </Button>
              <Button variant="primary" icon={RefreshCw} iconPosition="right">
                تحديث البيانات
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="إجمالي المستفيدين"
              value={stats.totalBeneficiaries}
              icon={Users}
              trend={{
                value: `${organizationBeneficiaries.filter(b => b.status === 'active').length} نشط`,
                direction: 'up',
                label: ''
              }}
              color="blue"
            />

            <StatCard
              title="إجمالي الطرود"
              value={stats.totalPackages}
              icon={Package}
              trend={{
                value: `${stats.deliveredPackages} مسلم`,
                direction: 'up',
                label: ''
              }}
              color="green"
            />

            <StatCard
              title="قوالب الطرود"
              value={stats.totalTemplates}
              icon={FileText}
              trend={{
                value: `${stats.activeTemplates} نشط`,
                direction: 'up',
                label: ''
              }}
              color="purple"
            />

            <StatCard
              title="معدل النجاح"
              value={`${stats.deliveryRate}%`}
              icon={TrendingUp}
              trend={{
                value: `${stats.pendingPackages} في الانتظار`,
                direction: 'neutral',
                label: ''
              }}
              color="orange"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card hover className="cursor-pointer" onClick={() => setActiveTab('beneficiaries-add')}>
              <div className="text-center p-6">
                <div className="bg-blue-100 p-4 rounded-xl mb-4">
                  <UserPlus className="w-8 h-8 text-blue-600 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">إضافة مستفيد جديد</h3>
                <p className="text-gray-600 text-sm">أضف مستفيد جديد لقاعدة بيانات المؤسسة</p>
              </div>
            </Card>

            <Card hover className="cursor-pointer" onClick={handleAddPackageTemplate}>
              <div className="text-center p-6">
                <div className="bg-green-100 p-4 rounded-xl mb-4">
                  <Package className="w-8 h-8 text-green-600 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">إنشاء قالب طرد</h3>
                <p className="text-gray-600 text-sm">إنشاء قالب طرد جديد للتوزيع</p>
              </div>
            </Card>

            <Card hover className="cursor-pointer" onClick={() => setActiveTab('reports-overview')}>
              <div className="text-center p-6">
                <div className="bg-purple-100 p-4 rounded-xl mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">عرض التقارير</h3>
                <p className="text-gray-600 text-sm">استعرض تقارير الأداء والإحصائيات</p>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">آخر الأنشطة</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 space-x-reverse p-3 bg-green-50 rounded-lg">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">تم تسليم طرد مواد غذائية</p>
                    <p className="text-xs text-gray-500 mt-1">منذ 5 دقائق</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-x-reverse p-3 bg-blue-50 rounded-lg">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <UserPlus className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">إضافة مستفيد جديد</p>
                    <p className="text-xs text-gray-500 mt-1">منذ 15 دقيقة</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-x-reverse p-3 bg-orange-50 rounded-lg">
                  <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">تحديث عنوان مستفيد</p>
                    <p className="text-xs text-gray-500 mt-1">منذ 30 دقيقة</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">التنبيهات المهمة</h3>
              <div className="space-y-3">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                      </div>
                    </div>
                    <Button variant="warning" size="sm">
                      متابعة
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Packages List Tab
    if (activeTab === 'packages-list') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">قوالب طرود المؤسسة</h2>
                <p className="text-gray-600 mt-1">إدارة قوالب الطرود الخاصة بـ {organization?.name}</p>
              </div>
            </div>
            <div className="flex space-x-3 space-x-reverse">
              <Button variant="success" icon={Download} iconPosition="right" onClick={() => setShowExportModal(true)}>
                تصدير القوالب
              </Button>
              <Button variant="primary" icon={Plus} iconPosition="right" onClick={handleAddPackageTemplate}>
                إضافة قالب جديد
              </Button>
            </div>
          </div>

          {/* Search */}
          <Card>
            <Input
              type="text"
              icon={Search}
              iconPosition="right"
              placeholder="البحث في قوالب الطرود..."
              value={packageSearchTerm}
              onChange={(e) => setPackageSearchTerm(e.target.value)}
            />
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="إجمالي القوالب"
              value={stats.totalTemplates}
              icon={Package}
              color="blue"
            />
            <StatCard
              title="قوالب نشطة"
              value={stats.activeTemplates}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="إجمالي الاستخدام"
              value={organizationTemplates.reduce((sum, t) => sum + t.usageCount, 0)}
              icon={TrendingUp}
              color="purple"
            />
            <StatCard
              title="متوسط التكلفة"
              value={`${organizationTemplates.length > 0 ? Math.round(organizationTemplates.reduce((sum, t) => sum + t.estimatedCost, 0) / organizationTemplates.length) : 0} ₪`}
              icon={Star}
              color="orange"
            />
          </div>

          {/* Templates Grid */}
          {filteredPackageTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackageTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="text-3xl">{getTypeIcon(template.type)}</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                        <Badge variant={
                          template.type === 'food' ? 'warning' :
                          template.type === 'medical' ? 'error' :
                          template.type === 'clothing' ? 'info' : 'neutral'
                        } size="sm">
                          {template.type === 'food' ? 'مواد غذائية' :
                           template.type === 'medical' ? 'طبية' :
                           template.type === 'clothing' ? 'ملابس' :
                           template.type === 'hygiene' ? 'نظافة' : 'طوارئ'}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={
                      template.status === 'active' ? 'success' :
                      template.status === 'draft' ? 'warning' : 'neutral'
                    } size="sm">
                      {getStatusText(template.status)}
                    </Badge>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>

                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <p className="text-lg font-bold text-blue-600">{template.contents.length}</p>
                      <p className="text-xs text-gray-600">عناصر</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{template.totalWeight?.toFixed(1) || 0}</p>
                      <p className="text-xs text-gray-600">كيلو</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">{template.estimatedCost}</p>
                      <p className="text-xs text-gray-600">شيكل</p>
                    </div>
                  </div>

                  {template.usageCount > 0 && (
                    <div className="flex items-center space-x-2 space-x-reverse mb-4 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>استُخدم {template.usageCount} مرة</span>
                    </div>
                  )}

                  <div className="flex space-x-2 space-x-reverse">
                    <Button variant="secondary" size="sm" onClick={() => handleViewPackageTemplate(template)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleEditPackageTemplate(template)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleCopyPackageTemplate(template)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeletePackageTemplate(template)}>
                      <AlertTriangle className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">
                  {packageSearchTerm ? 'لا توجد قوالب مطابقة للبحث' : 'لا توجد قوالب طرود'}
                </p>
                <p className="text-sm mt-2">
                  {packageSearchTerm ? 'جرب تعديل مصطلح البحث' : 'ابدأ بإضافة قالب طرد جديد'}
                </p>
                <Button variant="primary" icon={Plus} onClick={handleAddPackageTemplate} className="mt-4">
                  إضافة قالب جديد
                </Button>
              </div>
            </Card>
          )}
        </div>
      );
    }

    // Packages Create Tab
    if (activeTab === 'packages-create') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">إنشاء طرد جديد</h2>
              <p className="text-gray-600 mt-1">إنشاء طرد جديد للتوزيع من قوالب {organization?.name}</p>
            </div>
          </div>

          <Card>
            <div className="text-center py-12">
              <div className="bg-green-100 p-6 rounded-xl mb-6">
                <Plus className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">إنشاء طرد جديد</h3>
                <p className="text-gray-600">سيتم تطوير نموذج إنشاء الطرود هنا</p>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">الميزات المخططة:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• اختيار قالب من قوالب المؤسسة</li>
                  <li>• تخصيص محتويات الطرد</li>
                  <li>• تحديد المستفيدين المستهدفين</li>
                  <li>• جدولة التوزيع</li>
                </ul>
              </div>
              
              <Button variant="primary" className="mt-6">
                ابدأ التطوير
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    // Packages Tracking Tab
    if (activeTab === 'packages-tracking') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">تتبع طرود المؤسسة</h2>
              <p className="text-gray-600 mt-1">متابعة حالة طرود {organization?.name}</p>
            </div>
          </div>

          {/* Organization Packages Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="إجمالي الطرود"
              value={stats.totalPackages}
              icon={Package}
              color="blue"
            />
            <StatCard
              title="تم التسليم"
              value={stats.deliveredPackages}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="قيد التوصيل"
              value={stats.pendingPackages}
              icon={Clock}
              color="orange"
            />
            <StatCard
              title="نسبة النجاح"
              value={`${stats.deliveryRate}%`}
              icon={TrendingUp}
              color="purple"
            />
          </div>

          {/* Packages Table */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">طرود المؤسسة ({organizationPackages.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الطرد
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستفيد
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizationPackages.length > 0 ? (
                    organizationPackages.map((pkg) => {
                      const beneficiary = mockBeneficiaries.find(b => b.id === pkg.beneficiaryId);
                      return (
                        <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-green-100 p-2 rounded-lg ml-4">
                                <Package className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                                <div className="text-sm text-gray-500">{pkg.type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {beneficiary?.name || 'غير محدد'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              pkg.status === 'delivered' ? 'success' :
                              pkg.status === 'pending' ? 'warning' :
                              pkg.status === 'in_delivery' ? 'info' : 'neutral'
                            } size="sm">
                              {pkg.status === 'delivered' ? 'تم التسليم' :
                               pkg.status === 'pending' ? 'في الانتظار' :
                               pkg.status === 'in_delivery' ? 'قيد التوصيل' : 'فشل'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(pkg.createdAt).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2 space-x-reverse">
                              <Button variant="secondary" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="secondary" size="sm">
                                <Truck className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">لا توجد طرود للمؤسسة</p>
                          <p className="text-sm mt-2">ابدأ بإنشاء طرد جديد</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      );
    }

    // Packages Analytics Tab
    if (activeTab === 'packages-analytics') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">تحليلات طرود المؤسسة</h2>
              <p className="text-gray-600 mt-1">تحليل مفصل لأداء طرود {organization?.name}</p>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <Package className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-blue-600">معدل الاستخدام</p>
                <p className="text-2xl font-bold text-blue-900">
                  {organizationTemplates.length > 0 ? 
                    Math.round(organizationTemplates.reduce((sum, t) => sum + t.usageCount, 0) / organizationTemplates.length) : 0}
                </p>
              </div>
            </Card>

            <Card className="bg-green-50">
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-green-600">كفاءة التوزيع</p>
                <p className="text-2xl font-bold text-green-900">{stats.deliveryRate}%</p>
              </div>
            </Card>

            <Card className="bg-orange-50">
              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <Clock className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-orange-600">متوسط وقت التحضير</p>
                <p className="text-2xl font-bold text-orange-900">2.5 ساعة</p>
              </div>
            </Card>

            <Card className="bg-purple-50">
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <Star className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-purple-600">تقييم المستفيدين</p>
                <p className="text-2xl font-bold text-purple-900">4.8/5</p>
              </div>
            </Card>
          </div>

          {/* Template Performance */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">أداء القوالب</h3>
            <div className="space-y-4">
              {organizationTemplates.slice(0, 5).map((template) => {
                const usagePercentage = organizationTemplates.length > 0 ? 
                  (template.usageCount / Math.max(...organizationTemplates.map(t => t.usageCount))) * 100 : 0;
                
                return (
                  <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="text-2xl">{getTypeIcon(template.type)}</div>
                      <div>
                        <p className="font-medium text-gray-900">{template.name}</p>
                        <p className="text-sm text-gray-600">{template.contents.length} عناصر</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{template.usageCount}</p>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${usagePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      );
    }

    // Organization Tasks Management Tab
    if (activeTab === 'packages-tasks') {
      const organizationTasks = mockTasks.filter(task => {
        const packageInfo = mockPackages.find(p => p.id === task.packageId);
        return packageInfo?.organizationId === loggedInUser?.associatedId;
      });

      const taskStats = {
        total: organizationTasks.length,
        pending: organizationTasks.filter(t => t.status === 'pending').length,
        assigned: organizationTasks.filter(t => t.status === 'assigned').length,
        inProgress: organizationTasks.filter(t => t.status === 'in_progress').length,
        delivered: organizationTasks.filter(t => t.status === 'delivered').length,
        failed: organizationTasks.filter(t => t.status === 'failed').length
      };

      const getTaskStatusColor = (status: string) => {
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

      const getTaskStatusText = (status: string) => {
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

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">مهام توزيع المؤسسة</h2>
                <p className="text-gray-600 mt-1">متابعة مهام التوزيع الخاصة بـ {organization?.name}</p>
              </div>
            </div>
            <div className="flex space-x-3 space-x-reverse">
              <Button variant="success" icon={Download} iconPosition="right">
                تصدير المهام
              </Button>
              <Button variant="primary" icon={RefreshCw} iconPosition="right">
                تحديث البيانات
              </Button>
            </div>
          </div>

          {/* Task Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-gray-50">
              <div className="text-center">
                <div className="bg-gray-100 p-3 rounded-xl mb-2">
                  <Activity className="w-6 h-6 text-gray-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">إجمالي المهام</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
              </div>
            </Card>

            <Card className="bg-blue-50">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <Clock className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-blue-600">في الانتظار</p>
                <p className="text-2xl font-bold text-blue-900">{taskStats.pending}</p>
              </div>
            </Card>

            <Card className="bg-orange-50">
              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <Truck className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-orange-600">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-orange-900">{taskStats.inProgress}</p>
              </div>
            </Card>

            <Card className="bg-green-50">
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-green-600">تم التسليم</p>
                <p className="text-2xl font-bold text-green-900">{taskStats.delivered}</p>
              </div>
            </Card>

            <Card className="bg-red-50">
              <div className="text-center">
                <div className="bg-red-100 p-3 rounded-xl mb-2">
                  <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
                </div>
                <p className="text-sm text-red-600">فشل</p>
                <p className="text-2xl font-bold text-red-900">{taskStats.failed}</p>
              </div>
            </Card>

            <Card className="bg-purple-50">
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <Star className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-purple-600">معدل النجاح</p>
                <p className="text-2xl font-bold text-purple-900">
                  {organizationTasks.length > 0 ? Math.round((taskStats.delivered / organizationTasks.length) * 100) : 0}%
                </p>
              </div>
            </Card>
          </div>

          {/* Active Tasks Overview */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">المهام النشطة</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {organizationTasks.filter(t => ['pending', 'assigned', 'in_progress'].includes(t.status)).slice(0, 10).map((task) => {
                  const beneficiary = mockBeneficiaries.find(b => b.id === task.beneficiaryId);
                  const packageInfo = mockPackages.find(p => p.id === task.packageId);
                  const courier = task.courierId ? mockCouriers.find(c => c.id === task.courierId) : null;

                  return (
                    <div key={task.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
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
                          {getTaskStatusText(task.status)}
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
                        <Button variant="secondary" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="secondary" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        {courier && (
                          <Button variant="secondary" size="sm">
                            <Phone className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">أداء المندوبين</h3>
              <div className="space-y-4">
                {mockCouriers.slice(0, 5).map((courier) => {
                  const courierTasks = organizationTasks.filter(t => t.courierId === courier.id);
                  const completedTasks = courierTasks.filter(t => t.status === 'delivered').length;
                  const successRate = courierTasks.length > 0 ? (completedTasks / courierTasks.length * 100) : 0;

                  return (
                    <div key={courier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Truck className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{courier.name}</p>
                          <p className="text-sm text-gray-600">{courierTasks.length} مهمة</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 space-x-reverse mb-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-gray-900">{courier.rating}</span>
                        </div>
                        <div className="text-sm text-green-600 font-medium">{successRate.toFixed(1)}%</div>
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
              <h3 className="text-lg font-semibold text-gray-900">تفاصيل مهام المؤسسة ({organizationTasks.length})</h3>
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
                  {organizationTasks.length > 0 ? (
                    organizationTasks.map((task) => {
                      const beneficiary = mockBeneficiaries.find(b => b.id === task.beneficiaryId);
                      const packageInfo = mockPackages.find(p => p.id === task.packageId);
                      const courier = task.courierId ? mockCouriers.find(c => c.id === task.courierId) : null;

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
                              {getTaskStatusText(task.status)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {task.scheduledAt ? new Date(task.scheduledAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2 space-x-reverse">
                              <Button variant="secondary" size="sm" title="عرض التفاصيل">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="secondary" size="sm" title="تحديث الحالة">
                                <Edit className="w-4 h-4" />
                              </Button>
                              {courier && (
                                <Button variant="secondary" size="sm" title="اتصال بالمندوب">
                                  <Phone className="w-4 h-4" />
                                </Button>
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
                          <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">لا توجد مهام للمؤسسة</p>
                          <p className="text-sm mt-2">ابدأ بإنشاء طرود جديدة لإنشاء مهام التوزيع</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Performance Insights */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">رؤى الأداء</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                  نقاط القوة
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-green-700 bg-green-50 p-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>معدل تسليم عالي ({Math.round((taskStats.delivered / Math.max(organizationTasks.length, 1)) * 100)}%)</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-green-700 bg-green-50 p-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>تنوع في أنواع الطرود المقدمة</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-green-700 bg-green-50 p-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>تغطية جغرافية جيدة</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <AlertTriangle className="w-4 h-4 ml-2 text-orange-600" />
                  مجالات التحسين
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-orange-700 bg-orange-50 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span>تقليل وقت الاستجابة للطلبات العاجلة</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-orange-700 bg-orange-50 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span>تحسين التنسيق مع المندوبين</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-orange-700 bg-orange-50 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span>زيادة عدد المندوبين في المناطق النائية</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }
    // Other tabs placeholder
    return (
      <Card className="p-12">
        <div className="text-center text-gray-500">
          <IconComponent className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">{pageInfo.name}</p>
          <p className="text-sm mt-2">هذا القسم قيد التطوير</p>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/30 flex" dir="rtl">
      {/* Sidebar */}
      <div className="w-80 bg-white flex flex-col border-l border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onNavigateBack}
              className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">العودة للوحة الرئيسية</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{organization?.name}</h1>
              <p className="text-sm text-gray-500">لوحة تحكم المؤسسة</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id || item.children?.some(child => child.id === activeTab);
              const isOpen = openMenus.includes(item.id);
              
              return (
                <li key={item.id}>
                  <div>
                    <button
                      onClick={() => {
                        if (item.children && item.children.length > 0) {
                          toggleMenu(item.id);
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <IconComponent className={`w-4 h-4 ${isActive ? 'text-green-600' : ''}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.children && item.children.length > 0 && (
                        <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      )}
                    </button>
                    
                    {item.children && item.children.length > 0 && isOpen && (
                      <ul className="mt-2 mr-4 space-y-1">
                        {item.children.map((child) => {
                          const ChildIconComponent = child.icon;
                          const isChildActive = activeTab === child.id;
                          
                          return (
                            <li key={child.id}>
                              <button
                                onClick={() => setActiveTab(child.id)}
                                className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-2 rounded-lg text-sm transition-colors ${
                                  isChildActive
                                    ? 'bg-green-100 text-green-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                              >
                                <ChildIconComponent className={`w-3 h-3 ${isChildActive ? 'text-green-600' : ''}`} />
                                <span>{child.name}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <SupabaseConnectionStatus />
          <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="text-sm font-medium text-green-800 mb-2">إحصائيات سريعة</div>
            <div className="space-y-1 text-xs text-green-700">
              <div className="flex justify-between">
                <span>المستفيدين:</span>
                <span className="font-medium">{stats.totalBeneficiaries}</span>
              </div>
              <div className="flex justify-between">
                <span>الطرود:</span>
                <span className="font-medium">{stats.totalPackages}</span>
              </div>
              <div className="flex justify-between">
                <span>القوالب:</span>
                <span className="font-medium">{stats.totalTemplates}</span>
              </div>
              <div className="flex justify-between">
                <span>معدل النجاح:</span>
                <span className="font-medium">{stats.deliveryRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {renderMainContent()}
        </main>
      </div>

      {/* Package Template Modal */}
      {showPackageModal && (
        <Modal
          isOpen={showPackageModal}
          onClose={() => setShowPackageModal(false)}
          title={
            packageModalType === 'add' ? 'إضافة قالب طرد جديد' :
            packageModalType === 'edit' ? 'تعديل قالب الطرد' :
            packageModalType === 'copy' ? 'نسخ قالب الطرد' :
            'عرض تفاصيل القالب'
          }
          size="xl"
        >
          {(packageModalType === 'add' || packageModalType === 'edit' || packageModalType === 'copy') ? (
            <PackageTemplateForm
              template={packageModalType === 'add' ? null : selectedPackageTemplate}
              onSave={handleSavePackageTemplate}
              onCancel={() => setShowPackageModal(false)}
              isCopy={packageModalType === 'copy'}
            />
          ) : (
            selectedPackageTemplate && (
              <div className="p-6 space-y-6">
                {/* Template Details */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">معلومات القالب</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">اسم القالب:</span>
                          <span className="font-medium text-gray-900">{selectedPackageTemplate.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">النوع:</span>
                          <Badge variant={
                            selectedPackageTemplate.type === 'food' ? 'warning' :
                            selectedPackageTemplate.type === 'medical' ? 'error' : 'info'
                          } size="sm">
                            {selectedPackageTemplate.type === 'food' ? 'مواد غذائية' :
                             selectedPackageTemplate.type === 'medical' ? 'طبية' :
                             selectedPackageTemplate.type === 'clothing' ? 'ملابس' :
                             selectedPackageTemplate.type === 'hygiene' ? 'نظافة' : 'طوارئ'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">الحالة:</span>
                          <Badge variant={
                            selectedPackageTemplate.status === 'active' ? 'success' :
                            selectedPackageTemplate.status === 'draft' ? 'warning' : 'neutral'
                          } size="sm">
                            {getStatusText(selectedPackageTemplate.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">إحصائيات الاستخدام</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">عدد مرات الاستخدام:</span>
                          <span className="font-medium text-gray-900">{selectedPackageTemplate.usageCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">الوزن الإجمالي:</span>
                          <span className="font-medium text-gray-900">{selectedPackageTemplate.totalWeight?.toFixed(1) || 0} كيلو</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">التكلفة المقدرة:</span>
                          <span className="font-medium text-green-600">{selectedPackageTemplate.estimatedCost} ₪</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template Contents */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">محتويات الطرد</h4>
                  <div className="space-y-3">
                    {selectedPackageTemplate.contents?.map((item, index) => (
                      <div key={item.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.notes && (
                              <p className="text-xs text-gray-500">{item.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{item.quantity} {item.unit}</p>
                          {item.weight && (
                            <p className="text-xs text-gray-500">{item.weight} كيلو</p>
                          )}
                        </div>
                      </div>
                    )) || []}
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end">
                  <Button variant="secondary" onClick={() => setShowPackageModal(false)}>
                    إغلاق
                  </Button>
                  <Button variant="primary" onClick={() => {
                    setPackageModalType('edit');
                  }}>
                    تعديل القالب
                  </Button>
                </div>
              </div>
            )
          )}
        </Modal>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          data={filteredPackageTemplates}
          title="قوالب طرود المؤسسة"
          defaultFilename={`قوالب_${organization?.name}_${new Date().toISOString().split('T')[0]}`}
          availableFields={[
            { key: 'name', label: 'اسم القالب' },
            { key: 'type', label: 'النوع' },
            { key: 'description', label: 'الوصف' },
            { key: 'status', label: 'الحالة' },
            { key: 'usageCount', label: 'عدد مرات الاستخدام' },
            { key: 'totalWeight', label: 'الوزن الإجمالي' },
            { key: 'estimatedCost', label: 'التكلفة المقدرة' },
            { key: 'createdAt', label: 'تاريخ الإنشاء' }
          ]}
        />
      )}
    </div>
  );
}