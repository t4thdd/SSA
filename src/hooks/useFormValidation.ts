import { useState, useCallback, useEffect } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  email?: boolean;
  phone?: boolean;
  nationalId?: boolean;
  custom?: (value: any) => string | null;
  dependencies?: string[]; // Fields that this field depends on
}

interface ValidationRules {
  [field: string]: ValidationRule;
}

interface ValidationResult {
  isValid: boolean;
  errors: { [field: string]: string };
  warnings: { [field: string]: string };
  successes: { [field: string]: boolean };
  touchedFields: Set<string>;
}

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showSuccessStates?: boolean;
  debounceMs?: number;
}

export const useFormValidation = (
  rules: ValidationRules, 
  options: UseFormValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    showSuccessStates = true,
    debounceMs = 300
  } = options;

  const [errors, setErrors] = useState<{ [field: string]: string }>({});
  const [warnings, setWarnings] = useState<{ [field: string]: string }>({});
  const [successes, setSuccesses] = useState<{ [field: string]: boolean }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const validateField = useCallback((field: string, value: any, formData?: { [field: string]: any }): { error: string | null; warning: string | null } => {
    const rule = rules[field];
    if (!rule) return { error: null, warning: null };

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return { error: 'هذا الحقل مطلوب', warning: null };
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return { error: null, warning: null };
    }

    // String validations
    if (typeof value === 'string') {
      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        return { error: `يجب أن يكون الحد الأدنى ${rule.minLength} أحرف`, warning: null };
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        return { error: `يجب أن لا يتجاوز ${rule.maxLength} حرف`, warning: null };
      }

      // Email validation
      if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { error: 'صيغة البريد الإلكتروني غير صحيحة', warning: null };
      }

      // Phone validation (Palestinian format)
      if (rule.phone && !/^05\d{8}$/.test(value)) {
        return { error: 'رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام', warning: null };
      }

      // National ID validation (9 digits)
      if (rule.nationalId && !/^\d{9}$/.test(value)) {
        return { error: 'رقم الهوية يجب أن يتكون من 9 أرقام', warning: null };
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return { error: 'صيغة غير صحيحة', warning: null };
      }
    }

    // Number validations
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const numValue = Number(value);
      
      if (rule.min !== undefined && numValue < rule.min) {
        return { error: `القيمة يجب أن تكون ${rule.min} أو أكثر`, warning: null };
      }

      if (rule.max !== undefined && numValue > rule.max) {
        return { error: `القيمة يجب أن تكون ${rule.max} أو أقل`, warning: null };
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return { error: customError, warning: null };
      }
    }

    // Dependency validation
    if (rule.dependencies && formData) {
      for (const dep of rule.dependencies) {
        if (!formData[dep]) {
          return { error: null, warning: `يتطلب تعبئة حقل ${dep} أولاً` };
        }
      }
    }

    return { error: null, warning: null };
  }, [rules]);

  const validateForm = useCallback((formData: { [field: string]: any }): ValidationResult => {
    setIsValidating(true);
    
    const newErrors: { [field: string]: string } = {};
    const newWarnings: { [field: string]: string } = {};
    const newSuccesses: { [field: string]: boolean } = {};

    Object.keys(rules).forEach(field => {
      const { error, warning } = validateField(field, formData[field], formData);
      
      if (error) {
        newErrors[field] = error;
        newSuccesses[field] = false;
      } else if (warning) {
        newWarnings[field] = warning;
        newSuccesses[field] = false;
      } else if (formData[field] && showSuccessStates) {
        newSuccesses[field] = true;
      }
    });

    setErrors(newErrors);
    setWarnings(newWarnings);
    setSuccesses(newSuccesses);
    setIsValidating(false);

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
      warnings: newWarnings,
      successes: newSuccesses,
      touchedFields
    };
  }, [rules, validateField, showSuccessStates, touchedFields]);

  const validateSingleField = useCallback((field: string, value: any, formData?: { [field: string]: any }) => {
    const debouncedValidation = () => {
      const { error, warning } = validateField(field, value, formData);
      
      setErrors(prev => ({
        ...prev,
        [field]: error || ''
      }));

      setWarnings(prev => ({
        ...prev,
        [field]: warning || ''
      }));

      setSuccesses(prev => ({
        ...prev,
        [field]: !error && !warning && !!value && showSuccessStates
      }));

      return !error;
    };

    if (debounceMs > 0) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      const timer = setTimeout(debouncedValidation, debounceMs);
      setDebounceTimer(timer);
    } else {
      return debouncedValidation();
    }
  }, [validateField, showSuccessStates, debounceMs, debounceTimer]);

  const markFieldAsTouched = useCallback((field: string) => {
    setTouchedFields(prev => new Set([...prev, field]));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
    setWarnings(prev => ({
      ...prev,
      [field]: ''
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
    setWarnings({});
    setSuccesses({});
    setTouchedFields(new Set());
  }, []);

  const hasErrors = Object.values(errors).some(error => error);
  const hasWarnings = Object.values(warnings).some(warning => warning);
  const isFormValid = !hasErrors && Object.keys(rules).every(field => 
    !rules[field].required || successes[field] || !touchedFields.has(field)
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Enhanced validation methods
  const validateFieldOnChange = useCallback((field: string, value: any, formData?: { [field: string]: any }) => {
    if (validateOnChange) {
      validateSingleField(field, value, formData);
    }
  }, [validateOnChange, validateSingleField]);

  const validateFieldOnBlur = useCallback((field: string, value: any, formData?: { [field: string]: any }) => {
    markFieldAsTouched(field);
    if (validateOnBlur) {
      validateSingleField(field, value, formData);
    }
  }, [validateOnBlur, validateSingleField, markFieldAsTouched]);

  const getFieldState = useCallback((field: string) => {
    const hasError = !!errors[field];
    const hasWarning = !!warnings[field];
    const hasSuccess = !!successes[field];
    const isTouched = touchedFields.has(field);

    return {
      hasError,
      hasWarning,
      hasSuccess,
      isTouched,
      error: errors[field],
      warning: warnings[field],
      isValid: !hasError && !hasWarning,
      className: hasError ? 'field-invalid' : hasSuccess ? 'field-valid' : hasWarning ? 'field-warning' : ''
    };
  }, [errors, warnings, successes, touchedFields]);

  return {
    errors,
    warnings,
    successes,
    touchedFields,
    isValidating,
    hasErrors,
    hasWarnings,
    isFormValid,
    validateForm,
    validateSingleField,
    validateFieldOnChange,
    validateFieldOnBlur,
    markFieldAsTouched,
    clearFieldError,
    clearAllErrors,
    getFieldState
  };
};

// Predefined validation rules for common fields
export const commonValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[\u0600-\u06FF\s]+$/ // Arabic characters only
  },
  
  nationalId: {
    required: true,
    nationalId: true
  },
  
  phone: {
    required: true,
    phone: true
  },
  
  email: {
    required: true,
    email: true
  },
  
  password: {
    required: true,
    minLength: 6,
    pattern: /^(?=.*[a-zA-Z])(?=.*\d)/ // At least one letter and one number
  },
  
  confirmPassword: {
    required: true,
    custom: (value: string, formData?: any) => {
      if (formData?.password && value !== formData.password) {
        return 'كلمات المرور غير متطابقة';
      }
      return null;
    },
    dependencies: ['password']
  }
};