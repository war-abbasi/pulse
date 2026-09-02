import { cn } from '../../lib/cn';

/** The Propel mark: a gradient chevron paired with the wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <defs>
          <linearGradient id="propel-mark" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="55%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
        <path d="M6 26 16 4l4 9-7 4 11 1-8 8Z" fill="url(#propel-mark)" />
      </svg>
      <span className="text-lg font-extrabold tracking-tight text-primary">Propel</span>
    </span>
  );
}
