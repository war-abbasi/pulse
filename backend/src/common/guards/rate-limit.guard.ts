import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

export interface RateLimitOptions {
  /** Requests allowed per window, per client, per route. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export const RATE_LIMIT_KEY = 'rate-limit';

/**
 * Caps how often one client may call a route.
 *
 * @RateLimit({ limit: 5, windowMs: 60_000 })
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

interface Counter {
  count: number;
  /** Epoch ms at which this window ends and the count resets. */
  expiresAt: number;
}

/**
 * A fixed-window rate limiter.
 *
 * Written rather than pulled in because @nestjs/throttler does not yet declare
 * support for NestJS 12 — installing it would force --legacy-peer-deps on
 * everyone who clones this repo.
 *
 * State is in-process, which is the right trade-off for a single instance. Behind
 * a load balancer each instance would keep its own counts, so a shared store
 * (Redis) would be needed to enforce a global limit.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly counters = new Map<string, Counter>();

  /** Sweep expired keys once the map grows past this, so it cannot grow without bound. */
  private static readonly SWEEP_THRESHOLD = 5_000;

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Routes without the decorator are not limited at all.
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const now = Date.now();
    // Keyed per route as well as per client, so exhausting the login limit
    // does not also lock the client out of registering.
    const key = `${this.clientId(request)}:${request.method}:${request.route?.path ?? request.url}`;

    const existing = this.counters.get(key);
    if (!existing || existing.expiresAt <= now) {
      this.counters.set(key, { count: 1, expiresAt: now + options.windowMs });
      this.sweepIfCrowded(now);
      return true;
    }

    existing.count += 1;
    if (existing.count > options.limit) {
      const retryAfterSeconds = Math.ceil((existing.expiresAt - now) / 1000);
      response.setHeader('Retry-After', String(retryAfterSeconds));
      throw new HttpException(
        `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Identifies the caller. `req.ip` honours X-Forwarded-For only when Express
   * is configured to trust the proxy, which is deliberate: trusting that header
   * unconditionally would let anyone spoof their way around the limit.
   */
  private clientId(request: Request): string {
    return request.ip ?? request.socket?.remoteAddress ?? 'unknown';
  }

  private sweepIfCrowded(now: number): void {
    if (this.counters.size < RateLimitGuard.SWEEP_THRESHOLD) return;
    for (const [key, counter] of this.counters) {
      if (counter.expiresAt <= now) this.counters.delete(key);
    }
  }
}
