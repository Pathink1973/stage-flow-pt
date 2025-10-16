import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'success' | 'warn' | 'danger' | 'soft' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  onClick,
  variant = 'soft',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseStyles = 'rounded-full font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] inline-flex items-center justify-center gap-2 whitespace-nowrap';

  const variantStyles = {
    primary: 'bg-[var(--accent)] text-[var(--accent-text)] neumo-raised hover:bg-[var(--accent-hover)] active:scale-95',
    success: 'bg-[var(--success)] text-[var(--success-text)] neumo-raised hover:brightness-110 active:scale-95',
    warn: 'bg-[var(--warn)] text-[var(--warn-text)] neumo-raised hover:brightness-110 active:scale-95',
    danger: 'bg-[var(--danger)] text-[var(--danger-text)] neumo-raised hover:brightness-110 active:scale-95',
    soft: 'bg-[var(--bg)] text-[var(--fg)] neumo-raised hover:brightness-105 active:neumo-inset',
    ghost: 'bg-transparent text-[var(--fg)] hover:bg-[var(--surface)] hover:bg-opacity-50',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-7 py-3.5 text-lg gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
