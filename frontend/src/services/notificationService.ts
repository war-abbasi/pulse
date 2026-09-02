import type {
  CreateNotificationPayload,
  UpdateNotificationPayload,
  UserNotification,
} from '../types';
import { api } from './api';

export const notificationService = {
  async list(): Promise<UserNotification[]> {
    const { data } = await api.get<UserNotification[]>('/notifications');
    return data;
  },

  async getById(id: string): Promise<UserNotification> {
    const { data } = await api.get<UserNotification>(`/notifications/${id}`);
    return data;
  },

  async create(payload: CreateNotificationPayload): Promise<UserNotification> {
    const { data } = await api.post<UserNotification>('/notifications', payload);
    return data;
  },

  async update(id: string, payload: UpdateNotificationPayload): Promise<UserNotification> {
    const { data } = await api.patch<UserNotification>(`/notifications/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
