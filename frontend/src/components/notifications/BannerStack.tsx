import { useMemo } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBanner } from './NotificationBanner';

const MAX_BANNERS = 5;

/**
 * The live area at the top of the dashboard.
 *
 * Shows up to five undismissed notifications. Past that the individual banners
 * would dominate the page, so a single summary line replaces them — which is
 * what the requirement asks for.
 */
export function BannerStack() {
  const { notifications, dismiss } = useNotifications();

  const open = useMemo(
    () => notifications.filter((item) => !item.isClosed),
    [notifications],
  );

  if (open.length === 0) return null;

  if (open.length > MAX_BANNERS) {
    return (
      <div
        role="status"
        className="mb-8 flex items-center gap-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3.5 shadow-sm"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
          {open.length}
        </span>
        <div>
          <p className="text-sm font-bold text-primary">You have more notifications</p>
          <p className="text-xs text-secondary">
            {open.length} unread items — review them in the list below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-2.5">
      {open.slice(0, MAX_BANNERS).map((notification) => (
        <NotificationBanner
          key={notification.id}
          notification={notification}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}
