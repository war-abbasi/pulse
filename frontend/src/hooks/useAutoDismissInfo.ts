import { useEffect, useRef } from 'react';
import { Category, type UserNotification } from '../types';

/** Requirement: INFO notifications close themselves after 90 seconds. */
export const AUTO_DISMISS_MS = 90_000;

/**
 * Schedules one timer per open INFO notification.
 *
 * The countdown starts when the notification first becomes visible in this
 * session rather than from its creation date, so opening the dashboard does
 * not instantly wipe every INFO item that happens to be older than 90s.
 *
 * Timers are tracked by id so re-renders do not restart them, and every timer
 * is cleared when its notification closes or the component unmounts —
 * otherwise they would fire against a component that no longer exists.
 */
export function useAutoDismissInfo(
  notifications: UserNotification[],
  dismiss: (id: string) => Promise<void> | void,
) {
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const openInfoIds = new Set(
      notifications
        .filter((item) => !item.isClosed && item.category === Category.INFO)
        .map((item) => item.id),
    );

    for (const id of openInfoIds) {
      if (timers.current.has(id)) continue;
      const timer = window.setTimeout(() => {
        timers.current.delete(id);
        void dismiss(id);
      }, AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    }

    // Drop timers for notifications that were closed or deleted meanwhile.
    for (const [id, timer] of timers.current) {
      if (!openInfoIds.has(id)) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    }
  }, [notifications, dismiss]);

  useEffect(() => {
    const timerMap = timers.current;
    return () => {
      timerMap.forEach(clearTimeout);
      timerMap.clear();
    };
  }, []);
}
