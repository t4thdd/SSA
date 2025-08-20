import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Package, Users, MapPin, Calendar, Clock, Building2, Heart, User, Phone, FileText, Truck, Star, Edit, Save, X } from 'lucide-react';
import { 
  type DistributionRequest, 
  type Beneficiary, 
  type PackageTemplate, 
  type Courier,
  type Organization,
  type Family,
  mockDistributionRequests,
  mockBeneficiaries,
  mockPackageTemplates,
  mockCouriers,
  mockOrganizations,
  mockFamilies,
  getCouriersByServiceArea,
  getBeneficiariesByArea,
  getTemplateById
} from '../data/mockData';
import { useErrorLogger } from '../utils/errorLogger';
import { Button, Card, Input, Badge, ConfirmationModal } from './ui';
import * as Sentry from '@sentry/react';

interface DistributionRequestReviewProps {
  request: DistributionRequest;
  onApprove: (requestId: string, approvedQuantity: number, courierId: string, adminNotes?: string) => void;
  onReject: (requestId: string, rejectionReason: string) => void;
  onClose: () => void;
}

export default function DistributionRequestReview({ 
  request, 
  onApprove, 
  onReject, 
  onClose 
}: DistributionRequestReviewProps) {
  const { logInfo, logError } = useErrorLogger();
  
  const [approvedQuantity, setApprovedQuantity] = useState(request.requestedQuantity);
  const [selectedCourierId, setSelectedCourierId] = useState(request.assignedCourierId || '');
  const [adminNotes, setAdminNotes] = useState(request.adminNotes || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // جلب البيانات المرتبطة
  const packageTemplate = getTemplateById(request.packageTemplateId);
  const requesterOrg = mockOrganizations.find(org => org.id === request.requesterId);
  const requesterFamily = mockFamilies.find(family => family.id === request.requesterId);
  
  // جلب المستفيدين المستهدفين
  const targetBeneficiaries = request.type === 'bulk' 
    ? getBeneficiariesByArea(request.targetGovernorate, request.targetCity, request.targetDistrict)
    : request.beneficiaryIds 
      ? mockBeneficiaries.filter(b => request.beneficiaryIds!.includes(b.id))
      : [];

  // جلب المندوبين المتاحين للمنطقة
  const availableCouriers = request.type === 'bulk' && request.targetDistrict
    ? getCouriersByServiceArea(request.targetDistrict)
    : mockCouriers.filter(c => c.status === 'active');

  useEffect(() => {
    // تسجيل فتح مراجعة الطلب
    logInfo(`فتح مراجعة طلب التوزيع: ${request.id}`, 'DistributionRequestReview');
  }, [request.id, logInfo]);

  const handleApprove = () => {
    if (!selectedCourierId) {
      logError(new Error('يجب اختيار مندوب للموافقة على الطلب'), 'DistributionRequestReview');
      return;
    }
    
    if (approvedQuantity <= 0) {
      logError(new Error('الكمية المعتمدة يجب أن تكون أكبر من صفر'), 'DistributionRequestReview');
      return;
    }

    setShowApproveModal(true);
  };

  const executeApprove = async () => {
    setIsProcessing(true);
    setShowApproveModal(false);

    try {
      // محاكاة تأخير المعالجة
      await new Promise(resolve => setTimeout(resolve, 2000));

      onApprove(request.id, approvedQuantity, selectedCourierId, adminNotes);
      
      Sentry.addBreadcrumb({
        message: 'Distribution request approved',
        category: 'distribution',
        data: { 
          requestId: request.id, 
          approvedQuantity, 
          courierId: selectedCourierId 
        }
      });

      logInfo(`تمت الموافقة على طلب التوزيع: ${request.id}`, 'DistributionRequestReview');
    } catch (error) {
      Sentry.captureException(error);
      logError(error as Error, 'DistributionRequestReview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      logError(new Error('يجب إدخال سبب الرفض'), 'DistributionRequestReview');
      return;
    }

    setShowRejectModal(true);
  };

  const executeReject = async () => {
    setIsProcessing(true);
    setShowRejectModal(false);

    try {
      // محاكاة تأخير المعالجة
      await new Promise(resolve => setTimeout(resolve, 1000));

      onReject(request.id, rejectionReason);
      
      Sentry.addBreadcrumb({
        message: 'Distribution request rejected',
        category: 'distribution',
        data: { 
          requestId: request.id, 
          rejectionReason 
        }
      });

      logInfo(`تم رفض طلب التوزيع: ${request.id}`, 'DistributionRequestReview');
    } catch (error) {
      Sentry.captureException(error);
      logError(error as Error, 'DistributionRequestReview');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <User className="w-5 h-5" />;
      case 'bulk': return <Package className="w-5 h-5" />;
      case 'family_bulk': return <Heart className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case 'individual': return 'طلب فردي';
      case 'bulk': return 'طلب جماعي';
      case 'family_bulk': return 'طلب عائلي';
      default: return 'غير محدد';
    }
  };

  const getRequesterTypeIcon = (type: string) => {
    switch (type) {
      case 'organization': return <Building2 className="w-4 h-4" />;
      case 'family': return <Heart className="w-4 h-4" />;
      case 'admin': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const estimatedTotalCost = approvedQuantity * (packageTemplate?.estimatedCost || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-blue-100 p-4 rounded-xl w-fit mx-auto mb-4 animate-fadeIn">
          {getRequestTypeIcon(request.type)}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 animate-slideUp">
          مراجعة طلب التوزيع
        </h2>
        <p className="text-gray-600 mt-2 animate-slideUp">
          مراجعة وموافقة طلب التوزيع المقدم من {request.requesterName}
        </p>
      </div>

      {/* Request Overview */}
      <Card className="animate-slideUp hover-lift">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <FileText className="w-4 h-4 ml-2 text-blue-600" />
          تفاصيل الطلب
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-blue-100 p-2 rounded-lg">
                {getRequesterTypeIcon(request.requesterType)}
              </div>
              <div>
                <p className="text-sm text-gray-600">مقدم الطلب</p>
                <p className="font-medium text-gray-900">{request.requesterName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-green-100 p-2 rounded-lg">
                {getRequestTypeIcon(request.type)}
              </div>
              <div>
                <p className="text-sm text-gray-600">نوع الطلب</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <p className="font-medium text-gray-900">{getRequestTypeText(request.type)}</p>
                  <Badge variant={
                    request.priority === 'urgent' ? 'error' :
                    request.priority === 'high' ? 'warning' :
                    request.priority === 'normal' ? 'info' : 'neutral'
                  } size="sm">
                    {getPriorityText(request.priority)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">تاريخ الطلب</p>
                <p className="font-medium text-gray-900">
                  {new Date(request.requestDate).toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Package className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">قالب الطرد</p>
                <p className="font-medium text-gray-900">{packageTemplate?.name || 'غير محدد'}</p>
                <p className="text-xs text-gray-500">
                  {packageTemplate?.contents.length || 0} عنصر - {packageTemplate?.totalWeight || 0} كيلو
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Users className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الكمية المطلوبة</p>
                <p className="font-medium text-gray-900">{request.requestedQuantity} طرد</p>
                <p className="text-xs text-gray-500">
                  التكلفة المقدرة: {request.requestedQuantity * (packageTemplate?.estimatedCost || 0)} ₪
                </p>
              </div>
            </div>

            {(request.targetGovernorate || request.targetCity || request.targetDistrict) && (
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="bg-green-100 p-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">المنطقة المستهدفة</p>
                  <p className="font-medium text-gray-900">
                    {[request.targetGovernorate, request.targetCity, request.targetDistrict]
                      .filter(Boolean).join(' - ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {targetBeneficiaries.length} مستفيد في هذه المنطقة
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {request.notes && (
          <div className="mt-6 bg-gray-50 p-4 rounded-xl">
            <h4 className="font-medium text-gray-900 mb-2">ملاحظات مقدم الطلب</h4>
            <p className="text-gray-700 text-sm">{request.notes}</p>
          </div>
        )}
      </Card>

      {/* Package Template Details */}
      {packageTemplate && (
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Package className="w-4 h-4 ml-2 text-green-600" />
            تفاصيل قالب الطرد
          </h3>
          
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-800 mb-3">معلومات القالب</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">اسم القالب:</span>
                    <span className="font-medium text-green-900">{packageTemplate.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">النوع:</span>
                    <span className="font-medium text-green-900">
                      {packageTemplate.type === 'food' ? 'مواد غذائية' :
                       packageTemplate.type === 'medical' ? 'طبية' :
                       packageTemplate.type === 'clothing' ? 'ملابس' :
                       packageTemplate.type === 'hygiene' ? 'نظافة' : 'طوارئ'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">الوزن الإجمالي:</span>
                    <span className="font-medium text-green-900">{packageTemplate.totalWeight} كيلو</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">التكلفة لكل طرد:</span>
                    <span className="font-medium text-green-900">{packageTemplate.estimatedCost} ₪</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-green-800 mb-3">محتويات الطرد</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {packageTemplate.contents.map((item, index) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-green-700">{item.name}:</span>
                      <span className="font-medium text-green-900">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Target Beneficiaries */}
      {targetBeneficiaries.length > 0 && (
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Users className="w-4 h-4 ml-2 text-purple-600" />
            المستفيدين المستهدفين ({targetBeneficiaries.length})
          </h3>
          
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 max-h-64 overflow-y-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {targetBeneficiaries.slice(0, 12).map((beneficiary) => (
                <div key={beneficiary.id} className="bg-white p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <User className="w-4 h-4 text-purple-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{beneficiary.name}</p>
                      <p className="text-xs text-gray-600">{beneficiary.nationalId}</p>
                      <p className="text-xs text-gray-500">{beneficiary.detailedAddress.district}</p>
                    </div>
                  </div>
                </div>
              ))}
              {targetBeneficiaries.length > 12 && (
                <div className="bg-white p-3 rounded-lg border border-purple-200 flex items-center justify-center">
                  <p className="text-sm text-gray-600">+{targetBeneficiaries.length - 12} مستفيد آخر</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Admin Review Section */}
      <Card className="animate-slideUp hover-lift">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Edit className="w-4 h-4 ml-2 text-orange-600" />
          مراجعة الأدمن
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الكمية المعتمدة *
              </label>
              <Input
                type="number"
                value={approvedQuantity}
                onChange={(e) => setApprovedQuantity(parseInt(e.target.value) || 0)}
                min={1}
                max={request.requestedQuantity}
                helpText={`الكمية المطلوبة: ${request.requestedQuantity} طرد`}
              />
              {approvedQuantity !== request.requestedQuantity && (
                <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-800 font-medium text-sm">
                      تم تعديل الكمية من {request.requestedQuantity} إلى {approvedQuantity}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات الأدمن
              </label>
              <Input
                type="textarea"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="ملاحظات إضافية للطلب..."
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختيار المندوب *
              </label>
              <select
                value={selectedCourierId}
                onChange={(e) => setSelectedCourierId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر المندوب المناسب</option>
                {availableCouriers.map(courier => (
                  <option key={courier.id} value={courier.id}>
                    {courier.name} - تقييم: {courier.rating} ⭐ ({courier.completedTasks} مهمة مكتملة)
                  </option>
                ))}
              </select>
              
              {request.type === 'bulk' && request.targetDistrict && (
                <p className="text-xs text-gray-500 mt-1">
                  المندوبين المتاحين لمنطقة {request.targetDistrict}: {availableCouriers.length}
                </p>
              )}
            </div>

            {selectedCourierId && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">تفاصيل المندوب المختار</h4>
                {(() => {
                  const selectedCourier = availableCouriers.find(c => c.id === selectedCourierId);
                  return selectedCourier ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">الاسم:</span>
                        <span className="font-medium text-blue-900">{selectedCourier.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">التقييم:</span>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="font-medium text-blue-900">{selectedCourier.rating}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">المهام المكتملة:</span>
                        <span className="font-medium text-blue-900">{selectedCourier.completedTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">الحالة:</span>
                        <Badge variant={
                          selectedCourier.status === 'active' ? 'success' :
                          selectedCourier.status === 'busy' ? 'warning' : 'neutral'
                        } size="sm">
                          {selectedCourier.status === 'active' ? 'نشط' :
                           selectedCourier.status === 'busy' ? 'مشغول' : 'غير متصل'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">المناطق المخدومة:</span>
                        <span className="font-medium text-blue-900 text-xs">
                          {selectedCourier.serviceAreas.join(', ')}
                        </span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Cost Summary */}
      <Card className="animate-slideUp hover-lift">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Clock className="w-4 h-4 ml-2 text-yellow-600" />
          ملخص التكلفة والوقت
        </h3>
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="bg-yellow-100 p-3 rounded-xl mb-2">
                <Package className="w-6 h-6 text-yellow-600 mx-auto" />
              </div>
              <p className="text-sm text-yellow-700">الكمية المعتمدة</p>
              <p className="text-xl font-bold text-yellow-900">{approvedQuantity}</p>
              <p className="text-xs text-yellow-600">طرد</p>
            </div>

            <div>
              <div className="bg-orange-100 p-3 rounded-xl mb-2">
                <FileText className="w-6 h-6 text-orange-600 mx-auto" />
              </div>
              <p className="text-sm text-orange-700">التكلفة الإجمالية</p>
              <p className="text-xl font-bold text-orange-900">{estimatedTotalCost}</p>
              <p className="text-xs text-orange-600">شيكل</p>
            </div>

            <div>
              <div className="bg-blue-100 p-3 rounded-xl mb-2">
                <Clock className="w-6 h-6 text-blue-600 mx-auto" />
              </div>
              <p className="text-sm text-blue-700">الوقت المقدر</p>
              <p className="text-xl font-bold text-blue-900">{request.estimatedDeliveryTime || '1-2'}</p>
              <p className="text-xs text-blue-600">يوم</p>
            </div>

            <div>
              <div className="bg-purple-100 p-3 rounded-xl mb-2">
                <Users className="w-6 h-6 text-purple-600 mx-auto" />
              </div>
              <p className="text-sm text-purple-700">المستفيدين</p>
              <p className="text-xl font-bold text-purple-900">{targetBeneficiaries.length}</p>
              <p className="text-xs text-purple-600">مستفيد</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Rejection Section (if rejecting) */}
      <Card className="animate-slideUp hover-lift">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <XCircle className="w-4 h-4 ml-2 text-red-600" />
          سبب الرفض (في حالة الرفض)
        </h3>
        
        <Input
          label="سبب رفض الطلب"
          type="textarea"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="اذكر سبب رفض طلب التوزيع..."
          rows={3}
          helpText="سيتم إرسال هذا السبب لمقدم الطلب"
        />
      </Card>

      {/* Action Buttons */}
      <Card className="bg-gray-50 animate-slideUp" variant="default" shadow="none">
        <div className="flex space-x-4 space-x-reverse justify-end">
          <Button
            variant="secondary"
            icon={X}
            iconPosition="right"
            onClick={onClose}
            disabled={isProcessing}
            tooltip="إلغاء المراجعة والعودة"
            animation="hover"
          >
            إلغاء
          </Button>
          
          <Button
            variant="danger"
            icon={XCircle}
            iconPosition="right"
            onClick={handleReject}
            disabled={isProcessing || !rejectionReason.trim()}
            tooltip="رفض طلب التوزيع"
            animation="hover"
          >
            رفض الطلب
          </Button>
          
          <Button
            variant="success"
            icon={isProcessing ? undefined : CheckCircle}
            iconPosition="right"
            onClick={handleApprove}
            disabled={isProcessing || !selectedCourierId || approvedQuantity <= 0}
            loading={isProcessing}
            tooltip="الموافقة على طلب التوزيع وإنشاء المهام"
            animation="hover"
          >
            موافقة وإنشاء المهام
          </Button>
        </div>
      </Card>

      {/* Approval Confirmation Modal */}
      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={executeApprove}
        title="تأكيد الموافقة على طلب التوزيع"
        message={`هل أنت متأكد من الموافقة على هذا الطلب وإنشاء ${approvedQuantity} مهمة تسليم؟`}
        type="success"
        confirmText="موافقة وإنشاء المهام"
        cancelText="إلغاء"
        isLoading={isProcessing}
        details={[
          `مقدم الطلب: ${request.requesterName}`,
          `نوع الطلب: ${getRequestTypeText(request.type)}`,
          `قالب الطرد: ${packageTemplate?.name || 'غير محدد'}`,
          `الكمية المعتمدة: ${approvedQuantity} طرد`,
          `المندوب المعين: ${availableCouriers.find(c => c.id === selectedCourierId)?.name || 'غير محدد'}`,
          `التكلفة الإجمالية: ${estimatedTotalCost} ₪`,
          `المنطقة: ${[request.targetGovernorate, request.targetCity, request.targetDistrict].filter(Boolean).join(' - ') || 'غير محددة'}`
        ]}
      />

      {/* Rejection Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={executeReject}
        title="تأكيد رفض طلب التوزيع"
        message={`هل أنت متأكد من رفض طلب التوزيع المقدم من ${request.requesterName}؟`}
        type="danger"
        confirmText="رفض الطلب"
        cancelText="إلغاء"
        isLoading={isProcessing}
        details={[
          `مقدم الطلب: ${request.requesterName}`,
          `نوع الطلب: ${getRequestTypeText(request.type)}`,
          `الكمية المطلوبة: ${request.requestedQuantity} طرد`,
          `سبب الرفض: ${rejectionReason}`,
          `تاريخ الطلب: ${new Date(request.requestDate).toLocaleDateString('ar-SA')}`
        ]}
      />
    </div>
  );
}