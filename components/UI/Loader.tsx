import clsx from 'clsx';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'light' | 'danger';
  className?: string;
}

export default function Loader({ 
  size = 'medium', 
  variant = 'primary', 
  className = '' 
}: LoaderProps) {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-6 w-6 border-[3px]',
    large: 'h-10 w-10 border-4',
  };

  const colorClasses = {
    primary: 'border-chak-blue border-t-transparent',
    secondary: 'border-gray-400 border-t-transparent',
    light: 'border-white border-t-transparent',
    danger: 'border-red-600 border-t-transparent',
  };

  return (
    <div 
      className={clsx(
        'flex items-center justify-center',
        className
      )}
      role="status"
      aria-label="Loading..."
    >
      <div
        className={clsx(
          'rounded-full animate-spin',
          sizeClasses[size],
          colorClasses[variant]
        )}
      />
    </div>
  );
}
