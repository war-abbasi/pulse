/**
 * Client-side validation rules. These mirror the DTO rules on the server —
 * the server remains the authority, but validating here gives instant feedback
 * without a round trip.
 */

export type Errors<T> = Partial<Record<keyof T, string>>;

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm extends LoginForm {
  fullName: string;
  confirmPassword: string;
}

export interface NotificationForm {
  header: string;
  body: string;
  category: string;
}

export function validateLogin(values: LoginForm): Errors<LoginForm> {
  const errors: Errors<LoginForm> = {};
  if (!values.username.trim()) errors.username = 'Username is required.';
  if (!values.password) errors.password = 'Password is required.';
  return errors;
}

export function validateRegister(values: RegisterForm): Errors<RegisterForm> {
  const errors: Errors<RegisterForm> = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (values.fullName.trim().length > 100) {
    errors.fullName = 'Full name must be 100 characters or fewer.';
  }

  const username = values.username.trim();
  if (!username) {
    errors.username = 'Username is required.';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  } else if (username.length > 30) {
    errors.username = 'Username must be 30 characters or fewer.';
  } else if (/\s/.test(username)) {
    errors.username = 'Username must not contain spaces.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  } else if (values.password.length > 72) {
    // bcrypt only reads the first 72 bytes, so anything longer is misleading.
    errors.password = 'Password must be 72 characters or fewer.';
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function validateNotification(values: NotificationForm): Errors<NotificationForm> {
  const errors: Errors<NotificationForm> = {};

  if (!values.header.trim()) {
    errors.header = 'Header is required.';
  } else if (values.header.trim().length > 120) {
    errors.header = 'Header must be 120 characters or fewer.';
  }

  if (!values.body.trim()) {
    errors.body = 'Body is required.';
  } else if (values.body.trim().length > 2000) {
    errors.body = 'Body must be 2000 characters or fewer.';
  }

  if (!values.category) errors.category = 'Please choose a category.';

  return errors;
}

export const hasErrors = (errors: Record<string, string | undefined>): boolean =>
  Object.values(errors).some(Boolean);
