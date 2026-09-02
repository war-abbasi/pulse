import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTO_DISMISS_MS, useAutoDismissInfo } from './useAutoDismissInfo';
import { Category, type UserNotification } from '../types';

function build(overrides: Partial<UserNotification> = {}): UserNotification {
  return {
    id: 'n1',
    header: 'Header',
    body: 'Body',
    category: Category.INFO,
    isClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Minimal host component so the hook can be exercised in isolation. */
function Harness({
  notifications,
  dismiss,
}: {
  notifications: UserNotification[];
  dismiss: (id: string) => void;
}) {
  useAutoDismissInfo(notifications, dismiss);
  return null;
}

describe('useAutoDismissInfo', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('dismisses an open INFO notification after 90 seconds', () => {
    const dismiss = vi.fn();
    render(<Harness notifications={[build()]} dismiss={dismiss} />);

    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS));

    expect(dismiss).toHaveBeenCalledExactlyOnceWith('n1');
  });

  it('does not dismiss before the 90 seconds are up', () => {
    const dismiss = vi.fn();
    render(<Harness notifications={[build()]} dismiss={dismiss} />);

    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS - 1));

    expect(dismiss).not.toHaveBeenCalled();
  });

  it.each([Category.WARNING, Category.ERROR])('never auto-dismisses %s', (category) => {
    const dismiss = vi.fn();
    render(<Harness notifications={[build({ category })]} dismiss={dismiss} />);

    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS * 5));

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('ignores an INFO notification that is already closed', () => {
    const dismiss = vi.fn();
    render(<Harness notifications={[build({ isClosed: true })]} dismiss={dismiss} />);

    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS));

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('runs an independent timer for each INFO notification', () => {
    const dismiss = vi.fn();
    render(
      <Harness
        notifications={[build({ id: 'a' }), build({ id: 'b' }), build({ id: 'c' })]}
        dismiss={dismiss}
      />,
    );

    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS));

    expect(dismiss.mock.calls.map(([id]) => id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('does not restart the countdown when the component re-renders', () => {
    const dismiss = vi.fn();
    const notifications = [build()];
    const { rerender } = render(<Harness notifications={notifications} dismiss={dismiss} />);

    act(() => vi.advanceTimersByTime(60_000));
    // A new array with the same contents, which is what a refetch produces.
    rerender(<Harness notifications={[...notifications]} dismiss={dismiss} />);
    act(() => vi.advanceTimersByTime(30_000));

    // If the re-render had restarted the timer, 90s would not have elapsed yet.
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('cancels the timer when the notification is dismissed by hand first', () => {
    const dismiss = vi.fn();
    const { rerender } = render(<Harness notifications={[build()]} dismiss={dismiss} />);

    act(() => vi.advanceTimersByTime(30_000));
    rerender(<Harness notifications={[build({ isClosed: true })]} dismiss={dismiss} />);
    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS));

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('cancels the timer when the notification is deleted', () => {
    const dismiss = vi.fn();
    const { rerender } = render(<Harness notifications={[build()]} dismiss={dismiss} />);

    act(() => vi.advanceTimersByTime(30_000));
    rerender(<Harness notifications={[]} dismiss={dismiss} />);
    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS));

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('clears pending timers on unmount so none fire against a dead component', () => {
    const dismiss = vi.fn();
    const { unmount } = render(<Harness notifications={[build()]} dismiss={dismiss} />);

    act(() => vi.advanceTimersByTime(30_000));
    unmount();
    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS));

    expect(dismiss).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts a timer for a notification that appears later', () => {
    const dismiss = vi.fn();
    const { rerender } = render(<Harness notifications={[]} dismiss={dismiss} />);

    act(() => vi.advanceTimersByTime(200_000));
    rerender(<Harness notifications={[build({ id: 'late' })]} dismiss={dismiss} />);
    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS));

    expect(dismiss).toHaveBeenCalledExactlyOnceWith('late');
  });
});
