import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINK = 'rounded-full px-4 py-2 text-sm font-medium transition-colors';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--surface)]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="shrink-0">
          <Logo />
        </Link>

        {isAuthenticated && (
          <div className="hidden items-center gap-1 sm:flex">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  NAV_LINK,
                  isActive
                    ? 'bg-[var(--surface-sunken)] text-primary'
                    : 'text-secondary hover:text-primary',
                )
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/notifications/new"
              className={({ isActive }) =>
                cn(
                  NAV_LINK,
                  isActive
                    ? 'bg-[var(--surface-sunken)] text-primary'
                    : 'text-secondary hover:text-primary',
                )
              }
            >
              New
            </NavLink>
          </div>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm font-medium text-secondary md:inline">
                {user?.fullName}
              </span>
              <Button variant="secondary" size="sm" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
