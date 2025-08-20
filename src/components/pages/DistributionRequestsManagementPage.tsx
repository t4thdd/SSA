import React, { useState } from 'react';
import { Send, Search, Filter, Eye, CheckCircle, XCircle, Clock, AlertTriangle, Building2, Heart, User, Package, MapPin, Calendar, Download, RefreshCw, Star, Activity, FileText, Truck, Edit } from 'lucide-react';
import { 
  mockDistributionRequests, 
  mockBeneficiaries, 
  mockPackageTemplates, 
  mockCouriers,
  mockOrganizations,
  mockFamilies,
  type DistributionRequest,
  type Beneficiary,
  type PackageTemplate,
  type Courier
} from '../../data/mockData';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal, ExportModal } from '../ui';
import DistributionRequestReview from '../DistributionRequestReview';

export default function DistributionRequestsManagementPage() {
  const { logInfo, logError } = useErrorLogger();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'review' | 'view' | 'track'>('review');
  const [selectedRequest, setSelectedRequest] = useState<DistributionRequest | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // استخدام البيانات الوهمية مباشرة
  const [distributionRequests, setDistributionRequests] = useState<DistributionRequest[]>(mockDistributionRequests);
  const beneficiaries = mockBeneficiaries;
  const packageTemplates = mockPackageTemplates;
  const couriers = mockCouriers;
  const organizations = mockOrganizations;
  const families = mockFamilies;

  // فلترة طلبات التوزيع
  const filteredRequests = distributionRequests.filter(request => {
    // فلترة البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesRequester = request.requesterName.toLowerCase().includes(searchLower);
      const matchesId = request.id.toLowerCase().includes(searchLower);
      const template = packageTemplates.find(t => t.id === request.packageTemplateId);
      const matchesTemplate = template?.name.toLowerCase().includes(searchLower);
      
      if (!matchesRequester && !matchesId && !matchesTemplate) {
        return false;
      }
    }

    // فلترة الحالة
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false;
    }

    // فلترة النوع
    if (typeFilter !== 'all' && request.type !== typeFilter) {
      return false;
    }

    // فلترة الأولوية
    if (priorityFilter !== 'all' && request.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  // إحصائيات
  const statistics = {
    total: distributionRequests.length,
    pending: distributionRequests.filter(r => r.status === 'pending').length,
    approved: distributionRequests.filter(r => r.status === 'approved').length,
    rejected: distributionRequests.filter(r => r.status === 'rejected').length,
    inProgress: distributionRequests.filter(r => r.status === 'in_progress').length,
    completed: distributionRequests.filter(r => r.status === 'completed').length,
    urgent: distributionRequests.filter(r => r.priority === 'urgent' && r.status === 'pending').length
  };

  const handleReviewRequest = (request: DistributionRequest) => {
    setSelectedRequest(request);
    setModalType('review');
    setShowModal(true);
  };

  const handleViewRequest = (request: DistributionRequest) => {
    setSelectedRequest(request);
    setModalType('view');
    setShowModal(true);
  };

  const handleApproveRequest = async (requestId: string, approvedQuantity: number, courierId: string, adminNotes?: string) => {
    try {
      // محاكاة الموافقة على الطلب
      const updatedRequests = distributionRequests.map(request => 
        request.id === requestId 
          ? {
              ...request,
              status: 'approved' as DistributionRequest['status'],
              approvedQuantity,
              assignedCourierId: courierId,
              adminNotes,
              approvedBy: 'admin',
              approvalDate: new Date().toISOString()
            }
          : request
      );

      setDistributionRequests(updatedRequests);
      
      // محاكاة إنشاء مهام التسليم
      const approvedRequest = updatedRequests.find(r => r.id === requestId);
      if (approvedRequest) {
        // هنا سيتم إنشاء المهام الفعلية في mockTasks
        logInfo(`تمت الموافقة على طلب التوزيع وإنشاء ${approvedQuantity} مهمة`, 'DistributionRequestsManagementPage');
      }
      
      setNotification({
        message: `تمت الموافقة على الطلب وإنشاء ${approvedQuantity} مهمة تسليم`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
      
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) {
      logError(error as Error, 'DistributionRequestsManagementPage');
      setNotification({ message: 'حدث خطأ في الموافقة على الطلب', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleRejectRequest = async (requestId: string, rejectionReason: string) => {
    try {
      // محاكاة رفض الطلب
      const updatedRequests = distributionRequests.map(request => 
        request.id === requestId 
          ? {
              ...request,
              status: 'rejected' as DistributionRequest['status'],
              rejectionReason,
              approvedBy: 'admin',
              approvalDate: new Date().toISOString()
            }
          : request
      );

      setDistributionRequests(updatedRequests);
      
      setNotification({
        message: 'تم رفض طلب التوزيع وإشعار مقدم الطلب',
        type: 'warning'
      });
      setTimeout(() => setNotification(null), 3000);
      
      setShowModal(false);
      setSelectedRequest(null);
      logInfo(`تم رفض طلب التوزيع: ${requestId}`, 'DistributionRequestsManagementPage');
    } catch (error) {
      logError(error as Error, 'DistributionRequestsManagementPage');
      setNotification({ message: 'حدث خطأ في رفض الطلب', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'normal': return 'عادي';
      case 'low': return 'منخفض';
      default: return 'غير محدد';
    }
  };

  const getRequesterIcon = (type: string) => {
    switch (type) {
      case 'organization': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'family': return <Heart className="w-4 h-4 text-purple-600" />;
      case 'admin': return <User className="w-4 h-4 text-gray-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
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

  const handleExportRequests = () => {
    const exportData = {
      date: new Date().toISOString(),
      totalRequests: distributionRequests.length,
      filteredRequests: filteredRequests.length,
      statistics,
      requests: filteredRequests.map(request => {
        const template = packageTemplates.find(t => t.id === request.packageTemplateId);
        const requesterInfo = request.requesterType === 'organization' 
          ? organizations.find(o => o.id === request.requesterId)
          : request.requesterType === 'family'
          ? families.find(f => f.id === request.requesterId)
          : null;
        
        return {
          id: request.id,
          requester: requesterInfo?.name || request.requesterName,
          requesterType: request.requesterType,
          type: getTypeText(request.type),
          template: template?.name || 'غير محدد',
          requestedQuantity: request.requestedQuantity,
          approvedQuantity: request.approvedQuantity || 'غير محدد',
          status: getStatusText(request.status),
          priority: getPriorityText(request.priority),
          targetArea: request.targetGovernorate && request.targetCity && request.targetDistrict
            ? `${request.targetGovernorate} - ${request.targetCity} - ${request.targetDistrict}`
            : 'غير محدد',
          requestDate: request.requestDate,
          approvalDate: request.approvalDate || 'غير محدد',
          estimatedCost: request.estimatedCost || 0,
          notes: request.notes || 'لا توجد ملاحظات',
          adminNotes: request.adminNotes || 'لا توجد ملاحظات'
        };
      })
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `طلبات_التوزيع_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير طلبات التوزيع بنجاح', type: 'success' });
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
            البيانات الوهمية محملة - {distributionRequests.length} طلب توزيع
          </span>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3 space-x-reverse">
          <Button variant="success" icon={Download} iconPosition="right" onClick={handleExportRequests}>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الأولويات</option>
              <option value="urgent">عاجل</option>
              <option value="high">عالي</option>
              <option value="normal">عادي</option>
              <option value="low">منخفض</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <Send className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">إجمالي الطلبات</p>
            <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
          </div>
        </Card>

        <Card className="bg-yellow-50">
          <div className="text-center">
            <div className="bg-yellow-100 p-3 rounded-xl mb-2">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto" />
            </div>
            <p className="text-sm text-yellow-600">معلقة</p>
            <p className="text-2xl font-bold text-yellow-900">{statistics.pending}</p>
          </div>
        </Card>

        <Card className="bg-green-50">
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-xl mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm text-green-600">معتمدة</p>
            <p className="text-2xl font-bold text-green-900">{statistics.approved}</p>
          </div>
        </Card>

        <Card className="bg-red-50">
          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-xl mb-2">
              <XCircle className="w-6 h-6 text-red-600 mx-auto" />
            </div>
            <p className="text-sm text-red-600">مرفوضة</p>
            <p className="text-2xl font-bold text-red-900">{statistics.rejected}</p>
          </div>
        </Card>

        <Card className="bg-purple-50">
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-xl mb-2">
              <Activity className="w-6 h-6 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm text-purple-600">قيد التنفيذ</p>
            <p className="text-2xl font-bold text-purple-900">{statistics.inProgress}</p>
          </div>
        </Card>

        <Card className="bg-orange-50">
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-xl mb-2">
              <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm text-orange-600">عاجلة</p>
            <p className="text-2xl font-bold text-orange-900">{statistics.urgent}</p>
          </div>
        </Card>
      </div>

      {/* Urgent Requests Alert */}
      {statistics.urgent > 0 && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">طلبات عاجلة تحتاج مراجعة فورية!</h3>
              <p className="text-red-700 text-sm mt-1">
                يوجد {statistics.urgent} طلب توزيع عاجل في انتظار المراجعة
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Requests Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">طلبات التوزيع ({filteredRequests.length})</h3>
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
                  الحالة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الأولوية
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الطلب
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => {
                  const template = packageTemplates.find(t => t.id === request.packageTemplateId);
                  const requesterInfo = request.requesterType === 'organization' 
                    ? organizations.find(o => o.id === request.requesterId)
                    : request.requesterType === 'family'
                    ? families.find(f => f.id === request.requesterId)
                    : null;

                  return (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg ml-4">
                            <Send className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              طلب #{request.id.slice(-6)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {template?.name || 'قالب غير محدد'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getRequesterIcon(request.requesterType)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {requesterInfo?.name || request.requesterName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.requesterType === 'organization' ? 'مؤسسة' :
                               request.requesterType === 'family' ? 'عائلة' : 'أدمن'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          request.type === 'bulk' ? 'info' :
                          request.type === 'family_bulk' ? 'warning' : 'success'
                        } size="sm">
                          {getTypeText(request.type)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <span className="font-medium">
                            {request.approvedQuantity || request.requestedQuantity}
                          </span>
                          {request.approvedQuantity && request.approvedQuantity !== request.requestedQuantity && (
                            <span className="text-orange-600 text-xs mr-1">
                              (كان {request.requestedQuantity})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          request.status === 'approved' ? 'success' :
                          request.status === 'rejected' ? 'error' :
                          request.status === 'in_progress' ? 'warning' :
                          request.status === 'completed' ? 'success' : 'info'
                        } size="sm">
                          {getStatusText(request.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          request.priority === 'urgent' ? 'error' :
                          request.priority === 'high' ? 'warning' :
                          request.priority === 'normal' ? 'info' : 'neutral'
                        } size="sm">
                          {getPriorityText(request.priority)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.requestDate).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          {request.status === 'pending' ? (
                            <button 
                              onClick={() => handleReviewRequest(request)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                              title="مراجعة الطلب"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleViewRequest(request)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {request.status === 'approved' && (
                            <button 
                              className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors" 
                              title="تتبع التنفيذ"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Send className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' 
                          ? 'لا توجد طلبات مطابقة للفلاتر' 
                          : 'لا توجد طلبات توزيع'}
                      </p>
                      <p className="text-sm mt-2">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all'
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

      {/* Modal for Request Operations */}
      {showModal && selectedRequest && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'review' ? 'مراجعة طلب التوزيع' :
            modalType === 'view' ? 'تفاصيل طلب التوزيع' :
            'تتبع التنفيذ'
          }
          size="xl"
        >
          <div className="p-6">
            {modalType === 'review' && (
              <DistributionRequestReview
                request={selectedRequest}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                onClose={() => setShowModal(false)}
              />
            )}

            {modalType === 'view' && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3">تفاصيل الطلب</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">مقدم الطلب:</span>
                      <span className="font-medium text-gray-900 mr-2">{selectedRequest.requesterName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">نوع الطلب:</span>
                      <span className="font-medium text-gray-900 mr-2">{getTypeText(selectedRequest.type)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">الحالة:</span>
                      <Badge variant={
                        selectedRequest.status === 'approved' ? 'success' :
                        selectedRequest.status === 'rejected' ? 'error' :
                        selectedRequest.status === 'in_progress' ? 'warning' :
                        selectedRequest.status === 'completed' ? 'success' : 'info'
                      } size="sm" className="mr-2">
                        {getStatusText(selectedRequest.status)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">تاريخ الطلب:</span>
                      <span className="font-medium text-gray-900 mr-2">
                        {new Date(selectedRequest.requestDate).toLocaleDateString('ar-SA')}
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
          </div>
        </Modal>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          data={filteredRequests.map(request => {
            const template = packageTemplates.find(t => t.id === request.packageTemplateId);
            const requesterInfo = request.requesterType === 'organization' 
              ? organizations.find(o => o.id === request.requesterId)
              : request.requesterType === 'family'
              ? families.find(f => f.id === request.requesterId)
              : null;
            
            return {
              id: request.id,
              requester: requesterInfo?.name || request.requesterName,
              requesterType: request.requesterType,
              type: getTypeText(request.type),
              template: template?.name || 'غير محدد',
              requestedQuantity: request.requestedQuantity,
              approvedQuantity: request.approvedQuantity || 'غير محدد',
              status: getStatusText(request.status),
              priority: getPriorityText(request.priority),
              targetArea: request.targetGovernorate && request.targetCity && request.targetDistrict
                ? `${request.targetGovernorate} - ${request.targetCity} - ${request.targetDistrict}`
                : 'غير محدد',
              requestDate: request.requestDate,
              approvalDate: request.approvalDate || 'غير محدد',
              estimatedCost: request.estimatedCost || 0,
              notes: request.notes || 'لا توجد ملاحظات',
              adminNotes: request.adminNotes || 'لا توجد ملاحظات'
            };
          })}
          title="طلبات التوزيع"
          defaultFilename={`طلبات_التوزيع_${new Date().toISOString().split('T')[0]}`}
          availableFields={[
            { key: 'id', label: 'معرف الطلب' },
            { key: 'requester', label: 'مقدم الطلب' },
            { key: 'requesterType', label: 'نوع مقدم الطلب' },
            { key: 'type', label: 'نوع الطلب' },
            { key: 'template', label: 'قالب الطرد' },
            { key: 'requestedQuantity', label: 'الكمية المطلوبة' },
            { key: 'approvedQuantity', label: 'الكمية المعتمدة' },
            { key: 'status', label: 'الحالة' },
            { key: 'priority', label: 'الأولوية' },
            { key: 'targetArea', label: 'المنطقة المستهدفة' },
            { key: 'requestDate', label: 'تاريخ الطلب' },
            { key: 'approvalDate', label: 'تاريخ الموافقة' },
            { key: 'estimatedCost', label: 'التكلفة المقدرة' },
            { key: 'notes', label: 'ملاحظات' },
            { key: 'adminNotes', label: 'ملاحظات الأدمن' }
          ]}
          filters={{ statusFilter, typeFilter, priorityFilter, searchTerm }}
        />
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Send className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات إدارة طلبات التوزيع</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>الطلبات العاجلة تحتاج مراجعة فورية ولها أولوية في المعالجة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن تعديل الكمية المعتمدة حسب المخزون المتاح</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>اختيار المندوب يتم بناءً على المنطقة الجغرافية والحالة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>عند الموافقة، يتم إنشاء مهام التسليم تلقائياً</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}