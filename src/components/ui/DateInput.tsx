'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

interface DateInputProps {
  label?: string;
  error?: string;
  value?: string | number | readonly string[];
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  id?: string;
}

function isoToDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function displayToIso(display: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(display)) return null;
  const [d, m, y] = display.split('/').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime()) || date.getDate() !== d || date.getMonth() + 1 !== m) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let result = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) result += '/';
    result += digits[i];
  }
  return result;
}

function toIso(value: string | number | readonly string[] | undefined): string {
  if (typeof value === 'string') return value;
  return '';
}

export function DateInput({
  label,
  error,
  value,
  onChange,
  required,
  disabled,
  readOnly,
  className = '',
  id,
}: DateInputProps) {
  const iso = toIso(value);
  const [display, setDisplay] = useState(() => isoToDisplay(iso));
  const pickerRef = useRef<HTMLInputElement>(null);
  const isReadOnly = readOnly || disabled;
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    setDisplay(isoToDisplay(iso));
  }, [iso]);

  function emit(isoValue: string) {
    onChange?.({ target: { value: isoValue } } as ChangeEvent<HTMLInputElement>);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const masked = applyMask(e.target.value);
    setDisplay(masked);
    const parsed = displayToIso(masked);
    if (parsed !== null) emit(parsed);
    else if (masked === '') emit('');
  }

  function handleBlur() {
    if (!displayToIso(display)) {
      setDisplay(isoToDisplay(iso));
    }
  }

  function handleNativePick(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.value;
    setDisplay(isoToDisplay(picked));
    emit(picked || '');
  }

  const inputClass = `w-full rounded-lg border py-2 px-3 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft ${
    error ? 'border-danger' : 'border-neutral-300'
  } ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          placeholder="DD/MM/YYYY"
          value={display}
          onChange={isReadOnly ? undefined : handleChange}
          onBlur={isReadOnly ? undefined : handleBlur}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={10}
          inputMode="numeric"
          className={inputClass}
        />
        {!isReadOnly && (
          <>
            <button
              type="button"
              onClick={() => pickerRef.current?.showPicker?.()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 transition hover:text-neutral-600 focus:outline-none"
              tabIndex={-1}
              aria-label="Open date picker"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M16 2v4M8 2v4M3 10h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <input
              ref={pickerRef}
              type="date"
              value={iso}
              onChange={handleNativePick}
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-8 h-0 w-0 opacity-0"
            />
          </>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
