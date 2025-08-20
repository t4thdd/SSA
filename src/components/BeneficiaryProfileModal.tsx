import React, { useState } from 'react';
import { X, User, Phone, MapPin, Calendar, Shield, Package, FileText, CheckCircle, AlertTriangle, Clock, Edit, Eye, Download, UserPlus, UserX, Star, Award, Truck, Camera, FileSignature as Signature, Building2, Heart, Activity, Archive, Send, MessageSquare, ZoomIn, ExternalLink, Copy, CheckCircle2, Users, Upload, Ban, FileCheck, Navigation, List } from 'lucide-react';
import { 
  type Beneficiary, 
  mockPackages, 
  mockTasks, 
  mockCouriers, 
  mockActivityLog,
  type Package as PackageType,
  type Task,
  type Courier,
  type ActivityLog,
  type DistributionRequest,
  mockDistributionRequests,
  mockPackageTemplates,
  mockOrganizations,
  mockFamilies
} from '../data/mockData';
import { Modal, Button, Input, Badge } from './ui';

interface BeneficiaryProfileModalProps {
  beneficiary: Beneficiary;
  onClose: () => void;
  onNavigateToIndividualSend?: (beneficiaryId: string) => void;
  onEditBeneficiary?: (beneficiary: Beneficiary) => void;
}

export default function BeneficiaryProfileModal({ beneficiary, onClose, onNavigateToIndividualSend, onEditBeneficiary }: BeneficiaryProfileModalProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [showPackageDetails, setShowPackageDetails] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionData, setActionData] = useState<any>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('success');

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get related data
  const beneficiaryPackages = mockPackages.filter(p => p.beneficiaryId === beneficiary.id);
  const beneficiaryTasks = mockTasks.filter(t => t.beneficiaryId === beneficiary.id);
  const beneficiaryActivities = mockActivityLog.filter(a => a.beneficiaryId === beneficiary.id);
  const relatedDistributionRequests = mockDistributionRequests.filter(request => 
    request.beneficiaryIds?.includes(beneficiary.id) || 
    (request.type === 'bulk' && 
     beneficiary.detailedAddress.governorate === request.targetGovernorate &&
     beneficiary.detailedAddress.city === request.targetCity &&
     beneficiary.detailedAddress.district === request.targetDistrict)
  );
  const currentTask = beneficiaryTasks.find(t => ['assigned', 'in_progress'].includes(t.status));
  const currentCourier = currentTask ? mockCouriers.find(c => c.id === currentTask.courierId) : null;
  const lastDeliveredTask = beneficiaryTasks.find(t => t.status === 'delivered');
  const lastCourier = lastDeliveredTask ? mockCouriers.find(c => c.id === lastDeliveredTask.courierId) : null;

  const sections = [
    { id: 'overview', name: 'نظرة عامة', icon: User },
    { id: 'packages', name: 'سجل الطرود', icon: Package },
    { id: 'verification', name: 'التوثيقات', icon: Shield },
    { id: 'delivery', name: 'حالة التوصيل', icon: Truck },
    { id: 'activity', name: 'سجل النشاط', icon: Activity },
    { id: 'distribution-requests', name: 'طلبات التوزيع', icon: List },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getMaritalStatusText = (status: string) => {
    const statuses = {
      'single': 'أعزب',
      'married': 'متزوج',
      'divorced': 'مطلق',
      'widowed': 'أرمل'
    };
    return statuses[status] || status;
  };

  const getEconomicLevelText = (level: string) => {
    const levels = {
      'very_poor': 'فقير جداً',
      'poor': 'فقير',
      'moderate': 'متوسط',
      'good': 'ميسور'
    };
    return levels[level] || level;
  };

  const getCategoryText = (category: string) => {
    const categories = {
      'poor': 'فقير',
      'widow': 'أرملة',
      'orphan': 'يتيم',
      'disabled': 'ذوي احتياجات خاصة',
      'emergency': 'حالة طوارئ',
      'other': 'أخرى'
    };
    return categories[category] || category;
  };

  const handleImageView = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const showNotificationMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const showConfirmDialog = (message: string, onConfirm: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
    setShowConfirmModal(true);
  };

  const handleAction = (action: string, data?: any) => {
    switch (action) {
      case 'edit':
        if (onEditBeneficiary) {
          onEditBeneficiary(beneficiary);
          onClose();
        } else {
          console.warn('onEditBeneficiary function not provided');
        }
        break;
      case 'new-package':
        if (onNavigateToIndividualSend) {
          onNavigateToIndividualSend(beneficiary.id);
          onClose();
        } else {
          console.warn('onNavigateToIndividualSend function not provided');
        }
        break;
      case 'suspend':
        showConfirmDialog(
          'هل أنت متأكد من إيقاف/تجميد حساب المستفيد؟ سيتم منع المستفيد من استلام أي طرود جديدة.',
          () => {
            showNotificationMessage('تم إيقاف الحساب مؤقتاً', 'success');
            setShowConfirmModal(false);
          }
        );
        break;
      case 'approve-identity':
        showConfirmDialog(
          'هل أنت متأكد من اعتماد هوية المستفيد؟ سيتم تفعيل الحساب للاستفادة من الخدمات.',
          () => {
            showNotificationMessage('تم اعتماد الهوية بنجاح', 'success');
            setShowConfirmModal(false);
          }
        );
        break;
      case 'reject-identity':
        setActionType('reject-identity');
        setActionData({ reason: '' });
        setShowActionModal(true);
        break;
      case 'request-reupload':
        showConfirmDialog(
          'هل تريد إرسال طلب إعادة رفع الوثائق للمستفيد؟ سيتم إرسال رسالة نصية للمستفيد.',
          () => {
            showNotificationMessage('تم إرسال طلب إعادة رفع الوثائق للمستفيد', 'success');
            setShowConfirmModal(false);
          }
        );
        break;
      case 'track-courier':
        setActionType('track-courier');
        setShowActionModal(true);
        break;
      case 'export-activity':
        setActionType('export-activity');
        setShowActionModal(true);
        break;
      case 'view-documents':
        setActionType('view-documents');
        setShowActionModal(true);
        break;
      default:
        showNotificationMessage(`تم تنفيذ الإجراء: ${action}`, 'info');
    }
  };

  const handleActionSubmit = () => {
    switch (actionType) {
      case 'reject-identity':
        if (actionData.reason && actionData.reason.trim()) {
          showNotificationMessage(`تم رفض الهوية. السبب: ${actionData.reason}`, 'success');
          setShowActionModal(false);
          setActionData({});
        } else {
          showNotificationMessage('يرجى إدخال سبب الرفض', 'error');
        }
        break;
      case 'track-courier':
        showNotificationMessage('سيتم فتح خريطة تتبع المندوب في نافذة جديدة', 'info');
        setShowActionModal(false);
        break;
      case 'export-activity':
        // محاكاة تصدير سجل النشاط
        const activityData = {
          beneficiary: beneficiary.name,
          activities: beneficiaryActivities,
          exportDate: new Date().toISOString()
        };
        const dataStr = JSON.stringify(activityData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `سجل_النشاط_${beneficiary.name}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showNotificationMessage('تم تصدير سجل النشاط بنجاح', 'success');
        setShowActionModal(false);
        break;
      case 'view-documents':
        showNotificationMessage('سيتم فتح عارض المستندات', 'info');
        setShowActionModal(false);
        break;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      dir="rtl"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="bg-blue-100 p-3 rounded-xl">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{beneficiary.name}</h2>
              <p className="text-gray-600">بطاقة معلومات المستفيد الشاملة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Badges */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getIdentityColor(beneficiary.identityStatus)}`}>
              <Shield className="w-4 h-4 ml-2" />
              {beneficiary.identityStatus === 'verified' ? 'موثق الهوية' :
               beneficiary.identityStatus === 'pending' ? 'في انتظار التوثيق' : 'مرفوض التوثيق'}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(beneficiary.status)}`}>
              <User className="w-4 h-4 ml-2" />
              {beneficiary.status === 'active' ? 'نشط' :
               beneficiary.status === 'pending' ? 'معلق' : 'موقوف'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex space-x-8 space-x-reverse overflow-x-auto">
            {sections.map((section) => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 space-x-reverse px-1 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4 ml-2" />
                  <span>{section.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <User className="w-6 h-6 ml-2 text-blue-600" />
                  البيانات الأساسية للمستفيد
                </h3>
                
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Personal Info */}
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">الاسم الكامل</label>
                          <p className="text-lg font-bold text-gray-900">{beneficiary.fullName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">رقم الهوية</label>
                          <p className="text-lg font-bold text-gray-900">{beneficiary.nationalId}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">رقم الهاتف</label>
                          <p className="text-lg font-bold text-gray-900">{beneficiary.phone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">تاريخ الميلاد</label>
                          <p className="text-lg font-bold text-gray-900">{new Date(beneficiary.dateOfBirth).toLocaleDateString('ar-SA')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Identity Image */}
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <label className="text-sm font-medium text-gray-600 mb-3 block">صورة الهوية</label>
                      {beneficiary.identityImageUrl ? (
                        <div className="relative">
                          <img 
                            src="https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop"
                            alt="صورة الهوية"
                            className="w-full h-32 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            onClick={() => handleImageView(beneficiary.identityImageUrl!)}
                            className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-colors"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <Camera className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">لم يتم رفع صورة الهوية</p>
                          </div>
                        </div>
                      )}
                      <button 
                        onClick={() => handleAction('view-documents')}
                        className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <Archive className="w-4 h-4 ml-2" />
                        عرض جميع الملفات المرفقة ({beneficiary.additionalDocuments.length + 1})
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal and Social Data */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Heart className="w-6 h-6 ml-2 text-purple-600" />
                  البيانات الشخصية والاجتماعية
                </h3>
                
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Address Information */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPin className="w-5 h-5 ml-2 text-green-600" />
                      العنوان الكامل
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">المحافظة:</span>
                        <span className="font-medium text-gray-900">{beneficiary.detailedAddress.governorate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المدينة:</span>
                        <span className="font-medium text-gray-900">{beneficiary.detailedAddress.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الحي:</span>
                        <span className="font-medium text-gray-900">{beneficiary.detailedAddress.district}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الشارع:</span>
                        <span className="font-medium text-gray-900">{beneficiary.detailedAddress.street}</span>
                      </div>
                      {beneficiary.detailedAddress.additionalInfo && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">معلومات إضافية:</span>
                          <span className="font-medium text-gray-900">{beneficiary.detailedAddress.additionalInfo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Information */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 ml-2 text-purple-600" />
                      المعلومات الاجتماعية
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">عدد أفراد الأسرة:</span>
                        <span className="font-medium text-gray-900">{beneficiary.membersCount} فرد</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المهنة:</span>
                        <span className="font-medium text-gray-900">{beneficiary.profession}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الحالة الاجتماعية:</span>
                        <span className="font-medium text-gray-900">{getMaritalStatusText(beneficiary.maritalStatus)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المستوى الاقتصادي:</span>
                        <span className="font-medium text-gray-900">{getEconomicLevelText(beneficiary.economicLevel)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ التسجيل:</span>
                        <span className="font-medium text-gray-900">{new Date(beneficiary.createdAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {beneficiary.notes && (
                  <div className="mt-6 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FileText className="w-5 h-5 ml-2 text-yellow-600" />
                      ملاحظات
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{beneficiary.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Packages Section */}
          {activeSection === 'packages' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Package className="w-6 h-6 ml-2 text-green-600" />
                  سجل الطرود المستلمة ({beneficiaryPackages.length})
                </h3>
                
                {beneficiaryPackages.length > 0 ? (
                  <div className="space-y-4">
                    {beneficiaryPackages.map((pkg) => {
                      const task = beneficiaryTasks.find(t => t.packageId === pkg.id);
                      const courier = task ? mockCouriers.find(c => c.id === task.courierId) : null;
                      
                      return (
                        <div key={pkg.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <Package className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                                <p className="text-sm text-gray-600">{pkg.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{pkg.value} ₪</p>
                              <p className="text-sm text-gray-600">{pkg.funder}</p>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">تاريخ الاستلام:</span>
                              <p className="font-medium text-gray-900">{new Date(pkg.createdAt).toLocaleDateString('ar-SA')}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">المندوب:</span>
                              <p className="font-medium text-gray-900">{courier?.name || 'غير محدد'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">حالة التوصيل:</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                pkg.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                pkg.status === 'in_delivery' ? 'bg-blue-100 text-blue-800' :
                                pkg.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {pkg.status === 'delivered' ? 'تم التسليم' :
                                 pkg.status === 'in_delivery' ? 'قيد التوصيل' :
                                 pkg.status === 'failed' ? 'فشل التسليم' : 'معلق'}
                              </span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setShowPackageDetails(pkg.id)}
                            className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            عرض تفاصيل الطرد
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">لا توجد طرود مسجلة</p>
                    <p className="text-sm">لم يستلم هذا المستفيد أي طرود بعد</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Section */}
          {activeSection === 'verification' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Shield className="w-6 h-6 ml-2 text-purple-600" />
                  التوثيقات والتحقق (KYC)
                </h3>
                
                {/* Verification Status */}
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-purple-800 mb-2">حالة التحقق</h4>
                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getIdentityColor(beneficiary.identityStatus)}`}>
                        {beneficiary.identityStatus === 'verified' ? (
                          <CheckCircle className="w-4 h-4 ml-2" />
                        ) : beneficiary.identityStatus === 'pending' ? (
                          <Clock className="w-4 h-4 ml-2" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 ml-2" />
                        )}
                        {beneficiary.identityStatus === 'verified' ? 'تم التحقق' :
                         beneficiary.identityStatus === 'pending' ? 'بانتظار المراجعة' : 'مرفوض'}
                      </span>
                    </div>
                    {beneficiary.identityStatus === 'pending' && (
                      <div className="flex space-x-2 space-x-reverse">
                        <button 
                          onClick={() => handleAction('approve-identity')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 ml-2" />
                          اعتماد
                        </button>
                        <button 
                          onClick={() => handleAction('reject-identity')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center"
                        >
                          <AlertTriangle className="w-4 h-4 ml-2" />
                          رفض
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Required Documents */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4">المستندات المطلوبة</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">صورة الهوية (وجهان)</span>
                        </div>
                        <button 
                          onClick={() => handleImageView(beneficiary.identityImageUrl!)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          عرض
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">صورة شخصية</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm">
                          عرض
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium">إثبات سكن (اختياري)</span>
                        </div>
                        <button className="text-gray-400 text-sm">
                          غير مرفوع
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Documents */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4">مستندات إضافية</h4>
                    <div className="space-y-3">
                      {beneficiary.additionalDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">{doc.name}</span>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center">
                            <ExternalLink className="w-3 h-3 ml-1" />
                            عرض
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Staff Actions */}
                {beneficiary.identityStatus !== 'verified' && (
                  <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">إجراءات موظف الدعم</h4>
                    <div className="flex space-x-3 space-x-reverse">
                      <button 
                        onClick={() => handleAction('view-files')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Eye className="w-4 h-4 ml-2" />
                        عرض الملفات
                      </button>
                      <button 
                        onClick={() => handleAction('request-reupload')}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center"
                      >
                        <Upload className="w-4 h-4 ml-2" />
                        طلب إعادة الرفع
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Delivery Status */}
          {activeSection === 'delivery' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Truck className="w-6 h-6 ml-2 text-orange-600" />
                  حالة التوصيل الحالية
                </h3>
                
                {currentTask && currentCourier ? (
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-orange-800 mb-4">معلومات المندوب</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-orange-700">اسم المندوب:</span>
                            <span className="font-medium text-orange-900">{currentCourier.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700">رقم الهاتف:</span>
                            <span className="font-medium text-orange-900">{currentCourier.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700">التقييم:</span>
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-medium text-orange-900">{currentCourier.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-orange-800 mb-4">تفاصيل التوصيل</h4>
                        <div className="space-y-2 text-sm">
                          {currentTask.estimatedArrivalTime && (
                            <div className="flex justify-between">
                              <span className="text-orange-700">وقت الوصول المتوقع:</span>
                              <span className="font-medium text-orange-900">
                                {new Date(currentTask.estimatedArrivalTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          {currentTask.remainingDistance && (
                            <div className="flex justify-between">
                              <span className="text-orange-700">المسافة المتبقية:</span>
                              <span className="font-medium text-orange-900">{currentTask.remainingDistance} كم</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-orange-700">حالة المهمة:</span>
                            <span className="font-medium text-orange-900">
                              {currentTask.status === 'in_progress' ? 'في الطريق' : 'مُعيّن'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleAction('track-courier')}
                      className="w-full mt-4 bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center"
                    >
                      <Navigation className="w-4 h-4 ml-2" />
                      عرض موقع المندوب على الخريطة
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">لا توجد مهام توصيل نشطة</p>
                    <p className="text-sm">لا يوجد طرود قيد التوصيل حالياً</p>
                  </div>
                )}

                {/* Last Delivery Documentation */}
                {lastDeliveredTask && lastCourier && (
                  <div className="mt-8 bg-green-50 p-6 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                      <Award className="w-5 h-5 ml-2" />
                      توثيقات آخر تسليم
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-green-800 mb-3">بيانات المندوب</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-700">الاسم الثلاثي:</span>
                            <span className="font-medium text-green-900">{lastCourier.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">رقم الهاتف:</span>
                            <span className="font-medium text-green-900">{lastCourier.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">التقييم:</span>
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-medium text-green-900">{lastCourier.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-green-800 mb-3">تفاصيل العملية</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-700">تاريخ التسليم:</span>
                            <span className="font-medium text-green-900">
                              {lastDeliveredTask.deliveredAt ? new Date(lastDeliveredTask.deliveredAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">وقت التسليم:</span>
                            <span className="font-medium text-green-900">
                              {lastDeliveredTask.deliveredAt ? new Date(lastDeliveredTask.deliveredAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'غير محدد'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Proof */}
                    <div className="mt-6">
                      <h5 className="font-medium text-green-800 mb-3">إثبات التسليم</h5>
                      <div className="grid md:grid-cols-3 gap-4">
                        {lastDeliveredTask.digitalSignatureImageUrl && (
                          <div className="bg-white p-3 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-2 space-x-reverse mb-2">
                              <Signature className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium">توقيع المستفيد</span>
                            </div>
                            <button 
                              onClick={() => handleImageView(lastDeliveredTask.digitalSignatureImageUrl!)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              عرض التوقيع
                            </button>
                          </div>
                        )}
                        
                        {lastDeliveredTask.deliveryProofImageUrl && (
                          <div className="bg-white p-3 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-2 space-x-reverse mb-2">
                              <Camera className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium">صورة إثبات التسليم</span>
                            </div>
                            <button 
                              onClick={() => handleImageView(lastDeliveredTask.deliveryProofImageUrl!)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              عرض الصورة
                            </button>
                          </div>
                        )}
                        
                        {lastDeliveredTask.courierNotes && (
                          <div className="bg-white p-3 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-2 space-x-reverse mb-2">
                              <MessageSquare className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium">ملاحظات المندوب</span>
                            </div>
                            <p className="text-sm text-gray-700">{lastDeliveredTask.courierNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Log Section */}
          {activeSection === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Activity className="w-6 h-6 ml-2 text-blue-600" />
                    سجل النشاط ({beneficiaryActivities.length})
                  </h3>
                  <button 
                    onClick={() => handleAction('export-activity')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Download className="w-4 h-4 ml-2" />
                    تصدير السجل
                  </button>
                </div>
                
                <div className="space-y-4">
                  {beneficiaryActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 space-x-reverse p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'deliver' ? 'bg-green-100' :
                        activity.type === 'verify' ? 'bg-purple-100' :
                        activity.type === 'update' ? 'bg-blue-100' :
                        activity.type === 'create' ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}>
                        {activity.type === 'deliver' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {activity.type === 'verify' && <Shield className="w-4 h-4 text-purple-600" />}
                        {activity.type === 'update' && <Edit className="w-4 h-4 text-blue-600" />}
                        {activity.type === 'create' && <UserPlus className="w-4 h-4 text-yellow-600" />}
                        {!['deliver', 'verify', 'update', 'create'].includes(activity.type) && <Activity className="w-4 h-4 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <span className="text-sm text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString('ar-SA')} - {new Date(activity.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">بواسطة: {activity.user} ({activity.role})</p>
                        {activity.details && (
                          <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Distribution Requests Tab */}
          {activeSection === 'distribution-requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">طلبات التوزيع المرتبطة</h3>
                <span className="text-sm text-gray-600">{relatedDistributionRequests.length} طلب</span>
              </div>
              
              {relatedDistributionRequests.length > 0 ? (
                <div className="space-y-3">
                  {relatedDistributionRequests.map((request) => {
                    const template = mockPackageTemplates.find(t => t.id === request.packageTemplateId);
                    const requesterInfo = request.requesterType === 'organization' 
                      ? mockOrganizations.find(o => o.id === request.requesterId)
                      : request.requesterType === 'family'
                      ? mockFamilies.find(f => f.id === request.requesterId)
                      : null;
                    
                    return (
                      <div key={request.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              {request.requesterType === 'organization' ? (
                                <Building2 className="w-4 h-4 text-blue-600" />
                              ) : request.requesterType === 'family' ? (
                                <Heart className="w-4 h-4 text-purple-600" />
                              ) : (
                                <User className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                طلب #{request.id.slice(-6)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {requesterInfo?.name || request.requesterName}
                              </p>
                            </div>
                          </div>
                          <Badge variant={
                            request.status === 'approved' ? 'success' :
                            request.status === 'rejected' ? 'error' :
                            request.status === 'in_progress' ? 'warning' :
                            request.status === 'completed' ? 'success' : 'info'
                          } size="sm">
                            {request.status === 'pending' ? 'معلق' :
                             request.status === 'approved' ? 'معتمد' :
                             request.status === 'rejected' ? 'مرفوض' :
                             request.status === 'in_progress' ? 'قيد التنفيذ' : 'مكتمل'}
                          </Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">نوع الطلب:</span>
                            <span className="font-medium text-gray-900 mr-2">
                              {request.type === 'bulk' ? 'جماعي' :
                               request.type === 'family_bulk' ? 'عائلي' : 'فردي'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">قالب الطرد:</span>
                            <span className="font-medium text-gray-900 mr-2">{template?.name || 'غير محدد'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">الكمية:</span>
                            <span className="font-medium text-gray-900 mr-2">
                              {request.approvedQuantity || request.requestedQuantity}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">تاريخ الطلب:</span>
                            <span className="font-medium text-gray-900 mr-2">
                              {new Date(request.requestDate).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          {request.targetGovernorate && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600">المنطقة المستهدفة:</span>
                              <span className="font-medium text-gray-900 mr-2">
                                {request.targetGovernorate} - {request.targetCity} - {request.targetDistrict}
                              </span>
                            </div>
                          )}
                          {request.notes && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600">ملاحظات:</span>
                              <p className="text-gray-900 text-xs mt-1">{request.notes}</p>
                            </div>
                          )}
                          {request.adminNotes && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600">ملاحظات الأدمن:</span>
                              <p className="text-blue-900 text-xs mt-1">{request.adminNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <List className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد طلبات توزيع مرتبطة بهذا المستفيد</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button 
              onClick={() => handleAction('edit')}
              className="bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <Edit className="w-4 h-4 ml-2" />
              تعديل البيانات
            </button>
            <button 
              onClick={() => handleAction('new-package')}
              className="bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4 ml-2" />
              إرسال طرد فردي
            </button>
            <button 
              onClick={() => handleAction('suspend')}
              className="bg-red-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <UserX className="w-4 h-4 ml-2" />
              إيقاف الحساب
            </button>
          </div>
        </div>
      </div>

      {/* Package Details Modal */}
      {showPackageDetails && (
        <Modal
          isOpen={!!showPackageDetails}
          onClose={() => setShowPackageDetails(null)}
          title="تفاصيل الطرد"
          size="lg"
        >
          <div className="p-6">
            {(() => {
              const pkg = beneficiaryPackages.find(p => p.id === showPackageDetails);
              const task = pkg ? beneficiaryTasks.find(t => t.packageId === pkg.id) : null;
              const courier = task ? mockCouriers.find(c => c.id === task.courierId) : null;
              
              if (!pkg) return <div>الطرد غير موجود</div>;
              
              return (
                <div className="space-y-6">
                  {/* Package Info */}
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-4">معلومات الطرد</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-green-700">اسم الطرد:</span>
                          <span className="font-medium text-green-900">{pkg.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">النوع:</span>
                          <span className="font-medium text-green-900">{pkg.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">القيمة:</span>
                          <span className="font-medium text-green-900">{pkg.value} ₪</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">الممول:</span>
                          <span className="font-medium text-green-900">{pkg.funder}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-green-700">تاريخ الإنشاء:</span>
                          <span className="font-medium text-green-900">{new Date(pkg.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                        {pkg.deliveredAt && (
                          <div className="flex justify-between">
                            <span className="text-green-700">تاريخ التسليم:</span>
                            <span className="font-medium text-green-900">{new Date(pkg.deliveredAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        )}
                        {pkg.expiryDate && (
                          <div className="flex justify-between">
                            <span className="text-green-700">تاريخ الانتهاء:</span>
                            <span className="font-medium text-green-900">{new Date(pkg.expiryDate).toLocaleDateString('ar-SA')}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-green-700">الحالة:</span>
                          <Badge 
                            variant={
                              pkg.status === 'delivered' ? 'success' :
                              pkg.status === 'in_delivery' ? 'info' :
                              pkg.status === 'failed' ? 'error' : 'warning'
                            }
                          >
                            {pkg.status === 'delivered' ? 'تم التسليم' :
                             pkg.status === 'in_delivery' ? 'قيد التوصيل' :
                             pkg.status === 'failed' ? 'فشل التسليم' : 'معلق'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {pkg.description && (
                      <div className="mt-4">
                        <span className="text-green-700 text-sm font-medium">الوصف:</span>
                        <p className="text-green-900 mt-1">{pkg.description}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Courier Info */}
                  {courier && (
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-4">معلومات المندوب</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-blue-700">اسم المندوب:</span>
                            <span className="font-medium text-blue-900">{courier.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">رقم الهاتف:</span>
                            <span className="font-medium text-blue-900">{courier.phone}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-blue-700">التقييم:</span>
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-medium text-blue-900">{courier.rating}</span>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">المهام المكتملة:</span>
                            <span className="font-medium text-blue-900">{courier.completedTasks}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Task Details */}
                  {task && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">تفاصيل المهمة</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">تاريخ الإنشاء:</span>
                          <span className="font-medium text-gray-900">{new Date(task.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                        {task.scheduledAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">موعد التسليم:</span>
                            <span className="font-medium text-gray-900">{new Date(task.scheduledAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        )}
                        {task.notes && (
                          <div className="mt-3">
                            <span className="text-gray-600 text-sm font-medium">ملاحظات:</span>
                            <p className="text-gray-900 mt-1">{task.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </Modal>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <Modal
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setActionType('');
            setActionData({});
          }}
          title={
            actionType === 'reject-identity' ? 'رفض الهوية' :
            actionType === 'track-courier' ? 'تتبع المندوب' :
            actionType === 'export-activity' ? 'تصدير سجل النشاط' :
            actionType === 'view-documents' ? 'عرض المستندات' :
            'إجراء'
          }
          size="md"
        >
          <div className="p-6">
            {actionType === 'reject-identity' && (
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">رفض هوية المستفيد</span>
                  </div>
                  <p className="text-red-700 text-sm">سيتم رفض هوية المستفيد ومنعه من الاستفادة من الخدمات</p>
                </div>
                
                <Input
                  label="سبب الرفض *"
                  type="textarea"
                  value={actionData.reason || ''}
                  onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                  placeholder="أدخل سبب رفض الهوية..."
                  rows={3}
                  required
                />
                
                <div className="flex space-x-3 space-x-reverse justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowActionModal(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleActionSubmit}
                  >
                    رفض الهوية
                  </Button>
                </div>
              </div>
            )}
            
            {actionType === 'track-courier' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">تتبع المندوب</span>
                  </div>
                  <p className="text-blue-700 text-sm">سيتم فتح خريطة تفاعلية لتتبع موقع المندوب في الوقت الفعلي</p>
                </div>
                
                {currentCourier && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">معلومات المندوب الحالي</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">الاسم:</span>
                        <span className="font-medium text-gray-900">{currentCourier.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الهاتف:</span>
                        <span className="font-medium text-gray-900">{currentCourier.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الحالة:</span>
                        <Badge variant={currentCourier.status === 'active' ? 'success' : 'warning'}>
                          {currentCourier.status === 'active' ? 'نشط' : 
                           currentCourier.status === 'busy' ? 'مشغول' : 'غير متصل'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3 space-x-reverse justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowActionModal(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleActionSubmit}
                  >
                    فتح الخريطة
                  </Button>
                </div>
              </div>
            )}
            
            {actionType === 'export-activity' && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Download className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">تصدير سجل النشاط</span>
                  </div>
                  <p className="text-green-700 text-sm">سيتم تصدير سجل النشاط الكامل للمستفيد بصيغة JSON</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">محتويات التصدير</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• جميع الأنشطة ({beneficiaryActivities.length} نشاط)</li>
                    <li>• تفاصيل المستفيد الأساسية</li>
                    <li>• تاريخ ووقت التصدير</li>
                    <li>• معلومات المستخدم المصدر</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3 space-x-reverse justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowActionModal(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleActionSubmit}
                  >
                    تصدير الآن
                  </Button>
                </div>
              </div>
            )}
            
            {actionType === 'view-documents' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">عرض جميع المستندات</span>
                  </div>
                  <p className="text-blue-700 text-sm">عرض جميع الملفات والمستندات المرفقة للمستفيد</p>
                </div>
                
                <div className="space-y-3">
                  {/* Identity Image */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Camera className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">صورة الهوية</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleImageView(beneficiary.identityImageUrl || '')}
                      >
                        عرض
                      </Button>
                    </div>
                  </div>
                  
                  {/* Additional Documents */}
                  {beneficiary.additionalDocuments.map((doc, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{doc.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          فتح
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-3 space-x-reverse justify-end">
                  <Button
                    variant="primary"
                    onClick={() => setShowActionModal(false)}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="تأكيد الإجراء"
          size="sm"
        >
          <div className="p-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">تأكيد مطلوب</span>
              </div>
              <p className="text-yellow-700 text-sm">{confirmMessage}</p>
            </div>
            
            <div className="flex space-x-3 space-x-reverse justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={confirmAction}
              >
                تأكيد
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-60">
          <div className={`p-4 rounded-lg shadow-lg border ${
            notificationType === 'success' ? 'bg-green-50 border-green-200' :
            notificationType === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center space-x-2 space-x-reverse">
              {notificationType === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {notificationType === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
              {notificationType === 'info' && <FileText className="w-5 h-5 text-blue-600" />}
              <span className={`font-medium ${
                notificationType === 'success' ? 'text-green-800' :
                notificationType === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {notificationMessage}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img 
              src={selectedImage || "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"}
              alt="صورة مكبرة"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}