import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/cn';

const SUN = 'M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4';
const MOON = 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z';

/**
 * `icon` is the bare circular button used in tight spaces; `row` is the
 * full-width labelled version that sits in the sidebar.
 */
export function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Light mode' : 'Dark mode';

  const glyph = (
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
      {isDark ? <path d={SUN} /> : <path d={MOON} />}
      {isDark && <circle cx="12" cy="12" r="4" />}
    </svg>
  );

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={cn(
        'flex items-center transition-colors',
        variant === 'row'
          ? 'gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-secondary hover:bg-[var(--surface-sunken)] hover:text-primary'
          : 'size-9 justify-center rounded-full text-secondary hover:bg-[var(--surface-sunken)] hover:text-primary',
      )}
    >
      {glyph}
      {variant === 'row' && <span>{label}</span>}
    </button>
  );
}
