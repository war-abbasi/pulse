import { createContext } from 'react';
import type {
  CreateNotificationPayload,
  UpdateNotificationPayload,
  UserNotification,
} from '../types';

export interface NotificationsContextValue {
  notifications: UserNotification[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (payload: CreateNotificationPayload) => Promise<UserNotification>;
  update: (id: string, payload: UpdateNotificationPayload) => Promise<UserNotification>;
  remove: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);
