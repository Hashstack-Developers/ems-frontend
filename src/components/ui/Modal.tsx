'use client';

import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  /** When false, children manage their own internal scroll (e.g. wizard forms). */
  scrollBody?: boolean;
}

const sizeClasses = {
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export function Modal({ open, onClose, title, children, size = 'md', scrollBody = true }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-pointer bg-black/40 transition-opacity hover:bg-black/45" onClick={onClose} aria-hidden />
      <div className={`relative z-10 flex w-full ${sizeClasses[size]} max-h-[90vh] animate-scale-in flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface p-6 shadow-2xl`}>
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-muted-light transition-all hover:bg-neutral-100 hover:text-neutral-600 hover:scale-105 active:scale-95"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className={`min-h-0 flex-1 ${scrollBody ? 'overflow-y-auto' : 'flex flex-col overflow-hidden'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
