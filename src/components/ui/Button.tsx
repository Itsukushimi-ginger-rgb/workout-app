import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variantClasses = {
  primary: 'bg-blue-600 text-white active:bg-blue-700 disabled:bg-blue-300',
  secondary: 'bg-gray-100 text-gray-800 active:bg-gray-200 disabled:opacity-50',
  danger: 'bg-red-500 text-white active:bg-red-600 disabled:opacity-50',
  ghost: 'bg-transparent text-gray-600 active:bg-gray-100',
};

const sizeClasses = {
  sm: 'px-3 py-2 text-sm min-h-[36px]',
  md: 'px-4 py-3 text-base min-h-[48px]',
  lg: 'px-6 py-4 text-lg min-h-[56px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'rounded-xl font-medium transition-colors select-none cursor-pointer',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
