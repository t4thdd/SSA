import React, { useState, useEffect } from 'react';
import { Building2, Save, X, AlertTriangle, CheckCircle, MapPin, Phone, Mail, User, Activity } from 'lucide-react';
import { type Organization } from '../data/mockData';
import { useErrorLogger } from '../utils/errorLogger';
import { Button, Card, Input, FormField, ConfirmationModal } from './ui';
import { useFormValidation, commonValidationRules } from '../hooks/useFormValidation';

interface OrganizationFormProps {
  organization?: Organization | null;
  onSave: (data: Partial<Organization>) => void;
  onCancel: () => void;
  mode?: 'add' | 'edit';
}

interface FormData {
  name: string;
  type: string;
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
}

export default function OrganizationForm({ organization, onSave, onCancel, mode = 'add' }: OrganizationFormProps) {
  const { logError, logInfo } = useErrorLogger();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    location: '',
    contactPerson: '',
    phone: '',
    email: '',
    status: 'pending',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isEditing = !!organization;

  // Enhanced validation rules
  const validationRules = {
    name: {
      required: true,
      minLength: 3,
      maxLength: 100,
      custom: (value: string) => {
        if (value && value.length < 3) return 'اسم المؤسسة قصير جداً';
        return null;
      }
    },
    type: {
      required: true,
      minLength: 2
    },
    location: {
      required: true,
      minLength: 3
    },
    contactPerson: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[\u0600-\u06FF\s]+$/ // Arabic characters only
    },
    phone: commonValidationRules.phone,
    email: commonValidationRules.email
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
    if (organization) {
      setFormData({
        name: organization.name || '',
        type: organization.type || '',
        location: organization.location || '',
        contactPerson: organization.contactPerson || '',
        phone: organization.phone || '',
        email: organization.email || '',
        status: organization.status || 'pending',
      });
    }
  }, [organization]);

  const organizationTypes = [
    'منظمة دولية', 'منظمة محلية', 'جمعية خيرية', 'مبادرة فردية', 'أخرى'
  ];

  const organizationStatuses = [
    { value: 'active', label: 'نشطة', color: 'text-green-600' },
    { value: 'pending', label: 'معلقة', color: 'text-yellow-600' },
    { value: 'suspended', label: 'موقوفة', color: 'text-red-600' }
  ];

  const handleInputChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setHasUnsavedChanges(true);
    
    // Validate field on change
    validateFieldOnChange(field, value, newFormData);
  };

  const handleFieldBlur = (field: string, value: any) => {
    validateFieldOnBlur(field, value, formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm(formData);
    if (!validation.isValid) {
      logError(new Error('فشل في التحقق من صحة البيانات'), 'OrganizationForm');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);
    setOperationError(null);
    setShowConfirmModal(false);

    try {
      const dataToSave: Partial<Organization> = {
        name: formData.name.trim(),
        type: formData.type.trim(),
        location: formData.location.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        status: formData.status,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSave(dataToSave);
      setHasUnsavedChanges(false);
      logInfo('تم حفظ بيانات المؤسسة: ' + formData.name, 'OrganizationForm');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setOperationError(errorMessage);
      logError(new Error(errorMessage), 'OrganizationForm');
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
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 animate-slideUp">
            {isEditing ? 'تعديل بيانات المؤسسة' : 'إضافة مؤسسة جديدة'}
          </h2>
          <p className="text-gray-600 mt-2 animate-slideUp">
            {isEditing ? 'تحديث معلومات المؤسسة في النظام' : 'إضافة مؤسسة جديدة إلى قاعدة البيانات'}
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

        {/* General Information */}
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Building2 className="w-4 h-4 ml-2 text-blue-600" />
            المعلومات العامة
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="اسم المؤسسة"
              required
              error={getFieldState('name').error}
              success={getFieldState('name').hasSuccess ? 'اسم مؤسسة صحيح' : undefined}
              helpText="الاسم الرسمي للمؤسسة"
            >
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={(e) => handleFieldBlur('name', e.target.value)}
                placeholder="مثال: جمعية الهلال الأحمر"
                icon={Building2}
                className={getFieldState('name').className}
                autoFocus={!isEditing}
              />
            </FormField>

            <FormField
              label="نوع المؤسسة"
              required
              error={getFieldState('type').error}
            >
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                onBlur={(e) => handleFieldBlur('type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover-glow"
              >
                <option value="">اختر النوع</option>
                {organizationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label="الموقع (المدينة/المنطقة)"
              required
              error={getFieldState('location').error}
              helpText="الموقع الجغرافي للمؤسسة"
            >
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                onBlur={(e) => handleFieldBlur('location', e.target.value)}
                placeholder="مثال: خان يونس - الكتيبة"
                icon={MapPin}
                className={getFieldState('location').className}
              />
            </FormField>

            <FormField
              label="حالة المؤسسة"
              required
            >
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover-glow"
              >
                {organizationStatuses.map(status => (
                  <option key={status.value} value={status.value} className={status.color}>
                    {status.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="animate-slideUp hover-lift">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <User className="w-4 h-4 ml-2 text-green-600" />
            معلومات الاتصال
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="اسم شخص الاتصال"
              required
              error={getFieldState('contactPerson').error}
              helpText="الشخص المسؤول عن التواصل"
            >
              <Input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                onBlur={(e) => handleFieldBlur('contactPerson', e.target.value)}
                placeholder="مثال: أحمد أبو سالم"
                icon={User}
                className={getFieldState('contactPerson').className}
              />
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

            <div className="md:col-span-2">
              <FormField
                label="البريد الإلكتروني"
                required
                error={getFieldState('email').error}
                success={getFieldState('email').hasSuccess ? 'بريد إلكتروني صحيح' : undefined}
                helpText="البريد الإلكتروني الرسمي للمؤسسة"
              >
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={(e) => handleFieldBlur('email', e.target.value)}
                  placeholder="مثال: info@example.com"
                  icon={Mail}
                  className={getFieldState('email').className}
                />
              </FormField>
            </div>
          </div>
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
              tooltip={isEditing ? "حفظ التغييرات المدخلة" : "إضافة المؤسسة الجديدة"}
              animation="hover"
            >
              {isEditing ? 'حفظ التغييرات' : 'إضافة المؤسسة'}
            </Button>
          </div>
        </Card>

        {/* Form Instructions */}
        <Card className="bg-blue-50 border-blue-200 animate-slideUp">
          <div className="flex items-start space-x-3 space-x-reverse">
            <Activity className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800 mb-3">تعليمات مهمة</h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>تأكد من إدخال جميع الحقول المطلوبة.</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>البريد الإلكتروني يجب أن يكون بصيغة صحيحة.</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>الحالة الافتراضية للمؤسسة الجديدة هي "معلقة".</span>
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
        title={isEditing ? 'تأكيد حفظ التغييرات' : 'تأكيد إضافة المؤسسة'}
        message={
          isEditing 
            ? `هل أنت متأكد من حفظ التغييرات على بيانات ${formData.name}؟`
            : `هل أنت متأكد من إضافة ${formData.name} كمؤسسة جديدة؟`
        }
        type={isEditing ? 'warning' : 'success'}
        confirmText={isEditing ? 'حفظ التغييرات' : 'إضافة المؤسسة'}
        cancelText="إلغاء"
        isLoading={isSubmitting}
        details={[
          `اسم المؤسسة: ${formData.name}`,
          `النوع: ${formData.type}`,
          `الموقع: ${formData.location}`,
          `شخص الاتصال: ${formData.contactPerson}`,
          `الهاتف: ${formData.phone}`
        ]}
      />
    </div>
  );
}