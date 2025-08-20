import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  tooltip?: string;
  animation?: 'none' | 'hover' | 'press' | 'pulse';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'right',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  fullWidth = false,
  tooltip,
  animation = 'hover',
  rounded = 'lg'
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl border border-blue-600',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border border-gray-300 hover:border-gray-400',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-lg hover:shadow-xl border border-green-600',
    warning: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 shadow-lg hover:shadow-xl border border-orange-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl border border-red-600',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500 hover:shadow-md border border-transparent hover:border-gray-200',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 hover:border-gray-400'
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
    xl: 'px-8 py-5 text-lg'
  };

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  const animationClasses = {
    none: '',
    hover: 'hover:transform hover:scale-105 active:scale-95',
    press: 'active:scale-95',
    pulse: 'hover:animate-pulse'
  };

  const disabledClasses = disabled || loading 
    ? 'opacity-50 cursor-not-allowed transform-none hover:transform-none' 
    : animationClasses[animation];
    
  const widthClasses = fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${roundedClasses[rounded]} ${disabledClasses} ${widthClasses} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      title={tooltip}
      aria-label={tooltip}
    >
      {/* Loading Spinner */}
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin ml-2" />
      )}
      
      {/* Left Icon */}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className="w-4 h-4 mr-2 transition-transform duration-200" />
      )}
      
      {/* Button Content */}
      <span className={loading ? 'opacity-75' : ''}>{children}</span>
      
      {/* Right Icon */}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className="w-4 h-4 ml-2 transition-transform duration-200" />
      )}

      {/* Ripple Effect */}
      <span className="absolute inset-0 overflow-hidden rounded-lg">
        <span className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-200 pointer-events-none"></span>
      </span>
    </button>
  );
};