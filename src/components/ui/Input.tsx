import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'datetime-local' | 'textarea' | 'search';
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  error?: string;
  success?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  rows?: number;
  label?: string;
  helpText?: string;
  maxLength?: number;
  minLength?: number;
  showCharCount?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  loading?: boolean;
}

export const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  icon: Icon,
  iconPosition = 'right',
  error,
  success,
  disabled = false,
  required = false,
  className = '',
  rows = 3,
  label,
  helpText,
  maxLength,
  minLength,
  showCharCount = false,
  autoFocus = false,
  autoComplete,
  size = 'md',
  variant = 'default',
  loading = false
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-5 py-4 text-base'
  };

  const variantClasses = {
    default: 'border-gray-300 bg-white',
    filled: 'border-gray-200 bg-gray-50',
    outlined: 'border-2 border-gray-300 bg-transparent'
  };

  const baseClasses = 'w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent';
  
  const stateClasses = error 
    ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
    : success
    ? 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500'
    : isFocused
    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
    : 'focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400';
    
  const disabledClasses = disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : '';
  const loadingClasses = loading ? 'animate-pulse' : '';
  
  const iconPadding = Icon ? (iconPosition === 'right' ? 'pr-12' : 'pl-12') : '';
  const passwordPadding = type === 'password' ? 'pl-12' : '';

  const inputClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${stateClasses} ${disabledClasses} ${loadingClasses} ${iconPadding} ${passwordPadding} ${className}`;

  const currentLength = value?.toString().length || 0;
  const isOverLimit = maxLength ? currentLength > maxLength : false;
  const isUnderLimit = minLength ? currentLength < minLength : false;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
          isFocused ? 'text-blue-600' : error ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-700'
        }`}>
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows}
            maxLength={maxLength}
            minLength={minLength}
            autoComplete={autoComplete}
            className={inputClasses}
            style={{ resize: 'vertical', minHeight: `${rows * 1.5}rem` }}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            minLength={minLength}
            autoComplete={autoComplete}
            className={inputClasses}
          />
        )}
        
        {/* Icon */}
        {Icon && (
          <div className={`absolute top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
            iconPosition === 'right' ? 'right-4' : 'left-4'
          } ${isFocused ? 'text-blue-500' : 'text-gray-400'}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:text-blue-500"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {/* Success/Error Icons */}
        {(error || success) && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            {error ? (
              <AlertTriangle className="w-4 h-4 text-red-500 animate-shake" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500 animate-fadeIn" />
            )}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* Character Count */}
      {showCharCount && maxLength && (
        <div className={`text-xs mt-1 text-left transition-colors duration-200 ${
          isOverLimit ? 'text-red-600' : isUnderLimit ? 'text-orange-600' : 'text-gray-500'
        }`}>
          <span className={isOverLimit ? 'font-bold' : ''}>{currentLength}</span>/{maxLength}
          {isOverLimit && <span className="mr-2 animate-pulse">تجاوز الحد المسموح</span>}
        </div>
      )}

      {/* Help Text */}
      {helpText && !error && !success && (
        <p className="text-gray-500 text-sm mt-1 transition-opacity duration-200">{helpText}</p>
      )}

      {/* Success Message */}
      {success && (
        <p className="text-green-600 text-sm mt-1 flex items-center animate-fadeIn">
          <CheckCircle className="w-4 h-4 ml-1" />
          {success}
        </p>
      )}
      
      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm mt-1 flex items-center animate-shake">
          <AlertTriangle className="w-4 h-4 ml-1" />
          {error}
        </p>
      )}

      {/* Validation Hints */}
      {required && !value && isFocused && (
        <p className="text-orange-600 text-xs mt-1 animate-fadeIn">
          هذا الحقل مطلوب
        </p>
      )}
    </div>
  );
};