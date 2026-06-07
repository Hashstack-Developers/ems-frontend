import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full cursor-pointer rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary-soft ${
          error ? 'border-danger' : 'border-neutral-300'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
