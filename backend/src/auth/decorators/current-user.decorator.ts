import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/jwt-payload.js';

/**
 * Pulls the authenticated user off the request so controllers can write
 * `@CurrentUser() user: AuthenticatedUser` instead of reaching into the raw
 * request object. Only populated on routes behind JwtAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser =>
    ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user,
);
