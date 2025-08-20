import React, { useState } from 'react';
import { useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary'; // Assuming ErrorBoundary is correctly imported
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertsContext';
import { useErrorLogger } from '../utils/errorLogger';
import { statisticsService, alertsService } from '../services/supabaseService';
import { Shield, Users, Package, Truck, Bell, BarChart3, Settings, MapPin, Calendar, FileText, AlertTriangle, CheckCircle, Clock, Plus, Search, Filter, Download, Eye, Edit, Phone, Star, UserPlus, Building2, Heart, TrendingUp, Activity, Database, MessageSquare, UserCheck, Crown, Key, Lock, ChevronRight, RefreshCw, LogOut, ClipboardList, XCircle } from 'lucide-react';
import { mockBeneficiaries, mockPackages, calculateStats, mockOrganizations, mockFamilies, mockDistributionRequests, getPendingDistributionRequests, type DistributionRequest } from '../data/mockData';
import PermissionsManagement from './PermissionsManagement';
import { Button, Card, StatCard, Badge, Input } from './ui';

// Import new page components
import BeneficiariesListPage from './pages/BeneficiariesListPage';
import { StatusManagementPage } from './pages/StatusManagementPage';
import { DelayedBeneficiariesPage } from './pages/DelayedBeneficiariesPage';
import ActivityLogPage from './pages/ActivityLogPage';
import PackageListPage from './pages/PackageListPage';
import BulkSendPage from './pages/BulkSendPage';
import IndividualSendPage from './pages/IndividualSendPage';
import TrackingPage from './pages/TrackingPage';
import DistributionReportsPage from './pages/DistributionReportsPage';
import OrganizationsListPage from './pages/OrganizationsListPage';
import TestSupabasePage from './pages/TestSupabasePage';
import TasksManagementPage from './pages/TasksManagementPage';
import ComprehensiveReportsPage from './pages/ComprehensiveReportsPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import AlertsManagementPage from './pages/AlertsManagementPage';
import CouriersManagementPage from './pages/CouriersManagementPage';
import BackupManagementPage from './pages/BackupManagementPage';
import FamiliesDashboard from './FamiliesDashboard';
import MessagesSettingsPage from './pages/MessagesSettingsPage';
import GazaMap, { type MapPoint } from './GazaMap';
import DistributionRequestReview from './DistributionRequestReview';

interface NavItem {
  id: string;
  name: string;
  icon: any;
  children?: NavItem[];
}

interface AdminDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminDashboard({ activeTab, setActiveTab }: AdminDashboardProps) {
  const { loggedInUser, logout } = useAuth();
  const { alerts, criticalAlerts, unreadAlerts } = useAlerts();
  const { logInfo, logError } = useErrorLogger();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [openMenus, setOpenMenus] = useState<string[]>(['beneficiaries', 'packages', 'organizations-families', 'distribution', 'reports-alerts', 'settings', 'development']);
  const [beneficiaryIdForIndividualSend, setBeneficiaryIdForIndividualSend] = useState<string | null>(null);
  const [selectedDistributionRequest, setSelectedDistributionRequest] = useState<DistributionRequest | null>(null);
  const [showDistributionReview, setShowDistributionReview] = useState(false);

  // State for Supabase data
  const [stats, setStats] = useState<any>(calculateStats());
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [selectedBeneficiaryForMap, setSelectedBeneficiaryForMap] = useState<any>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const pendingRequests = getPendingDistributionRequests();

  // Fetch data from Supabase
  useEffect(() => {
    setStats(calculateStats());
    logInfo('تم تحميل البيانات الوهمية بنجاح', 'AdminDashboard');
  }, [logInfo]);

  const handleNavigateToIndividualSend = (beneficiaryId: string) => {
    setBeneficiaryIdForIndividualSend(beneficiaryId);
    setActiveTab('individual-send');
  };

  const handleReviewDistributionRequest = (request: DistributionRequest) => {
    setSelectedDistributionRequest(request);
    setShowDistributionReview(true);
  };

  const handleApproveDistributionRequest = (requestId: string, approvedQuantity: number, courierId: string, adminNotes?: string) => {
    // محاكاة الموافقة على طلب التوزيع
    const requestIndex = mockDistributionRequests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
      mockDistributionRequests[requestIndex] = {
        ...mockDistributionRequests[requestIndex],
        status: 'approved',
        approvedQuantity,
        assignedCourierId: courierId,
        adminNotes,
        approvedBy: loggedInUser?.id || 'admin',
        approvalDate: new Date().toISOString()
      };

      // محاكاة إنشاء مهام التسليم
      const newTaskIds: string[] = [];
      for (let i = 0; i < approvedQuantity; i++) {
        const taskId = `task-${Date.now()}-${i}`;
        newTaskIds.push(taskId);
        // في التطبيق الحقيقي، سيتم إنشاء مهام فعلية هنا
      }
      
      mockDistributionRequests[requestIndex].generatedTaskIds = newTaskIds;
      
      alert(`تمت الموافقة على الطلب وتم إنشاء ${approvedQuantity} مهمة تسليم`);
      setShowDistributionReview(false);
      setSelectedDistributionRequest(null);
    }
  };

  const handleRejectDistributionRequest = (requestId: string, rejectionReason: string) => {
    // محاكاة رفض طلب التوزيع
    const requestIndex = mockDistributionRequests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
      mockDistributionRequests[requestIndex] = {
        ...mockDistributionRequests[requestIndex],
        status: 'rejected',
        rejectionReason,
        approvedBy: loggedInUser?.id || 'admin',
        approvalDate: new Date().toISOString()
      };
      
      alert(`تم رفض الطلب: ${rejectionReason}`);
      setShowDistributionReview(false);
      setSelectedDistributionRequest(null);
    }
  };

  // تحويل بيانات المستفيدين إلى نقاط خريطة
  const convertBeneficiariesToMapPoints = (): MapPoint[] => {
    return mockBeneficiaries.map(beneficiary => {
      // تحديد حالة النقطة بناءً على حالة المستفيد
      let status: 'delivered' | 'problem' | 'rescheduled' | 'pending' = 'pending';
      
      if (beneficiary.status === 'active' && beneficiary.identityStatus === 'verified') {
        status = 'delivered';
      } else if (beneficiary.status === 'suspended' || beneficiary.identityStatus === 'rejected') {
        status = 'problem';
      } else if (beneficiary.eligibilityStatus === 'under_review') {
        status = 'rescheduled';
      }

      return {
        id: beneficiary.id,
        lat: beneficiary.location.lat,
        lng: beneficiary.location.lng,
        status,
        title: beneficiary.name,
        description: `${beneficiary.detailedAddress.district} - ${beneficiary.phone}`,
        data: beneficiary
      };
    });
  };

  const handleMapPointClick = (beneficiary: any) => {
    setSelectedBeneficiaryForMap(beneficiary);
    setShowMapModal(true);
  };

  // Navigation structure with hierarchical organization
  const navItems: NavItem[] = [
    {
      id: 'overview',
      name: 'نظرة عامة',
      icon: BarChart3
    },
    {
      id: 'beneficiaries',
      name: 'إدارة المستفيدين',
      icon: Users,
      children: [
        { id: 'beneficiaries-list', name: 'قائمة المستفيدين', icon: Users },
        { id: 'status-management', name: 'إدارة الحالات', icon: UserCheck },
        { id: 'delayed', name: 'المتأخرين', icon: Clock },
        { id: 'activity-log', name: 'سجل النشاط', icon: Activity }
      ]
    },
    {
      id: 'packages',
      name: 'إدارة الطرود',
      icon: Package,
      children: [
        { id: 'packages-list', name: 'قوالب الطرود', icon: Package },
        { id: 'bulk-send', name: 'إرسال جماعي', icon: Users },
        { id: 'individual-send', name: 'إرسال فردي', icon: UserPlus },
        { id: 'tracking', name: 'تتبع الإرسالات', icon: Truck },
        { id: 'distribution-requests', name: 'طلبات التوزيع', icon: ClipboardList },
        { id: 'distribution-reports', name: 'تقارير التوزيع', icon: BarChart3 }
      ]
    },
    {
      id: 'organizations-families',
      name: 'إدارة الشركاء',
      icon: Building2,
      children: [
        { id: 'organizations', name: 'إدارة المؤسسات', icon: Building2 },
        { id: 'families', name: 'إدارة العائلات', icon: Heart }
      ]
    },
    {
      id: 'distribution',
      name: 'إدارة التوزيع',
      icon: Truck,
      children: [
        { id: 'couriers', name: 'إدارة المندوبين', icon: Truck },
        { id: 'tasks', name: 'إدارة المهام', icon: Clock }
      ]
    },
    {
      id: 'reports-alerts',
      name: 'التقارير والتنبيهات',
      icon: BarChart3,
      children: [
        { id: 'reports', name: 'التقارير الشاملة', icon: BarChart3 },
        { id: 'alerts', name: 'التنبيهات', icon: Bell }
      ]
    },
    {
      id: 'settings',
      name: 'الإعدادات',
      icon: Settings,
      children: [
        { id: 'permissions', name: 'إدارة الصلاحيات', icon: Shield },
        { id: 'messages', name: 'إعدادات الرسائل', icon: MessageSquare },
        { id: 'system', name: 'إعدادات النظام', icon: Settings },
        { id: 'backup', name: 'النسخ الاحتياطي', icon: Database },
        { id: 'audit', name: 'سجل المراجعة', icon: Activity }
      ]
    },
    {
      id: 'development',
      name: 'أدوات التطوير',
      icon: Settings,
      children: [
        { id: 'test-supabase', name: 'اختبار Supabase', icon: Database }
      ]
    }
  ];

  const settingsItems = [
    { id: 'permissions', name: 'إدارة الصلاحيات', icon: Shield, description: 'إدارة أدوار المستخدمين وصلاحياتهم' },
    { id: 'messages', name: 'إعدادات الرسائل', icon: MessageSquare, description: 'إدارة قوالب الرسائل والتنبيهات' },
    { id: 'system', name: 'إعدادات النظام', icon: Settings, description: 'الإعدادات العامة للنظام' },
    { id: 'backup', name: 'النسخ الاحتياطي', icon: Database, description: 'إدارة النسخ الاحتياطية للبيانات' },
    { id: 'audit', name: 'سجل المراجعة', icon: Activity, description: 'سجل جميع العمليات في النظام' }
  ];

  React.useEffect(() => {
    logInfo('تم تحميل لوحة التحكم الرئيسية', 'AdminDashboard');
  }, []);

  // Initialize open menus based on active tab
  React.useEffect(() => {
    const findParentMenu = (tabId: string): string | null => {
      for (const item of navItems) {
        if (item.children) {
          for (const child of item.children) {
            if (child.id === tabId) {
              return item.id;
            }
          }
        }
      }
      return null;
    };

    const parentMenu = findParentMenu(activeTab);
    if (parentMenu && !openMenus.includes(parentMenu)) {
      setOpenMenus(prev => [...prev, parentMenu]);
    }
  }, [activeTab]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuActive = (item: NavItem): boolean => {
    if (item.id === activeTab) return true;
    if (item.children) {
      return item.children.some(child => child.id === activeTab);
    }
    return false;
  };

  const handleAddNew = (type: string) => {
    setModalType('add');
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setModalType('edit');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleView = (item: any) => {
    setModalType('view');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCall = (phone: string) => {
    if (confirm(`هل تريد الاتصال بالرقم ${phone}؟`)) {
      window.open(`tel:${phone}`);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      date: new Date().toISOString(),
      stats,
      beneficiaries: mockBeneficiaries.length,
      packages: mockPackages.length,
      alerts: unreadAlerts.length
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_النظام_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('تم تصدير تقرير النظام بنجاح');
  };

  const getPageTitle = (tabId: string) => {
    for (const item of navItems) {
      if (item.id === tabId) {
        return { name: item.name, icon: item.icon, description: '' };
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.id === tabId) {
            return { 
              name: child.name, 
              icon: child.icon, 
              description: getPageDescription(child.id)
            };
          }
        }
      }
    }
    return { name: 'غير محدد', icon: FileText, description: '' };
  };

  const getPageDescription = (tabId: string) => {
    const descriptions: { [key: string]: string } = {
      'overview': 'نظرة شاملة على النظام والأنشطة',
      'beneficiaries-list': 'إدارة جميع المستفيدين المسجلين في النظام',
      'status-management': 'تصنيف وإدارة حالات الأهلية للمستفيدين',
      'delayed': 'المستفيدين الذين لم يستلموا طرودهم في الوقت المحدد',
      'activity-log': 'سجل جميع الأنشطة والعمليات في النظام',
      'packages-list': 'إنشاء وإدارة قوالب الطرود وعمليات التوزيع',
      'bulk-send': 'إرسال طرود متعددة للمستفيدين',
      'individual-send': 'إرسال طرد لمستفيد واحد',
      'tracking': 'تتبع حالة الطرود والإرسالات',
      'distribution-reports': 'تقارير مفصلة عن عمليات التوزيع',
      'organizations': 'إدارة المؤسسات الخيرية والإنسانية',
      'families': 'إدارة العائلات والمبادرين الفرديين',
      'tasks': 'إدارة مهام التوزيع والمتابعة',
      'reports': 'تقارير شاملة وإحصائيات مفصلة',
      'alerts': 'التنبيهات والإشعارات المهمة',
      'couriers': 'إدارة المندوبين ومتابعة أدائهم',
      'permissions': 'إدارة أدوار المستخدمين وصلاحياتهم',
      'messages': 'إدارة قوالب الرسائل والتنبيهات',
      'system': 'الإعدادات العامة للنظام',
      'backup': 'إدارة النسخ الاحتياطية للبيانات',
      'audit': 'سجل جميع العمليات في النظام'
    };
    return descriptions[tabId] || '';
  };

  const renderMainContent = () => {
    const pageInfo = getPageTitle(activeTab);
    const IconComponent = pageInfo.icon;

    // Show permissions management component
    if (activeTab === 'permissions') {
      return <PermissionsManagement />;
    }

    // Beneficiaries pages
    if (activeTab === 'beneficiaries-list') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <BeneficiariesListPage 
            onNavigateToIndividualSend={handleNavigateToIndividualSend}
          />
        </div>
      );
    }

    if (activeTab === 'status-management') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <StatusManagementPage />
        </div>
      );
    }

    if (activeTab === 'delayed') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <DelayedBeneficiariesPage />
        </div>
      );
    }

    if (activeTab === 'activity-log') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <ActivityLogPage />
        </div>
      );
    }

    // Package pages
    if (activeTab === 'packages-list') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <PackageListPage 
            key={`packages-${Date.now()}`} 
          />
        </div>
      );
    }

    if (activeTab === 'bulk-send') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <BulkSendPage />
        </div>
      );
    }

    if (activeTab === 'individual-send') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <IndividualSendPage
            beneficiaryIdToPreselect={beneficiaryIdForIndividualSend}
            onBeneficiaryPreselected={() => setBeneficiaryIdForIndividualSend(null)} 
          />
        </div>
      );
    }

    if (activeTab === 'tracking') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <TrackingPage />
        </div>
      );
    }

    if (activeTab === 'distribution-requests') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <DistributionRequestsManagementPage 
            onReviewRequest={handleReviewDistributionRequest}
          />
        </div>
      );
    }

    if (activeTab === 'distribution-reports') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <DistributionReportsPage />
        </div>
      );
    }

    if (activeTab === 'organizations') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <OrganizationsListPage 
            highlightOrganizationId={loggedInUser?.associatedType === 'organization' ? loggedInUser.associatedId : undefined}
          />
        </div>
      );
    }

    if (activeTab === 'tasks') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <TasksManagementPage />
        </div>
      );
    }

    if (activeTab === 'families') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <FamiliesDashboard onNavigateBack={() => {}} />
        </div>
      );
    }

    if (activeTab === 'couriers') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <CouriersManagementPage />
        </div>
      );
    }

    // Test Supabase page
    if (activeTab === 'test-supabase') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">اختبار الاتصال وجلب البيانات من Supabase</p>
            </div>
          </div>
          <TestSupabasePage />
        </div>
      );
    }

    // Overview Tab
    if (activeTab === 'overview') {
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
                <p className="text-gray-600 mt-1">{pageInfo.description}</p>
              </div>
            </div>
            <div className="flex space-x-3 space-x-reverse">
              <button 
                onClick={handleExportReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير التقرير
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                تحديث البيانات
              </button>
            </div>
          </div>

          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <Card className="bg-red-50 border-red-200">
              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-800">تنبيهات حرجة تحتاج إجراء فوري</h3>
              </div>
              <div className="space-y-3">
                {criticalAlerts.slice(0, 3).map((alert) => (
                  <Card key={alert.id} className="bg-white border-red-200" padding="sm">
                    <div>
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                    <Button variant="danger" size="sm">
                      اتخاذ إجراء
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading ? (
              <Card className="col-span-4">
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 ml-3" />
                  <span className="text-gray-600">جاري تحميل الإحصائيات من Supabase...</span>
                </div>
              </Card>
            ) : statsError ? (
              <Card className="bg-red-50 border-red-200 col-span-4" padding="sm">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <span className="text-red-800 font-medium">خطأ في تحميل الإحصائيات</span>
                    <p className="text-red-600 text-sm mt-1">{statsError}</p>
                  </div>
                </div>
              </Card>
            ) : stats ? (
              <>
                <StatCard
                  title="إجمالي المستفيدين"
                  value={stats?.totalBeneficiaries || 0}
                  icon={Users}
                  trend={{
                    value: `${stats?.verifiedBeneficiaries || 0} موثق`,
                    direction: 'up',
                    label: ''
                  }}
                  color="blue"
                />

                <StatCard
                  title="الطرود النشطة"
                  value={stats?.totalPackages || 0}
                  icon={Package}
                  trend={{
                    value: `${stats?.deliveredPackages || 0} تم التسليم`,
                    direction: 'up',
                    label: ''
                  }}
                  color="green"
                />

                <StatCard
                  title="المهام النشطة"
                  value={stats?.activeTasks || 0}
                  icon={Truck}
                  trend={{
                    value: `${stats?.criticalAlerts || 0} حرجة`,
                    direction: 'down',
                    label: ''
                  }}
                  color="orange"
                />

                <StatCard
                  title="نسبة التسليم"
                  value={`${stats?.deliveryRate || 0}%`}
                  icon={BarChart3}
                  trend={{
                    value: 'من إجمالي الطرود',
                    direction: 'up',
                    label: ''
                  }}
                  color="purple"
                />

                <StatCard
                  title="طلبات التوزيع المعلقة"
                  value={stats?.pendingRequests || 0}
                  icon={ClipboardList}
                  trend={{
                    value: `${stats?.approvedRequests || 0} معتمد`,
                    direction: 'up',
                    label: ''
                  }}
                  color="blue"
                />
              </>
            ) : (
              <Card className="bg-gray-50 col-span-4">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">لا توجد إحصائيات متاحة</p>
                  <p className="text-sm mt-1">تأكد من الاتصال بـ Supabase</p>
                </div>
              </Card>
            )}
          </div>

          {/* Connection Status */}
          <Card className="bg-blue-50 border-blue-200" padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-blue-800 font-medium">النظام يعمل بالبيانات الوهمية</span>
                      <p className="text-blue-600 text-sm mt-1">يتم عرض البيانات الوهمية حالياً</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  تحديث البيانات
                </Button>
              </div>
          </Card>

          {/* Alerts Loading/Error States */}
          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card hover onClick={() => setActiveTab('beneficiaries-list')}>
              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">إدارة المستفيدين</h3>
              </div>
              <p className="text-gray-600 mb-4 text-sm">إضافة وإدارة المستفيدين الجدد</p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <span>إدارة المستفيدين</span>
                <ChevronRight className="w-4 h-4 mr-1" />
              </div>
            </Card>

            <Card hover onClick={() => setActiveTab('packages-list')}>
              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">إدارة الطرود</h3>
              </div>
              <p className="text-gray-600 mb-4 text-sm">إنشاء وتوزيع الطرود</p>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <span>إدارة الطرود</span>
                <ChevronRight className="w-4 h-4 mr-1" />
              </div>
            </Card>

            <Card hover onClick={() => setActiveTab('reports')}>
              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">التقارير والإحصائيات</h3>
              </div>
              <p className="text-gray-600 mb-4 text-sm">عرض التقارير المفصلة</p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                <span>عرض التقارير</span>
                <ChevronRight className="w-4 h-4 mr-1" />
              </div>
            </Card>
          </div>

          {/* Recent Activities and System Map */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">آخر الأنشطة</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">تم تسليم 15 طرد في منطقة خان يونس</p>
                    <p className="text-xs text-gray-500 mt-1">منذ 5 دقائق</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">إضافة 8 مستفيدين جدد للنظام</p>
                    <p className="text-xs text-gray-500 mt-1">منذ 15 دقيقة</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">تحديث عناوين 3 مستفيدين</p>
                    <p className="text-xs text-gray-500 mt-1">منذ 30 دقيقة</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">تسجيل مؤسسة جديدة: جمعية الخير</p>
                    <p className="text-xs text-gray-500 mt-1">منذ ساعة</p>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('alerts')}
                className="w-full mt-4"
              >
                عرض جميع الأنشطة
              </Button>
            </Card>

            {/* System Overview Map */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">خريطة النظام</h3>
              <div className="relative">
                <GazaMap 
                  points={convertBeneficiariesToMapPoints()}
                  onPointClick={handleMapPointClick}
                  activeFilter="all"
                  className="h-64 rounded-lg"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-600">
                  {stats?.totalBeneficiaries || 0} مستفيد في 5 محافظات
                </div>
              </div>
            </Card>
          </div>

          {/* Organizations and Families Overview */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">المؤسسات النشطة</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('organizations')}
                >
                  عرض الكل
                </Button>
              </div>
              <div className="space-y-4">
                {mockOrganizations.slice(0, 3).map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-sm text-gray-600">{org.beneficiariesCount} مستفيد</p>
                    </div>
                    <Badge variant={org.status === 'active' ? 'success' : 'warning'} size="sm">
                      {org.status === 'active' ? 'نشطة' : 'معلقة'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">العائلات النشطة</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('families')}
                >
                  عرض الكل
                </Button>
              </div>
              <div className="space-y-4">
                {mockFamilies.map((family) => (
                  <div key={family.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">{family.name}</p>
                      <p className="text-sm text-gray-600">{family.membersCount} فرد</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-purple-600">{family.completionRate}%</p>
                      <p className="text-xs text-gray-500">نسبة الإنجاز</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      );
    }

    if (activeTab === 'reports') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <ComprehensiveReportsPage />
        </div>
      );
    }

    if (activeTab === 'alerts') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <AlertsManagementPage />
        </div>
      );
    }

    if (activeTab === 'messages') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <MessagesSettingsPage />
        </div>
      );
    }

    // Settings Tab
    if (activeTab === 'settings') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
                <p className="text-gray-600 mt-1">{pageInfo.description}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsItems.map((item) => {
              const ItemIconComponent = item.icon;
              return (
                <Card 
                  key={item.id}
                  hover
                  onClick={() => setActiveTab(item.id)}
                >
                  <div className="flex items-center space-x-3 space-x-reverse mb-4">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <ItemIconComponent className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">{item.description}</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <span>فتح الإعدادات</span>
                    <ChevronRight className="w-4 h-4 mr-1" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }

    if (activeTab === 'system') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <SystemSettingsPage />
        </div>
      );
    }

    if (activeTab === 'backup') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <BackupManagementPage />
        </div>
      );
    }

    if (activeTab === 'audit') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <ActivityLogPage />
        </div>
      );
    }

    // Other tabs placeholder
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="flex items-center space-x-4 space-x-reverse mb-8">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <IconComponent className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.name}</h2>
              <p className="text-gray-600 mt-1">{pageInfo.description}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-12 mb-6">
            <div className="text-gray-400 text-center">
              <IconComponent className="w-12 h-12 mx-auto mb-4" />
            </div>
          </div>
          <p className="text-gray-600 mb-6">هذا القسم قيد التطوير - سيتم إضافة التفاصيل الكاملة قريباً</p>
          <Button variant="primary">
            ابدأ التطوير
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/30 flex" dir="rtl">
      {/* Sidebar */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">لوحة الإدارة</h1>
              <p className="text-sm text-gray-500">{loggedInUser?.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = isMenuActive(item);
            const isExpanded = openMenus.includes(item.id);

            return (
              <div key={item.id}>
                {/* Main Menu Item */}
                <button
                  onClick={() => {
                    if (item.children) {
                      toggleMenu(item.id);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-lg text-base font-semibold transition-all duration-200 ${
                    index > 0 ? 'mt-4' : ''
                  } ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <IconComponent className={`w-4 h-4 ml-2 ${isActive ? 'text-blue-600' : ''}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.children && (
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </button>

                {/* Sub Menu Items */}
                {item.children && isExpanded && (
                  <div className="mt-1 mr-4 space-y-1">
                    {item.children.map((child) => {
                      const ChildIconComponent = child.icon;
                      const isChildActive = activeTab === child.id;

                      return (
                        <button
                          key={child.id}
                          onClick={() => setActiveTab(child.id)}
                          className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                            isChildActive
                              ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <ChildIconComponent className={`w-4 h-4 ${isChildActive ? 'text-blue-600' : ''}`} />
                          <span>{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{loggedInUser?.name}</p>
                  <p className="text-xs text-gray-500">مدير النظام</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal for Beneficiary Details */}
      {showMapModal && selectedBeneficiaryForMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">تفاصيل المستفيد من الخريطة</h3>
              <button 
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">معلومات المستفيد</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">الاسم:</span>
                    <span className="font-medium text-blue-900 mr-2">{selectedBeneficiaryForMap.name}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">رقم الهوية:</span>
                    <span className="font-medium text-blue-900 mr-2">{selectedBeneficiaryForMap.nationalId}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">الهاتف:</span>
                    <span className="font-medium text-blue-900 mr-2">{selectedBeneficiaryForMap.phone}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">المنطقة:</span>
                    <span className="font-medium text-blue-900 mr-2">{selectedBeneficiaryForMap.detailedAddress.district}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">العنوان الكامل:</span>
                    <span className="font-medium text-blue-900 mr-2">{selectedBeneficiaryForMap.address}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">الحالة:</span>
                    <Badge 
                      variant={
                        selectedBeneficiaryForMap.status === 'active' ? 'success' :
                        selectedBeneficiaryForMap.status === 'pending' ? 'warning' : 'error'
                      } 
                      size="sm" 
                      className="mr-2"
                    >
                      {selectedBeneficiaryForMap.status === 'active' ? 'نشط' :
                       selectedBeneficiaryForMap.status === 'pending' ? 'معلق' : 'موقوف'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 space-x-reverse justify-end">
                <Button variant="secondary" onClick={() => setShowMapModal(false)}>
                  إغلاق
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setShowMapModal(false);
                    handleNavigateToIndividualSend(selectedBeneficiaryForMap.id);
                  }}
                >
                  إرسال طرد
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Request Review Modal */}
      {showDistributionReview && selectedDistributionRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <DistributionRequestReview
                request={selectedDistributionRequest}
                onApprove={handleApproveDistributionRequest}
                onReject={handleRejectDistributionRequest}
                onClose={() => {
                  setShowDistributionReview(false);
                  setSelectedDistributionRequest(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <ErrorBoundary>
            {renderMainContent()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

// مكون إدارة طلبات التوزيع
interface DistributionRequestsManagementPageProps {
  onReviewRequest: (request: DistributionRequest) => void;
}

function DistributionRequestsManagementPage({ onReviewRequest }: DistributionRequestsManagementPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredRequests = mockDistributionRequests.filter(request => {
    const matchesSearch = request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'معلق';
      case 'approved': return 'معتمد';
      case 'rejected': return 'مرفوض';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      default: return 'غير محدد';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'individual': return 'فردي';
      case 'bulk': return 'جماعي';
      case 'family_bulk': return 'عائلي';
      default: return 'غير محدد';
    }
  };

  const getTemplateById = (id: string) => {
    return mockPackages.find(p => p.id === id);
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <Users className="w-4 h-4 text-blue-600" />;
      case 'bulk': return <Package className="w-4 h-4 text-green-600" />;
      case 'family_bulk': return <Heart className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRequesterTypeIcon = (type: string) => {
    switch (type) {
      case 'organization': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'family': return <Heart className="w-4 h-4 text-purple-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-green-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'normal': return 'عادي';
      case 'low': return 'منخفض';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            البيانات الوهمية محملة - {mockDistributionRequests.length} طلب توزيع
          </span>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">طلبات التوزيع</h2>
          <p className="text-gray-600 mt-1">مراجعة والموافقة على طلبات التوزيع من المؤسسات والعائلات</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <Button variant="secondary" icon={Download} iconPosition="right">
            تصدير الطلبات
          </Button>
          <Button variant="primary" icon={RefreshCw} iconPosition="right">
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            type="text"
            icon={Search}
            iconPosition="right"
            placeholder="البحث في طلبات التوزيع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة الطلب</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">معلق</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتمل</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطلب</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الأنواع</option>
              <option value="individual">فردي</option>
              <option value="bulk">جماعي</option>
              <option value="family_bulk">عائلي</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-50">
          <div className="text-center">
            <div className="bg-yellow-100 p-3 rounded-xl mb-2">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto" />
            </div>
            <p className="text-sm text-yellow-600">طلبات معلقة</p>
            <p className="text-2xl font-bold text-yellow-900">
              {mockDistributionRequests.filter(r => r.status === 'pending').length}
            </p>
          </div>
        </Card>

        <Card className="bg-green-50">
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-xl mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm text-green-600">طلبات معتمدة</p>
            <p className="text-2xl font-bold text-green-900">
              {mockDistributionRequests.filter(r => r.status === 'approved').length}
            </p>
          </div>
        </Card>

        <Card className="bg-red-50">
          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-xl mb-2">
              <XCircle className="w-6 h-6 text-red-600 mx-auto" />
            </div>
            <p className="text-sm text-red-600">طلبات مرفوضة</p>
            <p className="text-2xl font-bold text-red-900">
              {mockDistributionRequests.filter(r => r.status === 'rejected').length}
            </p>
          </div>
        </Card>

        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <Package className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">إجمالي الطرود المطلوبة</p>
            <p className="text-2xl font-bold text-blue-900">
              {mockDistributionRequests.reduce((sum, r) => sum + r.requestedQuantity, 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <h4 className="font-medium text-orange-800">
                يوجد {pendingRequests.length} طلب توزيع في انتظار المراجعة
              </h4>
              <p className="text-orange-700 text-sm mt-1">
                يرجى مراجعة الطلبات المعلقة والموافقة عليها أو رفضها
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Distribution Requests Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              قائمة طلبات التوزيع ({filteredRequests.length})
            </h3>
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
                  الطلب
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مقدم الطلب
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكمية
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنطقة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => {
                  const packageTemplate = getTemplateById(request.packageTemplateId);
                  
                  return (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg ml-4">
                            {getRequestTypeIcon(request.type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {packageTemplate?.name || 'قالب غير محدد'}
                            </div>
                            <div className="text-sm text-gray-500">#{request.id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getRequesterTypeIcon(request.requesterType)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.requesterName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.requesterType === 'organization' ? 'مؤسسة' :
                               request.requesterType === 'family' ? 'عائلة' : 'إدارة'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Badge variant={
                            request.type === 'bulk' ? 'info' :
                            request.type === 'family_bulk' ? 'warning' : 'neutral'
                          } size="sm">
                            {getTypeText(request.type)}
                          </Badge>
                          <Badge variant={
                            request.priority === 'urgent' ? 'error' :
                            request.priority === 'high' ? 'warning' :
                            request.priority === 'normal' ? 'info' : 'neutral'
                          } size="sm">
                            {getPriorityText(request.priority)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <span className="font-medium">{request.requestedQuantity}</span>
                          {request.approvedQuantity && request.approvedQuantity !== request.requestedQuantity && (
                            <div className="text-xs text-orange-600">
                              معتمد: {request.approvedQuantity}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.type === 'bulk' ? (
                          <div>
                            <div className="font-medium">
                              {[request.targetGovernorate, request.targetCity, request.targetDistrict]
                                .filter(Boolean).join(' - ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">طلب فردي/عائلي</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          request.status === 'pending' ? 'warning' :
                          request.status === 'approved' ? 'success' :
                          request.status === 'rejected' ? 'error' : 'info'
                        } size="sm">
                          {getStatusText(request.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.requestDate).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button 
                            onClick={() => onReviewRequest(request)}
                            className={`p-2 rounded-lg transition-colors ${
                              request.status === 'pending' 
                                ? 'text-blue-600 hover:text-blue-900 hover:bg-blue-50' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                            title={request.status === 'pending' ? 'مراجعة الطلب' : 'عرض التفاصيل'}
                          >
                            {request.status === 'pending' ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                          ? 'لا توجد طلبات مطابقة للفلاتر' 
                          : 'لا توجد طلبات توزيع'}
                      </p>
                      <p className="text-sm mt-2">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                          ? 'جرب تعديل الفلاتر أو مصطلح البحث'
                          : 'لم يتم إنشاء أي طلبات توزيع بعد'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <ClipboardList className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات مراجعة طلبات التوزيع</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>راجع تفاصيل كل طلب بعناية قبل الموافقة أو الرفض</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكنك تعديل الكمية المعتمدة حسب المخزون المتاح</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>اختر المندوب المناسب بناءً على المنطقة والحمولة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>الطلبات العاجلة تحتاج أولوية في المراجعة</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}