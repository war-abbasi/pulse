import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Fallback to allow local React frontend if CORS_ORIGIN is not defined in .env
  const corsOrigin = config.get<string>('CORS_ORIGIN') || 'http://localhost:5173';
  app.enableCors({ origin: corsOrigin });

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

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on: http://localhost:${port}`);
}
await bootstrap();