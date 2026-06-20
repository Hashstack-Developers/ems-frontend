'use client';

import { ReactNode } from 'react';
import { Input } from './Input';

interface TableFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export function TableFilters({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  children,
}: TableFiltersProps) {
  return (
    <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full sm:max-w-xs">
        <Input
          label="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      {children && <div className="flex flex-wrap items-end gap-3">{children}</div>}
    </div>
  );
}
