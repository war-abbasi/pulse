import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_OPTIONS, CATEGORY_STYLES } from '../../lib/category';
import { cn } from '../../lib/cn';
import {
  hasErrors,
  validateNotification,
  type Errors,
  type NotificationForm as FormValues,
} from '../../lib/validation';
import { Category, type CreateNotificationPayload } from '../../types';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { TextAreaField, TextField } from '../ui/Field';

interface Props {
  initialValues?: FormValues;
  submitLabel: string;
  onSubmit: (payload: CreateNotificationPayload) => Promise<void>;
}

const EMPTY: FormValues = { header: '', body: '', category: Category.INFO };

/**
 * Shared by the create and edit screens — the two differ only in their initial
 * values and their submit handler, so one controlled form serves both.
 */
export function NotificationForm({ initialValues, submitLabel, onSubmit }: Props) {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(initialValues ?? EMPTY);
  const [errors, setErrors] = useState<Errors<FormValues>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear the error as soon as the user starts fixing the field, rather than
    // leaving stale red text under an input they are actively editing.
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateNotification(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        header: values.header.trim(),
        body: values.body.trim(),
        category: values.category as Category,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Could not save this notification.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {submitError && <Alert message={submitError} />}

      <TextField
        label="Header"
        value={values.header}
        onChange={(event) => setField('header', event.target.value)}
        error={errors.header}
        placeholder="Deployment finished"
        maxLength={120}
      />

      <TextAreaField
        label="Body"
        value={values.body}
        onChange={(event) => setField('body', event.target.value)}
        error={errors.body}
        placeholder="Version 2.1 is live in production."
        maxLength={2000}
      />

      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 block text-sm font-semibold text-primary">Category</legend>
        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORY_OPTIONS.map((category) => {
            const style = CATEGORY_STYLES[category];
            const isSelected = values.category === category;
            return (
              <label
                key={category}
                className={cn(
                  'flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5',
                  'text-sm font-semibold transition-colors',
                  isSelected
                    ? style.surface
                    : 'border-[var(--border-strong)] bg-[var(--surface)] text-secondary hover:bg-[var(--surface-sunken)]',
                )}
              >
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={isSelected}
                  onChange={() => setField('category', category)}
                  className="sr-only"
                />
                <span className={cn('size-2 rounded-full', style.accent)} aria-hidden="true" />
                {style.label}
              </label>
            );
          })}
        </div>
        {errors.category && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.category}</p>
        )}
      </fieldset>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
