import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-6xl font-extrabold tracking-tight">
        <span className="text-gradient">404</span>
      </p>
      <h1 className="mt-3 text-2xl font-extrabold text-primary">Page not found</h1>
      <p className="mt-2 text-sm text-secondary">
        That page does not exist. It may have been moved or deleted.
      </p>
      <Link to="/dashboard" className="mt-6 inline-block">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
