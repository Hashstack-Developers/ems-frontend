'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ToastContainer, toast, type ToastOptions } from 'react-toastify';
import { useTheme } from '@/contexts/ThemeContext';
import 'react-toastify/dist/ReactToastify.css';

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastDefaults: ToastOptions = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  draggable: true,
  draggablePercent: 35,
  pauseOnHover: true,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { mode, mounted } = useTheme();

  const value = useMemo(
    () => ({
      success: (message: string) => toast.success(message, toastDefaults),
      error: (message: string) => toast.error(message, toastDefaults),
      info: (message: string) => toast.info(message, toastDefaults),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer
        theme={mounted && mode === 'dark' ? 'dark' : 'colored'}
        newestOnTop
        stacked
        limit={5}
        className="ems-toast-container"
        toastClassName="ems-toast"
        progressClassName="ems-toast-progress"
        closeButton={({ closeToast }) => (
          <button
            type="button"
            onClick={closeToast}
            className="ems-toast-close"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        )}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
