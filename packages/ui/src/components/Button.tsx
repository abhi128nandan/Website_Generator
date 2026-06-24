import * as React from 'react';
import { cn } from '../utils';
import { motion } from 'framer-motion';
import { HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#4F8CFF] text-white hover:bg-[#4F8CFF]/90 shadow-lg shadow-[#4F8CFF]/20',
      secondary: 'bg-[#18233D] text-white hover:bg-[#1C2848] border border-white/5',
      outline: 'bg-transparent text-white border border-[#4F8CFF]/50 hover:bg-[#4F8CFF]/10',
      ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
      danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'w-10 h-10 p-2 justify-center',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
