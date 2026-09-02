import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NotificationForm } from '../components/notifications/NotificationForm';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../hooks/useNotifications';
import { getErrorMessage } from '../services/api';
import { notificationService } from '../services/notificationService';
import type { CreateNotificationPayload, UserNotification } from '../types';
import { PageHeader } from './PageHeader';

export function EditNotificationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notifications, update } = useNotifications();

  // Prefer the copy already in context so a normal edit renders instantly.
  const cached = notifications.find((item) => item.id === id) ?? null;

  const [notification, setNotification] = useState<UserNotification | null>(cached);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!cached);

  useEffect(() => {
    // Only fetch when the notification is not already loaded — which happens
    // when the user opens or refreshes this URL directly.
    if (!id || cached) return;

    // isLoading already starts true whenever there is no cached copy, so it
    // does not need setting again here.
    let isActive = true;

    notificationService
      .getById(id)
      .then((result) => {
        if (isActive) setNotification(result);
      })
      .catch((error: unknown) => {
        if (isActive) setLoadError(getErrorMessage(error, 'This notification could not be found.'));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    // Guard against setting state after unmount if the user navigates away
    // mid-request.
    return () => {
      isActive = false;
    };
  }, [id, cached]);

  const handleSubmit = async (payload: CreateNotificationPayload) => {
    if (!id) return;
    try {
      await update(id, payload);
      navigate('/dashboard');
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Could not save your changes.'));
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-96 animate-pulse rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)]" />
      </div>
    );
  }

  if (loadError || !notification) {
    return (
      <div className="mx-auto max-w-2xl">
        <Alert message={loadError ?? 'This notification could not be found.'} />
        <Button className="mt-5" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Edit"
        title="Edit notification"
        subtitle="Update the details and save your changes."
      />
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-7 shadow-sm">
        <NotificationForm
          // The form is uncontrolled with respect to this page: it seeds its
          // own state once, so typing does not fight with the cached copy.
          initialValues={{
            header: notification.header,
            body: notification.body,
            category: notification.category,
          }}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
