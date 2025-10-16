import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  pressed?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', pressed = false, onClick }: CardProps) {
  return (
    <div
      className={`
        ${pressed ? 'neumo-inset' : 'neumo-raised'}
        rounded-[var(--radius-md)]
        bg-[var(--bg)]
        p-4 sm:p-5 md:p-6
        transition-neumo
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
