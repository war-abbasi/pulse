import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/cn';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  to: string;
  label: string;
  /** SVG path data, stroked. */
  icon: string;
  /** Shown as a count pill on the right of the row. */
  badge?: number;
}

function NavRow({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/12 dark:text-brand-300'
            : 'text-secondary hover:bg-[var(--surface-sunken)] hover:text-primary',
        )
      }
    >
      <svg
        className="size-[18px] shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={item.icon} />
      </svg>
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[11px] font-bold text-secondary group-hover:bg-[var(--surface)]">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  const openCount = notifications.filter((item) => !item.isClosed).length;

  const items: NavItem[] = [
    {
      to: '/dashboard',
      label: 'Overview',
      icon: 'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z',
    },
    {
      to: '/board',
      label: 'Board',
      icon: 'M4 5h4v14H4V5Zm6 0h4v9h-4V5Zm6 0h4v11h-4V5Z',
      badge: openCount,
    },
    {
      to: '/notifications',
      label: 'All Notifications',
      icon: 'M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4 10a2 2 0 0 0 4 0',
      badge: notifications.length,
    },
  ];

  const initials = (user?.fullName ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex h-full flex-col gap-1 border-r border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-5">
      <div className="mb-6 flex items-center justify-between px-1">
        <NavLink to="/dashboard" onClick={onNavigate}>
          <Logo />
        </NavLink>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
          Live
        </span>
      </div>

      <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
        Workspace
      </p>

      <nav className="flex flex-col gap-1" onClick={onNavigate}>
        <NavRow item={items[0]} />

        {/*
          The dotted button sits between Overview and the rest, matching the
          reference layout. A dashed outline reads as "add something here"
          rather than as another destination.
        */}
        <button
          type="button"
          onClick={() => navigate('/notifications/new')}
          className="my-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-300 px-3 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-300 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New notification
        </button>

        {items.slice(1).map((item) => (
          <NavRow key={item.to} item={item} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-6">
        <ThemeToggle variant="row" />

        <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] px-2.5 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">
            {initials || '?'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-primary">{user?.fullName}</p>
            <p className="truncate text-xs text-muted">@{user?.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-[var(--surface-sunken)] hover:text-primary"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 17l5-5-5-5M20 12H9M12 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
