'use client';

import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-pointer bg-black/40 transition-opacity hover:bg-black/45" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-2xl border border-border/60 bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
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
        {children}
      </div>
    </div>
  );
}
