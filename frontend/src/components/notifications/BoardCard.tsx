import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_STYLES } from '../../lib/category';
import { cn } from '../../lib/cn';
import { timeAgo } from '../../lib/time';
import { Category, type UserNotification } from '../../types';

interface Props {
  notification: UserNotification;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDelete: (id: string) => Promise<void>;
  /** Keyboard equivalent of dragging, so the board is not mouse-only. */
  onMove: (id: string, category: Category) => void;
}

const ORDER: Category[] = [Category.INFO, Category.WARNING, Category.ERROR];

export const BoardCard = memo(function BoardCard({
  notification,
  isDragging,
  onDragStart,
  onDragEnd,
  onDelete,
  onMove,
}: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const style = CATEGORY_STYLES[notification.category];
  const index = ORDER.indexOf(notification.category);

  const move = (delta: number) => {
    const next = ORDER[index + delta];
    if (next) onMove(notification.id, next);
  };

  return (
    <article
      draggable
      onDragStart={(event) => {
        // Some browsers refuse to start a drag without transfer data set.
        event.dataTransfer.setData('text/plain', notification.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(notification.id);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'group cursor-grab rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3.5',
        'shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', style.accent)} aria-hidden="true" />
        <h4 className="min-w-0 flex-1 text-sm font-bold leading-snug text-primary">
          {notification.header}
        </h4>
        {notification.isClosed && (
          <span className="shrink-0 rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
            Read
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-3 pl-4 text-xs leading-relaxed text-secondary">
        {notification.body}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 pl-4">
        <span className="text-[11px] text-muted">{timeAgo(notification.createdAt)}</span>

        {/*
          Controls stay in the DOM and only fade in, so their space is
          reserved and cards do not resize on hover. They remain reachable by
          keyboard regardless of hover state.
        */}
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={index === 0}
            aria-label="Move to previous category"
            className="grid size-6 place-items-center rounded-md text-muted transition-colors hover:bg-[var(--surface-sunken)] hover:text-primary disabled:invisible"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={index === ORDER.length - 1}
            aria-label="Move to next category"
            className="grid size-6 place-items-center rounded-md text-muted transition-colors hover:bg-[var(--surface-sunken)] hover:text-primary disabled:invisible"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <Link
            to={`/notifications/${notification.id}`}
            aria-label={`Edit ${notification.header}`}
            className="grid size-6 place-items-center rounded-md text-muted transition-colors hover:bg-[var(--surface-sunken)] hover:text-primary"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </Link>

          {isConfirming ? (
            <button
              type="button"
              onClick={() => void onDelete(notification.id)}
              className="rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white"
            >
              Sure?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              onBlur={() => setIsConfirming(false)}
              aria-label={`Delete ${notification.header}`}
              className="grid size-6 place-items-center rounded-md text-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/12"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
