import React, { useState } from 'react';
import { Building2, Search, Filter, Plus, Eye, Edit, Phone, Mail, CheckCircle, Clock, AlertTriangle, Users, Package, Star, TrendingUp, Download, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { mockOrganizations, type Organization } from '../../data/mockData';
import { useErrorLogger } from '../../utils/errorLogger'; // Assuming errorLogger.ts is correctly imported
import { Button, Card, Input, Badge, Modal, ExportModal } from '../ui';

import OrganizationForm from '../OrganizationForm';
interface OrganizationsListPageProps {
  loggedInUser?: any;
  highlightOrganizationId?: string;
}

export default function OrganizationsListPage({ loggedInUser, highlightOrganizationId }: OrganizationsListPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>(mockOrganizations);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const { logError, logInfo } = useErrorLogger();

  const loading = false;
  const error = null;
  
  const refetch = () => {
    setOrganizations([...mockOrganizations]);
    logInfo('محاكاة تحديث بيانات المؤسسات', 'OrganizationsListPage');
  };

  // محاكاة العمليات
  const insert = async (data: Partial<Organization>) => {
    const newOrganization: Organization = {
      ...data,
      id: `org-${Date.now()}`,
      beneficiariesCount: 0,
      packagesCount: 0,
      completionRate: 0,
      createdAt: new Date().toISOString(),
      packagesAvailable: 0,
      templatesCount: 0,
      isPopular: false
    } as Organization;
    
    setOrganizations(prev => [newOrganization, ...prev]);
    logInfo(`تم إضافة مؤسسة جديدة: ${data.name}`, 'OrganizationsListPage');
    return true;
  };

  const update = async (id: string, data: Partial<Organization>) => {
    setOrganizations(prev => 
      prev.map(org => 
        org.id === id 
          ? { ...org, ...data }
          : org
      )
    );
    logInfo(`تم تحديث المؤسسة: ${data.name}`, 'OrganizationsListPage');
    return true;
  };

  const deleteRecord = async (id: string) => {
    const orgToDelete = organizations.find(org => org.id === id);
    setOrganizations(prev => prev.filter(org => org.id !== id));
    logInfo(`تم حذف المؤسسة: ${orgToDelete?.name}`, 'OrganizationsListPage');
    return true;
  };

  // فلترة البيانات
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // إحصائيات
  const totalOrganizations = organizations.length;
  const activeOrganizations = organizations.filter(org => org.status === 'active').length;
  const pendingOrganizations = organizations.filter(org => org.status === 'pending').length;
  const totalBeneficiaries = organizations.reduce((sum, org) => sum + org.beneficiariesCount, 0);

  const handleAddNew = () => {
    setModalType('add');
    setSelectedOrganization(null);
    setShowModal(true);
  };

  const handleEdit = (organization: Organization) => {
    setModalType('edit');
    setSelectedOrganization(organization);
    setShowModal(true);
  };

  const handleSaveOrganization = async (data: Partial<Organization>) => {
    try {
      if (modalType === 'add') {
        await insert(data);
        setNotification({ message: `تم إضافة المؤسسة "${data.name}" بنجاح`, type: 'success' });
      } else if (modalType === 'edit' && selectedOrganization) {
        await update(selectedOrganization.id, data);
        setNotification({ message: `تم تحديث المؤسسة "${data.name}" بنجاح`, type: 'success' });
      }
      setTimeout(() => setNotification(null), 3000);
      setShowModal(false);
      setSelectedOrganization(null);
    } catch (error) {
      logError(error as Error, 'OrganizationsListPage');
      setNotification({ message: 'حدث خطأ في حفظ البيانات', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCancelOrganization = () => {
    setShowModal(false);
    setSelectedOrganization(null);
  };

  const handleView = (organization: Organization) => {
    setModalType('view');
    setSelectedOrganization(organization);
    setShowModal(true);
  };

  const handleDelete = async (organization: Organization) => {
    if (confirm(`هل أنت متأكد من حذف المؤسسة "${organization.name}"؟`)) {
      try {
        await deleteRecord(organization.id);
        setNotification({ message: `تم حذف المؤسسة "${organization.name}" بنجاح`, type: 'warning' });
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        logError(error as Error, 'OrganizationsListPage');
        setNotification({ message: 'حدث خطأ في حذف المؤسسة', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };

  const handleCall = (phone: string) => {
    if (confirm(`هل تريد الاتصال بالرقم ${phone}؟`)) {
      window.open(`tel:${phone}`);
    }
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشطة';
      case 'pending': return 'معلقة';
      case 'suspended': return 'موقوفة';
      default: return 'غير محدد';
    }
  };

  const handleExportReport = () => {
    const reportData = {
      date: new Date().toISOString(),
      totalOrganizations,
      activeOrganizations,
      pendingOrganizations,
      totalBeneficiaries,
      organizations: filteredOrganizations
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_المؤسسات_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير تقرير المؤسسات بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
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
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">البيانات الوهمية محملة ({organizations.length} مؤسسة)</span>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3 space-x-reverse">
          <Button
            variant="success"
            icon={Download}
            iconPosition="right"
            onClick={() => setShowExportModal(true)}
          >
            تصدير المؤسسات
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            iconPosition="right"
            onClick={handleAddNew}
          >
            إضافة مؤسسة جديدة
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
            placeholder="البحث في المؤسسات (الاسم، النوع، الموقع)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-2"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة المؤسسة</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشطة</option>
              <option value="pending">معلقة</option>
              <option value="suspended">موقوفة</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <Building2 className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">إجمالي المؤسسات</p>
            <p className="text-2xl font-bold text-blue-900">{totalOrganizations}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-xl mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm text-green-600">مؤسسات نشطة</p>
            <p className="text-2xl font-bold text-green-900">{activeOrganizations}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="bg-yellow-100 p-3 rounded-xl mb-2">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto" />
            </div>
            <p className="text-sm text-yellow-600">معلقة</p>
            <p className="text-2xl font-bold text-yellow-900">{pendingOrganizations}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-xl mb-2">
              <Users className="w-6 h-6 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm text-purple-600">إجمالي المستفيدين</p>
            <p className="text-2xl font-bold text-purple-900">{totalBeneficiaries}</p>
          </div>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">قائمة المؤسسات ({filteredOrganizations.length})</h3>
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
                    المؤسسة
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الموقع
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    جهة الاتصال
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستفيدين
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
                {filteredOrganizations.length > 0 ? (
                  filteredOrganizations.map((organization) => (
                    <tr key={organization.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-xl ml-4">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{organization.name}</div>
                            <div className="text-sm text-gray-500">
                              تاريخ التسجيل: {new Date(organization.createdAt).toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {organization.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{organization.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{organization.contactPerson}</div>
                          <div className="text-gray-500">{organization.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{organization.beneficiariesCount}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {organization.packagesCount} طرد
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(organization.status)}`}>
                          {getStatusText(organization.status)}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {organization.completionRate}% إنجاز
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleView(organization)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(organization)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors" 
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCall(organization.phone)}
                            className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 transition-colors" 
                            title="اتصال"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEmail(organization.email)}
                            className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors" 
                            title="إرسال بريد إلكتروني"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(organization)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors" 
                            title="حذف المؤسسة"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">
                          {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد مؤسسات'}
                        </p>
                        <p className="text-sm mt-2">
                          {searchTerm ? 'جرب تعديل مصطلح البحث' : 'لم يتم إضافة أي مؤسسات بعد'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </Card>

      {/* Modal for Add/Edit/View */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'add' ? 'إضافة مؤسسة جديدة' :
            modalType === 'edit' ? 'تعديل بيانات المؤسسة' :
            'عرض تفاصيل المؤسسة'
          }
          size="lg"
        >
          <div className="p-6">
            {(modalType === 'add' || modalType === 'edit') && (
              <OrganizationForm
                organization={modalType === 'edit' ? selectedOrganization : null}
                onSave={handleSaveOrganization}
                onCancel={handleCancelOrganization}
              />
            )}
            
            {modalType === 'view' && selectedOrganization && (
              <div className="space-y-6">
                {/* Organization Details */}
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="text-lg font-bold text-blue-800 mb-4">تفاصيل المؤسسة</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div>
                        <span className="text-blue-700">اسم المؤسسة:</span>
                        <span className="font-medium text-blue-900 mr-2">{selectedOrganization.name}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">النوع:</span>
                        <span className="font-medium text-blue-900 mr-2">{selectedOrganization.type}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">الموقع:</span>
                        <span className="font-medium text-blue-900 mr-2">{selectedOrganization.location}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">الحالة:</span>
                        <Badge 
                          variant={
                          selectedOrganization.status === 'active' ? 'success' :
                          selectedOrganization.status === 'pending' ? 'warning' : 'error'
                          } 
                          size="sm" 
                          className="mr-2"
                        >
                          {getStatusText(selectedOrganization.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-blue-700">شخص الاتصال:</span>
                        <span className="font-medium text-blue-900 mr-2">{selectedOrganization.contactPerson}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">الهاتف:</span>
                        <span className="font-medium text-blue-900 mr-2">{selectedOrganization.phone}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">البريد الإلكتروني:</span>
                        <span className="font-medium text-blue-900 mr-2">{selectedOrganization.email}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">تاريخ التسجيل:</span>
                        <span className="font-medium text-blue-900 mr-2">
                          {new Date(selectedOrganization.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h4 className="text-lg font-bold text-green-800 mb-4">إحصائيات المؤسسة</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="bg-green-100 p-3 rounded-lg mb-2">
                        <Users className="w-6 h-6 text-green-600 mx-auto" />
                      </div>
                      <p className="text-green-700">المستفيدين</p>
                      <p className="text-2xl font-bold text-green-900">{selectedOrganization.beneficiariesCount}</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-green-100 p-3 rounded-lg mb-2">
                        <Package className="w-6 h-6 text-green-600 mx-auto" />
                      </div>
                      <p className="text-green-700">الطرود</p>
                      <p className="text-2xl font-bold text-green-900">{selectedOrganization.packagesCount}</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-green-100 p-3 rounded-lg mb-2">
                        <BarChart3 className="w-6 h-6 text-green-600 mx-auto" />
                      </div>
                      <p className="text-green-700">نسبة الإنجاز</p>
                      <p className="text-2xl font-bold text-green-900">{selectedOrganization.completionRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 space-x-reverse justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                  >
                    إغلاق
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setModalType('edit');
                    }}
                  >
                    تعديل البيانات
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
          data={filteredOrganizations}
          title="قائمة المؤسسات"
          defaultFilename={`قائمة_المؤسسات_${new Date().toISOString().split('T')[0]}`}
          availableFields={[
            { key: 'name', label: 'اسم المؤسسة' },
            { key: 'type', label: 'النوع' },
            { key: 'location', label: 'الموقع' },
            { key: 'contactPerson', label: 'شخص الاتصال' },
            { key: 'phone', label: 'الهاتف' },
            { key: 'email', label: 'البريد الإلكتروني' },
            { key: 'beneficiariesCount', label: 'عدد المستفيدين' },
            { key: 'packagesCount', label: 'عدد الطرود' },
            { key: 'completionRate', label: 'نسبة الإنجاز' },
            { key: 'status', label: 'الحالة' },
            { key: 'createdAt', label: 'تاريخ التسجيل' }
          ]}
          filters={{ statusFilter, searchTerm }}
        />
      )}
    </div>
  );
}