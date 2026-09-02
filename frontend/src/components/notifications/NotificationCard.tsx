import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryStyle } from '../../lib/category';
import { cn } from '../../lib/cn';
import { timeAgo } from '../../lib/time';
import { getErrorMessage } from '../../services/api';
import type { UserNotification } from '../../types';
import { Button } from '../ui/Button';

interface Props {
  notification: UserNotification;
  onDelete: (id: string) => Promise<void>;
}

export const NotificationCard = memo(function NotificationCard({
  notification,
  onDelete,
}: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const style = categoryStyle(notification.category);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(notification.id);
    } catch (error) {
      // Without this the request fails, the card stays put and the user is
      // told nothing — they walk away believing it was deleted.
      setDeleteError(getErrorMessage(error, 'Could not delete this notification.'));
    } finally {
      // The component usually unmounts on success; resetting matters for the
      // failure path, where the card stays on screen.
      setIsDeleting(false);
      setIsConfirming(false);
    }
  };

  return (
    <article className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm transition-shadow hover:shadow-md">
      <span className={cn('absolute inset-y-0 left-0 w-1', style.accent)} aria-hidden="true" />

      <div className="flex flex-col gap-4 py-5 pl-6 pr-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="truncate text-base font-bold text-primary">{notification.header}</h3>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                style.badge,
              )}
            >
              {style.label}
            </span>
            {notification.isClosed && (
              <span className="rounded-full bg-[var(--surface-sunken)] px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                Dismissed
              </span>
            )}
          </div>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-secondary">
            {notification.body}
          </p>
          <p className="mt-2.5 text-xs text-muted">Created {timeAgo(notification.createdAt)}</p>

          {deleteError && (
            <p role="alert" className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
              {deleteError}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isConfirming ? (
            <>
              <Button variant="danger" size="sm" isLoading={isDeleting} onClick={handleDelete}>
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => setIsConfirming(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Link to={`/notifications/${notification.id}`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
              {/* Delete is irreversible, so it asks first. */}
              <Button variant="ghost" size="sm" onClick={() => setIsConfirming(true)}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
});
