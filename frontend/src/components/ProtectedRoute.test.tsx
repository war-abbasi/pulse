import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';

let isAuthenticated = false;

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated }),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>Dashboard</p>} />
          <Route path="/notifications/new" element={<p>New notification</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    isAuthenticated = false;
  });

  it('renders the protected page for an authenticated user', () => {
    isAuthenticated = true;
    renderAt('/dashboard');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects an anonymous visitor to the login page', () => {
    renderAt('/dashboard');

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('protects every nested route, not just the dashboard', () => {
    renderAt('/notifications/new');

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('New notification')).not.toBeInTheDocument();
  });

  it('never renders the protected content before redirecting', () => {
    // A guard that flashed the page first would leak it to an unauthorised
    // viewer, however briefly.
    const { container } = renderAt('/dashboard');
    expect(container.textContent).not.toContain('Dashboard');
  });
});
