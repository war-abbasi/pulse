import { Category } from './enums/category.enum.js';
import { NotificationDocument } from './schemas/notification.schema.js';

/** The wire format for a notification. */
export interface NotificationResponse {
  id: string;
  header: string;
  body: string;
  category: Category;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps a document to the API response. Exposing `id` rather than `_id` keeps
 * Mongo out of the client's vocabulary, and userId is omitted — the client
 * already knows who it is, and echoing owner ids back invites tampering.
 */
export function toNotificationResponse(doc: NotificationDocument): NotificationResponse {
  return {
    id: doc._id.toString(),
    header: doc.header,
    body: doc.body,
    category: doc.category,
    isClosed: doc.isClosed,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
