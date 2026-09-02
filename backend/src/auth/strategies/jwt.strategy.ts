import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser, JwtPayload } from '../types/jwt-payload.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      // Read the token from "Authorization: Bearer <token>".
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Never disable this. It would accept expired tokens forever.
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Passport calls this only after it has verified the signature and expiry,
   * so by this point the payload is known to be authentic. Whatever we return
   * becomes request.user.
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    return { userId: payload.sub, username: payload.username };
  }
}
