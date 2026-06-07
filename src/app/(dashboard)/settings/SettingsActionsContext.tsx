'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface SettingsActionsContextValue {
  refetching: boolean;
  setRefetching: (value: boolean) => void;
  registerRefetch: (handler: (() => void) | null) => void;
  triggerRefetch: () => void;
}

const SettingsActionsContext = createContext<SettingsActionsContextValue | null>(null);

export function SettingsActionsProvider({ children }: { children: ReactNode }) {
  const [refetching, setRefetching] = useState(false);
  const [refetchHandler, setRefetchHandler] = useState<(() => void) | null>(null);

  const registerRefetch = useCallback((handler: (() => void) | null) => {
    setRefetchHandler(handler);
  }, []);

  const triggerRefetch = useCallback(() => {
    refetchHandler?.();
  }, [refetchHandler]);

  const value = useMemo(
    () => ({ refetching, setRefetching, registerRefetch, triggerRefetch }),
    [refetching, registerRefetch, triggerRefetch],
  );

  return (
    <SettingsActionsContext.Provider value={value}>
      {children}
    </SettingsActionsContext.Provider>
  );
}

export function useSettingsActions() {
  const ctx = useContext(SettingsActionsContext);
  if (!ctx) {
    throw new Error('useSettingsActions must be used within SettingsActionsProvider');
  }
  return ctx;
}
