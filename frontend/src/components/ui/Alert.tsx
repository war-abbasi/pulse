import { cn } from '../../lib/cn';

/** Inline feedback for a form or page-level error. */
export function Alert({ message, className }: { message: string; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3',
        'text-sm font-medium text-red-800',
        'dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
        className,
      )}
    >
      <svg className="mt-0.5 size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5m0 3h.01" strokeLinecap="round" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
