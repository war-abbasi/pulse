import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Rejects any request without a valid "Authorization: Bearer <token>" header
 * with a 401. Extending AuthGuard('jwt') wires it to JwtStrategy; the base
 * class implements canActivate for us.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
