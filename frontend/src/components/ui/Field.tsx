import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const CONTROL_BASE = cn(
  'w-full rounded-xl border bg-[var(--surface)] px-3.5 py-2.5 text-sm text-primary',
  'placeholder:text-[var(--text-muted)] transition-colors',
  'focus:border-brand-500 focus:outline-none',
);

const errorClasses = (hasError: boolean) =>
  hasError ? 'border-red-400 focus:border-red-500' : 'border-[var(--border-strong)]';

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Wires the label, control, error and hint together with matching ids so
 * screen readers announce the error with the field it belongs to.
 */
function FieldShell({
  label,
  error,
  hint,
  controlId,
  children,
}: BaseProps & { controlId: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={controlId} className="block text-sm font-semibold text-primary">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${controlId}-error`} className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, error, hint, className, ...props }: InputProps) {
  const id = useId();
  return (
    <FieldShell label={label} error={error} hint={hint} controlId={id}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL_BASE, errorClasses(Boolean(error)), className)}
        {...props}
      />
    </FieldShell>
  );
}

type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ label, error, hint, className, ...props }: TextareaProps) {
  const id = useId();
  return (
    <FieldShell label={label} error={error} hint={hint} controlId={id}>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL_BASE, 'min-h-32 resize-y', errorClasses(Boolean(error)), className)}
        {...props}
      />
    </FieldShell>
  );
}
