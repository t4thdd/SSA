import React, { useState } from 'react';
import { Package, Building2, MapPin, Users, Send, CheckCircle, AlertTriangle, Clock, FileText, Star, RefreshCw, X, Calendar, Shield, Activity, Truck, ArrowRight } from 'lucide-react';
import { 
  mockPackageTemplates,
  mockBeneficiaries,
  mockDistributionRequests,
  getBeneficiariesByArea,
  type DistributionRequest
} from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal, AreaSelector } from '../ui';
import { useAreaSelector } from '../../hooks/useGeographicData';

interface OrganizationBulkSendPageProps {
  onNavigateBack?: () => void;
}

export default function OrganizationBulkSendPage({ onNavigateBack }: OrganizationBulkSendPageProps) {
  const { loggedInUser } = useAuth();
  const { logInfo, logError } = useErrorLogger();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [requestedQuantity, setRequestedQuantity] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [requestResult, setRequestResult] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const {
    selectedGovernorate,
    selectedCity,
    selectedDistrict,
    getGovernorateName,
    getCityName,
    getDistrictName,
    getSelectedAreaText
  } = useAreaSelector();

  // استخدام البيانات الوهمية مباشرة
  const packageTemplates = mockPackageTemplates.filter(t => 
    t.organization_id === loggedInUser?.associatedId && t.status === 'active'
  );

  const selectedTemplateData = packageTemplates.find(t => t.id === selectedTemplate);

  // حساب المستفيدين في المنطقة المحددة
  const targetBeneficiaries = selectedGovernorate && selectedCity && selectedDistrict
    ? getBeneficiariesByArea(
        getGovernorateName(selectedGovernorate),
        getCityName(selectedCity),
        getDistrictName(selectedDistrict)
      )
    : [];

  const handleSubmitRequest = () => {
    if (!selectedTemplate || !selectedGovernorate || !selectedCity || !selectedDistrict || requestedQuantity <= 0) {
      setNotification({ 
        message: 'يرجى اختيار قالب الطرد والمنطقة المستهدفة وتحديد الكمية', 
        type: 'error' 
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (targetBeneficiaries.length === 0) {
      setNotification({ 
        message: 'لا توجد مستفيدين في المنطقة المحددة', 
        type: 'error' 
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (requestedQuantity > targetBeneficiaries.length) {
      setNotification({ 
        message: `الكمية المطلوبة (${requestedQuantity}) أكبر من عدد المستفيدين في المنطقة (${targetBeneficiaries.length})`, 
        type: 'warning' 
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setShowConfirmModal(true);
  };

  const executeSubmitRequest = async () => {
    setShowConfirmModal(false);
    
    try {
      // محاكاة عملية إنشاء طلب التوزيع
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newRequest: DistributionRequest = {
        id: `req-${Date.now()}`,
        requesterId: loggedInUser?.associatedId || loggedInUser?.id || '',
        requesterType: 'organization',
        requesterName: loggedInUser?.name || 'مؤسسة غير محددة',
        requestDate: new Date().toISOString(),
        status: 'pending',
        type: 'bulk',
        packageTemplateId: selectedTemplate,
        requestedQuantity,
        targetGovernorate: getGovernorateName(selectedGovernorate!),
        targetCity: getCityName(selectedCity!),
        targetDistrict: getDistrictName(selectedDistrict!),
        notes,
        priority,
        estimatedCost: requestedQuantity * (selectedTemplateData?.estimatedCost || 0),
        estimatedDeliveryTime: priority === 'urgent' ? '6-12 ساعة' : 
                              priority === 'high' ? '1-2 يوم' : 
                              priority === 'normal' ? '2-3 أيام' : '3-5 أيام'
      };

      // إضافة الطلب إلى البيانات الوهمية
      mockDistributionRequests.unshift(newRequest);
      
      const results = {
        requestId: newRequest.id,
        templateName: selectedTemplateData?.name,
        targetArea: getSelectedAreaText(),
        requestedQuantity,
        targetBeneficiaries: targetBeneficiaries.length,
        estimatedCost: newRequest.estimatedCost,
        estimatedDeliveryTime: newRequest.estimatedDeliveryTime,
        priorityText: priority === 'urgent' ? 'عاجلة' : 
                     priority === 'high' ? 'عالية' : 
                     priority === 'normal' ? 'عادية' : 'منخفضة'
      };
      
      setRequestResult(results);
      setShowSuccessModal(true);
      
      logInfo(`تم إنشاء طلب توزيع جماعي: ${newRequest.id}`, 'OrganizationBulkSendPage');
    } catch (error) {
      setErrorDetails('حدث خطأ تقني في النظام. يرجى المحاولة مرة أخرى.');
      setShowErrorModal(true);
      logError(error as Error, 'OrganizationBulkSendPage');
    }
  };

  const resetForm = () => {
    setSelectedTemplate('');
    setRequestedQuantity(0);
    setNotes('');
    setPriority('normal');
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إنشاء طلب توزيع جماعي</h1>
          <p className="text-gray-600 mt-1">إنشاء طلب توزيع جماعي للمؤسسة - يتطلب موافقة الأدمن</p>
        </div>
        {onNavigateBack && (
          <Button variant="secondary" onClick={onNavigateBack} icon={ArrowRight} iconPosition="right">
            العودة
          </Button>
        )}
      </div>

      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            البيانات الوهمية محملة - {packageTemplates.length} قالب متاح للمؤسسة
          </span>
        </div>
      </Card>

      {/* Progress Indicator */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">خطوات إنشاء طلب التوزيع الجماعي</h3>
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>الخطوة {selectedTemplate ? (selectedGovernorate && selectedCity && selectedDistrict ? (requestedQuantity > 0 ? '4' : '3') : '2') : '1'} من 4</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedTemplate ? 'text-green-600' : 'text-blue-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedTemplate ? 'bg-green-100' : 'bg-blue-100'}`}>
              {selectedTemplate ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">1</span>}
            </div>
            <span className="text-sm font-medium">اختيار قالب الطرد</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedGovernorate && selectedCity && selectedDistrict ? 'text-green-600' : selectedTemplate ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedGovernorate && selectedCity && selectedDistrict ? 'bg-green-100' : selectedTemplate ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {selectedGovernorate && selectedCity && selectedDistrict ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">2</span>}
            </div>
            <span className="text-sm font-medium">تحديد المنطقة</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${requestedQuantity > 0 ? 'text-green-600' : selectedGovernorate && selectedCity && selectedDistrict ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${requestedQuantity > 0 ? 'bg-green-100' : selectedGovernorate && selectedCity && selectedDistrict ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {requestedQuantity > 0 ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">3</span>}
            </div>
            <span className="text-sm font-medium">تحديد الكمية</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${requestedQuantity > 0 && selectedTemplate && selectedGovernorate && selectedCity && selectedDistrict ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${requestedQuantity > 0 && selectedTemplate && selectedGovernorate && selectedCity && selectedDistrict ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <span className="text-sm font-bold">4</span>
            </div>
            <span className="text-sm font-medium">إرسال الطلب</span>
          </div>
        </div>
      </Card>

      {/* Template Selection */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">اختيار قالب الطرد</h3>
          {selectedTemplate && (
            <div className="flex items-center space-x-2 space-x-reverse text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">تم الاختيار</span>
            </div>
          )}
        </div>

        {packageTemplates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packageTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl">
                    {template.type === 'food' ? '🍚' :
                     template.type === 'clothing' ? '👕' :
                     template.type === 'medical' ? '💊' :
                     template.type === 'hygiene' ? '🧼' : '🚨'}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{template.totalWeight} كيلو</p>
                    <p className="text-xs text-green-600">{template.estimatedCost} ₪</p>
                  </div>
                </div>
                <h5 className="font-semibold text-gray-900 mb-2">{template.name}</h5>
                <p className="text-sm text-gray-600 mb-3">{template.contents.length} أصناف</p>
                <div className="text-xs text-gray-500">
                  {template.contents.slice(0, 2).map(item => item.name).join(', ')}
                  {template.contents.length > 2 && '...'}
                </div>

                {template.usageCount > 0 && (
                  <div className="mt-2 flex items-center space-x-1 space-x-reverse text-xs text-blue-600">
                    <Star className="w-3 h-3" />
                    <span>استُخدم {template.usageCount} مرة</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">لا توجد قوالب طرود متاحة</p>
            <p className="text-sm">يرجى التواصل مع الأدمن لإضافة قوالب للمؤسسة</p>
          </div>
        )}
      </Card>

      {/* Area Selection */}
      {selectedTemplate && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">تحديد المنطقة المستهدفة</h3>
            {selectedGovernorate && selectedCity && selectedDistrict && (
              <div className="flex items-center space-x-2 space-x-reverse text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">تم التحديد</span>
              </div>
            )}
          </div>

          <AreaSelector
            required
            onSelectionChange={(gov, city, district) => {
              // سيتم التحديث تلقائياً عبر useAreaSelector
            }}
            helpText="حدد المنطقة الجغرافية التي تريد توزيع الطرود فيها"
          />

          {selectedGovernorate && selectedCity && selectedDistrict && (
            <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3">معلومات المنطقة المحددة</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-green-700">المنطقة:</span>
                  <span className="font-medium text-green-900 mr-2">{getSelectedAreaText()}</span>
                </div>
                <div>
                  <span className="text-green-700">المستفيدين المتاحين:</span>
                  <span className="font-medium text-green-900 mr-2">{targetBeneficiaries.length}</span>
                </div>
                <div>
                  <span className="text-green-700">المستفيدين الموثقين:</span>
                  <span className="font-medium text-green-900 mr-2">
                    {targetBeneficiaries.filter(b => b.identityStatus === 'verified').length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Quantity and Details */}
      {selectedGovernorate && selectedCity && selectedDistrict && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">تفاصيل الطلب</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الكمية المطلوبة *
              </label>
              <Input
                type="number"
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 0)}
                min={1}
                max={targetBeneficiaries.length}
                helpText={`الحد الأقصى: ${targetBeneficiaries.length} (عدد المستفيدين في المنطقة)`}
                icon={Package}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">أولوية الطلب</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">منخفضة - خلال 3-5 أيام</option>
                <option value="normal">عادية - خلال 2-3 أيام</option>
                <option value="high">عالية - خلال 1-2 يوم</option>
                <option value="urgent">عاجلة - خلال 6-12 ساعة</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الطلب</label>
              <Input
                type="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات إضافية للأدمن حول طلب التوزيع..."
                rows={3}
                maxLength={500}
                showCharCount
              />
            </div>
          </div>
        </Card>
      )}

      {/* Request Summary */}
      {selectedTemplate && selectedGovernorate && selectedCity && selectedDistrict && requestedQuantity > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">ملخص طلب التوزيع الجماعي</h3>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200 mb-6">
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <Package className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">قالب الطرد</p>
                <p className="font-bold text-gray-900">{selectedTemplateData?.name}</p>
              </div>

              <div>
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <MapPin className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">المنطقة المستهدفة</p>
                <p className="font-bold text-gray-900">{getSelectedAreaText()}</p>
              </div>

              <div>
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <Users className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">الكمية المطلوبة</p>
                <p className="font-bold text-gray-900">{requestedQuantity} طرد</p>
              </div>

              <div>
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <Star className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">التكلفة المقدرة</p>
                <p className="font-bold text-gray-900">{requestedQuantity * (selectedTemplateData?.estimatedCost || 0)} ₪</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitRequest}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center text-lg"
          >
            <Send className="w-5 h-5 ml-2" />
            إرسال طلب التوزيع الجماعي
          </button>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-3">تعليمات طلب التوزيع الجماعي</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-sm text-yellow-700 space-y-2">
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>سيتم إرسال الطلب إلى الأدمن للمراجعة والموافقة</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>الأدمن قد يعدل الكمية حسب المخزون المتاح</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>سيتم اختيار المندوب المناسب للمنطقة</span>
                </li>
              </ul>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>ستتلقى إشعاراً عند الموافقة أو الرفض</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>يمكن تتبع حالة الطلب من لوحة التحكم</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>الطلبات العاجلة لها أولوية في المعالجة</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Confirm Request Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="تأكيد إرسال طلب التوزيع الجماعي"
          size="md"
        >
          <div className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">هل أنت متأكد من إرسال هذا الطلب؟</h3>
            <p className="text-gray-600 mb-6">
              سيتم إرسال طلب التوزيع إلى الأدمن للمراجعة والموافقة.
            </p>
            
            {/* Request Details */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">تفاصيل الطلب</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-right">
                <div>
                  <span className="text-gray-600">قالب الطرد:</span>
                  <span className="font-medium text-gray-900 mr-2">{selectedTemplateData?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">المنطقة:</span>
                  <span className="font-medium text-gray-900 mr-2">{getSelectedAreaText()}</span>
                </div>
                <div>
                  <span className="text-gray-600">الكمية المطلوبة:</span>
                  <span className="font-medium text-gray-900 mr-2">{requestedQuantity} طرد</span>
                </div>
                <div>
                  <span className="text-gray-600">المستفيدين المستهدفين:</span>
                  <span className="font-medium text-gray-900 mr-2">{targetBeneficiaries.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">الأولوية:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {priority === 'urgent' ? 'عاجلة' : 
                     priority === 'high' ? 'عالية' : 
                     priority === 'normal' ? 'عادية' : 'منخفضة'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">التكلفة المقدرة:</span>
                  <span className="font-medium text-green-600 mr-2">
                    {requestedQuantity * (selectedTemplateData?.estimatedCost || 0)} ₪
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse justify-center">
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                إلغاء
              </Button>
              <Button variant="primary" onClick={executeSubmitRequest}>
                تأكيد الإرسال
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Modal */}
      {showSuccessModal && requestResult && (
        <Modal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            resetForm();
            if (onNavigateBack) onNavigateBack();
          }}
          title="تم إرسال طلب التوزيع بنجاح!"
          size="md"
        >
          <div className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">تم إرسال طلب التوزيع الجماعي بنجاح!</h3>
            <p className="text-gray-600 mb-6">
              تم إرسال طلبك إلى الأدمن للمراجعة. ستتلقى إشعاراً عند اتخاذ قرار بشأن الطلب.
            </p>
            
            {/* Request Results */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-green-800 mb-3">تفاصيل الطلب المرسل</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-right">
                <div>
                  <span className="text-green-700">رقم الطلب:</span>
                  <span className="font-mono font-bold text-green-900 mr-2">{requestResult.requestId}</span>
                </div>
                <div>
                  <span className="text-green-700">قالب الطرد:</span>
                  <span className="font-medium text-green-900 mr-2">{requestResult.templateName}</span>
                </div>
                <div>
                  <span className="text-green-700">المنطقة المستهدفة:</span>
                  <span className="font-medium text-green-900 mr-2">{requestResult.targetArea}</span>
                </div>
                <div>
                  <span className="text-green-700">الكمية المطلوبة:</span>
                  <span className="font-medium text-green-900 mr-2">{requestResult.requestedQuantity} طرد</span>
                </div>
                <div>
                  <span className="text-green-700">المستفيدين المستهدفين:</span>
                  <span className="font-medium text-green-900 mr-2">{requestResult.targetBeneficiaries}</span>
                </div>
                <div>
                  <span className="text-green-700">الأولوية:</span>
                  <span className="font-medium text-green-900 mr-2">{requestResult.priorityText}</span>
                </div>
                <div>
                  <span className="text-green-700">التكلفة المقدرة:</span>
                  <span className="font-medium text-green-900 mr-2">{requestResult.estimatedCost} ₪</span>
                </div>
                <div>
                  <span className="text-green-700">الوقت المقدر للتنفيذ:</span>
                  <span className="font-medium text-green-900 mr-2">{requestResult.estimatedDeliveryTime}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-2 space-x-reverse text-blue-600 mb-2">
                <Activity className="w-4 h-4" />
                <span className="font-medium">الخطوات التالية:</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1 text-right">
                <li>• سيقوم الأدمن بمراجعة طلبك خلال 24 ساعة</li>
                <li>• قد يتم تعديل الكمية حسب المخزون المتاح</li>
                <li>• سيتم اختيار المندوب المناسب للمنطقة</li>
                <li>• ستتلقى إشعاراً فور اتخاذ قرار بشأن الطلب</li>
                <li>• يمكنك متابعة حالة الطلب من لوحة التحكم</li>
              </ul>
            </div>

            <div className="flex space-x-3 space-x-reverse justify-center">
              <Button variant="secondary" onClick={() => {
                setShowSuccessModal(false);
                resetForm();
              }}>
                إنشاء طلب آخر
              </Button>
              <Button variant="primary" onClick={() => {
                setShowSuccessModal(false);
                resetForm();
                if (onNavigateBack) onNavigateBack();
              }}>
                العودة للوحة التحكم
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <Modal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="فشل في إرسال الطلب"
          size="md"
        >
          <div className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">فشل في إرسال طلب التوزيع</h3>
            <p className="text-gray-600 mb-6">
              عذراً، لم نتمكن من إرسال طلب التوزيع في الوقت الحالي.
            </p>
            
            {/* Error Details */}
            <div className="bg-red-50 p-4 rounded-lg mb-6 text-right">
              <h4 className="font-semibold text-red-800 mb-2">تفاصيل الخطأ:</h4>
              <p className="text-red-700 text-sm">{errorDetails}</p>
            </div>

            <div className="flex space-x-3 space-x-reverse justify-center">
              <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
                إغلاق
              </Button>
              <Button variant="primary" onClick={() => {
                setShowErrorModal(false);
                handleSubmitRequest();
              }}>
                محاولة مرة أخرى
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}