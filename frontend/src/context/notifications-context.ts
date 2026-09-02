import { createContext } from 'react';
import type {
  Category,
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
  /** Optimistic category move, used by the board's drag-and-drop. */
  changeCategory: (id: string, category: Category) => Promise<void>;
  /** Report a failed action into the shared error slot. */
  reportError: (message: string) => void;
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);
