import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  preventScroll?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  variant = 'default',
  animation = 'scale',
  preventScroll = true
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  const variantClasses = {
    default: 'border-gray-200',
    success: 'border-green-200',
    warning: 'border-orange-200',
    error: 'border-red-200'
  };

  const headerVariantClasses = {
    default: 'border-gray-200',
    success: 'border-green-200 bg-green-50',
    warning: 'border-orange-200 bg-orange-50',
    error: 'border-red-200 bg-red-50'
  };

  const animationClasses = {
    fade: isOpen ? 'animate-fadeIn' : 'animate-fadeOut',
    slide: isOpen ? 'animate-slideUp' : 'animate-slideDown',
    scale: isOpen ? 'animate-scaleIn' : 'animate-scaleOut',
    none: ''
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen && closeOnEscape) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen && preventScroll) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, preventScroll]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${animationClasses[animation]}`}
      dir="rtl"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-2xl w-full ${sizeClasses[size]} max-h-[95vh] flex flex-col shadow-2xl border ${variantClasses[variant]} ${className} transition-all duration-300 ${animationClasses[animation]} focus:outline-none`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className={`flex items-center justify-between p-6 border-b ${headerVariantClasses[variant]} rounded-t-2xl`}>
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900 flex items-center">
              {variant === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 ml-2" />}
              {title}
            </h2>
            {showCloseButton && (
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};