import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BoardCard } from '../components/notifications/BoardCard';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../hooks/useNotifications';
import { CATEGORY_OPTIONS, CATEGORY_STYLES } from '../lib/category';
import { cn } from '../lib/cn';
import { Category, type UserNotification } from '../types';

export function BoardPage() {
  const { notifications, isLoading, error, changeCategory, remove } = useNotifications();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<Category | null>(null);

  // One pass instead of three filters, and stable per render.
  const columns = useMemo(() => {
    const grouped: Record<Category, UserNotification[]> = {
      [Category.INFO]: [],
      [Category.WARNING]: [],
      [Category.ERROR]: [],
    };
    for (const item of notifications) grouped[item.category]?.push(item);
    return grouped;
  }, [notifications]);

  const moveTo = useCallback(
    (id: string, category: Category) => {
      const current = notifications.find((item) => item.id === id);
      // Dropping a card back in its own column is a no-op, not a request.
      if (!current || current.category === category) return;
      // changeCategory is optimistic and reports its own failures, so the
      // card moves at once and never snaps back without explanation.
      void changeCategory(id, category);
    },
    [notifications, changeCategory],
  );

  const handleDelete = useCallback((id: string) => remove(id), [remove]);
  const handleDragStart = useCallback((id: string) => setDraggingId(id), []);
  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">Triage</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-primary">
            Notification <span className="text-gradient">board</span>
          </h1>
          <p className="mt-1.5 text-sm text-secondary">
            Drag a card between columns to change its severity, or use the arrows on the card.
          </p>
        </div>
        <Link to="/notifications/new">
          <Button>
            New notification
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Button>
        </Link>
      </header>

      {error && <Alert message={error} className="mb-6" />}

      {/* min-h keeps the lanes reading as columns even when nearly empty,
          and gives a comfortable drop target below the last card. */}
      <div className="grid flex-1 gap-4 md:min-h-[32rem] md:grid-cols-3">
        {CATEGORY_OPTIONS.map((category) => {
          const style = CATEGORY_STYLES[category];
          const items = columns[category];
          const isTarget = dropTarget === category;

          return (
            <section
              key={category}
              onDragOver={(event) => {
                // Without preventDefault the browser refuses the drop.
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                if (dropTarget !== category) setDropTarget(category);
              }}
              onDragLeave={(event) => {
                // Ignore bubbling from children, or the highlight flickers as
                // the pointer crosses each card.
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDropTarget((current) => (current === category ? null : current));
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData('text/plain') || draggingId;
                if (id) moveTo(id, category);
                handleDragEnd();
              }}
              className={cn(
                'flex flex-col rounded-2xl border p-3 transition-colors',
                'bg-[var(--surface-sunken)] dark:bg-[var(--surface-raised)]/40',
                isTarget
                  ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/8'
                  : 'border-[var(--border-subtle)]',
              )}
            >
              <header className="mb-3 flex items-center gap-2 px-1.5 pt-1">
                <span className={cn('size-2.5 rounded-full', style.accent)} aria-hidden="true" />
                <h2 className="text-sm font-bold text-primary">{style.label}</h2>
                <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold text-secondary">
                  {items.length}
                </span>
              </header>

              <div className="flex flex-1 flex-col gap-2.5">
                {items.map((notification) => (
                  <BoardCard
                    key={notification.id}
                    notification={notification}
                    isDragging={draggingId === notification.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDelete={handleDelete}
                    onMove={moveTo}
                  />
                ))}

                {/* A permanent tail zone means a card can be dropped below the
                    last one, not only exactly onto another card. */}
                {items.length > 0 && (
                  <div
                    className={cn(
                      'min-h-16 flex-1 rounded-xl border-2 border-dashed transition-colors',
                      isTarget
                        ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-500/5'
                        : 'border-transparent',
                    )}
                  />
                )}

                {items.length === 0 && (
                  <div
                    className={cn(
                      'flex min-h-28 flex-1 items-center justify-center rounded-xl border-2 border-dashed px-3 text-center text-xs font-medium transition-colors',
                      isTarget
                        ? 'border-brand-500 text-brand-700 dark:text-brand-300'
                        : 'border-[var(--border-subtle)] text-muted',
                    )}
                  >
                    {isLoading ? 'Loading…' : isTarget ? 'Drop here' : `No ${style.label.toLowerCase()} notifications`}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
