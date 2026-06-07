import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
}

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover hover:shadow-md active:scale-[0.98]',
  secondary: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:shadow-sm border border-neutral-300 active:scale-[0.98]',
  danger: 'bg-danger text-white hover:bg-danger-hover hover:shadow-md active:scale-[0.98]',
  ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 active:scale-[0.98]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-label="Loading"
        />
      ) : (
        children
      )}
    </button>
  );
}
