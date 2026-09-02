/** The only user fields that ever leave the server. */
export interface PublicUser {
  id: string;
  fullName: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}
