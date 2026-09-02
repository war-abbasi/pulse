import { memo } from 'react';
import { CATEGORY_STYLES } from '../../lib/category';
import { cn } from '../../lib/cn';
import { timeAgo } from '../../lib/time';
import type { UserNotification } from '../../types';

interface Props {
  notification: UserNotification;
  onDismiss: (id: string) => void;
}

/**
 * memo because the banner list re-renders whenever any notification changes;
 * without it, dismissing one banner would re-render all of them.
 */
export const NotificationBanner = memo(function NotificationBanner({
  notification,
  onDismiss,
}: Props) {
  const style = CATEGORY_STYLES[notification.category];

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-sm',
        style.surface,
      )}
    >
      <svg
        className="mt-0.5 size-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d={style.icon} />
      </svg>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{notification.header}</p>
        <p className="mt-0.5 text-sm opacity-90">{notification.body}</p>
        <p className="mt-1 text-xs opacity-70">{timeAgo(notification.createdAt)}</p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        aria-label={`Dismiss ${notification.header}`}
        className="grid size-7 shrink-0 place-items-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
});
