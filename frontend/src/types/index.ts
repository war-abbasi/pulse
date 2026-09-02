/*
 * A const object plus a union type rather than a TS enum. It behaves the same
 * at the call site (Category.INFO), but compiles away to a plain object, so it
 * works under erasableSyntaxOnly and the values stay ordinary strings that
 * serialise cleanly to and from JSON.
 */
export const Category = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const;

export type Category = (typeof Category)[keyof typeof Category];

export interface UserNotification {
  id: string;
  header: string;
  body: string;
  category: Category;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  fullName: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  fullName: string;
}

export interface CreateNotificationPayload {
  header: string;
  body: string;
  category: Category;
}

export type UpdateNotificationPayload = Partial<
  CreateNotificationPayload & { isClosed: boolean }
>;
