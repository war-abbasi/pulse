/**
 * Regression tests for defects found in the specification audit. Each one
 * fails against the code as it was before the corresponding fix.
 */
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsProvider } from './NotificationsProvider';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { useNotifications } from '../hooks/useNotifications';
import { AUTO_DISMISS_MS } from '../hooks/useAutoDismissInfo';
import { Category, type UserNotification } from '../types';

vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true }) }));

const service = { list: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() };
vi.mock('../services/notificationService', () => ({
  notificationService: {
    list: (...a: unknown[]) => service.list(...a),
    getById: (...a: unknown[]) => service.getById(...a),
    create: (...a: unknown[]) => service.create(...a),
    update: (...a: unknown[]) => service.update(...a),
    remove: (...a: unknown[]) => service.remove(...a),
  },
}));

function build(id: string, overrides: Partial<UserNotification> = {}): UserNotification {
  return {
    id,
    header: `Header ${id}`,
    body: `Body ${id}`,
    category: Category.INFO,
    isClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <NotificationsProvider>{children}</NotificationsProvider>
);

async function mount(initial: UserNotification[]) {
  service.list.mockResolvedValue(initial);
  const view = renderHook(() => useNotifications(), { wrapper });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

beforeEach(() => vi.clearAllMocks());

describe('F1 — the 90-second rule must not depend on which screen is open', () => {
  afterEach(() => vi.useRealTimers());

  it('auto-dismisses INFO from the provider, with no banner component mounted', async () => {
    // The timer used to live in BannerStack, which only renders on the
    // dashboard, so opening the board silently stopped the countdown.
    vi.useFakeTimers();
    service.list.mockResolvedValue([build('a')]);
    service.update.mockResolvedValue(build('a', { isClosed: true }));

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Flush the initial load, then run out the clock. advanceTimersByTimeAsync
    // lets the promises inside the timer callback settle too.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.notifications).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTO_DISMISS_MS);
    });

    expect(service.update).toHaveBeenCalledWith('a', { isClosed: true });
  });
});

describe('F2 — a failed delete must tell the user', () => {
  const renderCard = (onDelete: (id: string) => Promise<void>) =>
    render(
      <MemoryRouter>
        <NotificationCard
          notification={build('a', { header: 'Backup failed' })}
          onDelete={onDelete}
        />
      </MemoryRouter>,
    );

  it('shows an error on the card instead of failing silently', async () => {
    const user = userEvent.setup();
    renderCard(vi.fn().mockRejectedValue(new Error('boom')));

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // An unrecognised error yields the friendly fallback rather than leaking
    // an internal message to the user.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not delete this notification.',
    );
  });

  it("relays the server's own explanation when there is one", async () => {
    const user = userEvent.setup();
    const axiosLike = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 404, data: { message: 'Notification not found.' } },
    });
    renderCard(vi.fn().mockRejectedValue(axiosLike));

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Notification not found.');
  });

  it('leaves the card on screen when the delete failed', async () => {
    const user = userEvent.setup();
    renderCard(vi.fn().mockRejectedValue(new Error('boom')));

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    await screen.findByRole('alert');

    // The row must not disappear, or the user believes it was deleted.
    expect(screen.getByText('Backup failed')).toBeInTheDocument();
  });
});

describe('F3 — a failed category move must roll back and explain itself', () => {
  it('moves the card immediately, before the server has answered', async () => {
    const { result } = await mount([build('a', { category: Category.INFO })]);
    // A promise that never settles, so only the optimistic step can have run.
    service.update.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      void result.current.changeCategory('a', Category.ERROR);
    });

    expect(result.current.notifications[0].category).toBe(Category.ERROR);
  });

  it('restores the original category and reports the failure when the server refuses', async () => {
    const { result } = await mount([build('a', { category: Category.INFO })]);
    service.update.mockRejectedValue(new Error('nope'));

    await act(async () => {
      await result.current.changeCategory('a', Category.ERROR);
    });

    expect(result.current.notifications[0].category).toBe(Category.INFO);
    expect(result.current.error).toBeTruthy();
  });

  it('reports a failed dismiss rather than letting the banner quietly return', async () => {
    const { result } = await mount([build('a')]);
    service.update.mockRejectedValue(new Error('offline'));

    await act(async () => {
      await result.current.dismiss('a');
    });

    expect(result.current.notifications[0].isClosed).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});
