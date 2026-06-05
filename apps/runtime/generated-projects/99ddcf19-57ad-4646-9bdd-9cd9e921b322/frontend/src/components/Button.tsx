import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ElementType;
  variant?: 'default' | 'operation' | 'equal' | 'clear';
  size?: 'normal' | 'full';
  className?: string;
}

export default function Button({
  onClick,
  children,
  icon: Icon,
  variant = 'default',
  size = 'normal',
  className = '',
}: ButtonProps) {
  const baseClasses = 'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
  const variantClasses = {
    default: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    operation: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    equal: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white',
    clear: 'bg-red-600 hover:bg-red-700 text-white',
  };
  const sizeClasses = size === 'full' ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses} ${className}`}
      onClick={onClick}
      type="button"
    >
      {Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
}