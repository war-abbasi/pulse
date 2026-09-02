import { cn } from '../../lib/cn';
import logoDark from '../../assets/logo-dark.png';
import logoLight from '../../assets/logo-light.png';

/**
 * The Pulse lockup. Two artwork files rather than one recoloured image,
 * because the wordmark is navy on light and white on dark.
 *
 * Both are rendered and toggled with CSS instead of picking one in JS: the
 * correct logo is then present in the very first paint, with no flash of the
 * wrong variant while React works out the theme.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <img
        src={logoLight}
        alt="Pulse"
        className="h-7 w-auto dark:hidden"
        width={297}
        height={96}
      />
      <img
        src={logoDark}
        alt="Pulse"
        // aria-hidden on the duplicate so screen readers announce the name once.
        aria-hidden="true"
        className="hidden h-7 w-auto dark:block"
        width={297}
        height={96}
      />
    </span>
  );
}
