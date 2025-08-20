import React from 'react';
import { AlertTriangle, CheckCircle, Info, X, Shield, Trash2, Loader2 } from 'lucide-react';
import { Button, Modal } from './index';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  showIcon?: boolean;
  details?: string[];
  preventClose?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  isLoading = false,
  showIcon = true,
  details = [],
  preventClose = false
}: ConfirmationModalProps) => {
  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500 animate-fadeIn" />;
      case 'info':
        return <Info className="w-16 h-16 text-blue-500 animate-fadeIn" />;
      default:
        return <AlertTriangle className="w-16 h-16 text-orange-500 animate-pulse" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'danger':
        return 'error';
      case 'success':
        return 'success';
      case 'info':
        return 'default';
      default:
        return 'warning';
    }
  };

  const getConfirmVariant = () => {
    switch (type) {
      case 'danger':
        return 'danger';
      case 'success':
        return 'success';
      case 'info':
        return 'primary';
      default:
        return 'warning';
    }
  };

  const getIconForType = () => {
    switch (type) {
      case 'danger':
        return Trash2;
      case 'success':
        return CheckCircle;
      case 'info':
        return Info;
      default:
        return Shield;
    }
  };

  const IconComponent = getIconForType();

  return (
    <Modal
      isOpen={isOpen}
      onClose={preventClose || isLoading ? () => {} : onClose}
      title={title}
      size="sm"
      variant={getVariant()}
      closeOnBackdrop={!preventClose && !isLoading}
      showCloseButton={!preventClose && !isLoading}
      animation="scale"
    >
      <div className="p-6 text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          {getIcon()}
        </div>
        
        {/* Title and Message */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
        
        {/* Details List */}
        {details.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-right">
            <h4 className="font-medium text-gray-900 mb-3">التفاصيل:</h4>
            <ul className="space-y-2">
              {details.map((detail, index) => (
                <li key={index} className="flex items-start space-x-2 space-x-reverse text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-3 space-x-reverse">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-800 font-medium">جاري المعالجة...</span>
            </div>
            <p className="text-blue-600 text-sm mt-2">يرجى الانتظار، لا تغلق النافذة</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-3 space-x-reverse justify-center">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading || preventClose}
            tooltip={cancelText}
            size="md"
            animation="hover"
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmVariant()}
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
            tooltip={confirmText}
            icon={isLoading ? undefined : IconComponent}
            iconPosition="right"
            size="md"
            animation="hover"
          >
            {confirmText}
          </Button>
        </div>

        {/* Warning for dangerous actions */}
        {type === 'danger' && !isLoading && (
          <div className="mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 inline ml-1" />
            تحذير: هذا الإجراء لا يمكن التراجع عنه
          </div>
        )}
      </div>
    </Modal>
  );
};