import React from 'react';

interface InputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
}

export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  className = '',
  inputMode,
}: InputProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--fg)]">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        className={`
          bg-[var(--bg)]
          text-[var(--fg)]
          px-4 py-3
          rounded-[var(--radius-sm)]
          neumo-inset
          outline-none
          transition-all
          focus:ring-2
          focus:ring-[var(--accent)]
          focus:ring-opacity-50
          disabled:opacity-50
          disabled:cursor-not-allowed
        `}
      />
      {error && (
        <span className="text-sm text-[var(--danger)]">{error}</span>
      )}
    </div>
  );
}
