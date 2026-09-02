import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAutoDismissInfo } from '../hooks/useAutoDismissInfo';
import { getErrorMessage } from '../services/api';
import { notificationService } from '../services/notificationService';
import type {
  Category,
  CreateNotificationPayload,
  UpdateNotificationPayload,
  UserNotification,
} from '../types';
import { NotificationsContext } from './notifications-context';

/** Stable empty array so signed-out renders do not create a new reference. */
const EMPTY: UserNotification[] = [];

/**
 * Holds the notification list for the whole authenticated app.
 *
 * It lives above the router rather than inside DashboardPage because the
 * create and edit screens are separate routes. With per-page state, navigating
 * back to the dashboard would unmount and refetch; here a create simply
 * prepends to the shared array and the dashboard renders it immediately —
 * which is what "appears without a page reload" means in practice.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mirrors the latest list so callbacks can read current state synchronously
  // without taking `notifications` as a dependency, which would give every
  // action a new identity on each change and defeat the memoised children.
  // Synced in an effect rather than assigned during render, because writing a
  // ref while rendering is not safe under concurrent rendering.
  const latest = useRef(notifications);
  useEffect(() => {
    latest.current = notifications;
  }, [notifications]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setNotifications(await notificationService.list());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your notifications.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void refresh();
  }, [isAuthenticated, refresh]);

  const create = useCallback(async (payload: CreateNotificationPayload) => {
    const created = await notificationService.create(payload);
    // A new array, not notifications.unshift(...): React compares by reference,
    // so mutating in place would not re-render anything.
    setNotifications((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, payload: UpdateNotificationPayload) => {
    const updated = await notificationService.update(id, payload);
    setNotifications((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await notificationService.remove(id);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * Closing a banner. The list keeps the notification — only its isClosed flag
   * changes, so it stays visible in the list below while leaving the banners.
   */
  const dismiss = useCallback(
    async (id: string) => {
      // Update locally first so the banner disappears instantly, then persist.
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isClosed: true } : item)),
      );
      try {
        await notificationService.update(id, { isClosed: true });
      } catch (err) {
        // Roll back if the server rejected it, so the UI never lies about
        // what was actually saved — and say so, rather than letting the
        // banner silently reappear with no explanation.
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isClosed: false } : item)),
        );
        setError(getErrorMessage(err, 'Could not dismiss that notification.'));
      }
    },
    [],
  );

  /**
   * Moving a card between board columns. Optimistic so the card follows the
   * pointer immediately, with a rollback and a visible message if the server
   * refuses — a drag that silently snapped back would look like a broken app.
   */
  const changeCategory = useCallback(
    async (id: string, category: Category) => {
      // Read the old value up front. Capturing it inside the setState updater
      // would not work: React invokes updaters lazily, so the catch block
      // below could run before the assignment ever happened and the rollback
      // would silently do nothing.
      const previous = latest.current.find((item) => item.id === id)?.category;

      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, category } : item)),
      );

      try {
        const updated = await notificationService.update(id, { category });
        setNotifications((prev) => prev.map((item) => (item.id === id ? updated : item)));
      } catch (err) {
        if (previous) {
          const restored = previous;
          setNotifications((prev) =>
            prev.map((item) => (item.id === id ? { ...item, category: restored } : item)),
          );
        }
        setError(getErrorMessage(err, 'Could not move that notification.'));
      }
    },
    [],
  );

  /** Lets a component report a failed action into the shared error slot. */
  const reportError = useCallback((message: string) => setError(message), []);

  // Lives here rather than in BannerStack so the 90-second rule keeps running
  // on every screen. Tying it to the dashboard meant the timers stopped the
  // moment the user opened the board.
  useAutoDismissInfo(notifications, dismiss);

  const value = useMemo(
    () => ({
      // Derived rather than cleared in an effect on logout: a signed-out user
      // simply sees nothing, without an extra render pass to empty the array.
      notifications: isAuthenticated ? notifications : EMPTY,
      isLoading,
      error,
      refresh,
      create,
      update,
      remove,
      dismiss,
      changeCategory,
      reportError,
    }),
    [
      isAuthenticated,
      notifications,
      isLoading,
      error,
      refresh,
      create,
      update,
      remove,
      dismiss,
      changeCategory,
      reportError,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}
