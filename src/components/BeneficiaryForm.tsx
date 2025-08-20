import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Calendar, Shield, Save, X, AlertTriangle, CheckCircle, Users, Briefcase, Heart, DollarSign, FileText, Home } from 'lucide-react';
import { type Beneficiary } from '../data/mockData';
import { useErrorLogger } from '../utils/errorLogger';
import { Button, Card, Input, Badge, FormField, ConfirmationModal } from './ui';
import { useFormValidation, commonValidationRules } from '../hooks/useFormValidation';
import * as Sentry from '@sentry/react';

interface BeneficiaryFormProps {
  beneficiary?: Beneficiary | null;
  onSave: (data: Partial<Beneficiary>) => void;
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
  address: string;
  detailedAddress: {
    governorate: string;
    city: string;
    district: string;
    street: string;
    additionalInfo: string;
  };
  profession: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  economicLevel: 'very_poor' | 'poor' | 'moderate' | 'good';
  membersCount: number;
  notes: string;
}

export default function BeneficiaryForm({ beneficiary, onSave, onCancel, mode = 'add' }: BeneficiaryFormProps) {
  const { logError, logInfo } = useErrorLogger();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    fullName: '',
    nationalId: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    address: '',
    detailedAddress: {
      governorate: '',
      city: '',
      district: '',
      street: '',
      additionalInfo: ''
    },
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

  const isEditing = !!beneficiary;

  // Enhanced validation rules
  const validationRules = {
    name: {
      ...commonValidationRules.name,
      custom: (value: string) => {
        if (value && value.length < 2) return 'الاسم قصير جداً';
        if (value && !/^[\u0600-\u06FF\s]+$/.test(value)) return 'يجب أن يحتوي على أحرف عربية فقط';
        return null;
      }
    },
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
        if (age < 18) return 'يجب أن يكون العمر 18 سنة أو أكثر';
        return null;
      }
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
    },
    'detailedAddress.governorate': {
      required: true
    },
    'detailedAddress.city': {
      required: true,
      minLength: 2
    },
    'detailedAddress.district': {
      required: true,
      minLength: 2
    }
  };

  const {
    errors,
    warnings,
    successes,
    validateForm,
    validateFieldOnChange,
    validateFieldOnBlur,
    clearAllErrors,
    getFieldState,
    isFormValid
  } = useFormValidation(validationRules, {
    validateOnChange: true,
    validateOnBlur: true,
    showSuccessStates: true,
    debounceMs: 300
  });

  useEffect(() => {
    if (beneficiary) {
      const newFormData = {
        name: beneficiary.name || '',
        fullName: beneficiary.fullName || '',
        nationalId: beneficiary.nationalId || '',
        dateOfBirth: beneficiary.dateOfBirth || '',
        gender: beneficiary.gender || 'male',
        phone: beneficiary.phone || '',
        address: beneficiary.address || '',
        detailedAddress: {
          governorate: beneficiary.detailedAddress?.governorate || '',
          city: beneficiary.detailedAddress?.city || '',
          district: beneficiary.detailedAddress?.district || '',
          street: beneficiary.detailedAddress?.street || '',
          additionalInfo: beneficiary.detailedAddress?.additionalInfo || ''
        },
        profession: beneficiary.profession || '',
        maritalStatus: beneficiary.maritalStatus || 'single',
        economicLevel: beneficiary.economicLevel || 'poor',
        membersCount: beneficiary.membersCount || 1,
        notes: beneficiary.notes || ''
      };
      setFormData(newFormData);
    }
  }, [beneficiary]);

  const governorates = ['غزة', 'خان يونس', 'الوسطى', 'شمال غزة', 'رفح'];
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
    
    // Validate field on change
    validateFieldOnChange(field, value, newFormData);
  };

  const handleDetailedAddressChange = (field: string, value: string) => {
    const newDetailedAddress = {
      ...formData.detailedAddress,
      [field]: value
    };
    
    const newFormData = {
      ...formData,
      detailedAddress: newDetailedAddress
    };
    
    // Auto-generate short address
    const shortAddress = [
      newDetailedAddress.governorate,
      newDetailedAddress.city,
      newDetailedAddress.district
    ].filter(Boolean).join(' - ');
    
    newFormData.address = shortAddress;
    
    setFormData(newFormData);
    setHasUnsavedChanges(true);
    
    // Validate the detailed address field
    validateFieldOnChange(`detailedAddress.${field}`, value, newFormData);
  };

  const handleFieldBlur = (field: string, value: any) => {
    validateFieldOnBlur(field, value, formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm(formData);
    if (!validation.isValid) {
      logError(new Error('فشل في التحقق من صحة البيانات'), 'BeneficiaryForm');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);
    setOperationError(null);
    setShowConfirmModal(false);

    try {
      const dataToSave: Partial<Beneficiary> = {
        name: formData.name.trim(),
        fullName: formData.fullName.trim(),
        nationalId: formData.nationalId.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        detailedAddress: formData.detailedAddress,
        location: { lat: 31.3469, lng: 34.3029 },
        profession: formData.profession.trim(),
        maritalStatus: formData.maritalStatus,
        economicLevel: formData.economicLevel,
        membersCount: formData.membersCount,
        notes: formData.notes.trim(),
        identityStatus: isEditing ? beneficiary?.identityStatus : 'pending',
        status: isEditing ? beneficiary?.status : 'active',
        eligibilityStatus: isEditing ? beneficiary?.eligibilityStatus : 'under_review',
        lastReceived: isEditing ? beneficiary?.lastReceived : new Date().toISOString().split('T')[0],
        totalPackages: isEditing ? beneficiary?.totalPackages : 0,
        additionalDocuments: isEditing ? beneficiary?.additionalDocuments : [],
        createdAt: isEditing ? beneficiary?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: isEditing ? beneficiary?.createdBy : 'admin',
        updatedBy: 'admin'
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      onSave(dataToSave);
      setHasUnsavedChanges(false);
      
      if (isEditing) {
        logInfo(`تم تحديث بيانات المستفيد: ${formData.name}`, 'BeneficiaryForm');
      } else {
        logInfo(`تم إضافة مستفيد جديد: ${formData.name}`, 'BeneficiaryForm');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setOperationError(errorMessage);
      Sentry.captureException(error instanceof Error ? error : new Error(errorMessage));
      logError(new Error(errorMessage), 'BeneficiaryForm');
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
          <div className="bg-blue-100 p-4 rounded-xl w-fit mx-auto mb-4 animate-fadeIn">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 animate-slideUp">
            {isEditing ? 'تعديل بيانات المستفيد' : 'إضافة مستفيد جديد'}
          </h2>
          <p className="text-gray-600 mt-2 animate-slideUp">
            {isEditing ? 'تحديث معلومات المستفيد في النظام' : 'إضافة مستفيد جديد إلى قاعدة البيانات'}
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
              helpText="أدخل الاسم الأول للمستفيد"
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
              helpText="9 أرقام بدون فواصل أو رموز"
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
              helpText="يبدأ بـ 05 ويتكون من 10 أرقام"
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

        {/* Address Information */}
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <MapPin className="w-4 h-4 ml-2 text-green-600" />
            معلومات العنوان
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="المحافظة"
              required
              error={getFieldState('detailedAddress.governorate').error}
            >
              <select
                value={formData.detailedAddress.governorate}
                onChange={(e) => handleDetailedAddressChange('governorate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover-glow"
              >
                <option value="">اختر المحافظة</option>
                {governorates.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label="المدينة / المخيم"
              required
              error={getFieldState('detailedAddress.city').error}
              helpText="اسم المدينة أو المخيم"
            >
              <Input
                type="text"
                value={formData.detailedAddress.city}
                onChange={(e) => handleDetailedAddressChange('city', e.target.value)}
                onBlur={(e) => handleFieldBlur('detailedAddress.city', e.target.value)}
                placeholder="مثال: خان يونس"
                icon={Home}
                className={getFieldState('detailedAddress.city').className}
              />
            </FormField>

            <FormField
              label="الحي / المنطقة"
              required
              error={getFieldState('detailedAddress.district').error}
              helpText="اسم الحي أو المنطقة السكنية"
            >
              <Input
                type="text"
                value={formData.detailedAddress.district}
                onChange={(e) => handleDetailedAddressChange('district', e.target.value)}
                onBlur={(e) => handleFieldBlur('detailedAddress.district', e.target.value)}
                placeholder="مثال: الكتيبة"
                icon={MapPin}
                className={getFieldState('detailedAddress.district').className}
              />
            </FormField>

            <FormField
              label="الشارع"
              helpText="اسم الشارع (اختياري)"
            >
              <Input
                type="text"
                value={formData.detailedAddress.street}
                onChange={(e) => handleDetailedAddressChange('street', e.target.value)}
                placeholder="مثال: شارع الشهداء"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                label="معلومات إضافية عن العنوان"
                helpText="معالم مميزة أو تفاصيل إضافية تساعد في الوصول"
              >
                <Input
                  type="text"
                  value={formData.detailedAddress.additionalInfo}
                  onChange={(e) => handleDetailedAddressChange('additionalInfo', e.target.value)}
                  placeholder="مثال: بجانب مسجد الكتيبة الكبير"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField
                label="العنوان المختصر (يتم إنشاؤه تلقائياً)"
                helpText="سيتم إنشاؤه تلقائياً من العنوان المفصل"
              >
                <Input
                  type="text"
                  value={formData.address}
                  placeholder="سيتم إنشاؤه تلقائياً من العنوان المفصل"
                  disabled
                  variant="filled"
                />
              </FormField>
            </div>
          </div>
        </Card>

        {/* Social and Economic Information */}
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Heart className="w-4 h-4 ml-2 text-purple-600" />
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

            <FormField
              label="عدد أفراد الأسرة"
              required
              error={getFieldState('membersCount').error}
              helpText="العدد الإجمالي لأفراد الأسرة"
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

        {/* Notes */}
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <FileText className="w-4 h-4 ml-2 text-yellow-600" />
            ملاحظات إضافية
          </h3>
          
          <FormField
            label="ملاحظات خاصة"
            helpText="ملاحظات إضافية تساعد في تحديد احتياجات المستفيد"
          >
            <Input
              type="textarea"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              placeholder="أي ملاحظات خاصة بالمستفيد..."
              maxLength={500}
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
              tooltip={isEditing ? "حفظ التغييرات المدخلة" : "إضافة المستفيد الجديد"}
              animation="hover"
            >
              {isEditing ? 'حفظ التغييرات' : 'إضافة المستفيد'}
            </Button>
          </div>
        </Card>

        {/* Form Instructions */}
        <Card className="bg-blue-50 border-blue-200 animate-slideUp">
          <div className="flex items-start space-x-3 space-x-reverse">
            <Shield className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800 mb-3">تعليمات مهمة</h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>تأكد من صحة رقم الهوية الوطنية (9 أرقام)</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>العنوان المفصل مطلوب لضمان دقة التوصيل</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>سيتم تعيين حالة "بانتظار التوثيق" للمستفيد الجديد</span>
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
        title={isEditing ? 'تأكيد حفظ التغييرات' : 'تأكيد إضافة المستفيد'}
        message={
          isEditing 
            ? `هل أنت متأكد من حفظ التغييرات على بيانات ${formData.name}؟`
            : `هل أنت متأكد من إضافة ${formData.name} كمستفيد جديد؟`
        }
        type={isEditing ? 'warning' : 'success'}
        confirmText={isEditing ? 'حفظ التغييرات' : 'إضافة المستفيد'}
        cancelText="إلغاء"
        isLoading={isSubmitting}
        details={[
          `الاسم: ${formData.name}`,
          `رقم الهوية: ${formData.nationalId}`,
          `الهاتف: ${formData.phone}`,
          `المنطقة: ${formData.detailedAddress.governorate} - ${formData.detailedAddress.district}`
        ]}
      />
    </div>
  );
}