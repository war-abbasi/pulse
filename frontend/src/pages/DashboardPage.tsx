import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BannerStack } from '../components/notifications/BannerStack';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { CATEGORY_OPTIONS, CATEGORY_STYLES } from '../lib/category';
import { cn } from '../lib/cn';
import { timeAgo } from '../lib/time';
import { Category } from '../types';

function MetricCard({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: string;
  caption: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-sunken)] text-brand-700 dark:text-brand-300">
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </span>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-primary">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-primary">{label}</p>
      <p className="mt-0.5 text-xs text-muted">{caption}</p>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { notifications, isLoading, error } = useNotifications();

  const stats = useMemo(() => {
    const byCategory = {
      [Category.INFO]: 0,
      [Category.WARNING]: 0,
      [Category.ERROR]: 0,
    };
    let open = 0;
    for (const item of notifications) {
      byCategory[item.category] += 1;
      if (!item.isClosed) open += 1;
    }
    const total = notifications.length;
    return {
      total,
      open,
      byCategory,
      // Guard the divide: an empty portfolio is 0%, not NaN.
      readRate: total === 0 ? 0 : Math.round(((total - open) / total) * 100),
      peak: Math.max(1, ...Object.values(byCategory)),
    };
  }, [notifications]);

  const recent = notifications.slice(0, 5);

  return (
    <>
      <BannerStack />

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Welcome back, <span className="text-gradient">{user?.fullName?.split(' ')[0]}</span>
          </h1>
          <p className="mt-1.5 text-sm text-secondary">Your notifications at a glance</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/board">
            <Button variant="secondary">Open board</Button>
          </Link>
          <Link to="/notifications/new">
            <Button>
              New notification
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Button>
          </Link>
        </div>
      </header>

      {error && <Alert message={error} className="mb-6" />}

      <section className="mb-9">
        <h2 className="text-lg font-bold text-primary">Portfolio overview</h2>
        <p className="mb-4 text-sm text-secondary">Aggregate metrics across all notifications</p>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total notifications"
            value={String(stats.total)}
            caption="All time"
            icon="M4 7h16M4 12h16M4 17h10"
          />
          <MetricCard
            label="Awaiting attention"
            value={String(stats.open)}
            caption="Not yet dismissed"
            icon="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4 10a2 2 0 0 0 4 0"
          />
          <MetricCard
            label="Read rate"
            value={`${stats.readRate}%`}
            caption="Dismissed vs total"
            icon="M3 17l6-6 4 4 8-8"
          />
          <MetricCard
            label="Critical"
            value={String(stats.byCategory[Category.ERROR])}
            caption="Error severity"
            icon="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 lg:col-span-2">
          <h2 className="text-sm font-bold text-primary">By severity</h2>
          <p className="mb-6 text-xs text-secondary">Distribution across categories</p>

          <div className="space-y-4">
            {CATEGORY_OPTIONS.map((category) => {
              const style = CATEGORY_STYLES[category];
              const count = stats.byCategory[category];
              return (
                <div key={category}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-primary">
                      <span className={cn('size-2 rounded-full', style.accent)} aria-hidden="true" />
                      {style.label}
                    </span>
                    <span className="font-bold text-secondary">{count}</span>
                  </div>
                  {/* Bars are scaled against the largest column, so the shape
                      stays readable even when totals are small. */}
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                    <div
                      className={cn('h-full rounded-full transition-[width] duration-500', style.accent)}
                      style={{ width: `${(count / stats.peak) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-primary">Recent activity</h2>
              <p className="text-xs text-secondary">Your five most recent notifications</p>
            </div>
            <Link
              to="/notifications"
              className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
            >
              View all
            </Link>
          </div>

          {isLoading && notifications.length === 0 ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--surface-sunken)]" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[var(--border-subtle)] px-4 py-10 text-center">
              <p className="text-sm font-semibold text-primary">Nothing here yet</p>
              <p className="mt-1 text-xs text-secondary">
                Create your first notification to see it appear instantly.
              </p>
              <Link to="/notifications/new" className="mt-4 inline-block">
                <Button size="sm">Create notification</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {recent.map((item) => {
                const style = CATEGORY_STYLES[item.category];
                return (
                  <li key={item.id}>
                    <Link
                      to={`/notifications/${item.id}`}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-[var(--surface-sunken)]"
                    >
                      <span className={cn('size-2 shrink-0 rounded-full', style.accent)} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">
                        {item.header}
                      </span>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', style.badge)}>
                        {style.label}
                      </span>
                      <span className="hidden shrink-0 text-xs text-muted sm:inline">
                        {timeAgo(item.createdAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
