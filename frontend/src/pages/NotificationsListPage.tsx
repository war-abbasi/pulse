import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../hooks/useNotifications';
import { CATEGORY_OPTIONS, CATEGORY_STYLES } from '../lib/category';
import { cn } from '../lib/cn';
import type { Category } from '../types';

type Filter = Category | 'ALL';

export function NotificationsListPage() {
  const { notifications, isLoading, error, remove } = useNotifications();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notifications.filter((item) => {
      if (filter !== 'ALL' && item.category !== filter) return false;
      if (!needle) return true;
      return (
        item.header.toLowerCase().includes(needle) || item.body.toLowerCase().includes(needle)
      );
    });
  }, [notifications, filter, query]);

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([['ALL', notifications.length]]);
    for (const category of CATEGORY_OPTIONS) {
      map.set(category, notifications.filter((n) => n.category === category).length);
    }
    return map;
  }, [notifications]);

  const handleDelete = useCallback((id: string) => remove(id), [remove]);

  const tabs: { value: Filter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    ...CATEGORY_OPTIONS.map((c) => ({ value: c as Filter, label: CATEGORY_STYLES[c].label })),
  ];

  return (
    <>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">Library</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-primary">
            All <span className="text-gradient">notifications</span>
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
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              aria-pressed={filter === tab.value}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                filter === tab.value
                  ? 'bg-brand-700 text-white'
                  : 'text-secondary hover:text-primary',
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">{counts.get(tab.value) ?? 0}</span>
            </button>
          ))}
        </div>

        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search notifications</span>
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by header or body…"
            className="w-full rounded-full border border-[var(--border-strong)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-primary placeholder:text-[var(--text-muted)] focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      {error && <Alert message={error} className="mb-6" />}

      {isLoading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--surface)]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-16 text-center">
          <h3 className="text-lg font-bold text-primary">
            {notifications.length === 0 ? 'No notifications yet' : 'Nothing matches those filters'}
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-secondary">
            {notifications.length === 0
              ? 'Create your first notification and it will appear here immediately.'
              : 'Try a different category or clear your search.'}
          </p>
          {notifications.length === 0 ? (
            <Link to="/notifications/new" className="mt-5 inline-block">
              <Button>Create notification</Button>
            </Link>
          ) : (
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => {
                setFilter('ALL');
                setQuery('');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((notification) => (
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
