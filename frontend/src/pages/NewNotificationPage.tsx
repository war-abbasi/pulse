import { useNavigate } from 'react-router-dom';
import { NotificationForm } from '../components/notifications/NotificationForm';
import { useNotifications } from '../hooks/useNotifications';
import { getErrorMessage } from '../services/api';
import type { CreateNotificationPayload } from '../types';
import { PageHeader } from './PageHeader';

export function NewNotificationPage() {
  const navigate = useNavigate();
  const { create } = useNotifications();

  const handleSubmit = async (payload: CreateNotificationPayload) => {
    try {
      // create() prepends to the shared list, so by the time we navigate the
      // dashboard already has the new item — no refetch, no page reload.
      await create(payload);
      navigate('/dashboard');
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Could not create this notification.'));
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Create"
        title="New notification"
        subtitle="It will appear on your dashboard straight away."
      />
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-7 shadow-sm">
        <NotificationForm submitLabel="Create notification" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
