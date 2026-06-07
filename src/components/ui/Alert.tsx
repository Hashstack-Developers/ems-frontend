interface AlertProps {
  type?: 'error' | 'success' | 'info';
  message: string;
  onClose?: () => void;
}

const styles = {
  error: 'bg-danger-light border-danger/20 text-danger-dark',
  success: 'bg-success-light border-success/20 text-success-dark',
  info: 'bg-primary-light border-primary-soft text-primary-hover',
};

export function Alert({ type = 'error', message, onClose }: AlertProps) {
  if (!message) return null;
  return (
    <div className={`flex items-start justify-between rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-4 cursor-pointer rounded font-bold opacity-60 transition hover:opacity-100 hover:scale-110"
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
}
