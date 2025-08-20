import React from 'react';
import { AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';

interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  success?: string;
  warning?: string;
  helpText?: string;
  className?: string;
  layout?: 'vertical' | 'horizontal';
  labelWidth?: string;
  showOptional?: boolean;
  tooltip?: string;
}

export const FormField = ({
  children,
  label,
  required = false,
  error,
  success,
  warning,
  helpText,
  className = '',
  layout = 'vertical',
  labelWidth = 'w-1/3',
  showOptional = true,
  tooltip
}: FormFieldProps) => {
  const isHorizontal = layout === 'horizontal';

  const renderLabel = () => {
    if (!label) return null;

    return (
      <div className={`flex items-center space-x-2 space-x-reverse ${isHorizontal ? labelWidth : 'mb-2'}`}>
        <label className="form-label text-sm font-medium text-gray-700 transition-all duration-200">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
          {!required && showOptional && (
            <span className="text-gray-400 text-xs mr-1">(اختياري)</span>
          )}
        </label>
        {tooltip && (
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMessages = () => (
    <div className="mt-2 space-y-1">
      {/* Help Text */}
      {helpText && !error && !success && !warning && (
        <div className="flex items-start space-x-2 space-x-reverse animate-fadeIn">
          <Info className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-gray-500 text-xs leading-relaxed">{helpText}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-start space-x-2 space-x-reverse animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-green-600 text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Warning Message */}
      {warning && (
        <div className="flex items-start space-x-2 space-x-reverse animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <p className="text-orange-600 text-sm font-medium">{warning}</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 space-x-reverse animate-shake">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );

  if (isHorizontal) {
    return (
      <div className={`form-field-group flex items-start space-x-4 space-x-reverse ${className}`}>
        {renderLabel()}
        <div className="flex-1">
          {children}
          {renderMessages()}
        </div>
      </div>
    );
  }

  return (
    <div className={`form-field-group ${className}`}>
      {renderLabel()}
      <div className="relative">
        {children}
      </div>
      {renderMessages()}
    </div>
  );
};