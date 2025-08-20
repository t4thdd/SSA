import React, { useState } from 'react';
import { Shield, Users, UserCheck, Plus, Search, Filter, Edit, Trash2, Eye, Settings, Lock, Unlock, Crown, UserPlus, CheckCircle, XCircle, AlertTriangle, ArrowRight, X, Save, Mail, Phone, Calendar, Activity, Star, TrendingUp, BarChart3, Database, Key, User } from 'lucide-react';
import { 
  mockRoles as initialMockRoles, 
  mockSystemUsers as initialMockSystemUsers, 
  mockPermissions, 
  mockOrganizations,
  mockFamilies,
  type Role, 
  type SystemUser, 
  type Permission 
} from '../data/mockData';
import { useErrorLogger } from '../utils/errorLogger';
import { Button, Card, Input, Badge, Modal } from './ui';

interface PermissionsManagementProps {
}

export default function PermissionsManagement({}: PermissionsManagementProps) {
  const { logInfo, logError } = useErrorLogger();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add-role' | 'edit-role' | 'add-user' | 'assign-role' | 'view-user' | 'view-role'>('add-role');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  // Make data editable
  const [roles, setRoles] = useState<Role[]>(initialMockRoles);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(initialMockSystemUsers);
  
  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    associatedId: '',
    associatedType: '' as 'organization' | 'family' | null,
    status: 'active' as SystemUser['status']
  });
  
  const [userRoleForm, setUserRoleForm] = useState({
    userId: '',
    roleId: ''
  });

  const tabs = [
    { id: 'overview', name: 'نظرة عامة', icon: Shield },
    { id: 'roles', name: 'الأدوار', icon: Crown },
    { id: 'users', name: 'المستخدمين', icon: Users },
    { id: 'permissions', name: 'الصلاحيات', icon: Lock },
    { id: 'analytics', name: 'التحليلات', icon: BarChart3 },
  ];

  const availablePermissions = [
    { id: "read_all", name: "قراءة جميع البيانات", category: "عام", description: "عرض جميع البيانات في النظام" },
    { id: "write_all", name: "تعديل جميع البيانات", category: "عام", description: "تعديل أي بيانات في النظام" },
    { id: "delete_all", name: "حذف البيانات", category: "عام", description: "حذف البيانات من النظام" },
    { id: "manage_users", name: "إدارة المستخدمين", category: "المستخدمين", description: "إضافة وتعديل المستخدمين" },
    { id: "manage_roles", name: "إدارة الأدوار", category: "المستخدمين", description: "إنشاء وتعديل الأدوار" },
    { id: "read_beneficiaries", name: "عرض المستفيدين", category: "المستفيدين", description: "عرض قائمة المستفيدين" },
    { id: "write_beneficiaries", name: "إدارة المستفيدين", category: "المستفيدين", description: "إضافة وتعديل المستفيدين" },
    { id: "read_requests", name: "عرض الطلبات", category: "الطلبات", description: "عرض طلبات المساعدة" },
    { id: "write_requests", name: "إدارة الطلبات", category: "الطلبات", description: "إدارة طلبات المساعدة" },
    { id: "approve_requests", name: "موافقة الطلبات", category: "الطلبات", description: "الموافقة على طلبات المساعدة" },
    { id: "reject_requests", name: "رفض الطلبات", category: "الطلبات", description: "رفض طلبات المساعدة" },
    { id: "read_deliveries", name: "عرض التسليمات", category: "التوزيع", description: "عرض حالة التسليمات" },
    { id: "update_delivery_status", name: "تحديث حالة التسليم", category: "التوزيع", description: "تحديث حالة تسليم الطرود" },
    { id: "view_reports", name: "عرض التقارير", category: "التقارير", description: "الوصول للتقارير والإحصائيات" },
    { id: "export_data", name: "تصدير البيانات", category: "التقارير", description: "تصدير البيانات والتقارير" }
  ];

  const handleAddRole = () => {
    setModalType('add-role');
    setSelectedItem(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  const handleEditRole = (role: Role) => {
    setModalType('edit-role');
    setSelectedItem(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setShowModal(true);
  };

  const handleViewRole = (role: Role) => {
    setModalType('view-role');
    setSelectedItem(role);
    setShowModal(true);
  };

  const handleAddUser = () => {
    setModalType('add-user');
    setSelectedItem(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      roleId: '',
      associatedId: '',
      associatedType: null,
      status: 'active'
    });
    setShowModal(true);
  };

  const handleViewUser = (user: SystemUser) => {
    setModalType('view-user');
    setSelectedItem(user);
    setShowModal(true);
  };

  const handleAssignRole = (user: SystemUser) => {
    setModalType('assign-role');
    setSelectedItem(user);
    setUserRoleForm({
      userId: user.id,
      roleId: user.roleId
    });
    setShowModal(true);
  };

  const handleCreateOrUpdateRole = async () => {
    if (!roleForm.name.trim()) {
      setNotification({ message: 'اسم الدور مطلوب', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      if (selectedItem) {
        // Update existing role
        setRoles(prevRoles => 
          prevRoles.map(role => 
            role.id === selectedItem.id 
              ? { 
                  ...role, 
                  name: roleForm.name,
                  description: roleForm.description,
                  permissions: roleForm.permissions
                }
              : role
          )
        );
        setNotification({ message: 'تم تحديث الدور بنجاح', type: 'success' });
        logInfo(`تم تحديث الدور: ${roleForm.name}`, 'PermissionsManagement');
      } else {
        // Create new role
        const newRole: Role = {
          id: `role-${Date.now()}`,
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions,
          userCount: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        setRoles(prevRoles => [newRole, ...prevRoles]);
        setNotification({ message: 'تم إنشاء الدور بنجاح', type: 'success' });
        logInfo(`تم إنشاء دور جديد: ${roleForm.name}`, 'PermissionsManagement');
      }

      setTimeout(() => setNotification(null), 3000);
      setShowModal(false);
      setRoleForm({ name: '', description: '', permissions: [] });
      setSelectedItem(null);
    } catch (error) {
      logError(error as Error, 'PermissionsManagement');
      setNotification({ message: 'حدث خطأ في حفظ الدور', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.phone.trim() || !userForm.roleId) {
      setNotification({ message: 'يرجى إدخال جميع الحقول المطلوبة', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // التحقق من عدم تكرار البريد الإلكتروني
    const emailExists = systemUsers.some(user => user.email.toLowerCase() === userForm.email.toLowerCase());
    if (emailExists) {
      setNotification({ message: 'البريد الإلكتروني مستخدم بالفعل', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const newUser: SystemUser = {
        id: `user-${Date.now()}`,
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        roleId: userForm.roleId,
        associatedId: userForm.associatedId || null,
        associatedType: userForm.associatedType,
        status: userForm.status,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      setSystemUsers(prev => [newUser, ...prev]);
      
      // Update role user count
      setRoles(prevRoles =>
        prevRoles.map(role => 
          role.id === userForm.roleId 
            ? { ...role, userCount: role.userCount + 1 }
            : role
        )
      );

      setNotification({ message: `تم إضافة المستخدم ${userForm.name} بنجاح`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      
      setShowModal(false);
      setUserForm({
        name: '',
        email: '',
        phone: '',
        roleId: '',
        associatedId: '',
        associatedType: null,
        status: 'active'
      });
      
      logInfo(`تم إضافة مستخدم جديد: ${userForm.name}`, 'PermissionsManagement');
    } catch (error) {
      logError(error as Error, 'PermissionsManagement');
      setNotification({ message: 'حدث خطأ في إضافة المستخدم', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleUpdateUserRole = async () => {
    if (!userRoleForm.userId || !userRoleForm.roleId) {
      setNotification({ message: 'يجب اختيار المستخدم والدور', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const oldUser = systemUsers.find(u => u.id === userRoleForm.userId);
      const oldRoleId = oldUser?.roleId;

      // Update user's role
      setSystemUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userRoleForm.userId
            ? { ...user, roleId: userRoleForm.roleId }
            : user
        )
      );

      // Update role user counts
      setRoles(prevRoles =>
        prevRoles.map(role => {
          if (role.id === oldRoleId) {
            return { ...role, userCount: Math.max(0, role.userCount - 1) };
          }
          if (role.id === userRoleForm.roleId) {
            return { ...role, userCount: role.userCount + 1 };
          }
          return role;
        })
      );

      const newRole = roles.find(r => r.id === userRoleForm.roleId);
      setNotification({ message: `تم تحديث دور المستخدم إلى "${newRole?.name}" بنجاح`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      
      setShowModal(false);
      setUserRoleForm({ userId: '', roleId: '' });
      setSelectedItem(null);
      
      logInfo(`تم تحديث دور المستخدم: ${oldUser?.name}`, 'PermissionsManagement');
    } catch (error) {
      logError(error as Error, 'PermissionsManagement');
      setNotification({ message: 'حدث خطأ في تحديث دور المستخدم', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    // Check if role is assigned to users
    const usersWithRole = systemUsers.filter(user => user.roleId === roleId);
    if (usersWithRole.length > 0) {
      setNotification({ 
        message: `لا يمكن حذف هذا الدور لأنه مُعيّن لـ ${usersWithRole.length} مستخدم`, 
        type: 'error' 
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const roleToDelete = roles.find(r => r.id === roleId);
      setRoles(prevRoles => prevRoles.filter(role => role.id !== roleId));
      setNotification({ message: `تم حذف الدور "${roleToDelete?.name}" بنجاح`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      logInfo(`تم حذف الدور: ${roleToDelete?.name}`, 'PermissionsManagement');
    } catch (error) {
      logError(error as Error, 'PermissionsManagement');
      setNotification({ message: 'حدث خطأ في حذف الدور', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userToDelete = systemUsers.find(u => u.id === userId);
      
      // Update role user count
      if (userToDelete) {
        setRoles(prevRoles =>
          prevRoles.map(role => 
            role.id === userToDelete.roleId 
              ? { ...role, userCount: Math.max(0, role.userCount - 1) }
              : role
          )
        );
      }

      setSystemUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setNotification({ message: `تم حذف المستخدم "${userToDelete?.name}" بنجاح`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      logInfo(`تم حذف المستخدم: ${userToDelete?.name}`, 'PermissionsManagement');
    } catch (error) {
      logError(error as Error, 'PermissionsManagement');
      setNotification({ message: 'حدث خطأ في حذف المستخدم', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = systemUsers.find(u => u.id === userId);
      const newStatus = user?.status === 'active' ? 'inactive' : 'active';
      
      setSystemUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, status: newStatus }
            : user
        )
      );
      
      const statusText = newStatus === 'active' ? 'تفعيل' : 'إيقاف';
      setNotification({ message: `تم ${statusText} المستخدم "${user?.name}" بنجاح`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      logInfo(`تم ${statusText} المستخدم: ${user?.name}`, 'PermissionsManagement');
    } catch (error) {
      logError(error as Error, 'PermissionsManagement');
      setNotification({ message: 'حدث خطأ في تحديث حالة المستخدم', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getPermissionsByRole = (roleId: string): Permission[] => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return [];
    return mockPermissions.filter(p => role.permissions.includes(p.id));
  };

  const getRoleName = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'غير محدد';
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case "مدير النظام":
        return "bg-red-100 text-red-800";
      case "مشرف المؤسسة":
        return "bg-blue-100 text-blue-800";
      case "مندوب التوزيع":
        return "bg-green-100 text-green-800";
      case "مراجع الطلبات":
        return "bg-purple-100 text-purple-800";
      case "مشرف العائلة":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPermissionsByCategory = () => {
    const grouped = availablePermissions.reduce((acc: any, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {});
    return grouped;
  };

  const getAssociatedEntityName = (user: SystemUser) => {
    if (user.associatedType === 'organization' && user.associatedId) {
      const org = mockOrganizations.find(o => o.id === user.associatedId);
      return org ? org.name : 'مؤسسة غير محددة';
    }
    if (user.associatedType === 'family' && user.associatedId) {
      const family = mockFamilies.find(f => f.id === user.associatedId);
      return family ? family.name : 'عائلة غير محددة';
    }
    return 'غير مرتبط';
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = systemUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoleName(user.roleId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = systemUsers.filter(u => u.status === 'active').length;
  const adminUsers = systemUsers.filter(u => getRoleName(u.roleId).includes('مدير')).length;
  const permissionsByCategory = getPermissionsByCategory();

  // Statistics
  const statistics = {
    totalRoles: roles.length,
    totalUsers: systemUsers.length,
    activeUsers,
    inactiveUsers: systemUsers.filter(u => u.status === 'inactive').length,
    suspendedUsers: systemUsers.filter(u => u.status === 'suspended').length,
    adminUsers,
    organizationUsers: systemUsers.filter(u => u.associatedType === 'organization').length,
    familyUsers: systemUsers.filter(u => u.associatedType === 'family').length,
    totalPermissions: availablePermissions.length
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

  const handleExportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      statistics,
      roles: roles.map(role => ({
        name: role.name,
        description: role.description,
        userCount: role.userCount,
        permissionsCount: role.permissions.length,
        isActive: role.isActive,
        createdAt: role.createdAt
      })),
      users: systemUsers.map(user => ({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: getRoleName(user.roleId),
        associatedEntity: getAssociatedEntityName(user),
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      })),
      permissions: availablePermissions
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الصلاحيات_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير تقرير الصلاحيات بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
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

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">إدارة الصلاحيات</h1>
                <p className="text-sm text-gray-600">إدارة أدوار المستخدمين وصلاحياتهم في النظام</p>
              </div>
            </div>
            <div className="flex space-x-3 space-x-reverse">
              <Button variant="success" icon={Database} iconPosition="right" onClick={handleExportData}>
                تصدير البيانات
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Card className="bg-blue-50 border-blue-200" padding="sm">
          <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              البيانات الوهمية محملة - {roles.length} دور، {systemUsers.length} مستخدم، {availablePermissions.length} صلاحية
            </span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 space-x-reverse">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 space-x-reverse px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4 ml-2" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">إجمالي الأدوار</p>
                    <p className="text-3xl font-bold text-blue-900">{statistics.totalRoles}</p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-2xl">
                    <Crown className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">إجمالي المستخدمين</p>
                    <p className="text-3xl font-bold text-green-900">{statistics.totalUsers}</p>
                    <p className="text-green-600 text-sm mt-1">{statistics.activeUsers} نشط</p>
                  </div>
                  <div className="bg-green-100 p-4 rounded-2xl">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="bg-orange-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">مديرين</p>
                    <p className="text-3xl font-bold text-orange-900">{statistics.adminUsers}</p>
                  </div>
                  <div className="bg-orange-100 p-4 rounded-2xl">
                    <Shield className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </Card>

              <Card className="bg-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">إجمالي الصلاحيات</p>
                    <p className="text-3xl font-bold text-purple-900">{statistics.totalPermissions}</p>
                  </div>
                  <div className="bg-purple-100 p-4 rounded-2xl">
                    <Key className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Roles Overview */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">الأدوار في النظام</h3>
                <Button variant="primary" icon={Plus} iconPosition="right" onClick={handleAddRole}>
                  إضافة دور جديد
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {roles.map((role) => {
                  const permissions = getPermissionsByRole(role.id);
                  return (
                    <Card key={role.id} className="hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Crown className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{role.name}</h4>
                            <p className="text-sm text-gray-600">{role.userCount} مستخدم</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleViewRole(role)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditRole(role)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الدور "${role.name}"؟`)) {
                                handleDeleteRole(role.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4">{role.description}</p>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">الصلاحيات ({permissions.length})</p>
                        <div className="space-y-1">
                          {permissions.slice(0, 3).map((permission) => (
                            <div key={permission.id} className="text-xs text-gray-600 flex items-center">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full ml-2"></div>
                              {permission.name}
                            </div>
                          ))}
                          {permissions.length > 3 && (
                            <div className="text-xs text-blue-600 font-medium">
                              + {permissions.length - 3} صلاحية أخرى
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card hover onClick={() => setActiveTab('users')}>
                <div className="flex items-center space-x-3 space-x-reverse mb-4">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">إدارة المستخدمين</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">إضافة وإدارة مستخدمي النظام</p>
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <span>إدارة المستخدمين</span>
                  <ArrowRight className="w-4 h-4 mr-1" />
                </div>
              </Card>

              <Card hover onClick={() => setActiveTab('roles')}>
                <div className="flex items-center space-x-3 space-x-reverse mb-4">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Crown className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">إدارة الأدوار</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">إنشاء وتعديل أدوار النظام</p>
                <div className="flex items-center text-purple-600 text-sm font-medium">
                  <span>إدارة الأدوار</span>
                  <ArrowRight className="w-4 h-4 mr-1" />
                </div>
              </Card>

              <Card hover onClick={() => setActiveTab('analytics')}>
                <div className="flex items-center space-x-3 space-x-reverse mb-4">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">تحليلات الاستخدام</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">عرض إحصائيات وتحليلات مفصلة</p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  <span>عرض التحليلات</span>
                  <ArrowRight className="w-4 h-4 mr-1" />
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">إدارة الأدوار</h2>
                <p className="text-gray-600 mt-1">إنشاء وتعديل أدوار المستخدمين</p>
              </div>
              <div className="flex space-x-3 space-x-reverse">
                <Button variant="primary" icon={Plus} iconPosition="right" onClick={handleAddRole}>
                  إضافة دور جديد
                </Button>
              </div>
            </div>

            {/* Search */}
            <Card>
              <Input
                type="text"
                icon={Search}
                iconPosition="right"
                placeholder="البحث في الأدوار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Card>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoles.map((role, index) => (
                <Card key={role.id} className="hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Crown className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{role.name}</h4>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role.name)}`}>
                          {role.userCount} مستخدم
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleViewRole(role)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الدور "${role.name}"؟`)) {
                            handleDeleteRole(role.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {role.description && (
                    <p className="text-gray-600 text-sm mb-4">{role.description}</p>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">الصلاحيات ({role.permissions.length})</p>
                    <div className="space-y-1">
                      {role.permissions.slice(0, 3).map((permissionId) => {
                        const permission = availablePermissions.find(p => p.id === permissionId);
                        return permission ? (
                          <div key={permissionId} className="text-xs text-gray-600 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                            {permission.name}
                          </div>
                        ) : null;
                      })}
                      {role.permissions.length > 3 && (
                        <div className="text-xs text-gray-500">
                          + {role.permissions.length - 3} صلاحية أخرى
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h2>
                <p className="text-gray-600 mt-1">إدارة مستخدمي النظام وأدوارهم</p>
              </div>
              <div className="flex space-x-3 space-x-reverse">
                <Button variant="primary" icon={UserPlus} iconPosition="right" onClick={handleAddUser}>
                  إضافة مستخدم
                </Button>
              </div>
            </div>

            {/* Search */}
            <Card>
              <Input
                type="text"
                icon={Search}
                iconPosition="right"
                placeholder="البحث في المستخدمين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Card>

            {/* Users Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-green-50">
                <div className="text-center">
                  <div className="bg-green-100 p-3 rounded-xl mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </div>
                  <p className="text-sm text-green-600">نشطين</p>
                  <p className="text-2xl font-bold text-green-900">{statistics.activeUsers}</p>
                </div>
              </Card>

              <Card className="bg-gray-50">
                <div className="text-center">
                  <div className="bg-gray-100 p-3 rounded-xl mb-2">
                    <XCircle className="w-6 h-6 text-gray-600 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-600">غير نشطين</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.inactiveUsers}</p>
                </div>
              </Card>

              <Card className="bg-blue-50">
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-xl mb-2">
                    <Shield className="w-6 h-6 text-blue-600 mx-auto" />
                  </div>
                  <p className="text-sm text-blue-600">مؤسسات</p>
                  <p className="text-2xl font-bold text-blue-900">{statistics.organizationUsers}</p>
                </div>
              </Card>

              <Card className="bg-purple-50">
                <div className="text-center">
                  <div className="bg-purple-100 p-3 rounded-xl mb-2">
                    <Users className="w-6 h-6 text-purple-600 mx-auto" />
                  </div>
                  <p className="text-sm text-purple-600">عائلات</p>
                  <p className="text-2xl font-bold text-purple-900">{statistics.familyUsers}</p>
                </div>
              </Card>
            </div>

            {/* Users List */}
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">قائمة المستخدمين ({filteredUsers.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المستخدم
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        البريد الإلكتروني
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الدور
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الكيان المرتبط
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        آخر دخول
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user, index) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-green-100 p-2 rounded-xl ml-4">
                              <User className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            getRoleName(user.roleId).includes('مدير') ? 'error' :
                            getRoleName(user.roleId).includes('مشرف') ? 'info' : 'success'
                          } size="sm">
                            {getRoleName(user.roleId)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getAssociatedEntityName(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(user.lastLogin).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            user.status === 'active' ? 'success' :
                            user.status === 'inactive' ? 'neutral' : 'error'
                          } size="sm">
                            {user.status === 'active' ? 'نشط' : 
                             user.status === 'inactive' ? 'غير نشط' : 'معلق'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2 space-x-reverse">
                            <button 
                              onClick={() => handleViewUser(user)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAssignRole(user)}
                              className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                              title="تعيين دور"
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                              title={user.status === 'active' ? 'إيقاف' : 'تفعيل'}
                            >
                              {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) {
                                  handleDeleteUser(user.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">إدارة الصلاحيات</h2>
                <p className="text-gray-600 mt-1">عرض وإدارة صلاحيات النظام</p>
              </div>
            </div>

            {/* Permissions by Category */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['عام', 'المستخدمين', 'المستفيدين', 'الطلبات', 'التوزيع', 'التقارير'].map((category) => {
                const categoryPermissions = availablePermissions.filter(p => p.category === category);
                const categoryColors = {
                  'عام': 'blue',
                  'المستخدمين': 'green',
                  'المستفيدين': 'purple',
                  'الطلبات': 'orange',
                  'التوزيع': 'red',
                  'التقارير': 'indigo'
                };
                const color = categoryColors[category as keyof typeof categoryColors] || 'gray';
                
                return (
                  <Card key={category}>
                    <div className="flex items-center space-x-3 space-x-reverse mb-4">
                      <div className={`bg-${color}-100 p-2 rounded-lg`}>
                        <Lock className={`w-5 h-5 text-${color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category}</h3>
                        <p className="text-sm text-gray-600">{categoryPermissions.length} صلاحية</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                            <div className="text-xs text-gray-500">{permission.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">تحليلات الصلاحيات</h2>
                <p className="text-gray-600 mt-1">إحصائيات وتحليلات مفصلة للأدوار والمستخدمين</p>
              </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع المستخدمين حسب الأدوار</h3>
                <div className="space-y-3">
                  {roles.map((role) => {
                    const percentage = statistics.totalUsers > 0 ? (role.userCount / statistics.totalUsers * 100) : 0;
                    return (
                      <div key={role.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{role.name}</span>
                          <span className="text-sm font-bold">{role.userCount}</span>
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
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">حالة المستخدمين</h3>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">مستخدمين نشطين</span>
                      <span className="text-2xl font-bold text-green-900">{statistics.activeUsers}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">غير نشطين</span>
                      <span className="text-2xl font-bold text-gray-900">{statistics.inactiveUsers}</span>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <div className="flex items-center justify-between">
                      <span className="text-red-700">معلقين</span>
                      <span className="text-2xl font-bold text-red-900">{statistics.suspendedUsers}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع الكيانات</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700">مستخدمي المؤسسات</span>
                      <span className="text-2xl font-bold text-blue-900">{statistics.organizationUsers}</span>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">مستخدمي العائلات</span>
                      <span className="text-2xl font-bold text-purple-900">{statistics.familyUsers}</span>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="text-orange-700">مديرين عامين</span>
                      <span className="text-2xl font-bold text-orange-900">
                        {systemUsers.filter(u => u.associatedType === null).length}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Security Insights */}
            <Card className="bg-red-50 border-red-200">
              <div className="flex items-start space-x-3 space-x-reverse">
                <Shield className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800 mb-3">رؤى الأمان</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="text-sm text-red-700 space-y-2">
                      <li className="flex items-start space-x-2 space-x-reverse">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>جميع المستخدمين لديهم أدوار محددة</span>
                      </li>
                      <li className="flex items-start space-x-2 space-x-reverse">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>الصلاحيات موزعة بشكل آمن</span>
                      </li>
                      <li className="flex items-start space-x-2 space-x-reverse">
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>مراجعة دورية للصلاحيات مطلوبة</span>
                      </li>
                    </ul>
                    <ul className="text-sm text-red-700 space-y-2">
                      <li className="flex items-start space-x-2 space-x-reverse">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>نظام تسجيل شامل للعمليات</span>
                      </li>
                      <li className="flex items-start space-x-2 space-x-reverse">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>حماية من الوصول غير المصرح</span>
                      </li>
                      <li className="flex items-start space-x-2 space-x-reverse">
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>تحديث كلمات المرور بانتظام</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'add-role' ? 'إضافة دور جديد' :
            modalType === 'edit-role' ? 'تعديل الدور' :
            modalType === 'view-role' ? 'تفاصيل الدور' :
            modalType === 'add-user' ? 'إضافة مستخدم جديد' :
            modalType === 'view-user' ? 'تفاصيل المستخدم' :
            'تعيين دور'
          }
          size="lg"
        >
          <div className="p-6">
            {/* Role Form */}
            {(modalType === 'add-role' || modalType === 'edit-role') && (
              <div className="space-y-6">
                <Input
                  label="اسم الدور *"
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                  placeholder="أدخل اسم الدور..."
                  required
                />
                
                <Input
                  label="وصف الدور"
                  type="textarea"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                  placeholder="أدخل وصف الدور..."
                  rows={3}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">الصلاحيات</label>
                  <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {Object.entries(permissionsByCategory).map(([category, permissions]: [string, any]) => (
                      <div key={category}>
                        <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                        <div className="space-y-2 pr-4">
                          {permissions.map((permission: any) => (
                            <div key={permission.id} className="flex items-start space-x-2 space-x-reverse">
                              <input
                                type="checkbox"
                                id={permission.id}
                                checked={roleForm.permissions.includes(permission.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRoleForm({
                                      ...roleForm,
                                      permissions: [...roleForm.permissions, permission.id]
                                    });
                                  } else {
                                    setRoleForm({
                                      ...roleForm,
                                      permissions: roleForm.permissions.filter(p => p !== permission.id)
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                              />
                              <div className="flex-1">
                                <label htmlFor={permission.id} className="text-sm text-gray-700 font-medium cursor-pointer">
                                  {permission.name}
                                </label>
                                <p className="text-xs text-gray-500">{permission.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={handleCreateOrUpdateRole}>
                    {modalType === 'add-role' ? 'إضافة الدور' : 'حفظ التغييرات'}
                  </Button>
                </div>
              </div>
            )}

            {/* View Role Details */}
            {modalType === 'view-role' && selectedItem && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">معلومات الدور</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">اسم الدور:</span>
                      <span className="font-medium text-blue-900 mr-2">{selectedItem.name}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">عدد المستخدمين:</span>
                      <span className="font-medium text-blue-900 mr-2">{selectedItem.userCount}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">عدد الصلاحيات:</span>
                      <span className="font-medium text-blue-900 mr-2">{selectedItem.permissions.length}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">تاريخ الإنشاء:</span>
                      <span className="font-medium text-blue-900 mr-2">
                        {new Date(selectedItem.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                  {selectedItem.description && (
                    <div className="mt-3">
                      <span className="text-blue-700">الوصف:</span>
                      <p className="text-blue-900 mt-1">{selectedItem.description}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-3">الصلاحيات المعينة ({selectedItem.permissions.length})</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedItem.permissions.map((permissionId: string) => {
                      const permission = availablePermissions.find(p => p.id === permissionId);
                      return permission ? (
                        <div key={permissionId} className="bg-white p-3 rounded-lg">
                          <div className="font-medium text-gray-900">{permission.name}</div>
                          <div className="text-xs text-gray-500">{permission.description}</div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                  <Button variant="primary" onClick={() => {
                    setModalType('edit-role');
                    setRoleForm({
                      name: selectedItem.name,
                      description: selectedItem.description,
                      permissions: selectedItem.permissions
                    });
                  }}>
                    تعديل الدور
                  </Button>
                </div>
              </div>
            )}

            {/* Add User Form */}
            {modalType === 'add-user' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="اسم المستخدم *"
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    placeholder="أدخل اسم المستخدم..."
                    required
                  />

                  <Input
                    label="البريد الإلكتروني *"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    placeholder="أدخل البريد الإلكتروني..."
                    required
                  />

                  <Input
                    label="رقم الهاتف *"
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    placeholder="مثال: 0591234567"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الدور *</label>
                    <select
                      value={userForm.roleId}
                      onChange={(e) => setUserForm({...userForm, roleId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">اختر الدور</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع الكيان المرتبط</label>
                    <select
                      value={userForm.associatedType || ''}
                      onChange={(e) => {
                        const value = e.target.value as 'organization' | 'family' | '';
                        setUserForm({
                          ...userForm, 
                          associatedType: value || null,
                          associatedId: ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">غير مرتبط (مدير عام)</option>
                      <option value="organization">مؤسسة</option>
                      <option value="family">عائلة</option>
                    </select>
                  </div>

                  {userForm.associatedType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {userForm.associatedType === 'organization' ? 'المؤسسة' : 'العائلة'}
                      </label>
                      <select
                        value={userForm.associatedId}
                        onChange={(e) => setUserForm({...userForm, associatedId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">اختر {userForm.associatedType === 'organization' ? 'المؤسسة' : 'العائلة'}</option>
                        {userForm.associatedType === 'organization' ? 
                          mockOrganizations.map((org) => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                          )) :
                          mockFamilies.map((family) => (
                            <option key={family.id} value={family.id}>{family.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حالة المستخدم</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({...userForm, status: e.target.value as SystemUser['status']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={handleCreateUser}>
                    إضافة المستخدم
                  </Button>
                </div>
              </div>
            )}

            {/* View User Details */}
            {modalType === 'view-user' && selectedItem && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">معلومات المستخدم</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">الاسم:</span>
                      <span className="font-medium text-green-900 mr-2">{selectedItem.name}</span>
                    </div>
                    <div>
                      <span className="text-green-700">البريد الإلكتروني:</span>
                      <span className="font-medium text-green-900 mr-2">{selectedItem.email}</span>
                    </div>
                    <div>
                      <span className="text-green-700">الهاتف:</span>
                      <span className="font-medium text-green-900 mr-2">{selectedItem.phone}</span>
                    </div>
                    <div>
                      <span className="text-green-700">الدور:</span>
                      <Badge variant="info" size="sm" className="mr-2">
                        {getRoleName(selectedItem.roleId)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-green-700">الكيان المرتبط:</span>
                      <span className="font-medium text-green-900 mr-2">{getAssociatedEntityName(selectedItem)}</span>
                    </div>
                    <div>
                      <span className="text-green-700">الحالة:</span>
                      <Badge variant={
                        selectedItem.status === 'active' ? 'success' :
                        selectedItem.status === 'inactive' ? 'neutral' : 'error'
                      } size="sm" className="mr-2">
                        {selectedItem.status === 'active' ? 'نشط' : 
                         selectedItem.status === 'inactive' ? 'غير نشط' : 'معلق'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-green-700">آخر دخول:</span>
                      <span className="font-medium text-green-900 mr-2">
                        {new Date(selectedItem.lastLogin).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">تاريخ الإنشاء:</span>
                      <span className="font-medium text-green-900 mr-2">
                        {new Date(selectedItem.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Permissions */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-3">صلاحيات المستخدم</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {getPermissionsByRole(selectedItem.roleId).map((permission) => (
                      <div key={permission.id} className="bg-white p-3 rounded-lg">
                        <div className="font-medium text-gray-900">{permission.name}</div>
                        <div className="text-xs text-gray-500">{permission.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                  <Button variant="primary" onClick={() => handleAssignRole(selectedItem)}>
                    تعيين دور جديد
                  </Button>
                </div>
              </div>
            )}

            {/* Assign Role Form */}
            {modalType === 'assign-role' && (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">المستخدم المحدد</h4>
                  <p className="text-purple-700">{selectedItem?.name} - {selectedItem?.email}</p>
                  <p className="text-sm text-purple-600">الدور الحالي: {getRoleName(selectedItem?.roleId)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الدور الجديد</label>
                  <select
                    value={userRoleForm.roleId}
                    onChange={(e) => setUserRoleForm({...userRoleForm, roleId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">اختر الدور</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} ({role.userCount} مستخدم)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={handleUpdateUserRole}>
                    تعيين الدور
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}