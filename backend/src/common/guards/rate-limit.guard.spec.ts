import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitGuard, type RateLimitOptions } from './rate-limit.guard.js';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  const setHeader = vi.fn();

  /** Builds a context for a given caller and route. */
  function contextFor(ip = '10.0.0.1', path = '/auth/login', method = 'POST') {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ ip, method, url: path, route: { path }, socket: {} }),
        getResponse: () => ({ setHeader }),
      }),
      getHandler: () => vi.fn(),
      getClass: () => vi.fn(),
    } as unknown as ExecutionContext;
  }

  const allow = (options: RateLimitOptions | undefined) =>
    reflector.getAllAndOverride.mockReturnValue(options);

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    reflector = { getAllAndOverride: vi.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [RateLimitGuard, { provide: Reflector, useValue: reflector }],
    }).compile();
    guard = moduleRef.get(RateLimitGuard);
  });

  afterEach(() => vi.useRealTimers());

  it('does not limit a route that carries no decorator', () => {
    allow(undefined);
    for (let i = 0; i < 50; i += 1) {
      expect(guard.canActivate(contextFor())).toBe(true);
    }
  });

  it('allows requests up to the limit', () => {
    allow({ limit: 3, windowMs: 60_000 });
    expect(guard.canActivate(contextFor())).toBe(true);
    expect(guard.canActivate(contextFor())).toBe(true);
    expect(guard.canActivate(contextFor())).toBe(true);
  });

  it('rejects the request after the limit with 429', () => {
    allow({ limit: 2, windowMs: 60_000 });
    guard.canActivate(contextFor());
    guard.canActivate(contextFor());

    try {
      guard.canActivate(contextFor());
      throw new Error('expected the guard to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('tells the client how long to wait', () => {
    allow({ limit: 1, windowMs: 60_000 });
    guard.canActivate(contextFor());

    expect(() => guard.canActivate(contextFor())).toThrow();
    expect(setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });

  it('lets the client through again once the window has passed', () => {
    allow({ limit: 1, windowMs: 60_000 });
    guard.canActivate(contextFor());
    expect(() => guard.canActivate(contextFor())).toThrow();

    vi.advanceTimersByTime(60_001);

    expect(guard.canActivate(contextFor())).toBe(true);
  });

  it('still blocks while the window is open', () => {
    allow({ limit: 1, windowMs: 60_000 });
    guard.canActivate(contextFor());

    vi.advanceTimersByTime(59_000);

    expect(() => guard.canActivate(contextFor())).toThrow(HttpException);
  });

  it('counts each client separately', () => {
    allow({ limit: 1, windowMs: 60_000 });
    guard.canActivate(contextFor('10.0.0.1'));

    // One attacker exhausting the limit must not lock out everybody else.
    expect(guard.canActivate(contextFor('10.0.0.2'))).toBe(true);
  });

  it('counts each route separately', () => {
    allow({ limit: 1, windowMs: 60_000 });
    guard.canActivate(contextFor('10.0.0.1', '/auth/login'));

    // Exhausting login must not also block registration.
    expect(guard.canActivate(contextFor('10.0.0.1', '/auth/register'))).toBe(true);
  });

  it('falls back to the socket address when req.ip is absent', () => {
    allow({ limit: 1, windowMs: 60_000 });
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          ip: undefined,
          method: 'POST',
          url: '/auth/login',
          route: { path: '/auth/login' },
          socket: { remoteAddress: '10.0.0.9' },
        }),
        getResponse: () => ({ setHeader }),
      }),
      getHandler: () => vi.fn(),
      getClass: () => vi.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });
});
