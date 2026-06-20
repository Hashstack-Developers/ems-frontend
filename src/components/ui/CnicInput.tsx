'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

interface CnicInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function parseCnicParts(value: string): [string, string, string] {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  return [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)];
}

function formatCnic(parts: [string, string, string]): string {
  const [a, b, c] = parts;
  if (!a && !b && !c) return '';
  if (!b && !c) return a;
  if (!c) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
}

const inputBase =
  'h-10 shrink-0 rounded-lg border bg-surface px-2 py-2 text-center font-mono text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft disabled:cursor-not-allowed disabled:opacity-60';

export function CnicInput({ label, value, onChange, error, disabled }: CnicInputProps) {
  const [part1, part2, part3] = parseCnicParts(value);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const inputId = 'cnic-no';

  const borderClass = error ? 'border-danger' : 'border-border';

  const update = (next: [string, string, string]) => {
    onChange(formatCnic(next));
  };

  const handlePart1 = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 5);
    update([digits, part2, part3]);
    if (digits.length === 5) ref2.current?.focus();
  };

  const handlePart2 = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 7);
    update([part1, digits, part3]);
    if (digits.length === 7) ref3.current?.focus();
  };

  const handlePart3 = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 1);
    update([part1, part2, digits]);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 13);
    if (!digits) return;
    const next: [string, string, string] = [
      digits.slice(0, 5),
      digits.slice(5, 12),
      digits.slice(12, 13),
    ];
    update(next);
    if (next[2]) ref3.current?.focus();
    else if (next[1]) ref2.current?.focus();
    else ref1.current?.focus();
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    segment: 1 | 2 | 3,
    currentValue: string,
  ) => {
    if (e.key !== 'Backspace' || currentValue.length > 0) return;
    if (segment === 2) ref1.current?.focus();
    if (segment === 3) ref2.current?.focus();
  };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="flex w-full max-w-full items-center gap-1.5">
        <input
          ref={ref1}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={5}
          value={part1}
          onChange={(e) => handlePart1(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => handleKeyDown(e, 1, part1)}
          disabled={disabled}
          placeholder="12345"
          aria-label="CNIC first part"
          className={`${inputBase} ${borderClass} w-[5.5rem]`}
        />
        <span className="shrink-0 text-muted">-</span>
        <input
          ref={ref2}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={7}
          value={part2}
          onChange={(e) => handlePart2(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => handleKeyDown(e, 2, part2)}
          disabled={disabled}
          placeholder="1234567"
          aria-label="CNIC middle part"
          className={`${inputBase} ${borderClass} w-[7.75rem]`}
        />
        <span className="shrink-0 text-muted">-</span>
        <input
          ref={ref3}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={1}
          value={part3}
          onChange={(e) => handlePart3(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => handleKeyDown(e, 3, part3)}
          disabled={disabled}
          placeholder="1"
          aria-label="CNIC check digit"
          className={`${inputBase} ${borderClass} w-10`}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
