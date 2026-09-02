import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BannerStack } from './BannerStack';
import { Category, type UserNotification } from '../../types';

const dismiss = vi.fn();
let notifications: UserNotification[] = [];

// The component reads its data from context; mocking the hook keeps these
// tests about the banner rules rather than about provider plumbing.
vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({ notifications, dismiss }),
}));

function build(id: string, overrides: Partial<UserNotification> = {}): UserNotification {
  return {
    id,
    header: `Header ${id}`,
    body: `Body ${id}`,
    category: Category.WARNING,
    isClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const many = (count: number) =>
  Array.from({ length: count }, (_, index) => build(String(index + 1)));

describe('BannerStack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications = [];
  });

  it('renders nothing when there are no notifications', () => {
    const { container } = render(<BannerStack />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when every notification is already dismissed', () => {
    notifications = [build('1', { isClosed: true }), build('2', { isClosed: true })];
    const { container } = render(<BannerStack />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a banner per undismissed notification below the limit', () => {
    notifications = many(3);
    render(<BannerStack />);

    expect(screen.getAllByRole('status')).toHaveLength(3);
    expect(screen.queryByText(/you have more notifications/i)).not.toBeInTheDocument();
  });

  it('shows five individual banners at exactly the limit', () => {
    notifications = many(5);
    render(<BannerStack />);

    expect(screen.getAllByRole('button', { name: /dismiss/i })).toHaveLength(5);
    expect(screen.queryByText(/you have more notifications/i)).not.toBeInTheDocument();
  });

  it('collapses to a single summary banner past the limit', () => {
    notifications = many(6);
    render(<BannerStack />);

    expect(screen.getByText(/you have more notifications/i)).toBeInTheDocument();
    // The summary replaces the individual banners rather than joining them.
    expect(screen.queryAllByRole('button', { name: /dismiss/i })).toHaveLength(0);
  });

  it('reports the undismissed count in the summary', () => {
    notifications = [...many(7), build('closed', { isClosed: true })];
    render(<BannerStack />);

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/7 unread items/i)).toBeInTheDocument();
  });

  it('counts only undismissed notifications towards the limit', () => {
    // Eight in total but only four still open, so individual banners.
    notifications = [
      ...many(4),
      ...Array.from({ length: 4 }, (_, i) => build(`c${i}`, { isClosed: true })),
    ];
    render(<BannerStack />);

    expect(screen.getAllByRole('button', { name: /dismiss/i })).toHaveLength(4);
    expect(screen.queryByText(/you have more notifications/i)).not.toBeInTheDocument();
  });

  it('dismisses the notification whose close button was clicked', async () => {
    const user = userEvent.setup();
    notifications = [build('a'), build('b')];
    render(<BannerStack />);

    await user.click(screen.getByRole('button', { name: 'Dismiss Header b' }));

    expect(dismiss).toHaveBeenCalledExactlyOnceWith('b');
  });

  it('shows each banner header and body', () => {
    notifications = [build('a', { header: 'Backup failed', body: 'Disk quota exceeded' })];
    render(<BannerStack />);

    expect(screen.getByText('Backup failed')).toBeInTheDocument();
    expect(screen.getByText('Disk quota exceeded')).toBeInTheDocument();
  });
});
