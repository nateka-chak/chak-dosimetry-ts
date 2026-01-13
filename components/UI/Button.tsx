import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'light';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  rounded = 'lg',
  fullWidth = false,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const baseClasses = clsx(
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden',
    'active:scale-[0.98]', // Add press effect
    fullWidth && 'w-full'
  );

  const variantClasses = {
    primary: clsx(
      'bg-gradient-to-r from-primary-600 to-primary-700 text-black shadow-sm',
      'hover:from-primary-700 hover:to-primary-800 hover:shadow-md',
      'focus:ring-primary-500 focus:ring-offset-white',
      'active:shadow-sm'
    ),
    secondary: clsx(
      'bg-gray-100 text-gray-900 border border-gray-300',
      'hover:bg-gray-200 hover:border-gray-400',
      'focus:ring-gray-400 focus:ring-offset-white',
      'active:bg-gray-300'
    ),
    danger: clsx(
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 hover:shadow-md',
      'focus:ring-red-500 focus:ring-offset-white',
      'active:bg-red-800'
    ),
    success: clsx(
      'bg-green-600 text-white shadow-sm',
      'hover:bg-green-700 hover:shadow-md',
      'focus:ring-green-500 focus:ring-offset-white',
      'active:bg-green-800'
    ),
    outline: clsx(
      'border-2 border-primary-600 text-primary-700 bg-transparent',
      'hover:bg-primary-600 hover:text-white',
      'focus:ring-primary-500 focus:ring-offset-white',
      'active:bg-primary-700'
    ),
    ghost: clsx(
      'bg-transparent text-primary-700',
      'hover:bg-primary-50 hover:text-primary-800',
      'focus:ring-primary-500 focus:ring-offset-white',
      'active:bg-primary-100'
    ),
    light: clsx(
      'bg-white text-gray-900 border border-gray-200 shadow-xs',
      'hover:bg-gray-50 hover:border-gray-300',
      'focus:ring-primary-500 focus:ring-offset-white',
      'active:bg-gray-100'
    ),
  };

  const sizeClasses = {
    xs: clsx('px-2.5 py-1.5 text-xs gap-1.5', {
      'h-8': true,
    }),
    sm: clsx('px-3 py-2 text-sm gap-2', {
      'h-9': true,
    }),
    md: clsx('px-4 py-2.5 text-sm gap-2', {
      'h-10': true,
    }),
    lg: clsx('px-5 py-3 text-base gap-2.5', {
      'h-11': true,
    }),
    xl: clsx('px-6 py-3.5 text-base gap-3', {
      'h-12': true,
    }),
  };

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const buttonContent = (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-current opacity-20 rounded-inherit" />
      )}
      
      {/* Icons and Content */}
      <div className={clsx(
        'flex items-center justify-center transition-opacity duration-200',
        isLoading && 'opacity-0'
      )}>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </>
  );

  const buttonClasses = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses[rounded],
    className
  );

  // Use motion.button for animations if not disabled
  if (disabled || isLoading) {
    return (
      <button
        className={buttonClasses}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }

  return (
    <motion.button
      className={buttonClasses}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      {...(props as any)}
    >
      {buttonContent}
    </motion.button>
  );
}

// Additional convenience button components
export function ButtonGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  );
}

// Pre-styled button variants for common use cases
export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="secondary" {...props} />
);

export const DangerButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="danger" {...props} />
);

export const SuccessButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="success" {...props} />
);

export const OutlineButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="outline" {...props} />
);