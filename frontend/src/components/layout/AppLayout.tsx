import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../ui/Logo';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

/**
 * Signed-in pages get the persistent sidebar; the login and register screens
 * are centred on the plain canvas with no navigation to leave through.
 */
export function AppLayout() {
  const { isAuthenticated } = useAuth();
  // The drawer closes from the event that navigates (Sidebar's onNavigate)
  // rather than from an effect watching the location, which would cost a
  // second render for something the click already knows about.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh bg-canvas">
        <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 pb-16">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[264px_1fr]">
      {/* Fixed rail on large screens. */}
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar />
      </aside>

      {/* Off-canvas drawer below lg. */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-[264px] shadow-2xl">
            <Sidebar onNavigate={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface)]/85 px-5 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsDrawerOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-secondary hover:bg-[var(--surface-sunken)] hover:text-primary"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Logo />
        </header>

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
