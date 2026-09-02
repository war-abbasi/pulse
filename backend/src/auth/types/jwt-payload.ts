/** Shape of the data we sign into the JWT. */
export interface JwtPayload {
  /** Subject — the user's id. Standard JWT claim name. */
  sub: string;
  username: string;
}

/** What the JwtStrategy attaches to request.user after verifying a token. */
export interface AuthenticatedUser {
  userId: string;
  username: string;
}
