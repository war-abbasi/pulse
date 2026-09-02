import { Link } from 'react-router-dom';

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function PageHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <div className="mb-7">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition-colors hover:text-primary"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to dashboard
      </Link>

      <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-primary">{title}</h1>
      <p className="mt-1.5 text-sm text-secondary">{subtitle}</p>
    </div>
  );
}
