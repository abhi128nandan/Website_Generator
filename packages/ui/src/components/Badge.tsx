import * as React from 'react';
import { cn } from '../utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#4F8CFF]/10 text-[#4F8CFF] border-[#4F8CFF]/20',
    success: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    error: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
    outline: 'bg-transparent text-gray-300 border-white/10',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
