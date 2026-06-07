'use client';

interface RefetchButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
}

function RefreshIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 4v5h-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RefetchButton({ onClick, loading = false, className = '' }: RefetchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label="Refresh latest data"
      aria-busy={loading}
      className={`refresh-btn group/refetch ${loading ? 'refresh-btn-loading' : ''} ${className}`}
    >
      <span className="refresh-btn-glow" aria-hidden />
      <span className="refresh-btn-ring" aria-hidden />
      <span className="refresh-btn-shell">
        <span className="refresh-btn-face">
          <RefreshIcon className="refresh-btn-icon" />
        </span>
        <span className="refresh-btn-label">Refresh</span>
      </span>
    </button>
  );
}
