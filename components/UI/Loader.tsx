import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'light' | 'dark';
  type?: 'spinner' | 'dots' | 'pulse' | 'progress';
  className?: string;
  label?: string;
  centered?: boolean;
}

export default function Loader({ 
  size = 'md', 
  variant = 'primary', 
  type = 'spinner',
  className = '',
  label,
  centered = false
}: LoaderProps) {
  const sizeClasses = {
    xs: { spinner: 'h-3 w-3 border-2', dots: 'h-1 w-1', pulse: 'h-2 w-2', progress: 'h-1' },
    sm: { spinner: 'h-4 w-4 border-2', dots: 'h-1.5 w-1.5', pulse: 'h-3 w-3', progress: 'h-1.5' },
    md: { spinner: 'h-6 w-6 border-[3px]', dots: 'h-2 w-2', pulse: 'h-4 w-4', progress: 'h-2' },
    lg: { spinner: 'h-8 w-8 border-4', dots: 'h-2.5 w-2.5', pulse: 'h-6 w-6', progress: 'h-2.5' },
    xl: { spinner: 'h-12 w-12 border-4', dots: 'h-3 w-3', pulse: 'h-8 w-8', progress: 'h-3' },
  };

  const colorClasses = {
    primary: {
      spinner: 'border-primary-500 border-t-transparent',
      dots: 'bg-primary-500',
      pulse: 'bg-primary-500',
      progress: 'bg-primary-500',
    },
    secondary: {
      spinner: 'border-gray-500 border-t-transparent',
      dots: 'bg-gray-500',
      pulse: 'bg-gray-500',
      progress: 'bg-gray-500',
    },
    success: {
      spinner: 'border-green-500 border-t-transparent',
      dots: 'bg-green-500',
      pulse: 'bg-green-500',
      progress: 'bg-green-500',
    },
    warning: {
      spinner: 'border-yellow-500 border-t-transparent',
      dots: 'bg-yellow-500',
      pulse: 'bg-yellow-500',
      progress: 'bg-yellow-500',
    },
    danger: {
      spinner: 'border-red-500 border-t-transparent',
      dots: 'bg-red-500',
      pulse: 'bg-red-500',
      progress: 'bg-red-500',
    },
    light: {
      spinner: 'border-white border-t-transparent',
      dots: 'bg-white',
      pulse: 'bg-white',
      progress: 'bg-white',
    },
    dark: {
      spinner: 'border-gray-900 border-t-transparent',
      dots: 'bg-gray-900',
      pulse: 'bg-gray-900',
      progress: 'bg-gray-900',
    },
  };

  const renderSpinner = () => (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizeClasses[size].spinner,
        colorClasses[variant].spinner
      )}
    />
  );

  const renderDots = () => (
    <div className="flex items-center space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-bounce',
            sizeClasses[size].dots,
            colorClasses[variant].dots
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div
      className={cn(
        'rounded-full animate-pulse',
        sizeClasses[size].pulse,
        colorClasses[variant].pulse
      )}
    />
  );

  const renderProgress = () => (
    <div className="w-20 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={cn(
          'animate-progress rounded-full',
          sizeClasses[size].progress,
          colorClasses[variant].progress
        )}
      />
    </div>
  );

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'progress':
        return renderProgress();
      case 'spinner':
      default:
        return renderSpinner();
    }
  };

  const containerClasses = cn(
    'inline-flex items-center justify-center',
    {
      'flex-col space-y-2': label && type !== 'dots',
      'flex-row space-x-2': label && type === 'dots',
      'absolute inset-0': centered,
    },
    className
  );

  const content = (
    <div className={containerClasses} role="status" aria-label={label || 'Loading...'}>
      {renderLoader()}
      {label && (
        <span className={cn(
          'text-sm font-medium',
          {
            'text-gray-600': variant !== 'light',
            'text-white': variant === 'light',
            'text-xs': size === 'xs',
            'text-sm': size === 'sm' || size === 'md',
            'text-base': size === 'lg' || size === 'xl',
          }
        )}>
          {label}
        </span>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="relative w-full h-full min-h-[100px]">
        {content}
      </div>
    );
  }

  return content;
}

// Pre-configured loader variants for common use cases
export function PageLoader({ size = 'lg', label = "Loading content..." }: { size?: LoaderProps['size'], label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader 
        size={size} 
        variant="primary" 
        type="spinner" 
        label={label}
      />
    </div>
  );
}

export function ButtonLoader({ size = 'sm', variant = 'light' }: { size?: LoaderProps['size'], variant?: LoaderProps['variant'] }) {
  return <Loader size={size} variant={variant} type="spinner" />;
}

export function InlineLoader({ size = 'sm', variant = 'primary' }: { size?: LoaderProps['size'], variant?: LoaderProps['variant'] }) {
  return <Loader size={size} variant={variant} type="dots" />;
}

export function ProgressLoader({ variant = 'primary' }: { variant?: LoaderProps['variant'] }) {
  return <Loader type="progress" variant={variant} />;
}