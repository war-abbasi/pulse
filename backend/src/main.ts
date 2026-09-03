import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

/**
 * CORS_ORIGIN accepts a comma-separated list, so a deployment can allow the
 * production frontend and a preview URL without a code change.
 */
function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Render and most PaaS hosts sit behind a reverse proxy, so the socket
  // address belongs to the proxy. Trusting a fixed number of hops makes
  // req.ip the real client again — without it the rate limiter treats every
  // visitor as the same caller and one attacker locks out everybody.
  //
  // An explicit hop count rather than `true`: trusting the entire chain would
  // let a client forge X-Forwarded-For and sidestep the limit completely.
  const trustedProxyHops = Number(config.get<string>('TRUSTED_PROXY_HOPS') ?? 0);
  if (trustedProxyHops > 0) {
    app.set('trust proxy', trustedProxyHops);
  }

  // Fallback to allow local React frontend if CORS_ORIGIN is not defined in .env
  const corsOrigin = config.get<string>('CORS_ORIGIN') || 'http://localhost:5173';
  app.enableCors({ origin: parseOrigins(corsOrigin) });

  // Security headers. This app serves JSON only, so the CSP that helmet would
  // otherwise apply to HTML is unnecessary; the resource policy is relaxed to
  // cross-origin because the browser app is served from a different port.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Prevents sudden 400/404 errors during testing
      transform: true,
    }),
  );

  // Bind 0.0.0.0 rather than the default loopback: a container that listens
  // only on localhost is unreachable from outside itself, so the platform's
  // health check fails and the deploy is marked dead.
  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend listening on port ${port}`);
}
await bootstrap();