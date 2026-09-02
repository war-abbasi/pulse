import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import { notificationService } from '../services/notificationService';
import type {
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
      } catch {
        // Roll back if the server rejected it, so the UI never lies about
        // what was actually saved.
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isClosed: false } : item)),
        );
      }
    },
    [],
  );

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
    }),
    [isAuthenticated, notifications, isLoading, error, refresh, create, update, remove, dismiss],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}
