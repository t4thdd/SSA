import React, { useState, useEffect } from 'react';
import { Package, Building2, FileText, DollarSign, Weight, Plus, Trash2, Save, X, AlertTriangle, CheckCircle, List, Edit } from 'lucide-react';
import { useErrorLogger } from '../utils/errorLogger';
import { Button, Card, Input, FormField, ConfirmationModal } from './ui';
import { useFormValidation } from '../hooks/useFormValidation';
interface PackageTemplateFormProps {
  template?: PackageTemplate | null;
  onSave: (data: Partial<PackageTemplate>) => void;
  onCancel: () => void;
  isCopy?: boolean;
  mode?: 'add' | 'edit' | 'copy';
}

interface FormData {
  name: string;
  type: 'food' | 'medical' | 'clothing' | 'hygiene' | 'emergency' | '';
  organization_id: string;
  description: string;
  contents: PackageItem[];
  estimatedCost: number;
  totalWeight: number;
}

export default function PackageTemplateForm({ template, onSave, onCancel, isCopy = false, mode = 'add' }: PackageTemplateFormProps) {
  const { logError, logInfo } = useErrorLogger();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    organization_id: '',
    description: '',
    contents: [],
    estimatedCost: 0,
    totalWeight: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isEditing = !!template && !isCopy;

  // Enhanced validation rules
  const validationRules = {
    name: {
      required: true,
      minLength: 3,
      maxLength: 100
    },
    type: {
      required: true
    },
    organization_id: {
      required: true
    },
    estimatedCost: {
      required: true,
      min: 0.01,
      custom: (value: number) => {
        if (value <= 0) return 'التكلفة يجب أن تكون أكبر من صفر';
        if (value > 10000) return 'التكلفة مرتفعة جداً، يرجى المراجعة';
        return null;
      }
    },
    contents: {
      custom: (value: PackageItem[]) => {
        if (!value || value.length === 0) return 'يجب إضافة عناصر إلى محتويات الطرد';
        
        // Validate each item
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (!item.name?.trim()) return `اسم العنصر ${i + 1} مطلوب`;
          if (!item.quantity || item.quantity <= 0) return `كمية العنصر ${i + 1} يجب أن تكون أكبر من صفر`;
          if (!item.unit?.trim()) return `وحدة العنصر ${i + 1} مطلوبة`;
          if (!item.weight || item.weight <= 0) return `وزن العنصر ${i + 1} يجب أن يكون أكبر من صفر`;
        }
        
        return null;
      }
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
    if (template && (isEditing || isCopy)) {
      setFormData({
        name: isCopy ? `${template.name} (نسخة)` : template.name || '',
        type: template.type || '',
        organization_id: template.organization_id || '',
        description: template.description || '',
        contents: template.contents || [],
        estimatedCost: template.estimatedCost || 0,
        totalWeight: template.totalWeight || 0,
      });
    }
  }, [template, isEditing, isCopy]);

  const organizationOptions = mockOrganizations.map(org => ({
    value: org.id,
    label: org.name,
  }));

  const packageTypes = [
    { value: 'food', label: 'مواد غذائية', icon: '🍚' },
    { value: 'medical', label: 'طبية', icon: '💊' },
    { value: 'clothing', label: 'ملابس', icon: '👕' },
    { value: 'hygiene', label: 'نظافة', icon: '🧼' },
    { value: 'emergency', label: 'طوارئ', icon: '🚨' },
  ];

  const handleInputChange = (field: keyof FormData, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setHasUnsavedChanges(true);
    
    validateFieldOnChange(field, value, newFormData);
  };

  const handleContentChange = (index: number, field: keyof PackageItem, value: any) => {
    const newContents = [...formData.contents];
    newContents[index] = { ...newContents[index], [field]: value };
    
    // Recalculate total weight
    const totalWeight = newContents.reduce((sum, item) => sum + (item.weight || 0), 0);
    
    const newFormData = {
      ...formData,
      contents: newContents,
      totalWeight
    };
    
    setFormData(newFormData);
    setHasUnsavedChanges(true);
    
    // Validate contents
    validateFieldOnChange('contents', newContents, newFormData);
  };

  const addContentItem = () => {
    const newItem: PackageItem = {
      id: `item-${Date.now()}`,
      name: '',
      quantity: 0,
      unit: '',
      weight: 0
    };
    
    const newContents = [...formData.contents, newItem];
    setFormData(prev => ({
      ...prev,
      contents: newContents
    }));
    setHasUnsavedChanges(true);
  };

  const removeContentItem = (index: number) => {
    const newContents = formData.contents.filter((_, i) => i !== index);
    const totalWeight = newContents.reduce((sum, item) => sum + (item.weight || 0), 0);
    
    const newFormData = {
      ...formData,
      contents: newContents,
      totalWeight
    };
    
    setFormData(newFormData);
    setHasUnsavedChanges(true);
    
    // Validate contents after removal
    validateFieldOnChange('contents', newContents, newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(formData);
    if (!validation.isValid) {
      logError(new Error('فشل في التحقق من صحة البيانات'), 'PackageTemplateForm');
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

      onSave(formData);
      setHasUnsavedChanges(false);
      logInfo(`تم حفظ قالب الطرد: ${formData.name}`, 'PackageTemplateForm');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setOperationError(errorMessage);
      logError(new Error(errorMessage), 'PackageTemplateForm');
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
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 animate-slideUp">
            {isEditing ? 'تعديل قالب الطرد' : isCopy ? 'نسخ قالب الطرد' : 'إضافة قالب طرد جديد'}
          </h2>
          <p className="text-gray-600 mt-2 animate-slideUp">
            {isEditing ? 'تحديث معلومات قالب الطرد في النظام' : isCopy ? 'إنشاء نسخة جديدة من قالب موجود' : 'إضافة قالب طرد جديد لتسهيل عمليات التوزيع'}
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
            <Package className="w-4 h-4 ml-2 text-blue-600" />
            معلومات القالب الأساسية
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="اسم القالب"
              required
              error={getFieldState('name').error}
              success={getFieldState('name').hasSuccess ? 'اسم قالب مناسب' : undefined}
              helpText="اسم وصفي للقالب يسهل التعرف عليه"
            >
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={(e) => handleFieldBlur('name', e.target.value)}
                placeholder="مثال: طرد رمضان كريم 2024"
                icon={Package}
                className={getFieldState('name').className}
                autoFocus={!isEditing}
              />
            </FormField>

            <FormField
              label="نوع القالب"
              required
              error={getFieldState('type').error}
            >
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as FormData['type'])}
                onBlur={(e) => handleFieldBlur('type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover-glow"
              >
                <option value="">اختر النوع</option>
                {packageTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="المؤسسة المانحة"
              required
              error={getFieldState('organization_id').error}
            >
              <select
                value={formData.organization_id}
                onChange={(e) => handleInputChange('organization_id', e.target.value)}
                onBlur={(e) => handleFieldBlur('organization_id', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover-glow"
              >
                <option value="">اختر المؤسسة</option>
                {organizationOptions.map(org => (
                  <option key={org.value} value={org.value}>{org.label}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label="التكلفة المقدرة (₪)"
              required
              error={getFieldState('estimatedCost').error}
              success={getFieldState('estimatedCost').hasSuccess ? 'تكلفة مناسبة' : undefined}
              helpText="التكلفة التقديرية بالشيكل"
            >
              <Input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => handleInputChange('estimatedCost', parseFloat(e.target.value) || 0)}
                onBlur={(e) => handleFieldBlur('estimatedCost', parseFloat(e.target.value) || 0)}
                placeholder="مثال: 50"
                icon={DollarSign}
                min={0}
                step={0.01}
                className={getFieldState('estimatedCost').className}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                label="الوصف"
                helpText="وصف مفصل يساعد في فهم محتويات القالب"
              >
                <Input
                  type="textarea"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="وصف تفصيلي لمحتويات الطرد أو الغرض منه..."
                  rows={3}
                  maxLength={500}
                  showCharCount
                />
              </FormField>
            </div>
          </div>
        </Card>

        {/* Package Contents */}
        <Card className="animate-slideUp hover-lift">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <List className="w-4 h-4 ml-2 text-green-600" />
              محتويات الطرد
            </h3>
            <div className="text-right">
              <p className="text-sm text-gray-600">الوزن الإجمالي</p>
              <p className="text-lg font-bold text-green-600">{formData.totalWeight.toFixed(2)} كيلو</p>
            </div>
          </div>

          {/* Contents List */}
          <div className="space-y-4">
            {formData.contents.map((item, index) => (
              <div key={item.id || index} className="grid md:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg relative bg-gray-50 hover:bg-gray-100 transition-colors">
                <FormField
                  label="اسم العنصر"
                  required
                  error={errors[`contents[${index}].name`]}
                >
                  <Input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleContentChange(index, 'name', e.target.value)}
                    placeholder="مثال: أرز بسمتي"
                    size="sm"
                  />
                </FormField>

                <FormField
                  label="الكمية"
                  required
                  error={errors[`contents[${index}].quantity`]}
                >
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleContentChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="مثال: 5"
                    min={0}
                    size="sm"
                  />
                </FormField>

                <FormField
                  label="الوحدة"
                  required
                  error={errors[`contents[${index}].unit`]}
                >
                  <Input
                    type="text"
                    value={item.unit}
                    onChange={(e) => handleContentChange(index, 'unit', e.target.value)}
                    placeholder="مثال: كيلو"
                    size="sm"
                  />
                </FormField>

                <FormField
                  label="الوزن (كيلو)"
                  required
                  error={errors[`contents[${index}].weight`]}
                >
                  <Input
                    type="number"
                    value={item.weight}
                    onChange={(e) => handleContentChange(index, 'weight', parseFloat(e.target.value) || 0)}
                    placeholder="مثال: 5"
                    min={0}
                    step={0.1}
                    size="sm"
                  />
                </FormField>

                <FormField label="ملاحظات">
                  <Input
                    type="text"
                    value={item.notes}
                    onChange={(e) => handleContentChange(index, 'notes', e.target.value)}
                    placeholder="ملاحظات خاصة بالعنصر"
                    size="sm"
                  />
                </FormField>

                <div className="flex items-end justify-center">
                  <Button
                    type="button"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => removeContentItem(index)}
                    size="sm"
                    tooltip="حذف هذا العنصر"
                    animation="hover"
                  >
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Validation Error for Contents */}
          {getFieldState('contents').error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
              <div className="flex items-center space-x-2 space-x-reverse">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-red-800 font-medium">{getFieldState('contents').error}</span>
              </div>
            </div>
          )}

          {/* Add Item Button */}
          <div className="mt-6">
            <Button
              type="button"
              variant="secondary"
              icon={Plus}
              onClick={addContentItem}
              fullWidth
              animation="hover"
              tooltip="إضافة عنصر جديد للطرد"
            >
              إضافة عنصر جديد
            </Button>
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
              tooltip={isEditing ? "حفظ التغييرات المدخلة" : isCopy ? "إنشاء نسخة من القالب" : "إضافة القالب الجديد"}
              animation="hover"
            >
              {isEditing ? 'حفظ التغييرات' : isCopy ? 'نسخ القالب' : 'إضافة القالب'}
            </Button>
          </div>
        </Card>

        {/* Form Instructions */}
        <Card className="bg-blue-50 border-blue-200 animate-slideUp">
          <div className="flex items-start space-x-3 space-x-reverse">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800 mb-3">تعليمات مهمة</h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>تأكد من إدخال جميع الحقول المطلوبة.</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>يجب أن تكون التكلفة المقدرة والوزن أكبر من صفر.</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>يمكنك إضافة عدة عناصر إلى محتويات الطرد.</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>الوزن الإجمالي يتم حسابه تلقائياً من أوزان العناصر.</span>
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
        title={
          isEditing ? 'تأكيد حفظ التغييرات' : 
          isCopy ? 'تأكيد نسخ القالب' : 
          'تأكيد إضافة القالب'
        }
        message={
          isEditing 
            ? `هل أنت متأكد من حفظ التغييرات على قالب "${formData.name}"؟`
            : isCopy
            ? `هل أنت متأكد من إنشاء نسخة من قالب "${formData.name}"؟`
            : `هل أنت متأكد من إضافة قالب "${formData.name}" الجديد؟`
        }
        type={isEditing ? 'warning' : 'success'}
        confirmText={isEditing ? 'حفظ التغييرات' : isCopy ? 'نسخ القالب' : 'إضافة القالب'}
        cancelText="إلغاء"
        isLoading={isSubmitting}
        details={[
          `اسم القالب: ${formData.name}`,
          `النوع: ${packageTypes.find(t => t.value === formData.type)?.label || 'غير محدد'}`,
          `المؤسسة: ${organizationOptions.find(o => o.value === formData.organization_id)?.label || 'غير محددة'}`,
          `عدد العناصر: ${formData.contents.length}`,
          `الوزن الإجمالي: ${formData.totalWeight.toFixed(2)} كيلو`,
          `التكلفة المقدرة: ${formData.estimatedCost} ₪`
        ]}
      />
    </div>
  );
}