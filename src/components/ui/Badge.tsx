import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
  pulse?: boolean;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
  pulse = false
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-all duration-200';
  
  const variantClasses = {
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-orange-100 text-orange-800 border border-orange-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    neutral: 'bg-gray-100 text-gray-800 border border-gray-200'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  const pulseClasses = pulse ? 'animate-pulse' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${pulseClasses} ${className}`;

  return (
    <span className={classes}>
      {icon && <span className="ml-1">{icon}</span>}
      {children}
    </span>
  );
}