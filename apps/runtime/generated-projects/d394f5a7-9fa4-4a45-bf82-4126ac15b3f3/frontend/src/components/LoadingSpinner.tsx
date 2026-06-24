import { Loader } from 'lucide-react';
import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 24,
  color = 'currentColor',
  className = '',
}: LoadingSpinnerProps): JSX.Element {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader
        size={size}
        color={color}
        className="animate-spin text-primary-500 dark:text-primary-400"
      />
    </div>
  );
}