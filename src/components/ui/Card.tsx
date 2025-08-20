import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
  variant = 'default',
  shadow = 'sm'
}: CardProps) {
  const baseClasses = 'bg-white border rounded-xl transition-all duration-200';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantClasses = {
    default: 'border-gray-200',
    success: 'border-green-200 bg-green-50/30',
    warning: 'border-orange-200 bg-orange-50/30',
    error: 'border-red-200 bg-red-50/30',
    info: 'border-blue-200 bg-blue-50/30'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const hoverClasses = hover ? 'hover:border-gray-300 hover:shadow-lg hover:scale-105 cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  const classes = `${baseClasses} ${paddingClasses[padding]} ${variantClasses[variant]} ${shadowClasses[shadow]} ${hoverClasses} ${clickableClasses} ${className}`;

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}