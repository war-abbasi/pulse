import type { PublicUser } from '../auth/dto/auth-response.dto.js';
import type { UserDocument } from './schemas/user.schema.js';

/**
 * Converts a user document into the only shape allowed to leave the server.
 * Building the response by explicitly listing fields (rather than deleting
 * unwanted ones) means a new sensitive field added to the schema tomorrow is
 * not exposed by accident.
 */
export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    username: user.username,
  };
}
