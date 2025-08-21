import React, { useState } from 'react';
import { Heart, Users, Package, Send, CheckCircle, AlertTriangle, Clock, FileText, Star, RefreshCw, X, Calendar, Shield, Activity, UserPlus, ArrowRight } from 'lucide-react';
import { 
  mockPackageTemplates,
  mockBeneficiaries,
  mockDistributionRequests,
  mockFamilies,
  type DistributionRequest,
  getBeneficiariesByFamily
} from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal } from '../ui'; 

interface FamilySendPageProps {
  onNavigateBack?: () => void;
}

export default function FamilySendPage({ onNavigateBack }: FamilySendPageProps) {
  const { loggedInUser } = useAuth();
  const { logInfo, logError } = useErrorLogger();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [requestResult, setRequestResult] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // استخدام البيانات الوهمية مباشرة
  const packageTemplates = mockPackageTemplates.filter(t => t.status === 'active');
  const familyId = loggedInUser?.associatedId;
  const family = mockFamilies.find(f => f.id === familyId);
  const familyMembers = familyId ? getBeneficiariesByFamily(familyId) : [];

  const selectedTemplateData = packageTemplates.find(t => t.id === selectedTemplate);

  const handleBeneficiaryToggle = (beneficiaryId: string) => {
    setSelectedBeneficiaries(prev => 
      prev.includes(beneficiaryId)
        ? prev.filter(id => id !== beneficiaryId)
        : [...prev, beneficiaryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBeneficiaries.length === familyMembers.length) {
      setSelectedBeneficiaries([]);
    } else {
      setSelectedBeneficiaries(familyMembers.map(member => member.id));
    }
  };

  const handleSubmitRequest = () => {
    if (!selectedTemplate || selectedBeneficiaries.length === 0) {
      setNotification({ 
        message: 'يرجى اختيار قالب الطرد وأفراد العائلة المستفيدين', 
        type: 'error' 
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
        requesterId: familyId || loggedInUser?.id || '',
        requesterType: 'family',
        requesterName: family?.name || loggedInUser?.name || 'عائلة غير محددة',
        requestDate: new Date().toISOString(),
        status: 'pending',
        type: 'family_bulk',
        packageTemplateId: selectedTemplate,
        requestedQuantity: selectedBeneficiaries.length,
        beneficiaryIds: selectedBeneficiaries,
        notes,
        priority,
        estimatedCost: selectedBeneficiaries.length * (selectedTemplateData?.estimatedCost || 0),
        estimatedDeliveryTime: priority === 'urgent' ? '6-12 ساعة' : 
                              priority === 'high' ? '1-2 يوم' : 
                              priority === 'normal' ? '2-3 أيام' : '3-5 أيام'
      };

      // إضافة الطلب إلى البيانات الوهمية
      mockDistributionRequests.unshift(newRequest);
      
      const results = {
        requestId: newRequest.id,
        templateName: selectedTemplateData?.name,
        familyName: family?.name,
        selectedMembersCount: selectedBeneficiaries.length,
        estimatedCost: newRequest.estimatedCost,
        estimatedDeliveryTime: newRequest.estimatedDeliveryTime,
        priorityText: priority === 'urgent' ? 'عاجلة' : 
                     priority === 'high' ? 'عالية' : 
                     priority === 'normal' ? 'عادية' : 'منخفضة'
      };
      
      setRequestResult(results);
      setShowSuccessModal(true);
      
      logInfo(`تم إنشاء طلب توزيع عائلي: ${newRequest.id}`, 'FamilySendPage');
    } catch (error) {
      setErrorDetails('حدث خطأ تقني في النظام. يرجى المحاولة مرة أخرى.');
      setShowErrorModal(true);
      logError(error as Error, 'FamilySendPage');
    }
  };

  const resetForm = () => {
    setSelectedTemplate('');
    setSelectedBeneficiaries([]);
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
          <h1 className="text-2xl font-bold text-gray-900">إنشاء طلب توزيع عائلي</h1>
          <p className="text-gray-600 mt-1">إنشاء طلب توزيع لأفراد العائلة - يتطلب موافقة الأدمن</p>
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
            البيانات الوهمية محملة - {packageTemplates.length} قالب متاح، {familyMembers.length} فرد في العائلة
          </span>
        </div>
      </Card>

      {/* Family Information */}
      {family && (
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Heart className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-800">معلومات العائلة</h3>
              <p className="text-purple-700 text-sm">
                {family.name} - رب الأسرة: {family.headOfFamily} - عدد الأفراد: {family.membersCount}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Progress Indicator */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">خطوات إنشاء طلب التوزيع العائلي</h3>
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>الخطوة {selectedTemplate ? (selectedBeneficiaries.length > 0 ? '3' : '2') : '1'} من 3</span>
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
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedBeneficiaries.length > 0 ? 'text-green-600' : selectedTemplate ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedBeneficiaries.length > 0 ? 'bg-green-100' : selectedTemplate ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {selectedBeneficiaries.length > 0 ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">2</span>}
            </div>
            <span className="text-sm font-medium">اختيار أفراد العائلة</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedBeneficiaries.length > 0 && selectedTemplate ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedBeneficiaries.length > 0 && selectedTemplate ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <span className="text-sm font-bold">3</span>
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
            <p className="text-sm">يرجى التواصل مع الأدمن لإضافة قوالب</p>
          </div>
        )}
      </Card>

      {/* Family Members Selection */}
      {selectedTemplate && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">اختيار أفراد العائلة المستفيدين</h3>
            <div className="flex items-center space-x-3 space-x-reverse">
              {selectedBeneficiaries.length > 0 && (
                <div className="flex items-center space-x-2 space-x-reverse text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">تم اختيار {selectedBeneficiaries.length}</span>
                </div>
              )}
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleSelectAll}
              >
                {selectedBeneficiaries.length === familyMembers.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
              </Button>
            </div>
          </div>

          {familyMembers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleBeneficiaryToggle(member.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedBeneficiaries.includes(member.id)
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">{member.name}</h5>
                      <p className="text-sm text-gray-600">{member.relationToFamily || 'فرد العائلة'}</p>
                      <p className="text-xs text-gray-500">{member.nationalId}</p>
                      <div className="mt-2">
                        <Badge variant={
                          member.identityStatus === 'verified' ? 'success' :
                          member.identityStatus === 'pending' ? 'warning' : 'error'
                        } size="sm">
                          {member.identityStatus === 'verified' ? 'موثق' :
                           member.identityStatus === 'pending' ? 'بانتظار التوثيق' : 'مرفوض التوثيق'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">لا توجد أفراد مسجلين في العائلة</p>
              <p className="text-sm">يرجى إضافة أفراد العائلة أولاً</p>
            </div>
          )}
        </Card>
      )}

      {/* Request Details */}
      {selectedTemplate && selectedBeneficiaries.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">تفاصيل الطلب</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
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

            <div>
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
      {selectedTemplate && selectedBeneficiaries.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">ملخص طلب التوزيع العائلي</h3>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200 mb-6">
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <Heart className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">العائلة</p>
                <p className="font-bold text-gray-900">{family?.name || 'غير محددة'}</p>
              </div>

              <div>
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <Package className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">قالب الطرد</p>
                <p className="font-bold text-gray-900">{selectedTemplateData?.name}</p>
              </div>

              <div>
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <Users className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">أفراد العائلة</p>
                <p className="font-bold text-gray-900">{selectedBeneficiaries.length} فرد</p>
              </div>

              <div>
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <Star className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">التكلفة المقدرة</p>
                <p className="font-bold text-gray-900">
                  {selectedBeneficiaries.length * (selectedTemplateData?.estimatedCost || 0)} ₪
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitRequest}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center text-lg"
          >
            <Send className="w-5 h-5 ml-2" />
            إرسال طلب التوزيع العائلي
          </button>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-3">تعليمات طلب التوزيع العائلي</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-sm text-yellow-700 space-y-2">
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>سيتم إرسال الطلب إلى الأدمن للمراجعة</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>يمكن اختيار أفراد محددين من العائلة</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>سيتم تعيين مندوب مناسب للمنطقة</span>
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
          title="تأكيد إرسال طلب التوزيع العائلي"
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
                  <span className="text-gray-600">العائلة:</span>
                  <span className="font-medium text-gray-900 mr-2">{family?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">قالب الطرد:</span>
                  <span className="font-medium text-gray-900 mr-2">{selectedTemplateData?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">عدد أفراد العائلة:</span>
                  <span className="font-medium text-gray-900 mr-2">{selectedBeneficiaries.length}</span>
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
                    {selectedBeneficiaries.length * (selectedTemplateData?.estimatedCost || 0)} ₪
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">تم إرسال طلب التوزيع العائلي بنجاح!</h3>
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
                  <span className="text-green-700">العائلة:</span>
                  <span className="font-medium text-green-900 mr-2">{requestResult.familyName}</span>
                </div>
                <div>
                  <span className="text-green-700">قالب الطرد:</span>
                  <span className="font-medium text-green-900 mr-2">{requestResult.templateName}</span>
                </div>
                <div>
                  <span className="text-green-700">عدد أفراد العائلة:</span>
                  <span className="font-medium text-green-900 mr-2">{requestResult.selectedMembersCount}</span>
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
                <li>• سيتم اختيار المندوب المناسب لمنطقة العائلة</li>
                <li>• ستتلقى إشعاراً فور اتخاذ قرار بشأن الطلب</li>
                <li>• يمكنك متابعة حالة الطلب من لوحة التحكم</li>
                <li>• سيتم إشعار أفراد العائلة عند بدء التوزيع</li>
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