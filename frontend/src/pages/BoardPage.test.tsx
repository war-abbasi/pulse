import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardPage } from './BoardPage';
import { Category, type UserNotification } from '../types';

const update = vi.fn();
const remove = vi.fn();
let notifications: UserNotification[] = [];

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({ notifications, isLoading: false, error: null, update, remove }),
}));

function build(id: string, category: Category, header = `Card ${id}`): UserNotification {
  return {
    id,
    header,
    body: `Body ${id}`,
    category,
    isClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const renderBoard = () =>
  render(
    <MemoryRouter>
      <BoardPage />
    </MemoryRouter>,
  );

/** Finds a lane by its heading, so assertions read like the UI. */
const column = (label: string) =>
  screen.getByRole('heading', { name: label, level: 2 }).closest('section')!;

/** Minimal DataTransfer stand-in; jsdom does not implement one. */
function dataTransfer() {
  const store = new Map<string, string>();
  return {
    setData: (type: string, value: string) => store.set(type, value),
    getData: (type: string) => store.get(type) ?? '',
    effectAllowed: '',
    dropEffect: '',
  };
}

function drag(cardHeader: string, toColumn: string) {
  const card = screen.getByText(cardHeader).closest('article')!;
  const target = column(toColumn);
  const dt = dataTransfer();

  fireEvent.dragStart(card, { dataTransfer: dt });
  fireEvent.dragOver(target, { dataTransfer: dt });
  fireEvent.drop(target, { dataTransfer: dt });
  fireEvent.dragEnd(card, { dataTransfer: dt });
}

describe('BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications = [];
  });

  it('groups notifications into the three severity columns', () => {
    notifications = [
      build('1', Category.INFO),
      build('2', Category.INFO),
      build('3', Category.WARNING),
      build('4', Category.ERROR),
    ];
    renderBoard();

    expect(within(column('Info')).getAllByRole('article')).toHaveLength(2);
    expect(within(column('Warning')).getAllByRole('article')).toHaveLength(1);
    expect(within(column('Error')).getAllByRole('article')).toHaveLength(1);
  });

  it('shows a per-column count', () => {
    notifications = [build('1', Category.INFO), build('2', Category.INFO)];
    renderBoard();

    expect(within(column('Info')).getByText('2')).toBeInTheDocument();
  });

  it('shows an empty-state message in a column with nothing in it', () => {
    notifications = [build('1', Category.INFO)];
    renderBoard();

    expect(within(column('Error')).getByText(/no error notifications/i)).toBeInTheDocument();
  });

  it('persists the new category when a card is dropped on another column', () => {
    notifications = [build('1', Category.INFO, 'Deploy finished')];
    renderBoard();

    drag('Deploy finished', 'Error');

    expect(update).toHaveBeenCalledExactlyOnceWith('1', { category: Category.ERROR });
  });

  it('does nothing when a card is dropped back on its own column', () => {
    notifications = [build('1', Category.WARNING, 'Cert expiring')];
    renderBoard();

    drag('Cert expiring', 'Warning');

    // A no-op drop must not fire a pointless request.
    expect(update).not.toHaveBeenCalled();
  });

  it('highlights the column being dragged over and clears it after the drop', () => {
    notifications = [build('1', Category.INFO, 'Deploy finished')];
    renderBoard();

    const target = column('Error');
    const dt = dataTransfer();
    fireEvent.dragOver(target, { dataTransfer: dt });
    expect(target.className).toMatch(/border-brand-500/);

    fireEvent.drop(target, { dataTransfer: dt });
    expect(target.className).not.toMatch(/border-brand-500/);
  });

  it('moves a card one step to the right with the keyboard-accessible arrow', async () => {
    const user = userEvent.setup();
    notifications = [build('1', Category.INFO, 'Deploy finished')];
    renderBoard();

    await user.click(screen.getByRole('button', { name: /move to next category/i }));

    expect(update).toHaveBeenCalledExactlyOnceWith('1', { category: Category.WARNING });
  });

  it('moves a card one step to the left', async () => {
    const user = userEvent.setup();
    notifications = [build('1', Category.ERROR, 'Backup failed')];
    renderBoard();

    await user.click(screen.getByRole('button', { name: /move to previous category/i }));

    expect(update).toHaveBeenCalledExactlyOnceWith('1', { category: Category.WARNING });
  });

  it('does not offer a move past either end of the range', () => {
    notifications = [build('1', Category.INFO), build('2', Category.ERROR)];
    renderBoard();

    // INFO is leftmost and ERROR rightmost, so each has one disabled arrow.
    const back = screen.getAllByRole('button', { name: /move to previous category/i });
    const forward = screen.getAllByRole('button', { name: /move to next category/i });
    expect(back.filter((b) => (b as HTMLButtonElement).disabled)).toHaveLength(1);
    expect(forward.filter((b) => (b as HTMLButtonElement).disabled)).toHaveLength(1);
  });

  it('requires confirmation before deleting a card', async () => {
    const user = userEvent.setup();
    notifications = [build('1', Category.INFO, 'Deploy finished')];
    renderBoard();

    await user.click(screen.getByRole('button', { name: /delete deploy finished/i }));
    expect(remove).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /sure\?/i }));
    expect(remove).toHaveBeenCalledExactlyOnceWith('1');
  });
});
