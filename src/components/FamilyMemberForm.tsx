import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Calendar, Shield, Save, X, AlertTriangle, CheckCircle, Users, Briefcase, Heart, DollarSign, FileText, Home, UserPlus } from 'lucide-react';
import { type Beneficiary, mockFamilies } from '../data/mockData';
import { useErrorLogger } from '../utils/errorLogger';
import { Button, Card, Input, Badge, FormField, ConfirmationModal } from './ui';
import { useFormValidation, commonValidationRules } from '../hooks/useFormValidation';

interface FamilyMemberFormProps {
  familyId: string;
  member?: Beneficiary | null;
  onSave: (memberData: Partial<Beneficiary>) => void;
  onCancel: () => void;
  mode?: 'add' | 'edit';
}

interface FormData {
  name: string;
  fullName: string;
  nationalId: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  phone: string;
  relationToFamily: string;
  profession: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  economicLevel: 'very_poor' | 'poor' | 'moderate' | 'good';
  membersCount: number;
  notes: string;
}

export default function FamilyMemberForm({ familyId, member, onSave, onCancel, mode = 'add' }: FamilyMemberFormProps) {
  const { logError, logInfo } = useErrorLogger();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    fullName: '',
    nationalId: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    relationToFamily: '',
    profession: '',
    maritalStatus: 'single',
    economicLevel: 'poor',
    membersCount: 1,
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isEditing = !!member;
  const family = mockFamilies.find(f => f.id === familyId);

  // Enhanced validation rules
  const validationRules = {
    name: commonValidationRules.name,
    fullName: {
      required: true,
      minLength: 5,
      maxLength: 100,
      pattern: /^[\u0600-\u06FF\s]+$/
    },
    nationalId: commonValidationRules.nationalId,
    phone: commonValidationRules.phone,
    dateOfBirth: {
      required: true,
      custom: (value: string) => {
        if (!value) return null;
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 0 || age > 120) return 'تاريخ الميلاد غير صحيح';
        return null;
      }
    },
    relationToFamily: {
      required: true,
      minLength: 2
    },
    profession: {
      required: true,
      minLength: 2,
      maxLength: 50
    },
    membersCount: {
      required: true,
      min: 1,
      max: 20
    }
  };

  const {
    errors,
    warnings,
    successes,
    validateForm,
    validateFieldOnChange,
    validateFieldOnBlur,
    getFieldState,
    isFormValid
  } = useFormValidation(validationRules, {
    validateOnChange: true,
    validateOnBlur: true,
    showSuccessStates: true,
    debounceMs: 300
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        fullName: member.fullName || '',
        nationalId: member.nationalId || '',
        dateOfBirth: member.dateOfBirth || '',
        gender: member.gender || 'male',
        phone: member.phone || '',
        relationToFamily: member.relationToFamily || '',
        profession: member.profession || '',
        maritalStatus: member.maritalStatus || 'single',
        economicLevel: member.economicLevel || 'poor',
        membersCount: member.membersCount || 1,
        notes: member.notes || ''
      });
    }
  }, [member]);

  const relationshipOptions = [
    { value: 'رب الأسرة', label: 'رب الأسرة' },
    { value: 'الزوجة', label: 'الزوجة' },
    { value: 'الابن', label: 'الابن' },
    { value: 'الابنة', label: 'الابنة' },
    { value: 'الأخ', label: 'الأخ' },
    { value: 'الأخت', label: 'الأخت' },
    { value: 'الوالد', label: 'الوالد' },
    { value: 'الوالدة', label: 'الوالدة' },
    { value: 'الجد', label: 'الجد' },
    { value: 'الجدة', label: 'الجدة' },
    { value: 'العم', label: 'العم' },
    { value: 'العمة', label: 'العمة' },
    { value: 'الخال', label: 'الخال' },
    { value: 'الخالة', label: 'الخالة' },
    { value: 'قريب آخر', label: 'قريب آخر' }
  ];

  const maritalStatusOptions = [
    { value: 'single', label: 'أعزب' },
    { value: 'married', label: 'متزوج' },
    { value: 'divorced', label: 'مطلق' },
    { value: 'widowed', label: 'أرمل' }
  ];

  const economicLevelOptions = [
    { value: 'very_poor', label: 'فقير جداً' },
    { value: 'poor', label: 'فقير' },
    { value: 'moderate', label: 'متوسط' },
    { value: 'good', label: 'ميسور' }
  ];

  const handleInputChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setHasUnsavedChanges(true);
    
    validateFieldOnChange(field, value, newFormData);
  };

  const handleFieldBlur = (field: string, value: any) => {
    validateFieldOnBlur(field, value, formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm(formData);
    if (!validation.isValid) {
      logError(new Error('فشل في التحقق من صحة البيانات'), 'FamilyMemberForm');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);
    setOperationError(null);
    setShowConfirmModal(false);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const memberData: Partial<Beneficiary> = {
        name: formData.name.trim(),
        fullName: formData.fullName.trim(),
        nationalId: formData.nationalId.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone.trim(),
        familyId: familyId,
        relationToFamily: formData.relationToFamily,
        profession: formData.profession.trim(),
        maritalStatus: formData.maritalStatus,
        economicLevel: formData.economicLevel,
        membersCount: formData.membersCount,
        notes: formData.notes.trim(),
        // Use family address as default
        address: family?.location || 'غير محدد',
        detailedAddress: {
          governorate: family?.location.split(' - ')[0] || 'غير محدد',
          city: family?.location.split(' - ')[1] || 'غير محدد',
          district: family?.location.split(' - ')[2] || 'غير محدد',
          street: '',
          additionalInfo: ''
        },
        location: { lat: 31.3469, lng: 34.3029 },
        identityStatus: 'pending',
        status: 'active',
        eligibilityStatus: 'under_review',
        lastReceived: new Date().toISOString().split('T')[0],
        totalPackages: 0,
        additionalDocuments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'family_admin',
        updatedBy: 'family_admin'
      };

      onSave(memberData);
      setHasUnsavedChanges(false);
      
      if (isEditing) {
        logInfo(`تم تحديث بيانات فرد العائلة: ${formData.name}`, 'FamilyMemberForm');
      } else {
        logInfo(`تم إضافة فرد جديد للعائلة: ${formData.name}`, 'FamilyMemberForm');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setOperationError(errorMessage);
      logError(new Error(errorMessage), 'FamilyMemberForm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('هل أنت متأكد من إلغاء التغييرات؟ ستفقد جميع البيانات المدخلة.')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="bg-purple-100 p-4 rounded-xl w-fit mx-auto mb-4 animate-fadeIn">
            <UserPlus className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 animate-slideUp">
            {isEditing ? 'تعديل بيانات فرد العائلة' : 'إضافة فرد جديد للعائلة'}
          </h2>
          <p className="text-gray-600 mt-2 animate-slideUp">
            {family ? `إضافة فرد جديد لـ ${family.name}` : 'إضافة فرد جديد للعائلة'}
          </p>
        </div>

        {/* Error Display */}
        {operationError && (
          <Card className="bg-red-50 border-red-200 animate-shake" padding="sm">
            <div className="flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">خطأ في حفظ البيانات:</span>
            </div>
            <p className="text-red-700 mt-2 text-sm">{operationError}</p>
          </Card>
        )}

        {/* Family Information */}
        {family && (
          <Card className="bg-purple-50 border-purple-200 animate-slideUp">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Heart className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-800">معلومات العائلة</h3>
                <p className="text-purple-700 text-sm">
                  {family.name} - رب الأسرة: {family.headOfFamily} - الموقع: {family.location}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Personal Information */}
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <User className="w-4 h-4 ml-2 text-blue-600" />
            المعلومات الشخصية
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="الاسم الأول"
              required
              error={getFieldState('name').error}
              success={getFieldState('name').hasSuccess ? 'اسم صحيح' : undefined}
              helpText="الاسم الأول لفرد العائلة"
            >
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={(e) => handleFieldBlur('name', e.target.value)}
                placeholder="مثال: محمد"
                icon={User}
                className={getFieldState('name').className}
                autoFocus={!isEditing}
              />
            </FormField>

            <FormField
              label="الاسم الكامل"
              required
              error={getFieldState('fullName').error}
              helpText="الاسم الكامل كما هو مكتوب في الهوية"
            >
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                onBlur={(e) => handleFieldBlur('fullName', e.target.value)}
                placeholder="مثال: محمد أحمد عبدالله الغزاوي"
                className={getFieldState('fullName').className}
              />
            </FormField>

            <FormField
              label="رقم الهوية الوطنية"
              required
              error={getFieldState('nationalId').error}
              success={getFieldState('nationalId').hasSuccess ? 'رقم هوية صحيح' : undefined}
              helpText="9 أرقام بدون فواصل"
            >
              <Input
                type="text"
                value={formData.nationalId}
                onChange={(e) => handleInputChange('nationalId', e.target.value)}
                onBlur={(e) => handleFieldBlur('nationalId', e.target.value)}
                placeholder="مثال: 900123456"
                maxLength={9}
                showCharCount
                className={getFieldState('nationalId').className}
              />
            </FormField>

            <FormField
              label="تاريخ الميلاد"
              required
              error={getFieldState('dateOfBirth').error}
            >
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                onBlur={(e) => handleFieldBlur('dateOfBirth', e.target.value)}
                icon={Calendar}
                className={getFieldState('dateOfBirth').className}
              />
            </FormField>

            <FormField label="الجنس" required>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover-glow"
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </FormField>

            <FormField
              label="رقم الهاتف"
              required
              error={getFieldState('phone').error}
              success={getFieldState('phone').hasSuccess ? 'رقم هاتف صحيح' : undefined}
              helpText="رقم هاتف فلسطيني يبدأ بـ 05"
            >
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                placeholder="مثال: 0591234567"
                icon={Phone}
                maxLength={10}
                showCharCount
                className={getFieldState('phone').className}
              />
            </FormField>
          </div>
        </Card>

        {/* Family Relationship */}
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Heart className="w-4 h-4 ml-2 text-purple-600" />
            العلاقة العائلية
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="صلة القرابة"
              required
              error={getFieldState('relationToFamily').error}
            >
              <select
                value={formData.relationToFamily}
                onChange={(e) => handleInputChange('relationToFamily', e.target.value)}
                onBlur={(e) => handleFieldBlur('relationToFamily', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover-glow"
              >
                <option value="">اختر صلة القرابة</option>
                {relationshipOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label="عدد الأفراد المعالين"
              error={getFieldState('membersCount').error}
              helpText="عدد الأشخاص الذين يعولهم هذا الفرد"
            >
              <Input
                type="number"
                value={formData.membersCount}
                onChange={(e) => handleInputChange('membersCount', parseInt(e.target.value) || 1)}
                onBlur={(e) => handleFieldBlur('membersCount', parseInt(e.target.value) || 1)}
                icon={Users}
                min={1}
                max={20}
                className={getFieldState('membersCount').className}
              />
            </FormField>
          </div>
        </Card>

        {/* Social and Economic Information */}
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Briefcase className="w-4 h-4 ml-2 text-green-600" />
            المعلومات الاجتماعية والاقتصادية
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="المهنة"
              required
              error={getFieldState('profession').error}
              helpText="المهنة الحالية أو آخر مهنة"
            >
              <Input
                type="text"
                value={formData.profession}
                onChange={(e) => handleInputChange('profession', e.target.value)}
                onBlur={(e) => handleFieldBlur('profession', e.target.value)}
                placeholder="مثال: عامل بناء"
                icon={Briefcase}
                className={getFieldState('profession').className}
              />
            </FormField>

            <FormField label="الحالة الاجتماعية" required>
              <select
                value={formData.maritalStatus}
                onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover-glow"
              >
                {maritalStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="المستوى الاقتصادي" required>
              <select
                value={formData.economicLevel}
                onChange={(e) => handleInputChange('economicLevel', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover-glow"
              >
                {economicLevelOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>
          </div>
        </Card>

        {/* Notes */}
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <FileText className="w-4 h-4 ml-2 text-yellow-600" />
            ملاحظات إضافية
          </h3>
          
          <FormField
            label="ملاحظات خاصة"
            helpText="ملاحظات إضافية حول فرد العائلة"
          >
            <Input
              type="textarea"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              placeholder="أي ملاحظات خاصة بفرد العائلة..."
              maxLength={300}
              showCharCount
            />
          </FormField>
        </Card>

        {/* Form Actions */}
        <Card className="bg-gray-50 animate-slideUp" variant="default" shadow="none">
          <div className="flex space-x-4 space-x-reverse justify-end">
            <Button
              variant="secondary"
              icon={X}
              iconPosition="right"
              onClick={handleCancel}
              disabled={isSubmitting}
              tooltip="إلغاء العملية والعودة"
              animation="hover"
            >
              إلغاء
            </Button>
            
            <Button
              variant="primary"
              icon={isSubmitting ? undefined : Save}
              iconPosition="right"
              type="submit"
              disabled={isSubmitting || !isFormValid}
              loading={isSubmitting}
              tooltip={isEditing ? "حفظ التغييرات المدخلة" : "إضافة فرد العائلة الجديد"}
              animation="hover"
            >
              {isEditing ? 'حفظ التغييرات' : 'إضافة فرد العائلة'}
            </Button>
          </div>
        </Card>

        {/* Form Instructions */}
        <Card className="bg-purple-50 border-purple-200 animate-slideUp">
          <div className="flex items-start space-x-3 space-x-reverse">
            <Heart className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-purple-800 mb-3">تعليمات إضافة فرد العائلة</h4>
              <ul className="text-sm text-purple-700 space-y-2">
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>سيتم ربط الفرد الجديد بعائلة {family?.name || 'المحددة'}</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>سيتم استخدام عنوان العائلة كعنوان افتراضي</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>سيتم تعيين حالة "بانتظار التوثيق" للفرد الجديد</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>يمكن تعديل العنوان لاحقاً من قائمة المستفيدين</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeSubmit}
        title={isEditing ? 'تأكيد حفظ التغييرات' : 'تأكيد إضافة فرد العائلة'}
        message={
          isEditing 
            ? `هل أنت متأكد من حفظ التغييرات على بيانات ${formData.name}؟`
            : `هل أنت متأكد من إضافة ${formData.name} كفرد جديد للعائلة؟`
        }
        type={isEditing ? 'warning' : 'success'}
        confirmText={isEditing ? 'حفظ التغييرات' : 'إضافة فرد العائلة'}
        cancelText="إلغاء"
        isLoading={isSubmitting}
        details={[
          `الاسم: ${formData.name}`,
          `رقم الهوية: ${formData.nationalId}`,
          `الهاتف: ${formData.phone}`,
          `صلة القرابة: ${formData.relationToFamily}`,
          `العائلة: ${family?.name || 'غير محددة'}`
        ]}
      />
    </div>
  );
}