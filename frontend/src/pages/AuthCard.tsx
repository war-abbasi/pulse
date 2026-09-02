import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Shared shell for the login and register screens. */
export function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-8">
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
          {title.split(' ').slice(0, -1).join(' ')}{' '}
          <span className="text-gradient">{title.split(' ').slice(-1)}</span>
        </h1>
        <p className="mt-2.5 text-sm text-secondary">{subtitle}</p>
      </div>

      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-7 shadow-sm">
        {children}
      </div>

      <p className="mt-5 text-center text-sm text-secondary">{footer}</p>
    </div>
  );
}
