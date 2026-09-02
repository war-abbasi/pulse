import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsProvider } from './NotificationsProvider';
import { useNotifications } from '../hooks/useNotifications';
import { Category, type UserNotification } from '../types';

let isAuthenticated = true;
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated }),
}));

const service = {
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};
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

async function mount(initial: UserNotification[] = []) {
  service.list.mockResolvedValue(initial);
  const view = renderHook(() => useNotifications(), { wrapper });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

describe('NotificationsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAuthenticated = true;
  });

  it('loads the list once authenticated', async () => {
    const { result } = await mount([build('a'), build('b')]);

    expect(service.list).toHaveBeenCalledOnce();
    expect(result.current.notifications.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('does not fetch anything for a signed-out visitor', async () => {
    isAuthenticated = false;
    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(service.list).not.toHaveBeenCalled();
    expect(result.current.notifications).toEqual([]);
  });

  it('surfaces a readable message when loading fails', async () => {
    service.list.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.isLoading).toBe(false);
  });

  it('prepends a created notification so it appears without a refetch', async () => {
    const { result } = await mount([build('old')]);
    service.create.mockResolvedValue(build('new'));

    await act(async () => {
      await result.current.create({ header: 'h', body: 'b', category: Category.INFO });
    });

    expect(result.current.notifications.map((n) => n.id)).toEqual(['new', 'old']);
    // A second round trip would defeat the point of holding the list here.
    expect(service.list).toHaveBeenCalledOnce();
  });

  it('replaces the edited notification in place, preserving order', async () => {
    const { result } = await mount([build('a'), build('b'), build('c')]);
    service.update.mockResolvedValue(build('b', { header: 'Edited' }));

    await act(async () => {
      await result.current.update('b', { header: 'Edited' });
    });

    expect(result.current.notifications.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.notifications[1].header).toBe('Edited');
  });

  it('creates a new array on update rather than mutating the old one', async () => {
    const { result } = await mount([build('a')]);
    const before = result.current.notifications;
    service.update.mockResolvedValue(build('a', { header: 'Edited' }));

    await act(async () => {
      await result.current.update('a', { header: 'Edited' });
    });

    // React compares by reference, so in-place mutation would not re-render.
    expect(result.current.notifications).not.toBe(before);
    expect(before[0].header).toBe('Header a');
  });

  it('removes a deleted notification from the list', async () => {
    const { result } = await mount([build('a'), build('b')]);
    service.remove.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.remove('a');
    });

    expect(result.current.notifications.map((n) => n.id)).toEqual(['b']);
  });

  it('keeps the list unchanged when a delete fails', async () => {
    const { result } = await mount([build('a')]);
    service.remove.mockRejectedValue(new Error('nope'));

    await act(async () => {
      await result.current.remove('a').catch(() => {});
    });

    expect(result.current.notifications).toHaveLength(1);
  });

  it('marks a dismissed notification closed but keeps it in the list', async () => {
    const { result } = await mount([build('a')]);
    service.update.mockResolvedValue(build('a', { isClosed: true }));

    await act(async () => {
      await result.current.dismiss('a');
    });

    expect(service.update).toHaveBeenCalledWith('a', { isClosed: true });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].isClosed).toBe(true);
  });

  it('rolls the dismissal back if the server rejects it', async () => {
    const { result } = await mount([build('a')]);
    service.update.mockRejectedValue(new Error('offline'));

    await act(async () => {
      await result.current.dismiss('a');
    });

    // The UI must not claim something was saved when it was not.
    expect(result.current.notifications[0].isClosed).toBe(false);
  });
});
