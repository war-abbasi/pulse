import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BannerStack } from '../components/notifications/BannerStack';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { Category } from '../types';

function StatTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${accent}`} aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-extrabold text-primary">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-16 text-center">
      <h3 className="text-lg font-bold text-primary">No notifications yet</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-secondary">
        Create your first notification and it will appear here immediately.
      </p>
      <Link to="/notifications/new" className="mt-5 inline-block">
        <Button>Create notification</Button>
      </Link>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { notifications, isLoading, error, remove } = useNotifications();

  // useMemo so the counts are not recomputed on unrelated re-renders such as
  // a theme toggle.
  const counts = useMemo(
    () => ({
      total: notifications.length,
      info: notifications.filter((n) => n.category === Category.INFO).length,
      warning: notifications.filter((n) => n.category === Category.WARNING).length,
      error: notifications.filter((n) => n.category === Category.ERROR).length,
    }),
    [notifications],
  );

  // Stable identity keeps the memoised NotificationCard from re-rendering
  // every time the parent renders.
  const handleDelete = useCallback((id: string) => remove(id), [remove]);

  return (
    <>
      <BannerStack />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">
            {user?.fullName}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Your <span className="text-gradient">notifications</span>
          </h1>
        </div>
        <Link to="/notifications/new">
          <Button>
            New notification
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Button>
        </Link>
      </div>

      {notifications.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Total" value={counts.total} accent="bg-slate-400" />
          <StatTile label="Info" value={counts.info} accent="bg-blue-500" />
          <StatTile label="Warning" value={counts.warning} accent="bg-amber-500" />
          <StatTile label="Error" value={counts.error} accent="bg-red-500" />
        </div>
      )}

      {error && <Alert message={error} className="mb-6" />}

      {isLoading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}
